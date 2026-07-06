/**
 * Admin SDK — recruit progress events and comments (server API routes)
 */

import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import type {
  ProgressEventType,
  RecruitCommentCategory,
} from '@countcard/core/validation/lifecycleSchemas';

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export async function addRecruitProgressEventAdmin(
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
  const now = Timestamp.now();
  const eventId = `evt-${Date.now()}`;
  const payload = omitUndefined({
    eventId,
    recruitId,
    type: input.type,
    recordedAt: now,
    recordedBy: input.recordedBy,
    scores: input.scores,
    passFail: input.passFail,
    location: input.location,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    createdBy: input.recordedBy,
  });
  const ref = await adminDb
    .collection('recruits')
    .doc(recruitId)
    .collection('progressEvents')
    .add(payload);
  return ref.id;
}

export async function addRecruitCommentAdmin(
  recruitId: string,
  input: {
    authorId: string;
    authorRole?: string;
    body: string;
    category: RecruitCommentCategory;
  }
): Promise<string> {
  const commentId = `cmt-${Date.now()}`;
  const payload = omitUndefined({
    commentId,
    recruitId,
    authorId: input.authorId,
    authorRole: input.authorRole,
    body: input.body,
    category: input.category,
    createdAt: Timestamp.now(),
  });
  const ref = await adminDb.collection('recruits').doc(recruitId).collection('comments').add(payload);
  return ref.id;
}
