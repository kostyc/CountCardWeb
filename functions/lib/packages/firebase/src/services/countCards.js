"use strict";
/**
 * Count Card Service
 *
 * Provides type-safe functions for count card operations in Firestore.
 * Handles count card creation, updates, retrieval, queries, and deletion
 * with GDPR compliance support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCountCard = createCountCard;
exports.updateCountCard = updateCountCard;
exports.deleteCountCard = deleteCountCard;
exports.getCountCardById = getCountCardById;
exports.listCountCards = listCountCards;
exports.getCountCardsByRecruit = getCountCardsByRecruit;
exports.getCountCardsByStatus = getCountCardsByStatus;
exports.getCountCardsByOrganization = getCountCardsByOrganization;
exports.getCountCardsByDateRange = getCountCardsByDateRange;
exports.getCountCardsByWorkflowState = getCountCardsByWorkflowState;
exports.approveCountCard = approveCountCard;
exports.rejectCountCard = rejectCountCard;
exports.consolidateCountCard = consolidateCountCard;
exports.finalApproveCountCard = finalApproveCountCard;
const firestore_1 = require("firebase/firestore");
const firestore_2 = require("firebase/firestore");
const base_1 = require("./base");
/**
 * Collection name for count cards
 */
const COLLECTION_NAME = 'countCards';
/**
 * Create count card
 */
async function createCountCard(countCardId, data, createdBy) {
    try {
        await (0, base_1.createDocument)(COLLECTION_NAME, countCardId, data, createdBy);
        return countCardId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create count card ${countCardId}`);
    }
}
/**
 * Update count card
 */
async function updateCountCard(countCardId, data, updatedBy) {
    try {
        await (0, base_1.updateDocument)(COLLECTION_NAME, countCardId, data, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update count card ${countCardId}`);
    }
}
/**
 * Delete count card (with GDPR compliance)
 * Note: This permanently deletes the count card. For GDPR compliance,
 * ensure all related data is also handled.
 */
async function deleteCountCard(countCardId) {
    try {
        await (0, base_1.deleteDocument)(COLLECTION_NAME, countCardId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to delete count card ${countCardId}`);
    }
}
/**
 * Get count card by ID
 */
async function getCountCardById(countCardId) {
    try {
        return await (0, base_1.getDocumentById)(COLLECTION_NAME, countCardId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get count card ${countCardId}`);
    }
}
/**
 * List count cards with filtering and pagination
 */
async function listCountCards(filters, pagination) {
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
        if (filters?.workflowState) {
            constraints.push((0, firestore_1.where)('workflowState', '==', filters.workflowState));
        }
        if (filters?.submittedBy) {
            constraints.push((0, firestore_1.where)('submittedBy', '==', filters.submittedBy));
        }
        // Add ordering (most recent first)
        constraints.push((0, firestore_1.orderBy)('timestamp', 'desc'));
        constraints.push((0, firestore_1.orderBy)('createdAt', 'desc'));
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to list count cards');
    }
}
/**
 * Get count cards by recruit
 * Note: This requires a recruitId field or relationship in the count card.
 * If count cards reference recruits differently, adjust this function accordingly.
 */
async function getCountCardsByRecruit(recruitId, pagination) {
    try {
        // Note: This assumes count cards have a recruitId field or reference
        // Adjust based on actual data model relationship
        const constraints = [];
        // If count cards reference recruits via recruitCounts or another field,
        // adjust the where clause accordingly
        // For now, this is a placeholder that may need adjustment
        constraints.push((0, firestore_1.where)('recruitId', '==', recruitId));
        constraints.push((0, firestore_1.orderBy)('timestamp', 'desc'));
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get count cards for recruit ${recruitId}`);
    }
}
/**
 * Get count cards by status
 */
async function getCountCardsByStatus(status, pagination) {
    try {
        return await listCountCards({ status }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get count cards by status: ${status}`);
    }
}
/**
 * Get count cards by organization
 */
async function getCountCardsByOrganization(organization, pagination) {
    try {
        return await listCountCards(organization, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to get count cards by organization');
    }
}
/**
 * Get count cards by date range
 */
async function getCountCardsByDateRange(startDate, endDate, filters, pagination) {
    try {
        const constraints = [];
        // Add date range filters
        constraints.push((0, firestore_1.where)('timestamp', '>=', startDate));
        constraints.push((0, firestore_1.where)('timestamp', '<=', endDate));
        // Add additional filters
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
        if (filters?.workflowState) {
            constraints.push((0, firestore_1.where)('workflowState', '==', filters.workflowState));
        }
        // Add ordering
        constraints.push((0, firestore_1.orderBy)('timestamp', 'desc'));
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to get count cards by date range');
    }
}
/**
 * Get count cards by workflow state
 */
async function getCountCardsByWorkflowState(workflowState, pagination) {
    try {
        return await listCountCards({ workflowState }, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get count cards by workflow state: ${workflowState}`);
    }
}
/**
 * Approve count card (Senior Drill Instructor)
 * Changes workflow state to "approved" and forwards to Company 1stSgt and Series Commander
 */
async function approveCountCard(countCardId, approvedBy, notes, submittedTo) {
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
        const historyEntry = {
            state: 'approved',
            timestamp: firestore_2.Timestamp.now(),
            userId: approvedBy,
            notes: notes || 'Count card approved and forwarded to Company 1stSgt and Series Commander',
        };
        // Update count card
        const updateData = {
            countCardId,
            workflowState: 'approved',
            status: 'approved',
            approvedBy,
            submittedTo: submittedTo?.join(',') || undefined,
            workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
            updatedBy: approvedBy,
        };
        await updateCountCard(countCardId, updateData, approvedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to approve count card ${countCardId}`);
    }
}
/**
 * Reject count card (Senior Drill Instructor)
 * Changes workflow state to "rejected" and returns to Drill Instructor
 */
async function rejectCountCard(countCardId, rejectedBy, notes) {
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
        const historyEntry = {
            state: 'rejected',
            timestamp: firestore_2.Timestamp.now(),
            userId: rejectedBy,
            notes: `Count card rejected: ${notes}`,
        };
        // Update count card
        const updateData = {
            countCardId,
            workflowState: 'rejected',
            status: 'rejected',
            rejectedBy,
            workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
            updatedBy: rejectedBy,
        };
        await updateCountCard(countCardId, updateData, rejectedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to reject count card ${countCardId}`);
    }
}
/**
 * Consolidate count card (Company 1stSgt or Series Commander)
 * Changes workflow state to "consolidated" and forwards to Company XO, Company Commander, or Battalion SgtMaj
 */
async function consolidateCountCard(countCardId, consolidatedBy, notes, submittedTo) {
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
        const historyEntry = {
            state: 'consolidated',
            timestamp: firestore_2.Timestamp.now(),
            userId: consolidatedBy,
            notes: notes || 'Count card consolidated and forwarded',
        };
        // Update count card
        const updateData = {
            countCardId,
            workflowState: 'consolidated',
            status: 'consolidated',
            submittedTo: submittedTo?.join(',') || undefined,
            workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
            updatedBy: consolidatedBy,
        };
        await updateCountCard(countCardId, updateData, consolidatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to consolidate count card ${countCardId}`);
    }
}
/**
 * Final approve count card (Company XO, Company Commander, or Battalion SgtMaj)
 * Changes workflow state to "final_approval" and marks count card as complete
 */
async function finalApproveCountCard(countCardId, approvedBy, notes) {
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
        const historyEntry = {
            state: 'final_approval',
            timestamp: firestore_2.Timestamp.now(),
            userId: approvedBy,
            notes: notes || 'Count card final approval granted',
        };
        // Update count card
        const updateData = {
            countCardId,
            workflowState: 'final_approval',
            status: 'approved',
            approvedBy,
            workflowHistory: [...(countCard.workflowHistory || []), historyEntry],
            updatedBy: approvedBy,
        };
        await updateCountCard(countCardId, updateData, approvedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to final approve count card ${countCardId}`);
    }
}
//# sourceMappingURL=countCards.js.map