/**
 * Role-Based Access Control Types
 * Type definitions for permissions and access control system
 */

import { UserRole, OrganizationalAssignment } from '@/types/auth';

/**
 * Privilege levels in the system
 */
export enum PrivilegeLevel {
  Level1 = 1, // Drill Instructor
  Level2 = 2, // Senior Drill Instructor
  Level3 = 3, // Chief Drill Instructor and above
}

/**
 * Permission types
 */
export type Permission =
  | 'view_own_platoon'
  | 'edit_own_platoon'
  | 'create_count_card'
  | 'submit_count_card'
  | 'approve_count_card'
  | 'reject_count_card'
  | 'view_series'
  | 'edit_series'
  | 'view_company'
  | 'edit_company'
  | 'view_battalion'
  | 'edit_battalion'
  | 'consolidate_count_cards'
  | 'forward_count_cards'
  | 'assign_roles'
  | 'view_audit_logs'
  | 'manage_users';

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Role hierarchy mapping
 */
export interface RoleHierarchy {
  role: UserRole;
  privilegeLevel: PrivilegeLevel;
  permissions: Permission[];
  canAccessOrganizations: (userOrg: OrganizationalAssignment, targetOrg: OrganizationalAssignment) => boolean;
}
