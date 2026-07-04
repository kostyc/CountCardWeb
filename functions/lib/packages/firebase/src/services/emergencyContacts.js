"use strict";
/**
 * Emergency Contact Service
 *
 * Provides type-safe functions for emergency contact operations in Firestore.
 * Handles emergency contact creation, updates, retrieval, queries, and deletion
 * with GDPR compliance support.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmergencyContact = createEmergencyContact;
exports.updateEmergencyContact = updateEmergencyContact;
exports.deleteEmergencyContact = deleteEmergencyContact;
exports.getEmergencyContactById = getEmergencyContactById;
exports.getEmergencyContactsByRecruit = getEmergencyContactsByRecruit;
exports.listEmergencyContacts = listEmergencyContacts;
const firestore_1 = require("firebase/firestore");
const base_1 = require("./base");
/**
 * Collection name for emergency contacts
 */
const COLLECTION_NAME = 'emergencyContacts';
/**
 * Create emergency contact
 */
async function createEmergencyContact(emergencyContactId, data, createdBy) {
    try {
        await (0, base_1.createDocument)(COLLECTION_NAME, emergencyContactId, data, createdBy);
        return emergencyContactId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create emergency contact ${emergencyContactId}`);
    }
}
/**
 * Update emergency contact
 */
async function updateEmergencyContact(emergencyContactId, data, updatedBy) {
    try {
        await (0, base_1.updateDocument)(COLLECTION_NAME, emergencyContactId, data, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update emergency contact ${emergencyContactId}`);
    }
}
/**
 * Delete emergency contact (with GDPR compliance)
 * Note: This permanently deletes the emergency contact. For GDPR compliance,
 * ensure the recruit's emergencyContactIds array is also updated.
 */
async function deleteEmergencyContact(emergencyContactId) {
    try {
        await (0, base_1.deleteDocument)(COLLECTION_NAME, emergencyContactId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to delete emergency contact ${emergencyContactId}`);
    }
}
/**
 * Get emergency contact by ID
 */
async function getEmergencyContactById(emergencyContactId) {
    try {
        return await (0, base_1.getDocumentById)(COLLECTION_NAME, emergencyContactId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get emergency contact ${emergencyContactId}`);
    }
}
/**
 * Get emergency contacts by recruit
 */
async function getEmergencyContactsByRecruit(recruitId, pagination) {
    try {
        const constraints = [];
        // Filter by recruit ID
        constraints.push((0, firestore_1.where)('recruitId', '==', recruitId));
        // Order by last name, then first name
        constraints.push((0, firestore_1.orderBy)('lastName', 'asc'));
        constraints.push((0, firestore_1.orderBy)('firstName', 'asc'));
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get emergency contacts for recruit ${recruitId}`);
    }
}
/**
 * List emergency contacts with filtering and pagination
 */
async function listEmergencyContacts(filters, pagination) {
    try {
        const constraints = [];
        // Add filters
        if (filters?.recruitId) {
            constraints.push((0, firestore_1.where)('recruitId', '==', filters.recruitId));
        }
        if (filters?.relationship) {
            constraints.push((0, firestore_1.where)('relationship', '==', filters.relationship));
        }
        // Add ordering
        constraints.push((0, firestore_1.orderBy)('lastName', 'asc'));
        constraints.push((0, firestore_1.orderBy)('firstName', 'asc'));
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to list emergency contacts');
    }
}
//# sourceMappingURL=emergencyContacts.js.map