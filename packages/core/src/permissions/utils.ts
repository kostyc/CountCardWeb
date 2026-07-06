/**
 * Permission Utilities
 * Utility functions for checking permissions and access control
 */

import { AppUser, UserRole, OrganizationalAssignment } from '@countcard/core/types/auth';
import { Permission, PermissionCheckResult } from './types';
import { hasPermission, canAccessOrganizationByRole, getPrivilegeLevel } from './roles';
import { isFullAdminUser } from './adminAccess';

/**
 * Check if user has a specific permission
 */
export function checkPermission(
  user: AppUser | null,
  permission: Permission
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

  const hasAccess = hasPermission(role, permission);
  return {
    allowed: hasAccess,
    reason: hasAccess ? undefined : `User role '${role}' does not have permission '${permission}'`,
  };
}

/**
 * Check if user can access a specific organization
 */
export function checkOrganizationAccess(
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
    reason: canAccess ? undefined : 'User cannot access this organization',
  };
}

/**
 * Check if user has a specific role
 */
export function checkRole(user: AppUser | null, requiredRole: UserRole): PermissionCheckResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'User not authenticated',
    };
  }

  const userRole = user.customClaims?.role || user.profile?.role;
  if (!userRole) {
    return {
      allowed: false,
      reason: 'User has no role assigned',
    };
  }

  const hasAccess = userRole === requiredRole;
  return {
    allowed: hasAccess,
    reason: hasAccess ? undefined : `User role '${userRole}' does not match required role '${requiredRole}'`,
  };
}

/**
 * Check if user has at least a specific privilege level
 */
export function checkPrivilegeLevel(
  user: AppUser | null,
  minimumLevel: number
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

  const userLevel = getPrivilegeLevel(role);
  const hasAccess = userLevel >= minimumLevel;
  return {
    allowed: hasAccess,
    reason: hasAccess ? undefined : `User privilege level ${userLevel} is below required level ${minimumLevel}`,
  };
}

/**
 * Get user's role
 */
export function getUserRole(user: AppUser | null): UserRole | null {
  if (!user) return null;
  return user.customClaims?.role || user.profile?.role || null;
}

/**
 * Get user's organizational assignment
 */
export function getUserOrganization(user: AppUser | null): OrganizationalAssignment | null {
  if (!user) return null;
  return user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment || null;
}
