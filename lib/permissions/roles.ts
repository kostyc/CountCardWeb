/**
 * Role-Based Permission System
 * Defines roles, privilege levels, and permissions
 */

import { UserRole, OrganizationalAssignment } from '@/types/auth';
import { PrivilegeLevel, Permission, RoleHierarchy } from './types';

/**
 * Check if user's organization can access target organization
 * Based on organizational hierarchy: Regiment → Battalion → Company → Series → Platoon
 */
function canAccessOrganization(
  userOrg: OrganizationalAssignment,
  targetOrg: OrganizationalAssignment
): boolean {
  // Must be in same regiment
  if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
    return false;
  }

  // Must be in same battalion
  if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
    return false;
  }

  // Must be in same company
  if (userOrg.company && targetOrg.company && userOrg.company !== targetOrg.company) {
    return false;
  }

  // Must be in same series
  if (userOrg.series && targetOrg.series && userOrg.series !== targetOrg.series) {
    return false;
  }

  // Must be in same platoon
  if (userOrg.platoon && targetOrg.platoon && userOrg.platoon !== targetOrg.platoon) {
    return false;
  }

  return true;
}

/**
 * Check if user's organization can access target organization at company level
 * (for Level 3 roles)
 */
function canAccessCompany(
  userOrg: OrganizationalAssignment,
  targetOrg: OrganizationalAssignment
): boolean {
  // Must be in same regiment
  if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
    return false;
  }

  // Must be in same battalion
  if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
    return false;
  }

  // Must be in same company
  if (userOrg.company && targetOrg.company && userOrg.company !== targetOrg.company) {
    return false;
  }

  return true;
}

/**
 * Check if user's organization can access target organization at battalion level
 * (for Level 3 roles with battalion access)
 */
function canAccessBattalion(
  userOrg: OrganizationalAssignment,
  targetOrg: OrganizationalAssignment
): boolean {
  // Must be in same regiment
  if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
    return false;
  }

  // Must be in same battalion
  if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
    return false;
  }

  return true;
}

/**
 * Role hierarchy definitions
 */
export const ROLE_HIERARCHY: Record<UserRole, RoleHierarchy> = {
  // Level 1: Drill Instructor
  drill_instructor: {
    role: 'drill_instructor',
    privilegeLevel: PrivilegeLevel.Level1,
    permissions: [
      'view_own_platoon',
      'edit_own_platoon',
      'create_count_card',
      'submit_count_card',
    ],
    canAccessOrganizations: canAccessOrganization,
  },

  // Level 2: Senior Drill Instructor
  senior_drill_instructor: {
    role: 'senior_drill_instructor',
    privilegeLevel: PrivilegeLevel.Level2,
    permissions: [
      'view_own_platoon',
      'edit_own_platoon',
      'view_series',
      'edit_series',
      'create_count_card',
      'submit_count_card',
      'approve_count_card',
      'reject_count_card',
      'forward_count_cards',
    ],
    canAccessOrganizations: (userOrg, targetOrg) => {
      // Can access all platoons in their series
      if (userOrg.regiment && targetOrg.regiment && userOrg.regiment !== targetOrg.regiment) {
        return false;
      }
      if (userOrg.battalion && targetOrg.battalion && userOrg.battalion !== targetOrg.battalion) {
        return false;
      }
      if (userOrg.company && targetOrg.company && userOrg.company !== targetOrg.company) {
        return false;
      }
      if (userOrg.series && targetOrg.series && userOrg.series !== targetOrg.series) {
        return false;
      }
      return true;
    },
  },

  // Level 3: Chief Drill Instructor
  chief_drill_instructor: {
    role: 'chief_drill_instructor',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_own_platoon',
      'edit_own_platoon',
      'view_series',
      'edit_series',
      'view_company',
      'edit_company',
      'create_count_card',
      'submit_count_card',
      'approve_count_card',
      'reject_count_card',
      'consolidate_count_cards',
      'forward_count_cards',
    ],
    canAccessOrganizations: canAccessCompany,
  },

  // Level 3: Company 1stSgt
  company_first_sgt: {
    role: 'company_first_sgt',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_company',
      'edit_company',
      'view_series',
      'edit_series',
      'view_own_platoon',
      'edit_own_platoon',
      'consolidate_count_cards',
      'forward_count_cards',
      'view_audit_logs',
    ],
    canAccessOrganizations: canAccessCompany,
  },

  // Level 3: Series Commander
  series_commander: {
    role: 'series_commander',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_company',
      'edit_company',
      'view_series',
      'edit_series',
      'view_own_platoon',
      'edit_own_platoon',
      'consolidate_count_cards',
      'forward_count_cards',
      'view_audit_logs',
    ],
    canAccessOrganizations: canAccessCompany,
  },

  // Level 3: Company XO
  company_xo: {
    role: 'company_xo',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_company',
      'edit_company',
      'view_series',
      'edit_series',
      'view_own_platoon',
      'edit_own_platoon',
      'consolidate_count_cards',
      'forward_count_cards',
      'view_audit_logs',
    ],
    canAccessOrganizations: canAccessCompany,
  },

  // Level 3: Company Commander
  company_commander: {
    role: 'company_commander',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_company',
      'edit_company',
      'view_series',
      'edit_series',
      'view_own_platoon',
      'edit_own_platoon',
      'consolidate_count_cards',
      'forward_count_cards',
      'view_audit_logs',
      'assign_roles',
      'manage_organizations',
    ],
    canAccessOrganizations: canAccessCompany,
  },

  // Level 3: Battalion SgtMaj
  battalion_sgt_maj: {
    role: 'battalion_sgt_maj',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_battalion',
      'edit_battalion',
      'view_company',
      'edit_company',
      'view_series',
      'edit_series',
      'view_own_platoon',
      'edit_own_platoon',
      'consolidate_count_cards',
      'forward_count_cards',
      'view_audit_logs',
    ],
    canAccessOrganizations: canAccessBattalion,
  },

  // Level 3: Battalion XO
  battalion_xo: {
    role: 'battalion_xo',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_battalion',
      'edit_battalion',
      'view_company',
      'edit_company',
      'view_series',
      'edit_series',
      'view_own_platoon',
      'edit_own_platoon',
      'consolidate_count_cards',
      'forward_count_cards',
      'view_audit_logs',
    ],
    canAccessOrganizations: canAccessBattalion,
  },

  // Level 3: Battalion Commander
  battalion_commander: {
    role: 'battalion_commander',
    privilegeLevel: PrivilegeLevel.Level3,
    permissions: [
      'view_battalion',
      'edit_battalion',
      'view_company',
      'edit_company',
      'view_series',
      'edit_series',
      'view_own_platoon',
      'edit_own_platoon',
      'consolidate_count_cards',
      'forward_count_cards',
      'view_audit_logs',
      'assign_roles',
      'manage_users',
      'manage_organizations',
    ],
    canAccessOrganizations: canAccessBattalion,
  },
};

/**
 * Get role hierarchy for a given role
 */
export function getRoleHierarchy(role: UserRole): RoleHierarchy {
  return ROLE_HIERARCHY[role];
}

/**
 * Get privilege level for a given role
 */
export function getPrivilegeLevel(role: UserRole): PrivilegeLevel {
  return ROLE_HIERARCHY[role].privilegeLevel;
}

/**
 * Get permissions for a given role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_HIERARCHY[role].permissions;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_HIERARCHY[role].permissions.includes(permission);
}

/**
 * Check if user can access target organization based on their role and organization
 */
export function canAccessOrganizationByRole(
  userRole: UserRole,
  userOrg: OrganizationalAssignment,
  targetOrg: OrganizationalAssignment
): boolean {
  const hierarchy = ROLE_HIERARCHY[userRole];
  return hierarchy.canAccessOrganizations(userOrg, targetOrg);
}

/**
 * Check if role is admin (Level 3 with additional privileges)
 */
export function isAdminRole(role: UserRole): boolean {
  const adminRoles: UserRole[] = [
    'company_first_sgt',
    'series_commander',
    'company_xo',
    'company_commander',
    'battalion_sgt_maj',
    'battalion_xo',
    'battalion_commander',
  ];
  return adminRoles.includes(role);
}

/**
 * Check if role can assign other roles
 */
export function canAssignRoles(role: UserRole): boolean {
  return hasPermission(role, 'assign_roles');
}
