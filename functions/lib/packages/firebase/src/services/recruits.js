"use strict";
/**
 * Recruit Service
 *
 * Provides type-safe functions for recruit profile operations in Firestore.
 * Handles recruit profile creation, updates, retrieval, queries, and deletion
 * with GDPR compliance support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecruitProfile = createRecruitProfile;
exports.updateRecruitProfile = updateRecruitProfile;
exports.updateRecruitStatus = updateRecruitStatus;
exports.deleteRecruitProfile = deleteRecruitProfile;
exports.getRecruitProfileById = getRecruitProfileById;
exports.listRecruits = listRecruits;
exports.searchRecruits = searchRecruits;
exports.getRecruitsByOrganization = getRecruitsByOrganization;
exports.getRecruitsByStatus = getRecruitsByStatus;
exports.getRecruitsByRank = getRecruitsByRank;
exports.getRecruitsByPlatoon = getRecruitsByPlatoon;
const firestore_1 = require("firebase/firestore");
const base_1 = require("./base");
const instance_1 = require("../instance");
const firestore_2 = require("firebase/firestore");
const recruitStatus_1 = require("@countcard/core/constants/recruitStatus");
const adminLogs_1 = require("./adminLogs");
/**
 * Collection name for recruits
 */
const COLLECTION_NAME = 'recruits';
/**
 * Create recruit profile
 */
async function createRecruitProfile(recruitId, data, createdBy) {
    try {
        await (0, base_1.createDocument)(COLLECTION_NAME, recruitId, data, createdBy);
        return recruitId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create recruit profile for ${recruitId}`);
    }
}
/**
 * Update recruit profile
 */
async function updateRecruitProfile(recruitId, data, updatedBy) {
    try {
        await (0, base_1.updateDocument)(COLLECTION_NAME, recruitId, data, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update recruit profile for ${recruitId}`);
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
async function updateRecruitStatus(recruitId, newStatus, updatedBy, reason, logAction = true) {
    try {
        // Get current recruit profile
        const currentRecruit = await getRecruitProfileById(recruitId);
        if (!currentRecruit) {
            throw new Error(`Recruit profile not found: ${recruitId}`);
        }
        // Validate status transition
        if (!(0, recruitStatus_1.isStatusTransitionAllowed)(currentRecruit.status, newStatus)) {
            throw new Error(`Invalid status transition from ${currentRecruit.status} to ${newStatus}`);
        }
        // If status hasn't changed, no-op
        if (currentRecruit.status === newStatus) {
            return;
        }
        // Create status history entry
        const statusHistoryEntry = {
            fromStatus: currentRecruit.status,
            toStatus: newStatus,
            timestamp: firestore_2.Timestamp.now(),
            changedBy: updatedBy,
            reason: reason || undefined,
        };
        // Get existing status history or create new array
        const existingHistory = currentRecruit.statusHistory || [];
        const updatedHistory = [...existingHistory, statusHistoryEntry];
        // Update recruit profile with new status and history
        const updateData = {
            recruitId,
            status: newStatus,
            statusHistory: updatedHistory,
            updatedBy,
            updatedAt: firestore_2.Timestamp.now(),
        };
        await (0, base_1.updateDocument)(COLLECTION_NAME, recruitId, updateData, updatedBy);
        // Log status change in admin logs (if enabled)
        if (logAction) {
            try {
                const logId = `status-change-${recruitId}-${Date.now()}`;
                await (0, adminLogs_1.createAdminLogEntry)(logId, {
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
                    timestamp: firestore_2.Timestamp.now(),
                }, updatedBy);
            }
            catch (logError) {
                // Log error but don't fail the status update
                console.error('Failed to log status change:', logError);
            }
        }
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update recruit status for ${recruitId}`);
    }
}
/**
 * Delete recruit profile (with GDPR compliance)
 * Note: This permanently deletes the recruit profile. For GDPR compliance,
 * ensure all related data (count cards, emergency contacts) is also handled.
 */
async function deleteRecruitProfile(recruitId) {
    try {
        await (0, base_1.deleteDocument)(COLLECTION_NAME, recruitId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to delete recruit profile for ${recruitId}`);
    }
}
/**
 * Get recruit profile by ID
 */
async function getRecruitProfileById(recruitId) {
    try {
        return await (0, base_1.getDocumentById)(COLLECTION_NAME, recruitId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get recruit profile for ${recruitId}`);
    }
}
/**
 * List recruits with filtering and pagination
 */
async function listRecruits(filters, pagination) {
    try {
        const constraints = [];
        // Add filters
        if (filters?.regiment) {
            constraints.push((0, firestore_1.where)('regiment', '==', filters.regiment));
        }
        if (filters?.battalion) {
            constraints.push((0, firestore_1.where)('battalion', '==', filters.battalion));
        }
        if (filters?.company) {
            constraints.push((0, firestore_1.where)('company', '==', filters.company));
        }
        if (filters?.series) {
            constraints.push((0, firestore_1.where)('series', '==', filters.series));
        }
        if (filters?.platoon) {
            constraints.push((0, firestore_1.where)('platoon', '==', filters.platoon));
        }
        if (filters?.status) {
            constraints.push((0, firestore_1.where)('status', '==', filters.status));
        }
        if (filters?.rank) {
            constraints.push((0, firestore_1.where)('rank', '==', filters.rank));
        }
        // Add ordering
        constraints.push((0, firestore_1.orderBy)('lastName', 'asc'));
        constraints.push((0, firestore_1.orderBy)('firstName', 'asc'));
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to list recruits');
    }
}
/**
 * Search recruits by name
 * Performs a case-insensitive search on firstName and lastName fields.
 * Note: Firestore doesn't support full-text search natively, so this uses
 * prefix matching. For more advanced search, consider using Algolia or similar.
 */
async function searchRecruits(searchTerm, pagination) {
    try {
        // Firestore doesn't support case-insensitive search or full-text search
        // This implementation uses prefix matching on lastName
        // For production, consider implementing a more sophisticated search solution
        const searchLower = searchTerm.toLowerCase().trim();
        // Try to find by last name prefix first
        const collectionRef = (0, firestore_1.collection)(instance_1.db, COLLECTION_NAME);
        const q = (0, firestore_1.query)(collectionRef, (0, firestore_1.orderBy)('lastName', 'asc'), (0, firestore_1.orderBy)('firstName', 'asc'), (0, firestore_1.limit)(pagination?.pageSize || 50));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        const items = [];
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const lastName = (data.lastName || '').toLowerCase();
            const firstName = (data.firstName || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`;
            // Check if search term matches lastName prefix, firstName prefix, or full name
            if (lastName.startsWith(searchLower) ||
                firstName.startsWith(searchLower) ||
                fullName.includes(searchLower)) {
                items.push({
                    id: docSnap.id,
                    ...data,
                    createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
                    updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate(),
                });
            }
        });
        // Note: This simple implementation doesn't support proper pagination for search
        // For production, consider using a dedicated search service
        return {
            items,
            hasMore: false, // Simplified - would need proper pagination for production
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to search recruits with term: ${searchTerm}`);
    }
}
/**
 * Get recruits by organization
 */
async function getRecruitsByOrganization(organization, pagination) {
    try {
        return await listRecruits(organization, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to get recruits by organization');
    }
}
/**
 * Get recruits by status
 */
async function getRecruitsByStatus(status, pagination) {
    try {
        return await listRecruits({ status }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get recruits by status: ${status}`);
    }
}
/**
 * Get recruits by rank
 */
async function getRecruitsByRank(rank, pagination) {
    try {
        return await listRecruits({ rank }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get recruits by rank: ${rank}`);
    }
}
/**
 * Get recruits by platoon
 */
async function getRecruitsByPlatoon(platoon, pagination) {
    try {
        return await listRecruits({ platoon }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get recruits by platoon: ${platoon}`);
    }
}
//# sourceMappingURL=recruits.js.map