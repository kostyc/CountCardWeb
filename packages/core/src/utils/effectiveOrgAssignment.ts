import type { AppUser, OrganizationalAssignment, UserRole } from '../types/auth';

/**
 * Merge Firestore profile + Firebase Auth custom claims.
 * Profile wins when both are set — it is the user's explicit assignment and
 * claims sync asynchronously via syncUserClaimsOnProfileWrite.
 */
export function getEffectiveOrganizationalAssignment(
  appUser: AppUser | null | undefined
): OrganizationalAssignment | undefined {
  const claims = appUser?.customClaims?.organizationalAssignment;
  const profile = appUser?.profile?.organizationalAssignment;
  if (!claims && !profile) return undefined;

  const merged: OrganizationalAssignment = {
    regiment: profile?.regiment ?? claims?.regiment,
    battalion: profile?.battalion ?? claims?.battalion,
    company: profile?.company ?? claims?.company,
    series: profile?.series ?? claims?.series,
    platoon: profile?.platoon ?? claims?.platoon,
  };

  if (
    !merged.regiment &&
    !merged.battalion &&
    !merged.company &&
    !merged.series &&
    !merged.platoon
  ) {
    return undefined;
  }

  return merged;
}

/** Profile-first role resolution (same rationale as org assignment). */
export function getEffectiveUserRole(
  appUser: AppUser | null | undefined
): UserRole | undefined {
  return appUser?.profile?.role ?? appUser?.customClaims?.role;
}
