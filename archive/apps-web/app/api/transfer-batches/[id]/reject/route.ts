/**
 * POST /api/transfer-batches/[id]/reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { transferBatchRejectSchema } from '@countcard/core/validation/lifecycleSchemas';
import { rejectTransferBatchAdmin, getTransferBatchAdmin } from '@/lib/lifecycle/transferBatchAdmin';
import { canRejectTransferBatch } from '@/lib/lifecycle/permissions';
import { logError } from '@/lib/utils/logger';

export async function POST(
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
    if (!canRejectTransferBatch(token, batch)) {
      return NextResponse.json({ error: 'Forbidden — destination company custody access required' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = transferBatchRejectSchema.safeParse(body);

    await rejectTransferBatchAdmin(id, token.uid, parsed.success ? parsed.data.reason : undefined);
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.reject');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject batch' },
      { status: 500 }
    );
  }
}
