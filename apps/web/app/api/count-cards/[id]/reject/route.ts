/**
 * API Route: Reject Count Card
 * Allows Senior Drill Instructors to reject count cards and return them to Drill Instructor
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/utils/logger';
import { rejectCountCard } from '@/lib/services/firestore/countCards';
import { verifyAuthToken, verifyPermission } from '@/lib/permissions/server';

/**
 * POST /api/count-cards/[id]/reject
 * Reject count card and return to Drill Instructor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verify authentication
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    const { id: countCardId } = await params;
    if (!countCardId) {
      return NextResponse.json(
        { error: 'Count card ID is required' },
        { status: 400 }
      );
    }

    // Check permission
    if (!verifyPermission(token, 'reject_count_card')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions to reject count cards' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { notes } = body;

    if (!notes || notes.trim().length === 0) {
      return NextResponse.json(
        { error: 'Rejection notes are required' },
        { status: 400 }
      );
    }

    // Reject count card
    await rejectCountCard(countCardId, token.uid, notes);

    logInfo(`Count card ${countCardId} rejected by ${token.uid}`, 'API.countCards.reject');

    return NextResponse.json({
      success: true,
      message: 'Count card rejected successfully',
    });
  } catch (error) {
    logError(error as Error, 'API.countCards.reject');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject count card' },
      { status: 500 }
    );
  }
}
