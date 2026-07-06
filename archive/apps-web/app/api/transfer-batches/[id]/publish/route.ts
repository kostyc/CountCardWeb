/**
 * POST /api/transfer-batches/[id]/publish
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { publishTransferBatchAdmin, getTransferBatchAdmin } from '@/lib/lifecycle/transferBatchAdmin';
import { canManageReceivingBatches, canViewTransferBatch } from '@/lib/lifecycle/permissions';
import { adminDb } from '@/lib/firebase/admin';
import { logError } from '@/lib/utils/logger';

const NOTIFY_ROLES = [
  'company_commander',
  'company_first_sgt',
  'chief_drill_instructor',
  'senior_drill_instructor',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
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

    const company = batch.destinationAssignment.company;
    const notificationsSentTo: Array<{ uid: string; role: string }> = [];

    if (company) {
      const usersSnap = await adminDb
        .collection('userProfiles')
        .where('organizationalAssignment.company', '==', company)
        .get();
      for (const doc of usersSnap.docs) {
        const profile = doc.data();
        const role = profile.role as string;
        if (NOTIFY_ROLES.includes(role)) {
          notificationsSentTo.push({ uid: doc.id, role });
        }
      }
    }

    await publishTransferBatchAdmin(id, token.uid, notificationsSentTo);
    return NextResponse.json({ success: true, notificationsSentTo });
  } catch (error) {
    logError(error as Error, 'API.transferBatches.publish');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to publish batch' },
      { status: 500 }
    );
  }
}
