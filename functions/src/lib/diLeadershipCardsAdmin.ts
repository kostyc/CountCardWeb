/**
 * Admin SDK — DI leadership cards (Cloud Functions API)
 */

import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../admin';
import type { DILeadershipCard, SignatureRecord } from '@countcard/core/types/models';

function cardRef(cardId: string) {
  return adminDb.collection('diLeadershipCards').doc(cardId);
}

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export async function createDILeadershipCardAdmin(
  cardId: string,
  data: Omit<DILeadershipCard, 'id' | 'createdAt' | 'updatedAt' | 'recommendations'>,
  createdBy: string
): Promise<string> {
  const now = Timestamp.now();
  const payload = omitUndefined({
    ...data,
    recommendations: [],
    createdAt: now,
    updatedAt: now,
    createdBy,
    updatedBy: createdBy,
  });
  await cardRef(cardId).set(payload);
  return cardId;
}

export async function appendDIRecommendationAdmin(
  cardId: string,
  authorId: string,
  text: string,
  updatedBy: string
): Promise<void> {
  const snap = await cardRef(cardId).get();
  if (!snap.exists) throw new Error('Card not found');
  const card = snap.data() as DILeadershipCard;
  const recommendations = [
    ...(card.recommendations ?? []),
    { text, authorId, createdAt: Timestamp.now() },
  ];
  await cardRef(cardId).update({
    recommendations,
    updatedAt: Timestamp.now(),
    updatedBy,
  });
}

export async function signDILeadershipCardAdmin(
  cardId: string,
  which: 'di' | 'senior',
  signature: SignatureRecord,
  updatedBy: string
): Promise<void> {
  const snap = await cardRef(cardId).get();
  if (!snap.exists) throw new Error('Card not found');

  const signedAt =
    signature.signedAt instanceof Date
      ? Timestamp.fromDate(signature.signedAt)
      : signature.signedAt;

  const signaturePayload = omitUndefined({
    userId: signature.userId,
    signedAt,
    signatureImageUrl: signature.signatureImageUrl,
    attestationHash: signature.attestationHash,
  });

  const patch: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
    updatedBy,
  };
  if (which === 'di') {
    patch.diSignature = signaturePayload;
    patch.workflowState = 'pending_senior_sign';
  } else {
    patch.seniorSignature = signaturePayload;
    patch.workflowState = 'completed';
  }
  await cardRef(cardId).update(patch);
}
