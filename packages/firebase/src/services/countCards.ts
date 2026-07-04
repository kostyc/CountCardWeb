/**
 * Count Card Service
 * 
 * Provides type-safe functions for count card operations in Firestore.
 * Handles count card creation, updates, retrieval, queries, and deletion
 * with GDPR compliance support.
 */

import {
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  handleFirestoreError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import type {
  CountCard,
  CountCardInput,
  CountCardUpdate,
  WorkflowHistoryEntry,
} from '@countcard/core/types/models';
import type { CountCardStatus, WorkflowState } from '@countcard/core/validation/countCardSchemas';
import type { Regiment } from '@countcard/core/types/auth';

/**
 * Collection name for count cards
 */
const COLLECTION_NAME = 'countCards';

/**
 * Create count card
 */
export async function createCountCard(
  countCardId: string,
  data: CountCardInput,
  createdBy: string
): Promise<string> {
  try {
    await createDocument(COLLECTION_NAME, countCardId, data, createdBy);
    return countCardId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create count card ${countCardId}`);
  }
}

/**
 * Update count card
 */
export async function updateCountCard(
  countCardId: string,
  data: CountCardUpdate,
  updatedBy: string
): Promise<void> {
  try {
    await updateDocument(COLLECTION_NAME, countCardId, data, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update count card ${countCardId}`);
  }
}

/**
 * Delete count card (with GDPR compliance)
 * Note: This permanently deletes the count card. For GDPR compliance,
 * ensure all related data is also handled.
 */
export async function deleteCountCard(countCardId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTION_NAME, countCardId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to delete count card ${countCardId}`);
  }
}

/**
 * Get count card by ID
 */
export async function getCountCardById(
  countCardId: string
): Promise<CountCard | null> {
  try {
    return await getDocumentById<CountCard>(COLLECTION_NAME, countCardId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get count card ${countCardId}`);
  }
}

/**
 * List count cards with filtering and pagination
 */
export async function listCountCards(
  filters?: {
    regiment?: Regiment;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
    status?: CountCardStatus;
    workflowState?: WorkflowState;
    submittedBy?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<CountCard>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];

    // Add filters
    if (filters?.regiment) {
      constraints.push(where('regiment', '==', filters.regiment));
    }
    if (filters?.battalion) {
      constraints.push(where('battalion', '==', filters.battalion));
    }
    if (filters?.company) {
      constraints.push(where('company', '==', filters.company));
    }
    if (filters?.series) {
      constraints.push(where('series', '==', filters.series));
    }
    if (filters?.platoon) {
      constraints.push(where('platoon', '==', filters.platoon));
    }
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.workflowState) {
      constraints.push(where('workflowState', '==', filters.workflowState));
    }
    if (filters?.submittedBy) {
      constraints.push(where('submittedBy', '==', filters.submittedBy));
    }

    // Add ordering (most recent first)
    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(orderBy('createdAt', 'desc'));

    return await queryDocuments<CountCard>(
      COLLECTION_NAME,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list count cards');
  }
}

/**
 * Get count cards by recruit
 * Note: This requires a recruitId field or relationship in the count card.
 * If count cards reference recruits differently, adjust this function accordingly.
 */
export async function getCountCardsByRecruit(
  recruitId: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<CountCard>> {
  try {
    // Note: This assumes count cards have a recruitId field or reference
    // Adjust based on actual data model relationship
    const constraints: Parameters<typeof queryDocuments>[1] = [];
    
    // If count cards reference recruits via recruitCounts or another field,
    // adjust the where clause accordingly
    // For now, this is a placeholder that may need adjustment
    constraints.push(where('recruitId', '==', recruitId));
    constraints.push(orderBy('timestamp', 'desc'));

    return await queryDocuments<CountCard>(
      COLLECTION_NAME,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get count cards for recruit ${recruitId}`);
  }
}

/**
 * Get count cards by status
 */
export async function getCountCardsByStatus(
  status: CountCardStatus,
  pagination?: PaginationOptions
): Promise<PaginationResult<CountCard>> {
  try {
    return await listCountCards({ status }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get count cards by status: ${status}`);
  }
}

/**
 * Get count cards by organization
 */
export async function getCountCardsByOrganization(
  organization: {
    regiment?: Regiment;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<CountCard>> {
  try {
    return await listCountCards(organization, pagination);
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to get count cards by organization');
  }
}

/**
 * Get count cards by date range
 */
export async function getCountCardsByDateRange(
  startDate: Date,
  endDate: Date,
  filters?: {
    regiment?: Regiment;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
    status?: CountCardStatus;
    workflowState?: WorkflowState;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<CountCard>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];

    // Add date range filters
    constraints.push(where('timestamp', '>=', startDate));
    constraints.push(where('timestamp', '<=', endDate));

    // Add additional filters
    if (filters?.regiment) {
      constraints.push(where('regiment', '==', filters.regiment));
    }
    if (filters?.battalion) {
      constraints.push(where('battalion', '==', filters.battalion));
    }
    if (filters?.company) {
      constraints.push(where('company', '==', filters.company));
    }
    if (filters?.series) {
      constraints.push(where('series', '==', filters.series));
    }
    if (filters?.platoon) {
      constraints.push(where('platoon', '==', filters.platoon));
    }
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters?.workflowState) {
      constraints.push(where('workflowState', '==', filters.workflowState));
    }

    // Add ordering
    constraints.push(orderBy('timestamp', 'desc'));

    return await queryDocuments<CountCard>(
      COLLECTION_NAME,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to get count cards by date range');
  }
}

/**
 * Get count cards by workflow state
 */
export async function getCountCardsByWorkflowState(
  workflowState: WorkflowState,
  pagination?: PaginationOptions
): Promise<PaginationResult<CountCard>> {
  try {
    return await listCountCards({ workflowState }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get count cards by workflow state: ${workflowState}`);
  }
}

/**
 * Approve count card (Senior Drill Instructor)
 * Changes workflow state to "approved" and forwards to Company 1stSgt and Series Commander
 */
export async function approveCountCard(
  countCardId: string,
  approvedBy: string,
  notes?: string,
  submittedTo?: string[]
): Promise<void> {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }

    // Validate workflow state transition
    if (countCard.workflowState !== 'submitted' && countCard.workflowState !== 'under_review') {
      throw new Error(`Cannot approve count card in ${countCard.workflowState} state`);
    }

    // Create workflow history entry
    const historyEntry: WorkflowHistoryEntry = {
      state: 'approved',
      timestamp: Timestamp.now(),
      userId: approvedBy,
      notes: notes || 'Count card approved and forwarded to Company 1stSgt and Series Commander',
    };

    // Update count card
    const updateData: CountCardUpdate = {
      countCardId,
      workflowState: 'approved',
      status: 'approved',
      approvedBy,
      submittedTo: submittedTo?.join(',') || undefined,
      workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
      updatedBy: approvedBy,
    };

    await updateCountCard(countCardId, updateData, approvedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to approve count card ${countCardId}`);
  }
}

/**
 * Reject count card (Senior Drill Instructor)
 * Changes workflow state to "rejected" and returns to Drill Instructor
 */
export async function rejectCountCard(
  countCardId: string,
  rejectedBy: string,
  notes: string
): Promise<void> {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }

    // Validate workflow state transition
    if (countCard.workflowState !== 'submitted' && countCard.workflowState !== 'under_review') {
      throw new Error(`Cannot reject count card in ${countCard.workflowState} state`);
    }

    if (!notes || notes.trim().length === 0) {
      throw new Error('Rejection notes are required');
    }

    // Create workflow history entry
    const historyEntry: WorkflowHistoryEntry = {
      state: 'rejected',
      timestamp: Timestamp.now(),
      userId: rejectedBy,
      notes: `Count card rejected: ${notes}`,
    };

    // Update count card
    const updateData: CountCardUpdate = {
      countCardId,
      workflowState: 'rejected',
      status: 'rejected',
      rejectedBy,
      workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
      updatedBy: rejectedBy,
    };

    await updateCountCard(countCardId, updateData, rejectedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to reject count card ${countCardId}`);
  }
}

/**
 * Consolidate count card (Company 1stSgt or Series Commander)
 * Changes workflow state to "consolidated" and forwards to Company XO, Company Commander, or Battalion SgtMaj
 */
export async function consolidateCountCard(
  countCardId: string,
  consolidatedBy: string,
  notes?: string,
  submittedTo?: string[]
): Promise<void> {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }

    // Validate workflow state transition
    if (countCard.workflowState !== 'approved') {
      throw new Error(`Cannot consolidate count card in ${countCard.workflowState} state`);
    }

    // Create workflow history entry
    const historyEntry: WorkflowHistoryEntry = {
      state: 'consolidated',
      timestamp: Timestamp.now(),
      userId: consolidatedBy,
      notes: notes || 'Count card consolidated and forwarded',
    };

    // Update count card
    const updateData: CountCardUpdate = {
      countCardId,
      workflowState: 'consolidated',
      status: 'consolidated',
      submittedTo: submittedTo?.join(',') || undefined,
      workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
      updatedBy: consolidatedBy,
    };

    await updateCountCard(countCardId, updateData, consolidatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to consolidate count card ${countCardId}`);
  }
}

/**
 * Final approve count card (Company XO, Company Commander, or Battalion SgtMaj)
 * Changes workflow state to "final_approval" and marks count card as complete
 */
export async function finalApproveCountCard(
  countCardId: string,
  approvedBy: string,
  notes?: string
): Promise<void> {
  try {
    const countCard = await getCountCardById(countCardId);
    if (!countCard) {
      throw new Error(`Count card ${countCardId} not found`);
    }

    // Validate workflow state transition
    if (countCard.workflowState !== 'consolidated') {
      throw new Error(`Cannot final approve count card in ${countCard.workflowState} state`);
    }

    // Create workflow history entry
    const historyEntry: WorkflowHistoryEntry = {
      state: 'final_approval',
      timestamp: Timestamp.now(),
      userId: approvedBy,
      notes: notes || 'Count card final approval granted',
    };

    // Update count card
    const updateData: CountCardUpdate = {
      countCardId,
      workflowState: 'final_approval',
      status: 'approved',
      approvedBy,
      workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
      updatedBy: approvedBy,
    };

    await updateCountCard(countCardId, updateData, approvedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to final approve count card ${countCardId}`);
  }
}
