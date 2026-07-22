/**
 * Recruit progress events and receiving checklist updates
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../instance';
import { handleFirestoreError, stripUndefined } from './base';
import type {
  RecruitProgressEvent,
  RecruitProfile,
} from '@countcard/core/types/models';
import type {
  ProgressEventType,
} from '@countcard/core/validation/lifecycleSchemas';
import { isReceivingChecklistComplete } from '@countcard/core/constants/receivingChecklist';
import { updateRecruitProfile, getRecruitProfileById } from './recruits';
import { summarizeProgressEvents } from '@countcard/core/utils/recruitProgressSummary';
import type { RecruitProgressSummary } from '@countcard/core/utils/recruitProgressSummary';

export async function addRecruitProgressEvent(
  recruitId: string,
  input: {
    type: ProgressEventType;
    recordedBy: string;
    scores?: Record<string, unknown>;
    passFail?: boolean;
    location?: string;
    notes?: string;
  }
): Promise<string> {
  try {
    const db = getDb();
    const ref = collection(db, 'recruits', recruitId, 'progressEvents');
    const eventId = `evt-${Date.now()}`;
    const payload: Omit<RecruitProgressEvent, 'id'> = {
      eventId,
      recruitId,
      type: input.type,
      recordedAt: Timestamp.now(),
      recordedBy: input.recordedBy,
      scores: input.scores,
      passFail: input.passFail,
      location: input.location,
      notes: input.notes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: input.recordedBy,
    };
    const docRef = await addDoc(ref, stripUndefined(payload));
    return docRef.id;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to add progress event for ${recruitId}`);
  }
}

export async function listRecruitProgressEvents(
  recruitId: string
): Promise<RecruitProgressEvent[]> {
  try {
    const db = getDb();
    const ref = collection(db, 'recruits', recruitId, 'progressEvents');
    const q = query(ref, orderBy('recordedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecruitProgressEvent));
  } catch (error) {
    throw handleFirestoreError(error, `Failed to list progress events for ${recruitId}`);
  }
}

export async function updateReceivingChecklist(
  recruitId: string,
  checklist: RecruitProfile['receivingChecklist'],
  updatedBy: string
): Promise<void> {
  const recruit = await getRecruitProfileById(recruitId);
  if (!recruit) throw new Error('Recruit not found');
  const complete = isReceivingChecklistComplete(checklist);
  let custodyPhase = recruit.custodyPhase ?? 'receiving';
  if (complete && custodyPhase === 'receiving') {
    custodyPhase = 'receiving_ready';
  }
  await updateRecruitProfile(
    recruitId,
    {
      recruitId,
      receivingChecklist: checklist,
      custodyPhase,
      updatedBy,
    },
    updatedBy
  );
}

export function progressColumnNeedsFetch(columnIds: string[]): boolean {
  return columnIds.some((id) => {
    if (id === 'finalPft') return true;
    if (id === 'finalCft') return true;
    if (id === 'finalDrill') return true;
    if (id === 'finalInspection') return true;
    if (id === 'comments') return true;
    return false;
  });
}

export async function loadProgressSummariesForRecruits(
  recruitIds: string[],
  options?: { concurrency?: number }
): Promise<Record<string, RecruitProgressSummary>> {
  const concurrency = options?.concurrency ?? 8;
  const summaries: Record<string, RecruitProgressSummary> = {};
  const queue = [...recruitIds];

  async function worker() {
    while (queue.length > 0) {
      const recruitId = queue.shift();
      if (!recruitId) return;
      try {
        const events = await listRecruitProgressEvents(recruitId);
        summaries[recruitId] = summarizeProgressEvents(events);
      } catch {
        summaries[recruitId] = {};
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, recruitIds.length || 1) }, () => worker());
  await Promise.all(workers);
  return summaries;
}
