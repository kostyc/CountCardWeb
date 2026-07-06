/**
 * Recruit progress events and append-only comments
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../instance';
import { handleFirestoreError } from './base';
import type {
  RecruitProgressEvent,
  RecruitComment,
  RecruitProfile,
} from '@countcard/core/types/models';
import type {
  ProgressEventType,
  RecruitCommentCategory,
} from '@countcard/core/validation/lifecycleSchemas';
import { isReceivingChecklistComplete } from '@countcard/core/constants/receivingChecklist';
import { updateRecruitProfile, getRecruitProfileById } from './recruits';

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
    const docRef = await addDoc(ref, payload);
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

export async function addRecruitComment(
  recruitId: string,
  input: {
    authorId: string;
    authorRole?: string;
    body: string;
    category: RecruitCommentCategory;
  }
): Promise<string> {
  try {
    const db = getDb();
    const ref = collection(db, 'recruits', recruitId, 'comments');
    const commentId = `cmt-${Date.now()}`;
    const payload: RecruitComment = {
      commentId,
      recruitId,
      authorId: input.authorId,
      authorRole: input.authorRole,
      body: input.body,
      category: input.category,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(ref, payload);
    return docRef.id;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to add comment for ${recruitId}`);
  }
}

export async function listRecruitComments(recruitId: string): Promise<RecruitComment[]> {
  try {
    const db = getDb();
    const ref = collection(db, 'recruits', recruitId, 'comments');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as RecruitComment);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to list comments for ${recruitId}`);
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
