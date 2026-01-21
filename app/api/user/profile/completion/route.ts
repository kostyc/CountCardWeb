/**
 * Profile Completion API Route
 * 
 * Handles updating user profile completion percentage
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/api/auth';
import { updateProfileCompletionStatus } from '@/lib/services/firestore/userProfiles';
import { logError, logInfo } from '@/lib/utils/logger';

/**
 * POST /api/user/profile/completion
 * Update profile completion percentage
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
    const { userId, completionPercentage } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (typeof completionPercentage !== 'number' || completionPercentage < 0 || completionPercentage > 100) {
      return NextResponse.json(
        { error: 'Completion percentage must be a number between 0 and 100' },
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

    // Update completion status
    await updateProfileCompletionStatus(userId, completionPercentage, authenticatedUserId);

    logInfo(`Profile completion updated to ${completionPercentage}% for user ${userId}`, 'API.profile.completion');

    return NextResponse.json({
      success: true,
      message: 'Profile completion updated successfully',
      completionPercentage,
    });
  } catch (error) {
    logError(error as Error, 'API.profile.completion');
    return NextResponse.json(
      { error: 'Failed to update profile completion' },
      { status: 500 }
    );
  }
}
