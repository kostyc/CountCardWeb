/**
 * API Route: Consolidate Count Card
 * Allows Company 1stSgt or Series Commander to consolidate count cards and forward them
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError, logInfo } from '@/lib/utils/logger';
import { consolidateCountCard } from '@/lib/services/firestore/countCards';
import { verifyAuthToken, verifyPermission } from '@/lib/permissions/server';

/**
 * POST /api/count-cards/[id]/consolidate
 * Consolidate count card and forward to Company XO, Company Commander, or Battalion SgtMaj
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
    if (!verifyPermission(token, 'consolidate_count_cards')) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions to consolidate count cards' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { notes, submittedTo } = body;

    // Consolidate count card
    await consolidateCountCard(countCardId, token.uid, notes, submittedTo);

    logInfo(`Count card ${countCardId} consolidated by ${token.uid}`, 'API.countCards.consolidate');

    return NextResponse.json({
      success: true,
      message: 'Count card consolidated successfully',
    });
  } catch (error) {
    logError(error as Error, 'API.countCards.consolidate');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to consolidate count card' },
      { status: 500 }
    );
  }
}
