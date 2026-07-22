/**
 * User Profile Service
 * 
 * Provides type-safe functions for user profile operations in Firestore.
 * Handles user profile creation, updates, retrieval, and queries.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  queryDocuments,
  handleFirestoreError,
  stripUndefined,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import { getDb } from '../instance';
import type { UserProfileDocument, OrganizationalAssignment } from '@countcard/core/types/models';

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

export interface PolicyAcceptanceInput {
  privacyPolicyAccepted: boolean;
  termsOfServiceAccepted: boolean;
  privacyPolicyVersion?: string;
  termsOfServiceVersion?: string;
}

/**
 * Record privacy / terms acceptance (merge into userProfiles; creates doc if missing).
 * Client-side path so Expo does not depend on Cloud Functions / Cloud Run.
 */
export async function recordPolicyAcceptance(
  userId: string,
  input: PolicyAcceptanceInput
): Promise<void> {
  try {
    const now = Timestamp.now();
    const docRef = doc(getDb(), COLLECTION_NAME, userId);
    const existing = await getDocumentById<UserProfileDocument>(COLLECTION_NAME, userId);

    const payload = stripUndefined({
      userId,
      privacyPolicyAccepted: input.privacyPolicyAccepted,
      termsOfServiceAccepted: input.termsOfServiceAccepted,
      privacyPolicyVersion: input.privacyPolicyVersion,
      termsOfServiceVersion: input.termsOfServiceVersion,
      privacyPolicyAcceptedAt: input.privacyPolicyAccepted ? now : undefined,
      termsOfServiceAcceptedAt: input.termsOfServiceAccepted ? now : undefined,
      policiesAcceptedAt: now,
      updatedAt: now,
      updatedBy: userId,
      ...(existing ? {} : { createdAt: now, createdBy: userId }),
    });

    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    throw handleFirestoreError(error, `Failed to record policy acceptance for ${userId}`);
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
