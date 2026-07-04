"use strict";
/**
 * Admin Log Service
 *
 * Provides type-safe functions for admin log operations in Firestore.
 * Admin logs are immutable - they can only be created and read, never updated or deleted.
 * This ensures audit trail integrity for compliance and security purposes.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminLogEntry = createAdminLogEntry;
exports.getAdminLogEntryById = getAdminLogEntryById;
exports.listAdminLogs = listAdminLogs;
exports.getAdminLogsByUser = getAdminLogsByUser;
exports.getAdminLogsByActionType = getAdminLogsByActionType;
exports.getAdminLogsByResourceType = getAdminLogsByResourceType;
exports.getAdminLogsByResource = getAdminLogsByResource;
exports.getAdminLogsByDateRange = getAdminLogsByDateRange;
const firestore_1 = require("firebase/firestore");
const base_1 = require("./base");
/**
 * Collection name for admin logs
 */
const COLLECTION_NAME = 'adminLogs';
/**
 * Create admin log entry
 * Admin logs are immutable - once created, they cannot be modified or deleted.
 * This ensures audit trail integrity for compliance and security purposes.
 */
async function createAdminLogEntry(logId, data, createdBy) {
    try {
        const now = firestore_1.Timestamp.now();
        const logData = {
            ...data,
            logId,
            timestamp: data.timestamp || now,
            ...(0, base_1.addBaseEntityFields)({}, createdBy),
        };
        await (0, base_1.createDocument)(COLLECTION_NAME, logId, logData, createdBy);
        return logId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create admin log entry ${logId}`);
    }
}
/**
 * Get admin log entry by ID
 * Note: Admin logs use logId as the document ID, so we query by document ID
 */
async function getAdminLogEntryById(logId) {
    try {
        // AdminLogEntry doesn't extend BaseEntity, so we need to use a workaround
        // Cast to satisfy the BaseEntity constraint
        const logEntry = await (0, base_1.getDocumentById)(COLLECTION_NAME, logId);
        if (!logEntry) {
            return null;
        }
        // Convert timestamp to date
        return {
            ...logEntry,
            timestamp: (0, base_1.timestampToDate)(logEntry.timestamp),
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get admin log entry ${logId}`);
    }
}
/**
 * List admin logs with filtering and pagination
 */
async function listAdminLogs(filters, pagination) {
    try {
        const constraints = [];
        // Add filters
        if (filters?.userId) {
            constraints.push((0, firestore_1.where)('userId', '==', filters.userId));
        }
        if (filters?.action) {
            constraints.push((0, firestore_1.where)('action', '==', filters.action));
        }
        if (filters?.resourceType) {
            constraints.push((0, firestore_1.where)('resourceType', '==', filters.resourceType));
        }
        if (filters?.resourceId) {
            constraints.push((0, firestore_1.where)('resourceId', '==', filters.resourceId));
        }
        if (filters?.startDate) {
            const startTimestamp = filters.startDate instanceof Date
                ? firestore_1.Timestamp.fromDate(filters.startDate)
                : filters.startDate;
            constraints.push((0, firestore_1.where)('timestamp', '>=', startTimestamp));
        }
        if (filters?.endDate) {
            const endTimestamp = filters.endDate instanceof Date
                ? firestore_1.Timestamp.fromDate(filters.endDate)
                : filters.endDate;
            constraints.push((0, firestore_1.where)('timestamp', '<=', endTimestamp));
        }
        // Add ordering (most recent first)
        constraints.push((0, firestore_1.orderBy)('timestamp', 'desc'));
        const result = await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
        // Convert timestamps to dates
        const items = result.items.map((item) => ({
            ...item,
            timestamp: (0, base_1.timestampToDate)(item.timestamp),
        }));
        return {
            ...result,
            items,
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to list admin logs');
    }
}
/**
 * Get admin logs by user
 */
async function getAdminLogsByUser(userId, pagination) {
    try {
        return await listAdminLogs({ userId }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get admin logs for user ${userId}`);
    }
}
/**
 * Get admin logs by action type
 */
async function getAdminLogsByActionType(action, pagination) {
    try {
        return await listAdminLogs({ action }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get admin logs by action type: ${action}`);
    }
}
/**
 * Get admin logs by resource type
 */
async function getAdminLogsByResourceType(resourceType, pagination) {
    try {
        return await listAdminLogs({ resourceType }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get admin logs by resource type: ${resourceType}`);
    }
}
/**
 * Get admin logs by resource
 * Gets all logs for a specific resource (resourceType + resourceId)
 */
async function getAdminLogsByResource(resourceType, resourceId, pagination) {
    try {
        return await listAdminLogs({ resourceType, resourceId }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get admin logs for resource ${resourceType}:${resourceId}`);
    }
}
/**
 * Get admin logs by date range
 */
async function getAdminLogsByDateRange(startDate, endDate, filters, pagination) {
    try {
        return await listAdminLogs({
            ...filters,
            startDate,
            endDate,
        }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to get admin logs by date range');
    }
}
//# sourceMappingURL=adminLogs.js.map