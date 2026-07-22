/**
 * Admin Log Service
 * 
 * Provides type-safe functions for admin log operations in Firestore.
 * Admin logs are immutable - they can only be created and read, never updated or deleted.
 * This ensures audit trail integrity for compliance and security purposes.
 */

import {
  Timestamp,
} from 'firebase/firestore';
import {
  createDocument,
  handleFirestoreError,
  addBaseEntityFields,
} from './base';
import type {
  AdminActionType,
  ResourceType,
} from '@countcard/core/types/models';

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
