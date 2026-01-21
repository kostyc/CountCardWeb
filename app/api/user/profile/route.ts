/**
 * API Route: User Profile
 * Creates or updates user profile in Firestore
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import { UserProfile, UserRole, OrganizationalAssignment, USMCRank } from '@/types/auth';

/**
 * Verify Firebase ID token from Authorization header
 */
async function verifyAuthToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    logError(error as Error, 'API.profile.verifyAuthToken');
    return null;
  }
}

/**
 * Format display name from rank and last name
 * Format: [Rank] [Last Name] (e.g., "Sgt. Smith", "Capt. Johnson")
 */
function formatDisplayName(rank: USMCRank, lastName: string): string {
  return `${rank}. ${lastName}`;
}

/**
 * Validate USMC rank
 */
function validateRank(rank: string): rank is USMCRank {
  const validRanks: USMCRank[] = [
    'Sgt', 'SSgt', 'GySgt', 'MSgt', '1stSgt', 'MGySgt', 'SgtMaj', 'SgtMajMC',
    '2ndLt', '1stLt', 'Capt', 'Maj', 'LtCol', 'Col',
  ];
  return validRanks.includes(rank as USMCRank);
}

/**
 * POST /api/user/profile
 * Create or update user profile
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authenticatedUserId = await verifyAuthToken(request);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      userId,
      firstName,
      lastName,
      rank,
      email,
      phoneNumber,
      role,
      organizationalAssignment,
      profilePictureUrl,
      companyLogoUrl,
      battalionLogoUrl,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user can only update their own profile
    if (userId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Forbidden - you can only update your own profile' },
        { status: 403 }
      );
    }

    // Validate required profile fields
    if (!firstName || !lastName || !rank || !email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, rank, email, and phoneNumber are required' },
        { status: 400 }
      );
    }

    // Validate rank
    if (!validateRank(rank)) {
      return NextResponse.json(
        { error: 'Invalid USMC rank' },
        { status: 400 }
      );
    }

    // Format display name
    const displayName = formatDisplayName(rank, lastName);

    // Get existing profile to preserve some fields
    const profileRef = adminDb.collection('userProfiles').doc(userId);
    const existingProfile = await profileRef.get();
    const existingData = existingProfile.exists ? existingProfile.data() : {};

    // Build profile data
    const profileData: Partial<UserProfile> = {
      userId,
      firstName,
      lastName,
      rank,
      email,
      phoneNumber,
      displayName,
      updatedAt: new Date(),
      ...existingData, // Preserve existing data like policy acceptance
    };

    // Add optional fields if provided
    if (role) {
      profileData.role = role;
    }

    if (organizationalAssignment) {
      profileData.organizationalAssignment = organizationalAssignment;
    }

    if (profilePictureUrl) {
      profileData.profilePictureUrl = profilePictureUrl;
      profileData.photoURL = profilePictureUrl; // Also set photoURL for compatibility
    }

    if (companyLogoUrl) {
      profileData.companyLogoUrl = companyLogoUrl;
    }

    if (battalionLogoUrl) {
      profileData.battalionLogoUrl = battalionLogoUrl;
    }

    // Set createdAt only if creating new profile
    if (!existingProfile.exists) {
      profileData.createdAt = new Date();
    }

    // Save profile to Firestore
    await profileRef.set(profileData, { merge: true });

    logInfo(`Profile ${existingProfile.exists ? 'updated' : 'created'} for user ${userId}`, 'API.profile');

    return NextResponse.json({
      success: true,
      message: `Profile ${existingProfile.exists ? 'updated' : 'created'} successfully`,
      profile: profileData,
    });
  } catch (error) {
    logError(error as Error, 'API.profile');
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/profile
 * Get user profile
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authenticatedUserId = await verifyAuthToken(request);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    // Get userId from query params or use authenticated user
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId') || authenticatedUserId;

    // Users can only view their own profile (unless admin - future enhancement)
    if (requestedUserId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Forbidden - you can only view your own profile' },
        { status: 403 }
      );
    }

    // Get profile from Firestore
    const profileRef = adminDb.collection('userProfiles').doc(requestedUserId);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profileData = profileSnap.data();

    return NextResponse.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    logError(error as Error, 'API.profile.GET');
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
