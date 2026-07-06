/**
 * GET /api/transfer-batches/[id]/export — roster CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { getTransferBatchAdmin } from '@/lib/lifecycle/transferBatchAdmin';
import { canViewTransferBatch } from '@/lib/lifecycle/permissions';
import { buildTransferBatchRosterCsv } from '@/lib/services/firestore/transferBatches';
import { adminDb } from '@/lib/firebase/admin';
import type { RecruitProfile } from '@/types/models';
import { logError } from '@/lib/utils/logger';

export async function GET(
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
    if (!canViewTransferBatch(token, batch)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recruits: RecruitProfile[] = [];
    for (const recruitId of batch.recruitIds) {
      const snap = await adminDb.collection('recruits').doc(recruitId).get();
      if (snap.exists) {
        recruits.push({ id: snap.id, ...snap.data() } as RecruitProfile);
      }
    }

    const csv = buildTransferBatchRosterCsv(
      batch,
      recruits.map((r) => ({
        recruitId: r.recruitId,
        edipi: r.edipi,
        firstName: r.firstName,
        lastName: r.lastName,
        rank: r.rank,
      }))
    );

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="roster-${id}.csv"`,
      },
    });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.export');
    return NextResponse.json({ error: 'Failed to export roster' }, { status: 500 });
  }
}
