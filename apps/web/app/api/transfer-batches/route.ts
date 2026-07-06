/**
 * POST /api/transfer-batches — create draft transfer batch
 * GET /api/transfer-batches — list batches
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { transferBatchCreateSchema } from '@countcard/core/validation/lifecycleSchemas';
import {
  createTransferBatchAdmin,
  listTransferBatchesAdmin,
} from '@/lib/lifecycle/transferBatchAdmin';
import {
  canManageReceivingBatches,
  filterTransferBatchesForToken,
} from '@/lib/lifecycle/permissions';
import { logError } from '@/lib/utils/logger';
import { adminDb } from '@/lib/firebase/admin';
import type { RecruitProfile } from '@/types/models';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canManageReceivingBatches(token)) {
      return NextResponse.json({ error: 'Forbidden — Receiving workflow access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = transferBatchCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    for (const recruitId of parsed.data.recruitIds) {
      const recruitSnap = await adminDb.collection('recruits').doc(recruitId).get();
      if (!recruitSnap.exists) {
        return NextResponse.json({ error: `Recruit not found: ${recruitId}` }, { status: 400 });
      }
      const recruit = recruitSnap.data() as RecruitProfile;
      if (recruit.custodyPhase !== 'receiving_ready') {
        return NextResponse.json(
          {
            error: `Recruit ${recruitId} is not receiving-ready (custodyPhase: ${recruit.custodyPhase ?? 'unset'})`,
          },
          { status: 400 }
        );
      }
    }

    const batchId = `tb-${Date.now()}`;
    await createTransferBatchAdmin(batchId, {
      pickupWeek: parsed.data.pickupWeek,
      regiment: parsed.data.regiment,
      destinationAssignment: parsed.data.destinationAssignment,
      recruitIds: parsed.data.recruitIds,
      notes: parsed.data.notes,
      createdBy: token.uid,
    });

    return NextResponse.json({ success: true, transferBatchId: batchId });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.create');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create batch' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get('status') ?? undefined;
    const company = request.nextUrl.searchParams.get('company') ?? undefined;
    const batches = await listTransferBatchesAdmin({
      status: status as Parameters<typeof listTransferBatchesAdmin>[0] extends infer T
        ? T extends { status?: infer S }
          ? S
          : never
        : never,
      destinationCompany: company,
    });

    return NextResponse.json({ batches: filterTransferBatchesForToken(token, batches) });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.list');
    return NextResponse.json({ error: 'Failed to list batches' }, { status: 500 });
  }
}
