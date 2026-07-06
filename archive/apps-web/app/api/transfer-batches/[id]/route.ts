/**
 * GET /api/transfer-batches/[id] — single batch detail
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { getTransferBatchAdmin } from '@/lib/lifecycle/transferBatchAdmin';
import { canViewTransferBatch } from '@/lib/lifecycle/permissions';
import { logError } from '@/lib/utils/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const batch = await getTransferBatchAdmin(id);
    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }
    if (!canViewTransferBatch(token, batch)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ batch });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.getById');
    return NextResponse.json({ error: 'Failed to load batch' }, { status: 500 });
  }
}
