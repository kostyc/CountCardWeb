/**
 * Recruit Service
 * 
 * Provides type-safe functions for recruit profile operations in Firestore.
 * Handles recruit profile creation, updates, retrieval, queries, and deletion
 * with GDPR compliance support.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  handleFirestoreError,
  ServiceError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import { getDb } from '../instance';
import type {
  RecruitProfile,
  RecruitProfileInput,
  RecruitProfileUpdate,
} from '@countcard/core/types/models';
import type { RecruitStatus } from '@countcard/core/validation/recruitSchemas';
import type { CustodyPhase } from '@countcard/core/validation/lifecycleSchemas';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import type { Regiment } from '@countcard/core/types/auth';
import { Timestamp } from 'firebase/firestore';
import { isStatusTransitionAllowed } from '@countcard/core/constants/recruitStatus';
import { createAdminLogEntry } from './adminLogs';

/**
 * Collection name for recruits
 */
const COLLECTION_NAME = 'recruits';

/**
 * Create recruit profile
 */
export async function createRecruitProfile(
  recruitId: string,
  data: RecruitProfileInput,
  createdBy: string
): Promise<string> {
  try {
    await createDocument(COLLECTION_NAME, recruitId, data, createdBy);
    return recruitId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create recruit profile for ${recruitId}`);
  }
}

/**
 * Update recruit profile
 */
export async function updateRecruitProfile(
  recruitId: string,
  data: RecruitProfileUpdate,
  updatedBy: string
): Promise<void> {
  try {
    await updateDocument(COLLECTION_NAME, recruitId, data, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update recruit profile for ${recruitId}`);
  }
}

/**
 * Update recruit status with history tracking
 * 
 * This function updates a recruit's status and maintains a history of status changes.
 * It validates status transitions and logs the change in admin logs.
 * 
 * @param recruitId - Recruit ID
 * @param newStatus - New status value
 * @param updatedBy - User ID who is making the change
 * @param reason - Optional reason for the status change
 * @param logAction - Whether to log the action in admin logs (default: true)
 */
export async function updateRecruitStatus(
  recruitId: string,
  newStatus: RecruitStatus,
  updatedBy: string,
  reason?: string,
  logAction: boolean = true
): Promise<void> {
  try {
    // Get current recruit profile
    const currentRecruit = await getRecruitProfileById(recruitId);
    
    if (!currentRecruit) {
      throw new Error(`Recruit profile not found: ${recruitId}`);
    }

    // Validate status transition
    if (!isStatusTransitionAllowed(currentRecruit.status, newStatus)) {
      throw new Error(
        `Invalid status transition from ${currentRecruit.status} to ${newStatus}`
      );
    }

    // If status hasn't changed, no-op
    if (currentRecruit.status === newStatus) {
      return;
    }

    // Create status history entry
    const statusHistoryEntry = {
      fromStatus: currentRecruit.status,
      toStatus: newStatus,
      timestamp: Timestamp.now(),
      changedBy: updatedBy,
      reason: reason || undefined,
    };

    // Get existing status history or create new array
    const existingHistory = currentRecruit.statusHistory || [];
    const updatedHistory = [...existingHistory, statusHistoryEntry];

    // Update recruit profile with new status and history
    const updateData: RecruitProfileUpdate = {
      recruitId,
      status: newStatus,
      statusHistory: updatedHistory,
      updatedBy,
      updatedAt: Timestamp.now(),
    };

    await updateDocument(COLLECTION_NAME, recruitId, updateData, updatedBy);

    // Log status change in admin logs (if enabled)
    if (logAction) {
      try {
        const logId = `status-change-${recruitId}-${Date.now()}`;
        await createAdminLogEntry(
          logId,
          {
            logId,
            userId: updatedBy,
            action: 'update',
            resourceType: 'recruit',
            resourceId: recruitId,
            description: `Status changed from ${currentRecruit.status} to ${newStatus}${reason ? `: ${reason}` : ''}`,
            metadata: {
              fromStatus: currentRecruit.status,
              toStatus: newStatus,
              reason: reason || null,
            },
            timestamp: Timestamp.now(),
          },
          updatedBy
        );
      } catch (logError) {
        // Log error but don't fail the status update
        console.error('Failed to log status change:', logError);
      }
    }
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update recruit status for ${recruitId}`);
  }
}

export type RecruitOrganizationalSnapshot = {
  regiment?: Regiment;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
};

/**
 * Transfer a recruit to a new organizational assignment and mark as transferred.
 */
export async function transferRecruitProfile(
  recruitId: string,
  toAssignment: RecruitOrganizationalSnapshot & { platoon: string },
  transferredBy: string,
  reason?: string
): Promise<void> {
  try {
    const currentRecruit = await getRecruitProfileById(recruitId);
    if (!currentRecruit) {
      throw new Error(`Recruit profile not found: ${recruitId}`);
    }

    if (currentRecruit.custodyPhase && currentRecruit.custodyPhase !== 'training') {
      throw new Error(
        'Recruit is not in training custody. Use transfer batch workflow for Receiving pickup.'
      );
    }

    const fromAssignment: RecruitOrganizationalSnapshot = {
      regiment: currentRecruit.regiment,
      battalion: currentRecruit.battalion,
      company: currentRecruit.company,
      series: currentRecruit.series,
      platoon: currentRecruit.platoon,
    };

    const assignmentUnchanged =
      fromAssignment.regiment === toAssignment.regiment &&
      fromAssignment.battalion === toAssignment.battalion &&
      fromAssignment.company === toAssignment.company &&
      fromAssignment.series === toAssignment.series &&
      fromAssignment.platoon === toAssignment.platoon;

    if (assignmentUnchanged) {
      throw new Error('New assignment must differ from the current assignment');
    }

    const transferEntry = {
      fromAssignment,
      toAssignment,
      timestamp: Timestamp.now(),
      transferredBy,
      reason: reason || undefined,
    };

    const newStatus: RecruitStatus = 'transferred';
    let status = currentRecruit.status;
    let statusHistory = currentRecruit.statusHistory || [];

    if (currentRecruit.status !== newStatus) {
      if (!isStatusTransitionAllowed(currentRecruit.status, newStatus)) {
        throw new Error(
          `Cannot transfer recruit with status "${currentRecruit.status}".`
        );
      }
      statusHistory = [
        ...statusHistory,
        {
          fromStatus: currentRecruit.status,
          toStatus: newStatus,
          timestamp: Timestamp.now(),
          changedBy: transferredBy,
          reason: reason || 'Organizational transfer',
        },
      ];
      status = newStatus;
    }

    const updateData: RecruitProfileUpdate = {
      recruitId,
      regiment: toAssignment.regiment,
      battalion: toAssignment.battalion,
      company: toAssignment.company,
      series: toAssignment.series,
      platoon: toAssignment.platoon,
      status,
      statusHistory,
      transferHistory: [...(currentRecruit.transferHistory || []), transferEntry],
      updatedBy: transferredBy,
      updatedAt: Timestamp.now(),
    };

    await updateDocument(COLLECTION_NAME, recruitId, updateData, transferredBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to transfer recruit ${recruitId}`);
  }
}

/**
 * Delete recruit profile (with GDPR compliance)
 * Note: This permanently deletes the recruit profile. For GDPR compliance,
 * ensure all related data (count cards, emergency contacts) is also handled.
 */
export async function deleteRecruitProfile(recruitId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTION_NAME, recruitId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to delete recruit profile for ${recruitId}`);
  }
}

/**
 * Get recruit profile by ID
 */
export async function getRecruitProfileById(
  recruitId: string
): Promise<RecruitProfile | null> {
  try {
    return await getDocumentById<RecruitProfile>(COLLECTION_NAME, recruitId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get recruit profile for ${recruitId}`);
  }
}

/**
 * List recruits with filtering and pagination
 */
export async function listRecruits(
  filters?: {
    regiment?: Regiment;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
    status?: RecruitStatus;
    rank?: RecruitRank;
    custodyPhase?: CustodyPhase;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<RecruitProfile>> {
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
    if (filters?.rank) {
      constraints.push(where('rank', '==', filters.rank));
    }
    if (filters?.custodyPhase) {
      constraints.push(where('custodyPhase', '==', filters.custodyPhase));
    }

    // Add ordering
    constraints.push(orderBy('lastName', 'asc'));
    constraints.push(orderBy('firstName', 'asc'));

    try {
      return await queryDocuments<RecruitProfile>(
        COLLECTION_NAME,
        constraints,
        pagination
      );
    } catch (error) {
      const code = error instanceof ServiceError ? error.code : '';
      const isIndexError =
        code === 'failed-precondition' ||
        (error instanceof Error && error.message.includes('requires an index'));
      if (!filters?.custodyPhase || !isIndexError) {
        throw error;
      }

      const fallbackConstraints: Parameters<typeof queryDocuments>[1] = [];
      if (filters.regiment) fallbackConstraints.push(where('regiment', '==', filters.regiment));
      if (filters.battalion) fallbackConstraints.push(where('battalion', '==', filters.battalion));
      if (filters.company) fallbackConstraints.push(where('company', '==', filters.company));
      if (filters.series) fallbackConstraints.push(where('series', '==', filters.series));
      if (filters.platoon) fallbackConstraints.push(where('platoon', '==', filters.platoon));
      if (filters.status) fallbackConstraints.push(where('status', '==', filters.status));
      if (filters.rank) fallbackConstraints.push(where('rank', '==', filters.rank));
      fallbackConstraints.push(where('custodyPhase', '==', filters.custodyPhase));

      const result = await queryDocuments<RecruitProfile>(
        COLLECTION_NAME,
        fallbackConstraints,
        pagination
      );
      result.items.sort((a, b) => {
        const last = a.lastName.localeCompare(b.lastName);
        return last !== 0 ? last : a.firstName.localeCompare(b.firstName);
      });
      return result;
    }
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list recruits');
  }
}

/**
 * Search recruits by name
 * Performs a case-insensitive search on firstName and lastName fields.
 * Note: Firestore doesn't support full-text search natively, so this uses
 * prefix matching. For more advanced search, consider using Algolia or similar.
 */
export async function searchRecruits(
  searchTerm: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<RecruitProfile>> {
  try {
    // Firestore doesn't support case-insensitive search or full-text search
    // This implementation uses prefix matching on lastName
    // For production, consider implementing a more sophisticated search solution
    const searchLower = searchTerm.toLowerCase().trim();
    
    // Try to find by last name prefix first
    const collectionRef = collection(getDb(), COLLECTION_NAME);
    const q = query(
      collectionRef,
      orderBy('lastName', 'asc'),
      orderBy('firstName', 'asc'),
      firestoreLimit(pagination?.pageSize || 50)
    );

    const querySnapshot = await getDocs(q);
    const items: RecruitProfile[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Omit<RecruitProfile, 'id'>;
      const lastName = (data.lastName || '').toLowerCase();
      const firstName = (data.firstName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`;

      // Check if search term matches lastName prefix, firstName prefix, or full name
      if (
        lastName.startsWith(searchLower) ||
        firstName.startsWith(searchLower) ||
        fullName.includes(searchLower)
      ) {
        items.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
          updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate(),
        } as RecruitProfile);
      }
    });

    // Note: This simple implementation doesn't support proper pagination for search
    // For production, consider using a dedicated search service
    return {
      items,
      hasMore: false, // Simplified - would need proper pagination for production
    };
  } catch (error) {
    throw handleFirestoreError(error, `Failed to search recruits with term: ${searchTerm}`);
  }
}

/**
 * Get recruits by organization
 */
export async function getRecruitsByOrganization(
  organization: {
    regiment?: Regiment;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<RecruitProfile>> {
  try {
    return await listRecruits(organization, pagination);
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to get recruits by organization');
  }
}

/**
 * Get recruits by status
 */
export async function getRecruitsByStatus(
  status: RecruitStatus,
  pagination?: PaginationOptions
): Promise<PaginationResult<RecruitProfile>> {
  try {
    return await listRecruits({ status }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get recruits by status: ${status}`);
  }
}

/**
 * Get recruits by rank
 */
export async function getRecruitsByRank(
  rank: RecruitRank,
  pagination?: PaginationOptions
): Promise<PaginationResult<RecruitProfile>> {
  try {
    return await listRecruits({ rank }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get recruits by rank: ${rank}`);
  }
}

/**
 * Get recruits by platoon
 */
export async function getRecruitsByPlatoon(
  platoon: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<RecruitProfile>> {
  try {
    return await listRecruits({ platoon }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get recruits by platoon: ${platoon}`);
  }
}

/** @deprecated Use getRecruitProfileById — kept for existing Expo imports */
export { getRecruitProfileById as getRecruitById };
