/**
 * Recruit Service
 * 
 * Provides type-safe functions for recruit profile operations in Firestore.
 * Handles recruit profile creation, updates, retrieval, queries, and deletion
 * with GDPR compliance support.
 */

import {
  where,
  orderBy,
} from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  queryDocuments,
  handleFirestoreError,
  ServiceError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
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
