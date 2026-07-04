"use strict";
/**
 * User Profile Service
 *
 * Provides type-safe functions for user profile operations in Firestore.
 * Handles user profile creation, updates, retrieval, and queries.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserProfile = createUserProfile;
exports.updateUserProfile = updateUserProfile;
exports.getUserProfileById = getUserProfileById;
exports.getUserProfileByEmail = getUserProfileByEmail;
exports.updateProfileCompletionStatus = updateProfileCompletionStatus;
exports.updateProfileCompletionAuto = updateProfileCompletionAuto;
exports.getUsersByRole = getUsersByRole;
exports.getUsersByOrganization = getUsersByOrganization;
exports.userProfileExists = userProfileExists;
const firestore_1 = require("firebase/firestore");
const base_1 = require("./base");
const instance_1 = require("../instance");
/**
 * Collection name for user profiles
 */
const COLLECTION_NAME = 'userProfiles';
/**
 * Create user profile
 */
async function createUserProfile(userId, data, createdBy) {
    try {
        const profileData = {
            ...data,
            userId, // Ensure userId from parameter takes precedence
        };
        await (0, base_1.createDocument)(COLLECTION_NAME, userId, profileData, createdBy);
        return userId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create user profile for ${userId}`);
    }
}
/**
 * Update user profile
 */
async function updateUserProfile(userId, data, updatedBy) {
    try {
        await (0, base_1.updateDocument)(COLLECTION_NAME, userId, data, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update user profile for ${userId}`);
    }
}
/**
 * Get user profile by ID
 */
async function getUserProfileById(userId) {
    try {
        return await (0, base_1.getDocumentById)(COLLECTION_NAME, userId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get user profile for ${userId}`);
    }
}
/**
 * Get user profile by email
 */
async function getUserProfileByEmail(email) {
    try {
        const collectionRef = (0, firestore_1.collection)(instance_1.db, COLLECTION_NAME);
        const q = (0, firestore_1.query)(collectionRef, (0, firestore_1.where)('email', '==', email.toLowerCase().trim()), (0, firestore_1.limit)(1));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty) {
            return null;
        }
        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
            updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate(),
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get user profile by email ${email}`);
    }
}
/**
 * Update profile completion status
 */
async function updateProfileCompletionStatus(userId, completionPercentage, updatedBy) {
    try {
        await (0, base_1.updateDocument)(COLLECTION_NAME, userId, {
            profileCompletion: completionPercentage,
        }, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update profile completion status for ${userId}`);
    }
}
/**
 * Update profile completion status automatically
 * Calculates completion based on profile data
 */
async function updateProfileCompletionAuto(userId, profile, updatedBy) {
    try {
        const { calculateProfileCompletion } = await Promise.resolve().then(() => __importStar(require('@countcard/core/profileCompletion')));
        const completionPercentage = calculateProfileCompletion(profile);
        await updateProfileCompletionStatus(userId, completionPercentage, updatedBy);
        return completionPercentage;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update profile completion for ${userId}`);
    }
}
/**
 * Get users by role
 */
async function getUsersByRole(role, pagination) {
    try {
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, [
            (0, firestore_1.where)('role', '==', role),
            (0, firestore_1.orderBy)('lastName', 'asc'),
            (0, firestore_1.orderBy)('firstName', 'asc'),
        ], pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get users by role ${role}`);
    }
}
/**
 * Get users by organization
 */
async function getUsersByOrganization(organization, pagination) {
    try {
        const constraints = [];
        if (organization.regiment) {
            constraints.push((0, firestore_1.where)('organizationalAssignment.regiment', '==', organization.regiment));
        }
        if (organization.battalion) {
            constraints.push((0, firestore_1.where)('organizationalAssignment.battalion', '==', organization.battalion));
        }
        if (organization.company) {
            constraints.push((0, firestore_1.where)('organizationalAssignment.company', '==', organization.company));
        }
        if (organization.series) {
            constraints.push((0, firestore_1.where)('organizationalAssignment.series', '==', organization.series));
        }
        if (organization.platoon) {
            constraints.push((0, firestore_1.where)('organizationalAssignment.platoon', '==', organization.platoon));
        }
        constraints.push((0, firestore_1.orderBy)('lastName', 'asc'));
        constraints.push((0, firestore_1.orderBy)('firstName', 'asc'));
        return await (0, base_1.queryDocuments)(COLLECTION_NAME, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to get users by organization');
    }
}
/**
 * Check if user profile exists
 */
async function userProfileExists(userId) {
    try {
        const profile = await getUserProfileById(userId);
        return profile !== null;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to check if user profile exists for ${userId}`);
    }
}
//# sourceMappingURL=userProfiles.js.map