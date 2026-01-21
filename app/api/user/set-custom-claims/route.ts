/**
 * API Route: Set Custom Claims
 * Sets Firebase custom claims for user roles and organizational assignments
 * Requires admin privileges or user updating their own profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import { UserRole, OrganizationalAssignment } from '@/types/auth';

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
    logError(error as Error, 'API.set-custom-claims.verifyAuthToken');
    return null;
  }
}

/**
 * Check if user is admin (has admin role or is in ADMIN_USER_IDS)
 */
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(userId);
    const customClaims = user.customClaims || {};
    
    // Check if user has admin role in custom claims
    if (customClaims.role === 'battalion_commander' || customClaims.admin === true) {
      return true;
    }

    // Check if user is in ADMIN_USER_IDS environment variable
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',') || [];
    if (adminUserIds.includes(userId)) {
      return true;
    }

    return false;
  } catch (error) {
    logError(error as Error, 'API.set-custom-claims.isAdmin');
    return false;
  }
}

/**
 * POST /api/user/set-custom-claims
 * Set custom claims for a user (role and organizational assignment)
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
    const { userId, role, organizationalAssignment } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user can only update their own claims OR is admin
    const userIsAdmin = await isAdmin(authenticatedUserId);
    if (userId !== authenticatedUserId && !userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - you can only update your own custom claims or must be an admin' },
        { status: 403 }
      );
    }

    // Validate role if provided
    if (role) {
      const validRoles: UserRole[] = [
        'drill_instructor',
        'senior_drill_instructor',
        'chief_drill_instructor',
        'company_first_sgt',
        'series_commander',
        'company_xo',
        'company_commander',
        'battalion_sgt_maj',
        'battalion_xo',
        'battalion_commander',
      ];

      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
      }
    }

    // Validate organizational assignment if provided
    if (organizationalAssignment) {
      if (organizationalAssignment.regiment && !['West', 'East'].includes(organizationalAssignment.regiment)) {
        return NextResponse.json(
          { error: 'Invalid regiment. Must be "West" or "East"' },
          { status: 400 }
        );
      }
    }

    // Get current custom claims
    const user = await adminAuth.getUser(userId);
    const currentClaims = user.customClaims || {};

    // Build new custom claims
    const newClaims: Record<string, any> = {
      ...currentClaims,
    };

    if (role !== undefined) {
      newClaims.role = role;
    }

    if (organizationalAssignment !== undefined) {
      newClaims.organizationalAssignment = organizationalAssignment;
    }

    // Set custom claims
    await adminAuth.setCustomUserClaims(userId, newClaims);

    logInfo(`Custom claims updated for user ${userId}`, 'API.set-custom-claims');

    return NextResponse.json({
      success: true,
      message: 'Custom claims updated successfully',
      claims: newClaims,
    });
  } catch (error) {
    logError(error as Error, 'API.set-custom-claims');
    return NextResponse.json(
      { error: 'Failed to set custom claims' },
      { status: 500 }
    );
  }
}
