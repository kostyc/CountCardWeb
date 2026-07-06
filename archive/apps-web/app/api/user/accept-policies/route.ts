/**
 * API Route: Accept Policies
 * Stores privacy policy and terms of service acceptance in user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';

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
    logError(error as Error, 'API.accept-policies.verifyAuthToken');
    return null;
  }
}

/**
 * POST /api/user/accept-policies
 * Store privacy policy and terms of service acceptance
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
    const { userId, privacyPolicyAccepted, privacyPolicyVersion, termsOfServiceAccepted, termsOfServiceVersion } = body;

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

    if (privacyPolicyAccepted === undefined || termsOfServiceAccepted === undefined) {
      return NextResponse.json(
        { error: 'Acceptance status is required' },
        { status: 400 }
      );
    }

    // Update user profile in Firestore
    const userProfileRef = adminDb.collection('userProfiles').doc(userId);
    const updateData: any = {
      privacyPolicyAccepted,
      termsOfServiceAccepted,
      updatedAt: new Date(),
    };

    if (privacyPolicyVersion) {
      updateData.privacyPolicyVersion = privacyPolicyVersion;
      updateData.privacyPolicyAcceptedAt = new Date();
    }

    if (termsOfServiceVersion) {
      updateData.termsOfServiceVersion = termsOfServiceVersion;
      updateData.termsOfServiceAcceptedAt = new Date();
    }

    await userProfileRef.set(updateData, { merge: true });

    logInfo(`Policy acceptance stored for user ${userId}`, 'API.accept-policies');

    return NextResponse.json({
      success: true,
      message: 'Policy acceptance stored successfully',
    });
  } catch (error) {
    logError(error as Error, 'API.accept-policies');
    return NextResponse.json(
      { error: 'Failed to store policy acceptance' },
      { status: 500 }
    );
  }
}
