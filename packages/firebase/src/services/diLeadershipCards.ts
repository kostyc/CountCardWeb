/**
 * DI leadership cards service
 */

import {
  createDocument,
  getDocumentById,
  updateDocument,
  queryDocuments,
  handleFirestoreError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import { Timestamp, where, orderBy } from 'firebase/firestore';
import type { DILeadershipCard, SignatureRecord } from '@countcard/core/types/models';

const COLLECTION = 'diLeadershipCards';

export async function createDILeadershipCard(
  cardId: string,
  data: Omit<DILeadershipCard, 'id' | 'createdAt' | 'updatedAt' | 'recommendations'>,
  createdBy: string
): Promise<string> {
  try {
    await createDocument(
      COLLECTION,
      cardId,
      { ...data, recommendations: [] },
      createdBy
    );
    return cardId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create DI leadership card ${cardId}`);
  }
}

export async function getDILeadershipCardById(id: string): Promise<DILeadershipCard | null> {
  try {
    return await getDocumentById<DILeadershipCard>(COLLECTION, id);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get DI leadership card ${id}`);
  }
}

export async function listDILeadershipCards(
  filters?: { subjectUserId?: string; company?: string },
  pagination?: PaginationOptions
): Promise<PaginationResult<DILeadershipCard>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];
    if (filters?.subjectUserId) {
      constraints.push(where('subjectUserId', '==', filters.subjectUserId));
    }
    if (filters?.company) {
      constraints.push(where('organizationalAssignment.company', '==', filters.company));
    }
    constraints.push(orderBy('updatedAt', 'desc'));
    return await queryDocuments<DILeadershipCard>(COLLECTION, constraints, pagination);
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list DI leadership cards');
  }
}

export async function appendDIRecommendation(
  cardId: string,
  authorId: string,
  text: string,
  updatedBy: string
): Promise<void> {
  const card = await getDILeadershipCardById(cardId);
  if (!card) throw new Error('Card not found');
  const recommendations = [
    ...(card.recommendations ?? []),
    { text, authorId, createdAt: Timestamp.now() },
  ];
  await updateDocument(COLLECTION, cardId, { recommendations }, updatedBy);
}

export async function signDILeadershipCard(
  cardId: string,
  which: 'di' | 'senior',
  signature: SignatureRecord,
  updatedBy: string
): Promise<void> {
  const card = await getDILeadershipCardById(cardId);
  if (!card) throw new Error('Card not found');
  const patch: Partial<DILeadershipCard> = {};
  if (which === 'di') {
    patch.diSignature = signature;
    patch.workflowState = 'pending_senior_sign';
  } else {
    patch.seniorSignature = signature;
    patch.workflowState = 'completed';
  }
  await updateDocument(COLLECTION, cardId, patch, updatedBy);
}
