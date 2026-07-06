/**
 * Admin SDK operations for transfer batch custody workflow
 */

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../admin';
import { RECEIVING_DEFAULT_ASSIGNMENT } from '@countcard/core/constants/custodyPhase';
import type { TransferBatch } from '@countcard/core/types/models';
import type { TransferBatchStatus } from '@countcard/core/validation/lifecycleSchemas';

function batchRef(id: string) {
  return adminDb.collection('transferBatches').doc(id);
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

function historyEntry(action: string, userId: string, notes?: string) {
  const entry: { action: string; timestamp: Date; userId: string; notes?: string } = {
    action,
    timestamp: Timestamp.now().toDate(),
    userId,
  };
  if (notes !== undefined) entry.notes = notes;
  return entry;
}

export async function createTransferBatchAdmin(
  batchId: string,
  data: {
    pickupWeek: string;
    regiment: string;
    destinationAssignment: TransferBatch['destinationAssignment'];
    recruitIds: string[];
    notes?: string;
    createdBy: string;
  }
): Promise<void> {
  const now = Timestamp.now();
  const batch: Omit<TransferBatch, 'id'> = {
    transferBatchId: batchId,
    pickupWeek: data.pickupWeek,
    regiment: data.regiment as TransferBatch['regiment'],
    status: 'draft',
    sourceAssignment: {
      battalion: RECEIVING_DEFAULT_ASSIGNMENT.battalion,
      company: RECEIVING_DEFAULT_ASSIGNMENT.company,
      platoon: RECEIVING_DEFAULT_ASSIGNMENT.platoon,
    },
    destinationAssignment: data.destinationAssignment,
    recruitIds: data.recruitIds,
    ...(data.notes !== undefined ? { notes: data.notes } : {}),
    workflowHistory: [historyEntry('created', data.createdBy)],
    createdAt: now.toDate(),
    updatedAt: now.toDate(),
    createdBy: data.createdBy,
  };
  await batchRef(batchId).set(batch);
}

export async function publishTransferBatchAdmin(
  batchId: string,
  userId: string,
  notificationsSentTo: Array<{ uid: string; role: string }>
): Promise<void> {
  const ref = batchRef(batchId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Transfer batch not found');
  const batch = snap.data() as TransferBatch;
  if (batch.status !== 'draft') throw new Error('Only draft batches can be published');

  const batchWrite = adminDb.batch();
  batchWrite.update(ref, {
    status: 'published',
    publishedAt: Timestamp.now(),
    publishedBy: userId,
    notificationsSentTo,
    workflowHistory: FieldValue.arrayUnion(historyEntry('published', userId)),
    updatedBy: userId,
    updatedAt: Timestamp.now(),
  });

  for (const recruitId of batch.recruitIds) {
    const recruitRef = adminDb.collection('recruits').doc(recruitId);
    batchWrite.update(recruitRef, {
      custodyPhase: 'transfer_pending',
      intendedAssignment: batch.destinationAssignment,
      activeTransferBatchId: batchId,
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });
  }
  await batchWrite.commit();
}

export async function initiateTransferBatchAdmin(batchId: string, userId: string): Promise<void> {
  const ref = batchRef(batchId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Transfer batch not found');
  const batch = snap.data() as TransferBatch;
  if (batch.status !== 'published') throw new Error('Only published batches can be initiated');

  const batchWrite = adminDb.batch();
  batchWrite.update(ref, {
    status: 'first_sgt_review',
    initiatedAt: Timestamp.now(),
    initiatedBy: userId,
    workflowHistory: FieldValue.arrayUnion(historyEntry('initiated', userId)),
    updatedBy: userId,
    updatedAt: Timestamp.now(),
  });

  for (const recruitId of batch.recruitIds) {
    batchWrite.update(adminDb.collection('recruits').doc(recruitId), {
      custodyPhase: 'in_transit',
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });
  }
  await batchWrite.commit();
}

export async function advanceFirstSgtReviewAdmin(batchId: string, userId: string): Promise<void> {
  const ref = batchRef(batchId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Transfer batch not found');
  const batch = snap.data() as TransferBatch;
  if (batch.status !== 'first_sgt_review') {
    throw new Error('Only batches in first_sgt_review can be advanced by 1st Sgt');
  }

  await ref.update({
    status: 'cdi_review',
    firstSgtReviewedAt: Timestamp.now(),
    firstSgtReviewedBy: userId,
    workflowHistory: FieldValue.arrayUnion(historyEntry('first_sgt_review', userId)),
    updatedBy: userId,
    updatedAt: Timestamp.now(),
  });
}

export async function advanceCdiReviewAdmin(batchId: string, userId: string): Promise<void> {
  const ref = batchRef(batchId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Transfer batch not found');
  const batch = snap.data() as TransferBatch;
  if (batch.status !== 'cdi_review') {
    throw new Error('Only batches in cdi_review can be advanced by CDI');
  }

  await ref.update({
    status: 'sdi_accept',
    cdiReviewedAt: Timestamp.now(),
    cdiReviewedBy: userId,
    workflowHistory: FieldValue.arrayUnion(historyEntry('cdi_review', userId)),
    updatedBy: userId,
    updatedAt: Timestamp.now(),
  });
}

export async function acceptTransferBatchAdmin(batchId: string, userId: string): Promise<void> {
  const ref = batchRef(batchId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Transfer batch not found');
  const batch = snap.data() as TransferBatch;
  if (batch.status !== 'sdi_accept') {
    throw new Error('Only batches awaiting SDI accept can be accepted');
  }

  const dest = batch.destinationAssignment;
  const batchWrite = adminDb.batch();
  batchWrite.update(ref, {
    status: 'completed',
    completedAt: Timestamp.now(),
    completedBy: userId,
    workflowHistory: FieldValue.arrayUnion(historyEntry('sdi_accept', userId)),
    updatedBy: userId,
    updatedAt: Timestamp.now(),
  });

  for (const recruitId of batch.recruitIds) {
    const recruitRef = adminDb.collection('recruits').doc(recruitId);
    const recruitSnap = await recruitRef.get();
    if (!recruitSnap.exists) continue;
    const recruitData = recruitSnap.data() as Record<string, unknown>;
    const fromAssignment = omitUndefined({
      regiment: recruitData.regiment,
      battalion: recruitData.battalion,
      company: recruitData.company,
      series: recruitData.series,
      platoon: recruitData.platoon,
    });
    const transferEntry = {
      fromAssignment,
      toAssignment: dest,
      timestamp: Timestamp.now().toDate(),
      transferredBy: userId,
      reason: `Custody accepted from transfer batch ${batchId}`,
    };
    batchWrite.update(recruitRef, {
      regiment: dest.regiment ?? FieldValue.delete(),
      battalion: dest.battalion ?? FieldValue.delete(),
      company: dest.company ?? FieldValue.delete(),
      series: dest.series ?? FieldValue.delete(),
      platoon: dest.platoon,
      custodyPhase: 'training',
      status: 'active',
      intendedAssignment: FieldValue.delete(),
      activeTransferBatchId: FieldValue.delete(),
      transferHistory: FieldValue.arrayUnion(transferEntry),
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });
  }
  await batchWrite.commit();
}

export async function rejectTransferBatchAdmin(
  batchId: string,
  userId: string,
  reason?: string
): Promise<void> {
  const ref = batchRef(batchId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Transfer batch not found');
  const batch = snap.data() as TransferBatch;
  if (
    batch.status !== 'in_transit' &&
    batch.status !== 'published' &&
    batch.status !== 'first_sgt_review' &&
    batch.status !== 'cdi_review' &&
    batch.status !== 'sdi_accept'
  ) {
    throw new Error('Only published or in-review batches can be rejected');
  }

  const batchWrite = adminDb.batch();
  batchWrite.update(ref, {
    status: 'rejected',
    rejectedAt: Timestamp.now(),
    rejectedBy: userId,
    ...(reason !== undefined ? { rejectionReason: reason } : {}),
    workflowHistory: FieldValue.arrayUnion(historyEntry('rejected', userId, reason)),
    updatedBy: userId,
    updatedAt: Timestamp.now(),
  });

  for (const recruitId of batch.recruitIds) {
    batchWrite.update(adminDb.collection('recruits').doc(recruitId), {
      custodyPhase: 'receiving_ready',
      intendedAssignment: FieldValue.delete(),
      activeTransferBatchId: FieldValue.delete(),
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });
  }
  await batchWrite.commit();
}

export async function getTransferBatchAdmin(batchId: string): Promise<TransferBatch | null> {
  const snap = await batchRef(batchId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as TransferBatch;
}

export async function listTransferBatchesAdmin(filters?: {
  status?: TransferBatchStatus;
  destinationCompany?: string;
}): Promise<TransferBatch[]> {
  let q = adminDb.collection('transferBatches').orderBy('updatedAt', 'desc').limit(50);
  if (filters?.status) {
    q = adminDb
      .collection('transferBatches')
      .where('status', '==', filters.status)
      .orderBy('updatedAt', 'desc')
      .limit(50) as typeof q;
  }
  const snap = await q.get();
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TransferBatch));
  if (filters?.destinationCompany) {
    items = items.filter((b) => b.destinationAssignment.company === filters.destinationCompany);
  }
  return items;
}
