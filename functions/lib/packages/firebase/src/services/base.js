"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = void 0;
exports.timestampToDate = timestampToDate;
exports.dateToTimestamp = dateToTimestamp;
exports.addBaseEntityFields = addBaseEntityFields;
exports.updateBaseEntityFields = updateBaseEntityFields;
exports.getDocumentById = getDocumentById;
exports.createDocument = createDocument;
exports.updateDocument = updateDocument;
exports.deleteDocument = deleteDocument;
exports.queryDocuments = queryDocuments;
exports.handleFirestoreError = handleFirestoreError;
exports.createBatch = createBatch;
exports.commitBatch = commitBatch;
const firestore_1 = require("firebase/firestore");
const instance_1 = require("../instance");
/**
 * Service error types
 */
class ServiceError extends Error {
    code;
    originalError;
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'ServiceError';
    }
}
exports.ServiceError = ServiceError;
/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp) {
    if (timestamp instanceof Date) {
        return timestamp;
    }
    return timestamp.toDate();
}
/**
 * Convert Date to Firestore Timestamp
 */
function dateToTimestamp(date) {
    if (date instanceof firestore_1.Timestamp) {
        return date;
    }
    return firestore_1.Timestamp.fromDate(date instanceof Date ? date : new Date(date));
}
/**
 * Add base entity fields to a document
 */
function addBaseEntityFields(data, userId) {
    const now = firestore_1.Timestamp.now();
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
function updateBaseEntityFields(data, userId) {
    return {
        ...data,
        updatedAt: firestore_1.Timestamp.now(),
        updatedBy: userId,
    };
}
/**
 * Get document by ID
 */
async function getDocumentById(collectionName, documentId) {
    try {
        const docRef = (0, firestore_1.doc)(instance_1.db, collectionName, documentId);
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: timestampToDate(data.createdAt),
            updatedAt: timestampToDate(data.updatedAt),
        };
    }
    catch (error) {
        throw handleFirestoreError(error, `Failed to get document ${documentId} from ${collectionName}`);
    }
}
/**
 * Create document
 */
async function createDocument(collectionName, documentId, data, userId) {
    try {
        const docRef = (0, firestore_1.doc)(instance_1.db, collectionName, documentId);
        const documentData = addBaseEntityFields(data, userId);
        await (0, firestore_1.setDoc)(docRef, documentData);
        return documentId;
    }
    catch (error) {
        throw handleFirestoreError(error, `Failed to create document in ${collectionName}`);
    }
}
/**
 * Update document
 */
async function updateDocument(collectionName, documentId, data, userId) {
    try {
        const docRef = (0, firestore_1.doc)(instance_1.db, collectionName, documentId);
        const updateData = updateBaseEntityFields(data, userId);
        await (0, firestore_1.updateDoc)(docRef, updateData);
    }
    catch (error) {
        throw handleFirestoreError(error, `Failed to update document ${documentId} in ${collectionName}`);
    }
}
/**
 * Delete document
 */
async function deleteDocument(collectionName, documentId) {
    try {
        const docRef = (0, firestore_1.doc)(instance_1.db, collectionName, documentId);
        await (0, firestore_1.deleteDoc)(docRef);
    }
    catch (error) {
        throw handleFirestoreError(error, `Failed to delete document ${documentId} from ${collectionName}`);
    }
}
/**
 * Query documents with pagination
 */
async function queryDocuments(collectionName, constraints, pagination) {
    try {
        const collectionRef = (0, firestore_1.collection)(instance_1.db, collectionName);
        let q = (0, firestore_1.query)(collectionRef, ...constraints);
        // Add pagination
        if (pagination) {
            if (pagination.lastDoc) {
                q = (0, firestore_1.query)(q, (0, firestore_1.startAfter)(pagination.lastDoc));
            }
            if (pagination.pageSize) {
                q = (0, firestore_1.query)(q, (0, firestore_1.limit)(pagination.pageSize + 1)); // Fetch one extra to check if there's more
            }
        }
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        const items = [];
        let lastDoc;
        let hasMore = false;
        querySnapshot.docs.forEach((docSnap, index) => {
            if (pagination?.pageSize && index === pagination.pageSize) {
                // This is the extra document, indicating there are more
                hasMore = true;
                lastDoc = querySnapshot.docs[index - 1];
                return;
            }
            const data = docSnap.data();
            items.push({
                id: docSnap.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt),
            });
            if (index === querySnapshot.docs.length - 1) {
                lastDoc = docSnap;
            }
        });
        // If we fetched exactly pageSize items and there's no extra, check if there are more
        if (pagination?.pageSize && items.length === pagination.pageSize) {
            // We fetched one extra, so if we have pageSize items, there might be more
            // The hasMore flag is already set above if we found the extra document
        }
        else if (pagination?.pageSize && items.length < pagination.pageSize) {
            hasMore = false;
        }
        return {
            items,
            lastDoc,
            hasMore,
        };
    }
    catch (error) {
        throw handleFirestoreError(error, `Failed to query documents from ${collectionName}`);
    }
}
/**
 * Handle Firestore errors
 */
function handleFirestoreError(error, context) {
    if (error instanceof firestore_1.FirestoreError) {
        return new ServiceError(context ? `${context}: ${error.message}` : error.message, error.code, error);
    }
    if (error instanceof Error) {
        return new ServiceError(context ? `${context}: ${error.message}` : error.message, 'unknown', error);
    }
    return new ServiceError(context || 'An unknown error occurred', 'unknown', error);
}
/**
 * Create a batch for batch writes
 */
function createBatch() {
    return (0, firestore_1.writeBatch)(instance_1.db);
}
/**
 * Commit a batch
 */
async function commitBatch(batch) {
    try {
        await batch.commit();
    }
    catch (error) {
        throw handleFirestoreError(error, 'Failed to commit batch');
    }
}
//# sourceMappingURL=base.js.map