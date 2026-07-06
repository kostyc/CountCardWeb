/**
 * API Route: Approve Count Card
 * Allows Senior Drill Instructors to approve count cards and forward them
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/utils/logger';
import { approveCountCard } from '@/lib/services/firestore/countCards';
import { verifyAuthToken, verifyPermission } from '@/lib/permissions/server';

/**
 * POST /api/count-cards/[id]/approve
 * Approve count card and forward to Company 1stSgt and Series Commander
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
    if (!verifyPermission(token, 'approve_count_card')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions to approve count cards' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { notes, submittedTo } = body;

    // Approve count card
    await approveCountCard(countCardId, token.uid, notes, submittedTo);

    logInfo(`Count card ${countCardId} approved by ${token.uid}`, 'API.countCards.approve');

    return NextResponse.json({
      success: true,
      message: 'Count card approved successfully',
    });
  } catch (error) {
    logError(error as Error, 'API.countCards.approve');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve count card' },
      { status: 500 }
    );
  }
}
