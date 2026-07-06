/**
 * Recruit Permissions Hook
 * 
 * React hook for checking recruit-related permissions.
 * Provides convenient access to permission checking functions for recruit operations.
 */

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  canViewRecruit,
  canCreateRecruit,
  canEditRecruit,
  canDeleteRecruit,
  getRecruitOrganizationalScope,
  getRecruitListViewMode,
  getRecruitListFilterLevel,
  getRecruitListScopeLabel,
} from '@/lib/permissions/recruits';
import type {
  RecruitListViewMode,
  RecruitListFilterLevel,
  RecruitOrganizationalScope,
} from '@/lib/permissions/recruits';
import { hasPermission, isAdminRole } from '@/lib/permissions/roles';
import { isFullAdminUser } from '@countcard/core/permissions/adminAccess';
import type { UserRole } from '@/types/auth';
import type { RecruitProfile } from '@/types/models';
import type { OrganizationalAssignment } from '@/types/auth';
import type { PermissionCheckResult } from '@/lib/permissions/types';

/**
 * Recruit permissions hook result
 */
export interface UseRecruitPermissionsResult {
  /**
   * Check if user can view a specific recruit
   */
  canView: (recruit: RecruitProfile) => PermissionCheckResult;
  /**
   * Check if user can create a recruit in a specific organizational assignment
   */
  canCreate: (targetOrg: OrganizationalAssignment) => PermissionCheckResult;
  /**
   * Check if user can edit a specific recruit
   */
  canEdit: (recruit: RecruitProfile) => PermissionCheckResult;
  /**
   * Check if user can delete a specific recruit
   */
  canDelete: (recruit: RecruitProfile) => PermissionCheckResult;
  /**
   * Get organizational scope for filtering recruits
   */
  getOrganizationalScope: () => RecruitOrganizationalScope;
  listViewMode: RecruitListViewMode;
  filterLevel: RecruitListFilterLevel;
  scopeLabel: string | null;
  /**
   * Whether user can view any recruits
   */
  canViewAny: boolean;
  /**
   * Whether user can create recruits
   */
  canCreateAny: boolean;
}

/**
 * Hook for checking recruit permissions
 * 
 * @example
 * ```tsx
 * const { canView, canEdit, canDelete } = useRecruitPermissions();
 * 
 * const canEditThisRecruit = canEdit(recruit);
 * if (canEditThisRecruit.allowed) {
 *   // Show edit button
 * }
 * ```
 */
export function useRecruitPermissions(): UseRecruitPermissionsResult {
  const { user } = useAuth();

  // Memoize permission check functions
  const canView = useMemo(
    () => (recruit: RecruitProfile) => canViewRecruit(user, recruit),
    [user]
  );

  const canCreate = useMemo(
    () => (targetOrg: OrganizationalAssignment) => canCreateRecruit(user, targetOrg),
    [user]
  );

  const canEdit = useMemo(
    () => (recruit: RecruitProfile) => canEditRecruit(user, recruit),
    [user]
  );

  const canDelete = useMemo(
    () => (recruit: RecruitProfile) => canDeleteRecruit(user, recruit),
    [user]
  );

  const getOrganizationalScope = useMemo(
    () => () => getRecruitOrganizationalScope(user),
    [user]
  );

  const listViewMode = useMemo((): RecruitListViewMode => {
    const role = user?.customClaims?.role || user?.profile?.role;
    return getRecruitListViewMode(role);
  }, [user]);

  const filterLevel = useMemo((): RecruitListFilterLevel => {
    const role = user?.customClaims?.role || user?.profile?.role;
    return getRecruitListFilterLevel(role);
  }, [user]);

  const scopeLabel = useMemo(() => getRecruitListScopeLabel(user), [user]);

  // Check if user can view/create any recruits (has any permissions)
  const canViewAny = useMemo(() => {
    if (!user) return false;
    if (isFullAdminUser(user)) return true;
    const role = user.customClaims?.role || user.profile?.role;
    if (!role) return false;
    // If user has a role and organizational assignment, they can view recruits
    const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
    return !!userOrg;
  }, [user]);

  const canCreateAny = useMemo(() => {
    if (!user) return false;
    if (isFullAdminUser(user)) return true;
    const role = user.customClaims?.role || user.profile?.role;
    if (!role) return false;
    if (isAdminRole(role as UserRole)) return true;
    // Check if user has any edit permissions (which implies create permissions)
    return (
      hasPermission(role, 'edit_own_platoon') ||
      hasPermission(role, 'edit_series') ||
      hasPermission(role, 'edit_company') ||
      hasPermission(role, 'edit_battalion')
    );
  }, [user]);

  return {
    canView,
    canCreate,
    canEdit,
    canDelete,
    getOrganizationalScope,
    listViewMode,
    filterLevel,
    scopeLabel,
    canViewAny,
    canCreateAny,
  };
}
