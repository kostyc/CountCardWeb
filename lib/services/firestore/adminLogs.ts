/**
 * Admin Log Service
 * 
 * Provides type-safe functions for admin log operations in Firestore.
 * Admin logs are immutable - they can only be created and read, never updated or deleted.
 * This ensures audit trail integrity for compliance and security purposes.
 */

import {
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {
  createDocument,
  getDocumentById,
  queryDocuments,
  handleFirestoreError,
  timestampToDate,
  addBaseEntityFields,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import type {
  AdminLogEntry,
  AdminActionType,
  ResourceType,
  BaseEntity,
} from '@/types/models';

/**
 * Collection name for admin logs
 */
const COLLECTION_NAME = 'adminLogs';

/**
 * Admin Log Input (for creation)
 * Admin logs are immutable, so this is only used for creation
 */
export interface AdminLogInput {
  logId: string;
  userId: string;
  action: AdminActionType;
  resourceType: ResourceType;
  resourceId: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date | Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create admin log entry
 * Admin logs are immutable - once created, they cannot be modified or deleted.
 * This ensures audit trail integrity for compliance and security purposes.
 */
export async function createAdminLogEntry(
  logId: string,
  data: AdminLogInput,
  createdBy: string
): Promise<string> {
  try {
    const now = Timestamp.now();
    const logData = {
      ...data,
      logId,
      timestamp: data.timestamp || now,
      ...addBaseEntityFields({}, createdBy),
    };

    await createDocument(COLLECTION_NAME, logId, logData, createdBy);
    return logId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create admin log entry ${logId}`);
  }
}

/**
 * Get admin log entry by ID
 * Note: Admin logs use logId as the document ID, so we query by document ID
 */
export async function getAdminLogEntryById(
  logId: string
): Promise<AdminLogEntry | null> {
  try {
    // AdminLogEntry doesn't extend BaseEntity, so we need to use a workaround
    // Cast to satisfy the BaseEntity constraint
    const logEntry = await getDocumentById<BaseEntity>(
      COLLECTION_NAME,
      logId
    ) as (AdminLogEntry & BaseEntity) | null;

    if (!logEntry) {
      return null;
    }

    // Convert timestamp to date
    return {
      ...logEntry,
      timestamp: timestampToDate(logEntry.timestamp),
    } as AdminLogEntry;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get admin log entry ${logId}`);
  }
}

/**
 * List admin logs with filtering and pagination
 */
export async function listAdminLogs(
  filters?: {
    userId?: string;
    action?: AdminActionType;
    resourceType?: ResourceType;
    resourceId?: string;
    startDate?: Date | Timestamp;
    endDate?: Date | Timestamp;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<AdminLogEntry>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];

    // Add filters
    if (filters?.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters?.action) {
      constraints.push(where('action', '==', filters.action));
    }
    if (filters?.resourceType) {
      constraints.push(where('resourceType', '==', filters.resourceType));
    }
    if (filters?.resourceId) {
      constraints.push(where('resourceId', '==', filters.resourceId));
    }
    if (filters?.startDate) {
      const startTimestamp = filters.startDate instanceof Date
        ? Timestamp.fromDate(filters.startDate)
        : filters.startDate;
      constraints.push(where('timestamp', '>=', startTimestamp));
    }
    if (filters?.endDate) {
      const endTimestamp = filters.endDate instanceof Date
        ? Timestamp.fromDate(filters.endDate)
        : filters.endDate;
      constraints.push(where('timestamp', '<=', endTimestamp));
    }

    // Add ordering (most recent first)
    constraints.push(orderBy('timestamp', 'desc'));

    const result = await queryDocuments<BaseEntity>(
      COLLECTION_NAME,
      constraints,
      pagination
    ) as PaginationResult<AdminLogEntry & BaseEntity>;

    // Convert timestamps to dates
    const items = result.items.map((item) => ({
      ...item,
      timestamp: timestampToDate(item.timestamp),
    }));

    return {
      ...result,
      items,
    };
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list admin logs');
  }
}

/**
 * Get admin logs by user
 */
export async function getAdminLogsByUser(
  userId: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<AdminLogEntry>> {
  try {
    return await listAdminLogs({ userId }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get admin logs for user ${userId}`);
  }
}

/**
 * Get admin logs by action type
 */
export async function getAdminLogsByActionType(
  action: AdminActionType,
  pagination?: PaginationOptions
): Promise<PaginationResult<AdminLogEntry>> {
  try {
    return await listAdminLogs({ action }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get admin logs by action type: ${action}`);
  }
}

/**
 * Get admin logs by resource type
 */
export async function getAdminLogsByResourceType(
  resourceType: ResourceType,
  pagination?: PaginationOptions
): Promise<PaginationResult<AdminLogEntry>> {
  try {
    return await listAdminLogs({ resourceType }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get admin logs by resource type: ${resourceType}`);
  }
}

/**
 * Get admin logs by resource
 * Gets all logs for a specific resource (resourceType + resourceId)
 */
export async function getAdminLogsByResource(
  resourceType: ResourceType,
  resourceId: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<AdminLogEntry>> {
  try {
    return await listAdminLogs({ resourceType, resourceId }, pagination);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get admin logs for resource ${resourceType}:${resourceId}`);
  }
}

/**
 * Get admin logs by date range
 */
export async function getAdminLogsByDateRange(
  startDate: Date | Timestamp,
  endDate: Date | Timestamp,
  filters?: {
    userId?: string;
    action?: AdminActionType;
    resourceType?: ResourceType;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<AdminLogEntry>> {
  try {
    return await listAdminLogs(
      {
        ...filters,
        startDate,
        endDate,
      },
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to get admin logs by date range');
  }
}
