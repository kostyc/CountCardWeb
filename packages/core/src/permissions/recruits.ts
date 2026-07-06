/**
 * Recruit Permissions Utilities
 * 
 * Provides permission checking functions specifically for recruit data operations.
 * Handles view, create, edit, and delete permissions based on role and organizational scope.
 */

import { AppUser, UserRole, OrganizationalAssignment } from '@countcard/core/types/auth';
import { PermissionCheckResult } from './types';
import { canAccessOrganizationByRole, hasPermission, isAdminRole } from './roles';
import { getBootstrapAdminEmailsFromEnv, isFullAdminUser } from './adminAccess';
import { isBootstrapAdminEmail } from './bootstrapAdmin';
import type { RecruitProfile } from '@countcard/core/types/models';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';

export type RecruitOrganizationalScope = {
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
};

export type RecruitListViewMode = 'company_columns' | 'flat';

export type RecruitListFilterLevel = 'battalion' | 'company' | 'series' | 'platoon';

export type RecruitSortField =
  | 'name'
  | 'rank'
  | 'status'
  | 'platoon'
  | 'series'
  | 'createdAt'
  | 'updatedAt';

export type RecruitSortOrder = 'asc' | 'desc';

function toMillis(value: Date | { toMillis(): number } | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}

/** Bootstrap / system admins bypass recruit list scope; role-based staff do not. */
function hasUnscopedRecruitListAccess(user: AppUser | null): boolean {
  if (!user) return false;
  if (isBootstrapAdminEmail(user.email ?? user.profile?.email, getBootstrapAdminEmailsFromEnv().join(','))) {
    return true;
  }
  return user.customClaims?.admin === true;
}

/**
 * Convert recruit profile organizational fields to OrganizationalAssignment
 * Handles type conversion from string (RecruitProfile) to enum types (OrganizationalAssignment)
 */
function recruitToOrganizationalAssignment(recruit: RecruitProfile): OrganizationalAssignment {
  return {
    regiment: recruit.regiment,
    battalion: recruit.battalion as Battalion | undefined,
    company: recruit.company as Company | undefined,
    series: recruit.series as Series | undefined,
    platoon: recruit.platoon,
  };
}

/**
 * Check if user can view a specific recruit
 * Based on organizational scope and role permissions
 */
export function canViewRecruit(
  user: AppUser | null,
  recruit: RecruitProfile
): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
    };
  }

  if (hasUnscopedRecruitListAccess(user)) {
    return { allowed: true };
  }

  const role = user.customClaims?.role || user.profile?.role;
  if (!role) {
    return {
      allowed: false,
      reason: 'User has no role assigned',
    };
  }

  const inScope = isRecruitInOrganizationalScope(user, recruit);
  return {
    allowed: inScope,
    reason: inScope ? undefined : 'User cannot access recruits in this organizational scope',
  };
}

/**
 * Check if user can create a recruit in a specific organizational assignment
 * Based on role permissions and organizational scope
 */
export function canCreateRecruit(
  user: AppUser | null,
  targetOrg: OrganizationalAssignment
): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
    };
  }

  if (isFullAdminUser(user)) {
    return { allowed: true };
  }

  const role = user.customClaims?.role || user.profile?.role;
  if (!role) {
    return {
      allowed: false,
      reason: 'User has no role assigned',
    };
  }

  // Check if user has permission to edit at the target organizational level
  // Level 1 (Drill Instructor): Can create in own platoon
  // Level 2 (Senior DI): Can create in own series
  // Level 3 (Chief DI and above): Can create in company/battalion based on role
  const hasEditPermission = hasPermission(role, 'edit_own_platoon') ||
    hasPermission(role, 'edit_series') ||
    hasPermission(role, 'edit_company') ||
    hasPermission(role, 'edit_battalion');

  if (!hasEditPermission) {
    return {
      allowed: false,
      reason: `User role '${role}' does not have permission to create recruits`,
    };
  }

  // Admins can create in any organization
  if (isAdminRole(role)) {
    return {
      allowed: true,
    };
  }

  // Check organizational scope
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
  if (!userOrg) {
    return {
      allowed: false,
      reason: 'User has no organizational assignment',
    };
  }

  const canAccess = canAccessOrganizationByRole(role, userOrg, targetOrg);

  return {
    allowed: canAccess,
    reason: canAccess ? undefined : 'User cannot create recruits in this organizational scope',
  };
}

/**
 * Check if user can edit a specific recruit
 * Based on role permissions and organizational scope
 */
export function canEditRecruit(
  user: AppUser | null,
  recruit: RecruitProfile
): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
    };
  }

  if (isFullAdminUser(user)) {
    return { allowed: true };
  }

  const role = user.customClaims?.role || user.profile?.role;
  if (!role) {
    return {
      allowed: false,
      reason: 'User has no role assigned',
    };
  }

  // Check if user has edit permission
  const hasEditPermission = hasPermission(role, 'edit_own_platoon') ||
    hasPermission(role, 'edit_series') ||
    hasPermission(role, 'edit_company') ||
    hasPermission(role, 'edit_battalion');

  if (!hasEditPermission) {
    return {
      allowed: false,
      reason: `User role '${role}' does not have permission to edit recruits`,
    };
  }

  // Admins can edit any recruit
  if (isAdminRole(role)) {
    return {
      allowed: true,
    };
  }

  // Check organizational scope
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
  if (!userOrg) {
    return {
      allowed: false,
      reason: 'User has no organizational assignment',
    };
  }

  const recruitOrg = recruitToOrganizationalAssignment(recruit);
  const canAccess = canAccessOrganizationByRole(role, userOrg, recruitOrg);

  return {
    allowed: canAccess,
    reason: canAccess ? undefined : 'User cannot edit recruits in this organizational scope',
  };
}

/**
 * Check if user can delete a specific recruit
 * Based on role permissions and organizational scope
 * Note: Delete is typically restricted to higher-level roles
 */
export function canDeleteRecruit(
  user: AppUser | null,
  recruit: RecruitProfile
): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
    };
  }

  if (isFullAdminUser(user)) {
    return { allowed: true };
  }

  const role = user.customClaims?.role || user.profile?.role;
  if (!role) {
    return {
      allowed: false,
      reason: 'User has no role assigned',
    };
  }

  // Only Level 3 roles (and above) can delete recruits
  // This is a stricter permission than edit
  const hasDeletePermission = hasPermission(role, 'edit_company') ||
    hasPermission(role, 'edit_battalion') ||
    isAdminRole(role);

  if (!hasDeletePermission) {
    return {
      allowed: false,
      reason: `User role '${role}' does not have permission to delete recruits`,
    };
  }

  // Admins can delete any recruit
  if (isAdminRole(role)) {
    return {
      allowed: true,
    };
  }

  // Check organizational scope
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
  if (!userOrg) {
    return {
      allowed: false,
      reason: 'User has no organizational assignment',
    };
  }

  const recruitOrg = recruitToOrganizationalAssignment(recruit);
  const canAccess = canAccessOrganizationByRole(role, userOrg, recruitOrg);

  return {
    allowed: canAccess,
    reason: canAccess ? undefined : 'User cannot delete recruits in this organizational scope',
  };
}

/**
 * Get organizational scope for filtering recruits
 * Returns the organizational filters that should be applied based on user's role
 */
export function getRecruitOrganizationalScope(user: AppUser | null): RecruitOrganizationalScope {
  if (!user) {
    return {};
  }

  const role = user.customClaims?.role || user.profile?.role;
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;

  if (!role || !userOrg) {
    return {};
  }

  if (hasUnscopedRecruitListAccess(user)) {
    return {};
  }

  const scope: RecruitOrganizationalScope = {
    regiment: userOrg.regiment,
    battalion: userOrg.battalion,
    company: userOrg.company,
    series: userOrg.series,
    platoon: userOrg.platoon,
  };

  switch (role) {
    case 'battalion_commander':
    case 'battalion_xo':
    case 'battalion_sgt_maj':
      delete scope.company;
      delete scope.series;
      delete scope.platoon;
      break;

    case 'company_commander':
    case 'company_xo':
    case 'company_first_sgt':
      delete scope.series;
      delete scope.platoon;
      break;

    case 'series_commander':
    case 'chief_drill_instructor':
      delete scope.platoon;
      break;

    case 'senior_drill_instructor':
    case 'drill_instructor':
      break;

    default:
      break;
  }

  return scope;
}

/**
 * Whether a recruit falls within the user's recruit-list organizational scope.
 */
export function isRecruitInOrganizationalScope(
  user: AppUser | null,
  recruit: RecruitProfile
): boolean {
  if (!user) return false;
  if (hasUnscopedRecruitListAccess(user)) return true;

  const role = user.customClaims?.role || user.profile?.role;
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
  if (!role || !userOrg) return false;

  const scope = getRecruitOrganizationalScope(user);

  if (scope.regiment && recruit.regiment !== scope.regiment) return false;
  if (scope.battalion && recruit.battalion !== scope.battalion) return false;
  if (scope.company && recruit.company !== scope.company) return false;
  if (scope.series && recruit.series !== scope.series) return false;
  if (scope.platoon && recruit.platoon !== scope.platoon) return false;

  return true;
}

export function getRecruitListViewMode(role: UserRole | undefined): RecruitListViewMode {
  switch (role) {
    case 'battalion_commander':
    case 'battalion_xo':
    case 'battalion_sgt_maj':
      return 'company_columns';
    default:
      return 'flat';
  }
}

export function getRecruitListFilterLevel(role: UserRole | undefined): RecruitListFilterLevel {
  switch (role) {
    case 'battalion_commander':
    case 'battalion_xo':
    case 'battalion_sgt_maj':
      return 'battalion';
    case 'company_commander':
    case 'company_xo':
    case 'company_first_sgt':
      return 'company';
    case 'series_commander':
    case 'chief_drill_instructor':
      return 'series';
    case 'senior_drill_instructor':
    case 'drill_instructor':
      return 'platoon';
    default:
      return 'platoon';
  }
}

export function getRecruitListScopeLabel(user: AppUser | null): string | null {
  if (!user) return null;
  const role = user.customClaims?.role || user.profile?.role;
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
  if (!role || !userOrg) return null;

  if (hasUnscopedRecruitListAccess(user)) return 'All recruits';

  switch (role) {
    case 'battalion_commander':
    case 'battalion_xo':
    case 'battalion_sgt_maj':
      return userOrg.battalion ? `${userOrg.battalion} Battalion` : null;
    case 'company_commander':
    case 'company_xo':
    case 'company_first_sgt':
      return userOrg.company ? `${userOrg.company} Company` : null;
    case 'series_commander':
    case 'chief_drill_instructor':
      return userOrg.series ? `${userOrg.series} Series` : null;
    case 'senior_drill_instructor':
    case 'drill_instructor':
      return userOrg.platoon ? `Platoon ${userOrg.platoon}` : null;
    default:
      return null;
  }
}

export function sortRecruits(
  recruits: RecruitProfile[],
  field: RecruitSortField,
  order: RecruitSortOrder
): RecruitProfile[] {
  const sorted = [...recruits].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (field) {
      case 'name':
        aValue = `${a.lastName} ${a.firstName}`.toLowerCase();
        bValue = `${b.lastName} ${b.firstName}`.toLowerCase();
        break;
      case 'rank':
        aValue = a.rank || '';
        bValue = b.rank || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'platoon':
        aValue = a.platoon || '';
        bValue = b.platoon || '';
        break;
      case 'series':
        aValue = a.series || '';
        bValue = b.series || '';
        break;
      case 'createdAt':
        aValue = toMillis(a.createdAt);
        bValue = toMillis(b.createdAt);
        break;
      case 'updatedAt':
        aValue = toMillis(a.updatedAt);
        bValue = toMillis(b.updatedAt);
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

/**
 * Check if the current user can see the recruit's full profile (including extended info)
 * based on recruit privacy settings.
 */
export function canSeeFullRecruitProfile(
  user: AppUser | null,
  recruit: RecruitProfile
): boolean {
  if (!user || !recruit) return false;
  const visibility = recruit.privacy?.fullProfileVisibleTo;
  if (!visibility) return true;

  const role = user.customClaims?.role || user.profile?.role;
  if (role && isAdminRole(role)) return true;
  if (visibility === 'admins_only') return false;

  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
  if (!userOrg) return false;

  const recruitOrg = recruitToOrganizationalAssignment(recruit);
  if (visibility === 'same_platoon') {
    return (
      userOrg.platoon === recruitOrg.platoon &&
      userOrg.company === recruitOrg.company &&
      userOrg.battalion === recruitOrg.battalion
    );
  }
  if (visibility === 'same_company') {
    return (
      userOrg.company === recruitOrg.company &&
      userOrg.battalion === recruitOrg.battalion
    );
  }
  if (visibility === 'same_battalion') {
    return userOrg.battalion === recruitOrg.battalion;
  }
  return false;
}
