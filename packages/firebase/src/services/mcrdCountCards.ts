/**
 * MCRD grid count card Firestore service (Depot Order 1513.6)
 */

import { query, where, orderBy } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  queryDocuments,
  handleFirestoreError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import type {
  McrdCountCard,
  McrdCountCardInput,
  McrdCountCardUpdate,
  WorkflowHistoryEntry,
} from '@countcard/core/types/models';
import type { CountCardStatus, WorkflowState } from '@countcard/core/validation/countCardSchemas';
import type { Regiment } from '@countcard/core/types/auth';
import { resolveCompanyTrainingDayForDate } from './companyTrainingDays';

const COLLECTION = 'mcrdCountCards';

export async function createMcrdCountCard(
  countCardId: string,
  data: McrdCountCardInput,
  createdBy: string
): Promise<string> {
  try {
    await createDocument(COLLECTION, countCardId, data, createdBy);
    return countCardId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create MCRD count card ${countCardId}`);
  }
}

export async function updateMcrdCountCard(
  countCardId: string,
  data: McrdCountCardUpdate,
  updatedBy: string
): Promise<void> {
  try {
    await updateDocument(COLLECTION, countCardId, data, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update MCRD count card ${countCardId}`);
  }
}

export async function getMcrdCountCardById(countCardId: string): Promise<McrdCountCard | null> {
  try {
    return await getDocumentById<McrdCountCard>(COLLECTION, countCardId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get MCRD count card ${countCardId}`);
  }
}

export async function listMcrdCountCards(
  filters?: {
    regiment?: Regiment;
    battalion?: string;
    company?: string;
    series?: string;
    workflowState?: WorkflowState;
    submittedBy?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<McrdCountCard>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];
    if (filters?.regiment) constraints.push(where('regiment', '==', filters.regiment));
    if (filters?.battalion) constraints.push(where('battalion', '==', filters.battalion));
    if (filters?.company) constraints.push(where('company', '==', filters.company));
    if (filters?.series) constraints.push(where('series', '==', filters.series));
    if (filters?.workflowState) {
      constraints.push(where('workflowState', '==', filters.workflowState));
    }
    if (filters?.submittedBy) {
      constraints.push(where('submittedBy', '==', filters.submittedBy));
    }
    constraints.push(orderBy('countDate', 'desc'));
    return await queryDocuments<McrdCountCard>(COLLECTION, constraints, pagination);
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list MCRD count cards');
  }
}

/** Snapshot company T-DAY onto a new card payload. */
export async function buildMcrdCountCardTrainingSnapshot(
  regiment: string,
  battalion: string,
  company: string,
  countDate: Date
): Promise<{ trainingDayCode: string; trainingDayPhase: 1 | 2 | 3 | 4; f1Friday: Date }> {
  const resolved = await resolveCompanyTrainingDayForDate(
    regiment,
    battalion,
    company,
    countDate
  );
  if (!resolved) {
    throw new Error('Company training day is not configured. Set F-1 Friday first.');
  }
  return resolved;
}

export async function submitMcrdCountCard(
  countCardId: string,
  submittedBy: string,
  notes?: string
): Promise<void> {
  const card = await getMcrdCountCardById(countCardId);
  if (!card) throw new Error(`Count card ${countCardId} not found`);
  if (card.workflowState !== 'draft' && card.workflowState !== 'rejected') {
    throw new Error(`Cannot submit from ${card.workflowState}`);
  }

  const entry: WorkflowHistoryEntry = {
    state: 'submitted',
    timestamp: Timestamp.now(),
    userId: submittedBy,
    notes: notes || 'Submitted to Senior Drill Instructor',
  };

  await updateMcrdCountCard(
    countCardId,
    {
      countCardId,
      workflowState: 'submitted',
      status: 'pending' as CountCardStatus,
      workflowHistory: [...(card.workflowHistory || []), entry],
      updatedBy: submittedBy,
    },
    submittedBy
  );
}

/** SDI consolidates platoon submissions and forwards to CDI. */
export async function consolidateMcrdCountCardBySdi(
  countCardId: string,
  consolidatedBy: string,
  notes?: string
): Promise<void> {
  const card = await getMcrdCountCardById(countCardId);
  if (!card) throw new Error(`Count card ${countCardId} not found`);
  if (card.workflowState !== 'submitted' && card.workflowState !== 'under_review') {
    throw new Error(`Cannot consolidate from ${card.workflowState}`);
  }

  const entry: WorkflowHistoryEntry = {
    state: 'under_review',
    timestamp: Timestamp.now(),
    userId: consolidatedBy,
    notes: notes || 'Consolidated by Senior Drill Instructor; forwarded to CDI',
  };

  await updateMcrdCountCard(
    countCardId,
    {
      countCardId,
      workflowState: 'under_review',
      status: 'pending' as CountCardStatus,
      approvedBy: consolidatedBy,
      workflowHistory: [...(card.workflowHistory || []), entry],
      updatedBy: consolidatedBy,
    },
    consolidatedBy
  );
}

/** @deprecated Use consolidateMcrdCountCardBySdi — kept for callers expecting approveMcrdCountCard. */
export async function approveMcrdCountCard(
  countCardId: string,
  approvedBy: string,
  notes?: string
): Promise<void> {
  return consolidateMcrdCountCardBySdi(countCardId, approvedBy, notes);
}

/** CDI validates consolidated counts and forwards to 1stSgt / Series Commander. */
export async function validateMcrdCountCardByCdi(
  countCardId: string,
  validatedBy: string,
  notes?: string
): Promise<void> {
  const card = await getMcrdCountCardById(countCardId);
  if (!card) throw new Error(`Count card ${countCardId} not found`);
  if (card.workflowState !== 'under_review') {
    throw new Error(`Cannot validate from ${card.workflowState}`);
  }

  const entry: WorkflowHistoryEntry = {
    state: 'approved',
    timestamp: Timestamp.now(),
    userId: validatedBy,
    notes: notes || 'Validated by Chief Drill Instructor; forwarded to 1stSgt / Series',
  };

  await updateMcrdCountCard(
    countCardId,
    {
      countCardId,
      workflowState: 'approved',
      status: 'approved' as CountCardStatus,
      approvedBy: validatedBy,
      workflowHistory: [...(card.workflowHistory || []), entry],
      updatedBy: validatedBy,
    },
    validatedBy
  );
}

/** 1stSgt or Series Commander forwards toward battalion / company leadership. */
export async function forwardMcrdCountCard(
  countCardId: string,
  forwardedBy: string,
  notes?: string
): Promise<void> {
  const card = await getMcrdCountCardById(countCardId);
  if (!card) throw new Error(`Count card ${countCardId} not found`);
  if (card.workflowState !== 'approved') {
    throw new Error(`Cannot forward from ${card.workflowState}`);
  }

  const entry: WorkflowHistoryEntry = {
    state: 'consolidated',
    timestamp: Timestamp.now(),
    userId: forwardedBy,
    notes: notes || 'Forwarded to Battalion / Company leadership',
  };

  await updateMcrdCountCard(
    countCardId,
    {
      countCardId,
      workflowState: 'consolidated',
      status: 'consolidated' as CountCardStatus,
      workflowHistory: [...(card.workflowHistory || []), entry],
      updatedBy: forwardedBy,
    },
    forwardedBy
  );
}

/** BSM / Company XO / Commander final approval. */
export async function finalApproveMcrdCountCard(
  countCardId: string,
  approvedBy: string,
  notes?: string
): Promise<void> {
  const card = await getMcrdCountCardById(countCardId);
  if (!card) throw new Error(`Count card ${countCardId} not found`);
  if (card.workflowState !== 'consolidated') {
    throw new Error(`Cannot final-approve from ${card.workflowState}`);
  }

  const entry: WorkflowHistoryEntry = {
    state: 'final_approval',
    timestamp: Timestamp.now(),
    userId: approvedBy,
    notes: notes || 'Final approval complete',
  };

  await updateMcrdCountCard(
    countCardId,
    {
      countCardId,
      workflowState: 'final_approval',
      status: 'approved' as CountCardStatus,
      approvedBy,
      workflowHistory: [...(card.workflowHistory || []), entry],
      updatedBy: approvedBy,
    },
    approvedBy
  );
}

export async function rejectMcrdCountCard(
  countCardId: string,
  rejectedBy: string,
  notes: string
): Promise<void> {
  if (!notes?.trim()) throw new Error('Rejection notes are required');
  const card = await getMcrdCountCardById(countCardId);
  if (!card) throw new Error(`Count card ${countCardId} not found`);
  if (
    card.workflowState !== 'submitted' &&
    card.workflowState !== 'under_review' &&
    card.workflowState !== 'approved'
  ) {
    throw new Error(`Cannot reject from ${card.workflowState}`);
  }

  const entry: WorkflowHistoryEntry = {
    state: 'rejected',
    timestamp: Timestamp.now(),
    userId: rejectedBy,
    notes: `Rejected: ${notes}`,
  };

  await updateMcrdCountCard(
    countCardId,
    {
      countCardId,
      workflowState: 'rejected',
      status: 'rejected',
      rejectedBy,
      workflowHistory: [...(card.workflowHistory || []), entry],
      updatedBy: rejectedBy,
    },
    rejectedBy
  );
}
