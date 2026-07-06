/**
 * POST /api/transfer-batches/[id]/first-sgt-review — 1st Sgt staged review
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { advanceFirstSgtReviewAdmin, getTransferBatchAdmin } from '@/lib/lifecycle/transferBatchAdmin';
import { canAdvanceTransferBatchStage } from '@/lib/lifecycle/permissions';
import { logError } from '@/lib/utils/logger';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(_request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const batch = await getTransferBatchAdmin(id);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    if (!canAdvanceTransferBatchStage(token, batch)) {
      return NextResponse.json(
        { error: 'Forbidden — company 1st Sgt review access required' },
        { status: 403 }
      );
    }

    await advanceFirstSgtReviewAdmin(id, token.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.firstSgtReview');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to advance 1st Sgt review' },
      { status: 500 }
    );
  }
}
