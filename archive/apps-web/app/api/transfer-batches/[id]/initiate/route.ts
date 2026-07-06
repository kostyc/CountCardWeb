/**
 * POST /api/transfer-batches/[id]/initiate — Friday in-transit
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { initiateTransferBatchAdmin, getTransferBatchAdmin } from '@/lib/lifecycle/transferBatchAdmin';
import { canManageReceivingBatches, canViewTransferBatch } from '@/lib/lifecycle/permissions';
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
    if (!canManageReceivingBatches(token)) {
      return NextResponse.json({ error: 'Forbidden — Receiving workflow access required' }, { status: 403 });
    }

    const { id } = await params;
    const batch = await getTransferBatchAdmin(id);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    if (!canViewTransferBatch(token, batch)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await initiateTransferBatchAdmin(id, token.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.initiate');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to initiate batch' },
      { status: 500 }
    );
  }
}
