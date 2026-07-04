/**
 * Base Firestore Service Utilities
 * 
 * Provides common utilities for Firestore operations including:
 * - Firestore client initialization
 * - Common CRUD operations
 * - Query builder utilities
 * - Error handling utilities
 * - Transaction utilities
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
  WriteBatch,
  writeBatch,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import { getDb } from '../instance';
import type { BaseEntity } from '@countcard/core/types/models';

/**
 * Service error types
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Number of items per page */
  pageSize?: number;
  /** Last document snapshot for pagination */
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  /** Array of items */
  items: T[];
  /** Last document snapshot for next page */
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  /** Whether there are more items */
  hasMore: boolean;
}

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Date | Timestamp): Date {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return timestamp.toDate();
}

/**
 * Convert Date to Firestore Timestamp
 */
export function dateToTimestamp(date: Date | Timestamp): Timestamp {
  if (date instanceof Timestamp) {
    return date;
  }
  return Timestamp.fromDate(date instanceof Date ? date : new Date(date));
}

/**
 * Remove undefined values recursively. Firestore rejects undefined field values.
 */
export function stripUndefined<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Timestamp || value instanceof Date) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (val !== undefined) {
      result[key] = stripUndefined(val);
    }
  }
  return result as T;
}

/**
 * Add base entity fields to a document
 */
export function addBaseEntityFields<T extends Record<string, unknown>>(
  data: T,
  userId: string
): T & { createdAt: Timestamp; updatedAt: Timestamp; createdBy: string; updatedBy: string } {
  const now = Timestamp.now();
  return {
    ...data,
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
  };
}

/**
 * Update base entity fields
 */
export function updateBaseEntityFields<T extends Record<string, unknown>>(
  data: Partial<T>,
  userId: string
): Partial<T> & { updatedAt: Timestamp; updatedBy: string } {
  return {
    ...data,
    updatedAt: Timestamp.now(),
    updatedBy: userId,
  };
}

/**
 * Get document by ID
 */
export async function getDocumentById<T extends BaseEntity>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(getDb(), collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as Omit<T, 'id'>;
    return {
      id: docSnap.id,
      ...data,
      createdAt: timestampToDate(data.createdAt as Date | Timestamp),
      updatedAt: timestampToDate(data.updatedAt as Date | Timestamp),
    } as T;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get document ${documentId} from ${collectionName}`);
  }
}

/**
 * Create document
 */
export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: T,
  userId: string
): Promise<string> {
  try {
    const docRef = doc(getDb(), collectionName, documentId);
    const documentData = addBaseEntityFields(stripUndefined(data), userId);
    await setDoc(docRef, documentData);
    return documentId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create document in ${collectionName}`);
  }
}

/**
 * Update document
 */
export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  documentId: string,
  data: Partial<T>,
  userId: string
): Promise<void> {
  try {
    const docRef = doc(getDb(), collectionName, documentId);
    const updateData = updateBaseEntityFields(stripUndefined(data), userId);
    await updateDoc(docRef, updateData);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update document ${documentId} in ${collectionName}`);
  }
}

/**
 * Delete document
 */
export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(getDb(), collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to delete document ${documentId} from ${collectionName}`);
  }
}

/**
 * Query documents with pagination
 */
export async function queryDocuments<T extends BaseEntity>(
  collectionName: string,
  constraints: QueryConstraint[],
  pagination?: PaginationOptions
): Promise<PaginationResult<T>> {
  try {
    const collectionRef = collection(getDb(), collectionName);
    let q = query(collectionRef, ...constraints);

    // Add pagination
    if (pagination) {
      if (pagination.lastDoc) {
        q = query(q, startAfter(pagination.lastDoc));
      }
      if (pagination.pageSize) {
        q = query(q, limit(pagination.pageSize + 1)); // Fetch one extra to check if there's more
      }
    }

    const querySnapshot = await getDocs(q);
    const items: T[] = [];
    let lastDoc: QueryDocumentSnapshot<DocumentData> | undefined;
    let hasMore = false;

    querySnapshot.docs.forEach((docSnap, index) => {
      if (pagination?.pageSize && index === pagination.pageSize) {
        // This is the extra document, indicating there are more
        hasMore = true;
        lastDoc = querySnapshot.docs[index - 1];
        return;
      }

      const data = docSnap.data() as Omit<T, 'id'>;
      items.push({
        id: docSnap.id,
        ...data,
        createdAt: timestampToDate(data.createdAt as Date | Timestamp),
        updatedAt: timestampToDate(data.updatedAt as Date | Timestamp),
      } as T);

      if (index === querySnapshot.docs.length - 1) {
        lastDoc = docSnap;
      }
    });

    // If we fetched exactly pageSize items and there's no extra, check if there are more
    if (pagination?.pageSize && items.length === pagination.pageSize) {
      // We fetched one extra, so if we have pageSize items, there might be more
      // The hasMore flag is already set above if we found the extra document
    } else if (pagination?.pageSize && items.length < pagination.pageSize) {
      hasMore = false;
    }

    return {
      items,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    throw handleFirestoreError(error, `Failed to query documents from ${collectionName}`);
  }
}

/**
 * Handle Firestore errors
 */
export function handleFirestoreError(
  error: unknown,
  context?: string
): ServiceError {
  if (error instanceof FirestoreError) {
    return new ServiceError(
      context ? `${context}: ${error.message}` : error.message,
      error.code,
      error
    );
  }

  if (error instanceof Error) {
    return new ServiceError(
      context ? `${context}: ${error.message}` : error.message,
      'unknown',
      error
    );
  }

  return new ServiceError(
    context || 'An unknown error occurred',
    'unknown',
    error
  );
}

/**
 * Create a batch for batch writes
 */
export function createBatch(): WriteBatch {
  return writeBatch(getDb());
}

/**
 * Commit a batch
 */
export async function commitBatch(batch: WriteBatch): Promise<void> {
  try {
    await batch.commit();
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to commit batch');
  }
}
