import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import type { UserRole, OrganizationalAssignment } from '@countcard/core/types/auth';
import { adminAuth } from '../admin';

const VALID_ROLES: UserRole[] = [
  'drill_instructor',
  'senior_drill_instructor',
  'chief_drill_instructor',
  'company_first_sgt',
  'series_commander',
  'company_xo',
  'company_commander',
  'battalion_sgt_maj',
  'battalion_xo',
  'battalion_commander',
];

/**
 * Sync Firebase Auth custom claims when userProfiles role/org assignment changes.
 * Replaces POST /api/user/set-custom-claims for Expo (no public Cloud Run invoker required).
 */
export const syncUserClaimsOnProfileWrite = onDocumentWritten(
  {
    document: 'userProfiles/{userId}',
    region: 'us-central1',
  },
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;

    const userId = event.params.userId;
    const data = after.data();
    if (!data) return;

    const role = data.role as UserRole | undefined;
    const organizationalAssignment = data.organizationalAssignment as
      | OrganizationalAssignment
      | undefined;

    if (role === undefined && organizationalAssignment === undefined) return;
    if (role !== undefined && !VALID_ROLES.includes(role)) return;

    try {
      const user = await adminAuth.getUser(userId);
      const currentClaims = user.customClaims ?? {};
      const newClaims: Record<string, unknown> = { ...currentClaims };

      if (role !== undefined) newClaims.role = role;
      if (organizationalAssignment !== undefined) {
        newClaims.organizationalAssignment = organizationalAssignment;
      }

      const unchanged =
        JSON.stringify(newClaims) === JSON.stringify(currentClaims);
      if (unchanged) return;

      await adminAuth.setCustomUserClaims(userId, newClaims);
    } catch {
      // Avoid logging PII; claims sync will retry on next profile write
    }
  }
);
