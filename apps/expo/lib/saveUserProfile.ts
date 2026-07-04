import type { OrganizationalAssignment, USMCRank, UserRole } from '@countcard/core/types/auth';
import { calculateProfileCompletion } from '@countcard/core/profileCompletion';
import {
  createUserProfile,
  getUserProfileById,
  updateUserProfile,
} from '@countcard/firebase/services/userProfiles';

export function formatProfileDisplayName(rank: USMCRank, lastName: string): string {
  return `${rank}. ${lastName}`;
}

export interface SaveUserProfileInput {
  userId: string;
  firstName: string;
  lastName: string;
  rank: USMCRank;
  email: string;
  phoneNumber: string;
  role?: UserRole;
  organizationalAssignment?: OrganizationalAssignment;
  profilePictureUrl?: string | null;
}

/** Persist profile to Firestore (no HTTP API required). */
export async function saveUserProfileToFirestore(input: SaveUserProfileInput): Promise<number> {
  const existing = await getUserProfileById(input.userId);
  const existingPhoto =
    existing?.profilePictureUrl ??
    (existing as { photoURL?: string } | null)?.photoURL ??
    undefined;
  const profilePictureUrl = input.profilePictureUrl ?? undefined;

  const displayName = formatProfileDisplayName(input.rank, input.lastName);

  const completion = calculateProfileCompletion({
    firstName: input.firstName,
    lastName: input.lastName,
    rank: input.rank,
    email: input.email,
    phoneNumber: input.phoneNumber,
    role: input.role,
    organizationalAssignment: input.organizationalAssignment,
    profilePictureUrl: profilePictureUrl ?? existingPhoto,
  });

  const payload: Record<string, unknown> = {
    userId: input.userId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    rank: input.rank,
    email: input.email.trim().toLowerCase(),
    phoneNumber: input.phoneNumber.trim(),
    displayName,
    profileCompletion: completion,
  };

  if (input.role) payload.role = input.role;
  if (input.organizationalAssignment) payload.organizationalAssignment = input.organizationalAssignment;
  if (profilePictureUrl) {
    payload.profilePictureUrl = profilePictureUrl;
    payload.photoURL = profilePictureUrl;
  }

  if (existing) {
    await updateUserProfile(input.userId, payload, input.userId);
  } else {
    await createUserProfile(
      input.userId,
      {
        userId: input.userId,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        rank: input.rank,
        email: input.email.trim().toLowerCase(),
        phoneNumber: input.phoneNumber.trim(),
        displayName,
        profileCompletion: completion,
        ...(input.role ? { role: input.role } : {}),
        ...(input.organizationalAssignment
          ? { organizationalAssignment: input.organizationalAssignment }
          : {}),
        ...(profilePictureUrl ? { profilePictureUrl, photoURL: profilePictureUrl } : {}),
      },
      input.userId
    );
  }

  return completion;
}
