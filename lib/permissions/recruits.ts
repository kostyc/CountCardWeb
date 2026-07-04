/**
 * Recruit Permissions Utilities
 * 
 * Provides permission checking functions specifically for recruit data operations.
 * Handles view, create, edit, and delete permissions based on role and organizational scope.
 */

import { AppUser, UserRole, OrganizationalAssignment } from '@/types/auth';
import { PermissionCheckResult } from './types';
import { canAccessOrganizationByRole, hasPermission, isAdminRole } from './roles';
import { checkOrganizationAccess } from './utils';
import type { RecruitProfile } from '@/types/models';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';

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

  const role = user.customClaims?.role || user.profile?.role;
  if (!role) {
    return {
      allowed: false,
      reason: 'User has no role assigned',
    };
  }

  // Admins can view any recruit
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
    reason: canAccess ? undefined : 'User cannot access recruits in this organizational scope',
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
export function getRecruitOrganizationalScope(
  user: AppUser | null
): {
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
} {
  if (!user) {
    return {};
  }

  const role = user.customClaims?.role || user.profile?.role;
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;

  if (!role || !userOrg) {
    return {};
  }

  // Admins can see all recruits (no filters)
  if (isAdminRole(role)) {
    return {};
  }

  // Base scope from user's assignment
  const scope: {
    regiment?: string;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
  } = {
    regiment: userOrg.regiment,
    battalion: userOrg.battalion,
    company: userOrg.company,
    series: userOrg.series,
    platoon: userOrg.platoon,
  };

  // Role-based scope expansion
  // Higher roles can see more of the organizational structure
  switch (role) {
    case 'battalion_commander':
    case 'battalion_xo':
    case 'battalion_sgt_maj':
      // Battalion-level roles can see entire battalion
      // Remove company/series/platoon restrictions
      delete scope.company;
      delete scope.series;
      delete scope.platoon;
      break;

    case 'company_commander':
    case 'company_xo':
    case 'company_first_sgt':
    case 'chief_drill_instructor':
      // Company-level roles can see entire company
      // Remove series/platoon restrictions
      delete scope.series;
      delete scope.platoon;
      break;

    case 'series_commander':
    case 'senior_drill_instructor':
      // Series-level roles can see entire series
      // Remove platoon restrictions
      delete scope.platoon;
      break;

    case 'drill_instructor':
      // Platoon-level roles see only their platoon
      // Keep all restrictions
      break;

    default:
      // Unknown role - return base scope
      break;
  }

  return scope;
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
