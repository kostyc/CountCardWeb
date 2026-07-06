/**
 * POST /api/transfer-batches/[id]/accept — destination custody accept
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { acceptTransferBatchAdmin, getTransferBatchAdmin } from '@/lib/lifecycle/transferBatchAdmin';
import { canAcceptRejectBatch } from '@/lib/lifecycle/permissions';
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
    if (!canAcceptRejectBatch(token, batch)) {
      return NextResponse.json({ error: 'Forbidden — destination company custody access required' }, { status: 403 });
    }

    await acceptTransferBatchAdmin(id, token.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.accept');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to accept batch' },
      { status: 500 }
    );
  }
}
