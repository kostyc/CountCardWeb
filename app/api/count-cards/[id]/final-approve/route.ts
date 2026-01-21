/**
 * API Route: Final Approve Count Card
 * Allows Company XO, Company Commander, or Battalion SgtMaj to grant final approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/utils/logger';
import { finalApproveCountCard } from '@/lib/services/firestore/countCards';
import { verifyAuthToken, verifyPermission } from '@/lib/permissions/server';

/**
 * POST /api/count-cards/[id]/final-approve
 * Grant final approval to count card
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

    // Check permission - users with consolidate_count_cards permission can final approve
    // (Company XO, Company Commander, Battalion SgtMaj have this permission)
    if (!verifyPermission(token, 'consolidate_count_cards')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions to grant final approval' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { notes } = body;

    // Final approve count card
    await finalApproveCountCard(countCardId, token.uid, notes);

    logInfo(`Count card ${countCardId} final approved by ${token.uid}`, 'API.countCards.finalApprove');

    return NextResponse.json({
      success: true,
      message: 'Count card final approval granted successfully',
    });
  } catch (error) {
    logError(error as Error, 'API.countCards.finalApprove');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to grant final approval' },
      { status: 500 }
    );
  }
}
