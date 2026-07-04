/**
 * Emergency Contact Service
 * 
 * Provides type-safe functions for emergency contact operations in Firestore.
 * Handles emergency contact creation, updates, retrieval, queries, and deletion
 * with GDPR compliance support.
 */

import {
  query,
  where,
  orderBy,
} from 'firebase/firestore';
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
  EmergencyContact,
  EmergencyContactInput,
  EmergencyContactUpdate,
} from '@countcard/core/types/models';

/**
 * Collection name for emergency contacts
 */
const COLLECTION_NAME = 'emergencyContacts';

/**
 * Create emergency contact
 */
export async function createEmergencyContact(
  emergencyContactId: string,
  data: EmergencyContactInput,
  createdBy: string
): Promise<string> {
  try {
    await createDocument(COLLECTION_NAME, emergencyContactId, data, createdBy);
    return emergencyContactId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create emergency contact ${emergencyContactId}`);
  }
}

/**
 * Update emergency contact
 */
export async function updateEmergencyContact(
  emergencyContactId: string,
  data: EmergencyContactUpdate,
  updatedBy: string
): Promise<void> {
  try {
    await updateDocument(COLLECTION_NAME, emergencyContactId, data, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update emergency contact ${emergencyContactId}`);
  }
}

/**
 * Delete emergency contact (with GDPR compliance)
 * Note: This permanently deletes the emergency contact. For GDPR compliance,
 * ensure the recruit's emergencyContactIds array is also updated.
 */
export async function deleteEmergencyContact(emergencyContactId: string): Promise<void> {
  try {
    await deleteDocument(COLLECTION_NAME, emergencyContactId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to delete emergency contact ${emergencyContactId}`);
  }
}

/**
 * Get emergency contact by ID
 */
export async function getEmergencyContactById(
  emergencyContactId: string
): Promise<EmergencyContact | null> {
  try {
    return await getDocumentById<EmergencyContact>(COLLECTION_NAME, emergencyContactId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get emergency contact ${emergencyContactId}`);
  }
}

/**
 * Get emergency contacts by recruit
 */
export async function getEmergencyContactsByRecruit(
  recruitId: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<EmergencyContact>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];

    // Filter by recruit ID
    constraints.push(where('recruitId', '==', recruitId));

    // Order by last name, then first name
    constraints.push(orderBy('lastName', 'asc'));
    constraints.push(orderBy('firstName', 'asc'));

    return await queryDocuments<EmergencyContact>(
      COLLECTION_NAME,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get emergency contacts for recruit ${recruitId}`);
  }
}

/**
 * List emergency contacts with filtering and pagination
 */
export async function listEmergencyContacts(
  filters?: {
    recruitId?: string;
    relationship?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<EmergencyContact>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];

    // Add filters
    if (filters?.recruitId) {
      constraints.push(where('recruitId', '==', filters.recruitId));
    }
    if (filters?.relationship) {
      constraints.push(where('relationship', '==', filters.relationship));
    }

    // Add ordering
    constraints.push(orderBy('lastName', 'asc'));
    constraints.push(orderBy('firstName', 'asc'));

    return await queryDocuments<EmergencyContact>(
      COLLECTION_NAME,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list emergency contacts');
  }
}
