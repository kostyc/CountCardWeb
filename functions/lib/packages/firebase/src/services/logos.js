"use strict";
/**
 * Logo Service
 *
 * Provides type-safe functions for logo operations in Firestore.
 * Handles logo metadata storage and retrieval. Actual file uploads to Firebase Storage
 * should be handled separately (e.g., in API routes or utility functions).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyLogo = createCompanyLogo;
exports.updateCompanyLogo = updateCompanyLogo;
exports.deleteCompanyLogo = deleteCompanyLogo;
exports.getCompanyLogoById = getCompanyLogoById;
exports.getCompanyLogoByOrganization = getCompanyLogoByOrganization;
exports.createBattalionLogo = createBattalionLogo;
exports.updateBattalionLogo = updateBattalionLogo;
exports.deleteBattalionLogo = deleteBattalionLogo;
exports.getBattalionLogoById = getBattalionLogoById;
exports.getBattalionLogoByOrganization = getBattalionLogoByOrganization;
const firestore_1 = require("firebase/firestore");
const base_1 = require("./base");
/**
 * Collection name for company logos
 */
const COMPANY_LOGOS_COLLECTION = 'companyLogos';
/**
 * Collection name for battalion logos
 */
const BATTALION_LOGOS_COLLECTION = 'battalionLogos';
/**
 * Create company logo
 */
async function createCompanyLogo(logoId, data, createdBy) {
    try {
        const logoData = {
            ...data,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now(),
            createdBy,
            updatedBy: createdBy,
        };
        await (0, base_1.createDocument)(COMPANY_LOGOS_COLLECTION, logoId, logoData, createdBy);
        return logoId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create company logo ${logoId}`);
    }
}
/**
 * Update company logo
 */
async function updateCompanyLogo(logoId, data, updatedBy) {
    try {
        const updateData = {
            ...data,
            updatedAt: firestore_1.Timestamp.now(),
            updatedBy,
        };
        await (0, base_1.updateDocument)(COMPANY_LOGOS_COLLECTION, logoId, updateData, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update company logo ${logoId}`);
    }
}
/**
 * Delete company logo
 * Note: This only deletes the Firestore document. The actual file in Firebase Storage
 * should be deleted separately.
 */
async function deleteCompanyLogo(logoId) {
    try {
        await (0, base_1.deleteDocument)(COMPANY_LOGOS_COLLECTION, logoId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to delete company logo ${logoId}`);
    }
}
/**
 * Get company logo by ID
 */
async function getCompanyLogoById(logoId) {
    try {
        const logo = await (0, base_1.getDocumentById)(COMPANY_LOGOS_COLLECTION, logoId);
        if (!logo) {
            return null;
        }
        return {
            ...logo,
            createdAt: (0, base_1.timestampToDate)(logo.createdAt),
            updatedAt: (0, base_1.timestampToDate)(logo.updatedAt),
            metadata: {
                ...logo.metadata,
                uploadedAt: (0, base_1.timestampToDate)(logo.metadata.uploadedAt),
            },
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get company logo ${logoId}`);
    }
}
/**
 * Get company logo by organization
 */
async function getCompanyLogoByOrganization(regiment, battalion, company) {
    try {
        const constraints = [
            (0, firestore_1.where)('regiment', '==', regiment),
            (0, firestore_1.where)('battalion', '==', battalion),
            (0, firestore_1.where)('company', '==', company),
            (0, firestore_1.orderBy)('createdAt', 'desc'),
        ];
        const result = await (0, base_1.queryDocuments)(COMPANY_LOGOS_COLLECTION, constraints, { pageSize: 1 });
        if (result.items.length === 0) {
            return null;
        }
        const logo = result.items[0];
        return {
            ...logo,
            createdAt: (0, base_1.timestampToDate)(logo.createdAt),
            updatedAt: (0, base_1.timestampToDate)(logo.updatedAt),
            metadata: {
                ...logo.metadata,
                uploadedAt: (0, base_1.timestampToDate)(logo.metadata.uploadedAt),
            },
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get company logo for ${regiment}/${battalion}/${company}`);
    }
}
/**
 * Create battalion logo
 */
async function createBattalionLogo(logoId, data, createdBy) {
    try {
        const logoData = {
            ...data,
            createdAt: firestore_1.Timestamp.now(),
            updatedAt: firestore_1.Timestamp.now(),
            createdBy,
            updatedBy: createdBy,
        };
        await (0, base_1.createDocument)(BATTALION_LOGOS_COLLECTION, logoId, logoData, createdBy);
        return logoId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create battalion logo ${logoId}`);
    }
}
/**
 * Update battalion logo
 */
async function updateBattalionLogo(logoId, data, updatedBy) {
    try {
        const updateData = {
            ...data,
            updatedAt: firestore_1.Timestamp.now(),
            updatedBy,
        };
        await (0, base_1.updateDocument)(BATTALION_LOGOS_COLLECTION, logoId, updateData, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update battalion logo ${logoId}`);
    }
}
/**
 * Delete battalion logo
 * Note: This only deletes the Firestore document. The actual file in Firebase Storage
 * should be deleted separately.
 */
async function deleteBattalionLogo(logoId) {
    try {
        await (0, base_1.deleteDocument)(BATTALION_LOGOS_COLLECTION, logoId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to delete battalion logo ${logoId}`);
    }
}
/**
 * Get battalion logo by ID
 */
async function getBattalionLogoById(logoId) {
    try {
        const logo = await (0, base_1.getDocumentById)(BATTALION_LOGOS_COLLECTION, logoId);
        if (!logo) {
            return null;
        }
        return {
            ...logo,
            createdAt: (0, base_1.timestampToDate)(logo.createdAt),
            updatedAt: (0, base_1.timestampToDate)(logo.updatedAt),
            metadata: {
                ...logo.metadata,
                uploadedAt: (0, base_1.timestampToDate)(logo.metadata.uploadedAt),
            },
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get battalion logo ${logoId}`);
    }
}
/**
 * Get battalion logo by organization
 */
async function getBattalionLogoByOrganization(regiment, battalion) {
    try {
        const constraints = [
            (0, firestore_1.where)('regiment', '==', regiment),
            (0, firestore_1.where)('battalion', '==', battalion),
            (0, firestore_1.orderBy)('createdAt', 'desc'),
        ];
        const result = await (0, base_1.queryDocuments)(BATTALION_LOGOS_COLLECTION, constraints, { pageSize: 1 });
        if (result.items.length === 0) {
            return null;
        }
        const logo = result.items[0];
        return {
            ...logo,
            createdAt: (0, base_1.timestampToDate)(logo.createdAt),
            updatedAt: (0, base_1.timestampToDate)(logo.updatedAt),
            metadata: {
                ...logo.metadata,
                uploadedAt: (0, base_1.timestampToDate)(logo.metadata.uploadedAt),
            },
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get battalion logo for ${regiment}/${battalion}`);
    }
}
//# sourceMappingURL=logos.js.map