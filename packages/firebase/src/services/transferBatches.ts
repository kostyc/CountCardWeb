/**
 * Transfer batch Firestore service (client reads + lifecycle writes)
 */

import {
  getDocumentById,
  queryDocuments,
  createDocument,
  handleFirestoreError,
  ServiceError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import {
  where,
  orderBy,
  writeBatch,
  doc,
  arrayUnion,
  deleteField,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../instance';
import { RECEIVING_DEFAULT_ASSIGNMENT } from '@countcard/core/constants/custodyPhase';
import type { RecruitProfile, TransferBatch } from '@countcard/core/types/models';
import type { TransferBatchStatus } from '@countcard/core/validation/lifecycleSchemas';

const COLLECTION = 'transferBatches';

function updatedAtMs(value: TransferBatch['updatedAt']): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (value instanceof Timestamp) return value.toMillis();
  return new Date(value as string | number).getTime();
}

function historyEntry(action: string, userId: string, notes?: string) {
  return {
    action,
    timestamp: new Date(),
    userId,
    notes,
  };
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

function batchRef(id: string) {
  return doc(getDb(), COLLECTION, id);
}

function recruitRef(recruitId: string) {
  return doc(getDb(), 'recruits', recruitId);
}

export async function getTransferBatchById(id: string): Promise<TransferBatch | null> {
  try {
    return await getDocumentById<TransferBatch>(COLLECTION, id);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get transfer batch ${id}`);
  }
}

export async function listTransferBatches(
  filters?: {
    status?: TransferBatchStatus;
    company?: string;
    battalion?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<TransferBatch>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.company) {
      constraints.push(where('destinationAssignment.company', '==', filters.company));
    }
    if (filters?.battalion) {
      constraints.push(where('destinationAssignment.battalion', '==', filters.battalion));
    }
    constraints.push(orderBy('updatedAt', 'desc'));
    try {
      return await queryDocuments<TransferBatch>(COLLECTION, constraints, pagination);
    } catch (error) {
      const code = error instanceof ServiceError ? error.code : '';
      const isIndexError =
        code === 'failed-precondition' ||
        (error instanceof Error && error.message.includes('requires an index'));
      if (!isIndexError) {
        throw error;
      }
      const fallback = constraints.filter((c) => {
        const type = (c as { type?: string }).type;
        return type !== 'orderBy';
      });
      const result = await queryDocuments<TransferBatch>(COLLECTION, fallback, pagination);
      result.items.sort((a, b) => updatedAtMs(b.updatedAt) - updatedAtMs(a.updatedAt));
      return result;
    }
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list transfer batches');
  }
}

export async function createTransferBatch(
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
  try {
    await createDocument(
      COLLECTION,
      batchId,
      {
        transferBatchId: batchId,
        pickupWeek: data.pickupWeek,
        regiment: data.regiment,
        status: 'draft',
        sourceAssignment: {
          battalion: RECEIVING_DEFAULT_ASSIGNMENT.battalion,
          company: RECEIVING_DEFAULT_ASSIGNMENT.company,
          platoon: RECEIVING_DEFAULT_ASSIGNMENT.platoon,
        },
        destinationAssignment: data.destinationAssignment,
        recruitIds: data.recruitIds,
        notes: data.notes,
        workflowHistory: [historyEntry('created', data.createdBy)],
      },
      data.createdBy
    );
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to create transfer batch');
  }
}

export async function publishTransferBatch(batchId: string, userId: string): Promise<void> {
  try {
    const batch = await getTransferBatchById(batchId);
    if (!batch) throw new Error('Transfer batch not found');
    if (batch.status !== 'draft') throw new Error('Only draft batches can be published');

    const batchWrite = writeBatch(getDb());
    batchWrite.update(batchRef(batchId), {
      status: 'published',
      publishedAt: Timestamp.now(),
      publishedBy: userId,
      notificationsSentTo: [],
      workflowHistory: arrayUnion(historyEntry('published', userId)),
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });

    for (const recruitId of batch.recruitIds) {
      batchWrite.update(recruitRef(recruitId), {
        custodyPhase: 'transfer_pending',
        intendedAssignment: batch.destinationAssignment,
        activeTransferBatchId: batchId,
        updatedBy: userId,
        updatedAt: Timestamp.now(),
      });
    }
    await batchWrite.commit();
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to publish transfer batch');
  }
}

export async function initiateTransferBatch(batchId: string, userId: string): Promise<void> {
  try {
    const batch = await getTransferBatchById(batchId);
    if (!batch) throw new Error('Transfer batch not found');
    if (batch.status !== 'published') throw new Error('Only published batches can be initiated');

    const batchWrite = writeBatch(getDb());
    batchWrite.update(batchRef(batchId), {
      status: 'in_transit',
      initiatedAt: Timestamp.now(),
      initiatedBy: userId,
      workflowHistory: arrayUnion(historyEntry('initiated', userId)),
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });

    for (const recruitId of batch.recruitIds) {
      batchWrite.update(recruitRef(recruitId), {
        custodyPhase: 'in_transit',
        updatedBy: userId,
        updatedAt: Timestamp.now(),
      });
    }
    await batchWrite.commit();
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to initiate transfer batch');
  }
}

export async function acceptTransferBatch(batchId: string, userId: string): Promise<void> {
  try {
    const batch = await getTransferBatchById(batchId);
    if (!batch) throw new Error('Transfer batch not found');
    if (batch.status !== 'in_transit') throw new Error('Only in-transit batches can be accepted');

    const dest = batch.destinationAssignment;
    const batchWrite = writeBatch(getDb());

    batchWrite.update(batchRef(batchId), {
      status: 'completed',
      completedAt: Timestamp.now(),
      completedBy: userId,
      workflowHistory: arrayUnion(historyEntry('accepted', userId)),
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });

    for (const recruitId of batch.recruitIds) {
      const recruitSnap = await getDocumentById<RecruitProfile>('recruits', recruitId);
      if (!recruitSnap) continue;
      const transferEntry = {
        fromAssignment: omitUndefined({
          regiment: recruitSnap.regiment,
          battalion: recruitSnap.battalion,
          company: recruitSnap.company,
          series: recruitSnap.series,
          platoon: recruitSnap.platoon,
        }),
        toAssignment: dest,
        timestamp: new Date(),
        transferredBy: userId,
        reason: `Custody accepted from transfer batch ${batchId}`,
      };
      batchWrite.update(recruitRef(recruitId), {
        regiment: dest.regiment ?? deleteField(),
        battalion: dest.battalion ?? deleteField(),
        company: dest.company ?? deleteField(),
        series: dest.series ?? deleteField(),
        platoon: dest.platoon,
        custodyPhase: 'training',
        status: 'active',
        intendedAssignment: deleteField(),
        activeTransferBatchId: deleteField(),
        transferHistory: arrayUnion(transferEntry),
        updatedBy: userId,
        updatedAt: Timestamp.now(),
      });
    }
    await batchWrite.commit();
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to accept transfer batch');
  }
}

export async function rejectTransferBatch(
  batchId: string,
  userId: string,
  reason?: string
): Promise<void> {
  try {
    const batch = await getTransferBatchById(batchId);
    if (!batch) throw new Error('Transfer batch not found');
    if (batch.status !== 'in_transit' && batch.status !== 'published') {
      throw new Error('Only published or in-transit batches can be rejected');
    }

    const batchWrite = writeBatch(getDb());
    batchWrite.update(batchRef(batchId), {
      status: 'rejected',
      rejectedAt: Timestamp.now(),
      rejectedBy: userId,
      rejectionReason: reason,
      workflowHistory: arrayUnion(historyEntry('rejected', userId, reason)),
      updatedBy: userId,
      updatedAt: Timestamp.now(),
    });

    for (const recruitId of batch.recruitIds) {
      batchWrite.update(recruitRef(recruitId), {
        custodyPhase: 'receiving_ready',
        intendedAssignment: deleteField(),
        activeTransferBatchId: deleteField(),
        updatedBy: userId,
        updatedAt: Timestamp.now(),
      });
    }
    await batchWrite.commit();
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to reject transfer batch');
  }
}

export function buildTransferBatchRosterCsv(
  batch: TransferBatch,
  recruits: Array<{ recruitId: string; edipi?: string; firstName: string; lastName: string; rank: string }>
): string {
  const header = 'EDIPI,Last Name,First Name,Rank,Destination Company,Destination Platoon,Pickup Week';
  const rows = recruits.map((r) => {
    const dest = batch.destinationAssignment;
    return [
      r.edipi ?? '',
      r.lastName,
      r.firstName,
      r.rank,
      dest.company ?? '',
      dest.platoon ?? '',
      batch.pickupWeek,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });
  return [header, ...rows].join('\n');
}
