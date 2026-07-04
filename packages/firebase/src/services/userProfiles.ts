/**
 * User Profile Service
 * 
 * Provides type-safe functions for user profile operations in Firestore.
 * Handles user profile creation, updates, retrieval, and queries.
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  queryDocuments,
  handleFirestoreError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import { getDb } from '../instance';
import type { UserProfileDocument, OrganizationalAssignment } from '@countcard/core/types/models';
import type { UserRole } from '@countcard/core/types/auth';

/**
 * Collection name for user profiles
 */
const COLLECTION_NAME = 'userProfiles';

/**
 * User Profile Input (for creation)
 * Excludes auto-generated fields
 */
export type UserProfileInput = Omit<
  UserProfileDocument,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'
>;

/**
 * User Profile Update (for updates)
 * All fields optional except userId
 */
export type UserProfileUpdate = Partial<
  Omit<UserProfileDocument, 'id' | 'userId' | 'createdAt' | 'createdBy'>
>;

/**
 * Create user profile
 */
export async function createUserProfile(
  userId: string,
  data: UserProfileInput,
  createdBy: string
): Promise<string> {
  try {
    const profileData: UserProfileInput = {
      ...data,
      userId, // Ensure userId from parameter takes precedence
    };

    await createDocument(COLLECTION_NAME, userId, profileData, createdBy);
    return userId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create user profile for ${userId}`);
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: UserProfileUpdate,
  updatedBy: string
): Promise<void> {
  try {
    await updateDocument(COLLECTION_NAME, userId, data, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update user profile for ${userId}`);
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfileById(userId: string): Promise<UserProfileDocument | null> {
  try {
    return await getDocumentById<UserProfileDocument>(COLLECTION_NAME, userId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get user profile for ${userId}`);
  }
}

/**
 * Get user profile by email
 */
export async function getUserProfileByEmail(email: string): Promise<UserProfileDocument | null> {
  try {
    const collectionRef = collection(getDb(), COLLECTION_NAME);
    const q = query(
      collectionRef,
      where('email', '==', email.toLowerCase().trim()),
      firestoreLimit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    const docSnap = querySnapshot.docs[0];
    const data = docSnap.data() as Omit<UserProfileDocument, 'id'>;
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
      updatedAt: data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate(),
    } as UserProfileDocument;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get user profile by email ${email}`);
  }
}

/**
 * Update profile completion status
 */
export async function updateProfileCompletionStatus(
  userId: string,
  completionPercentage: number,
  updatedBy: string
): Promise<void> {
  try {
    await updateDocument(
      COLLECTION_NAME,
      userId,
      {
        profileCompletion: completionPercentage,
      },
      updatedBy
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update profile completion status for ${userId}`);
  }
}

/**
 * Update profile completion status automatically
 * Calculates completion based on profile data
 */
export async function updateProfileCompletionAuto(
  userId: string,
  profile: Partial<UserProfileDocument>,
  updatedBy: string
): Promise<number> {
  try {
    const { calculateProfileCompletion } = await import('@countcard/core/profileCompletion');
    const completionPercentage = calculateProfileCompletion(profile);
    
    await updateProfileCompletionStatus(userId, completionPercentage, updatedBy);
    
    return completionPercentage;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update profile completion for ${userId}`);
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(
  role: UserRole,
  pagination?: PaginationOptions
): Promise<PaginationResult<UserProfileDocument>> {
  try {
    return await queryDocuments<UserProfileDocument>(
      COLLECTION_NAME,
      [
        where('role', '==', role),
        orderBy('lastName', 'asc'),
        orderBy('firstName', 'asc'),
      ],
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get users by role ${role}`);
  }
}

/**
 * Get users by organization
 */
export async function getUsersByOrganization(
  organization: OrganizationalAssignment,
  pagination?: PaginationOptions
): Promise<PaginationResult<UserProfileDocument>> {
  try {
    const constraints = [];

    if (organization.regiment) {
      constraints.push(where('organizationalAssignment.regiment', '==', organization.regiment));
    }
    if (organization.battalion) {
      constraints.push(where('organizationalAssignment.battalion', '==', organization.battalion));
    }
    if (organization.company) {
      constraints.push(where('organizationalAssignment.company', '==', organization.company));
    }
    if (organization.series) {
      constraints.push(where('organizationalAssignment.series', '==', organization.series));
    }
    if (organization.platoon) {
      constraints.push(where('organizationalAssignment.platoon', '==', organization.platoon));
    }

    constraints.push(orderBy('lastName', 'asc'));
    constraints.push(orderBy('firstName', 'asc'));

    return await queryDocuments<UserProfileDocument>(
      COLLECTION_NAME,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to get users by organization');
  }
}

/**
 * List user profiles (admin / role assignment). Client-side search filter.
 */
export async function listUserProfiles(options?: {
  search?: string;
  limit?: number;
}): Promise<UserProfileDocument[]> {
  try {
    const max = options?.limit ?? 50;
    const collectionRef = collection(getDb(), COLLECTION_NAME);
    const q = query(collectionRef, firestoreLimit(max));
    const querySnapshot = await getDocs(q);

    let profiles = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data() as Omit<UserProfileDocument, 'id'>;
      return {
        id: docSnap.id,
        ...data,
        userId: data.userId ?? docSnap.id,
        createdAt:
          data.createdAt instanceof Date ? data.createdAt : data.createdAt.toDate(),
        updatedAt:
          data.updatedAt instanceof Date ? data.updatedAt : data.updatedAt.toDate(),
      } as UserProfileDocument;
    });

    const search = options?.search?.trim().toLowerCase();
    if (search) {
      profiles = profiles.filter((p) => {
        const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase();
        const email = (p.email ?? '').toLowerCase();
        const display = (p.displayName ?? '').toLowerCase();
        return name.includes(search) || email.includes(search) || display.includes(search);
      });
    }

    return profiles;
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to list user profiles');
  }
}

/**
 * Check if user profile exists
 */
export async function userProfileExists(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfileById(userId);
    return profile !== null;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to check if user profile exists for ${userId}`);
  }
}
