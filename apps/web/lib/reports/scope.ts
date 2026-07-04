/**
 * Report scope and access control.
 * Centralizes "who can see reports" and "what org scope" for report APIs.
 */

import type { DecodedToken } from '@/lib/permissions/server';
import { verifyPermission } from '@/lib/permissions/server';
import { getOrganizationalScopeForUser } from '@/lib/services/firestore/organizations';
import type { Regiment } from '@/types/auth';

const REPORT_VIEW_PERMISSIONS = [
  'manage_organizations',
  'view_company',
  'view_series',
  'view_battalion',
  'view_own_platoon',
] as const;

export interface ReportScope {
  regiment?: Regiment;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
}

/**
 * Whether the user can access any reports (has at least one view permission).
 */
export function canAccessReports(token: DecodedToken | null): boolean {
  if (!token?.role) return false;
  return REPORT_VIEW_PERMISSIONS.some((p) => verifyPermission(token, p));
}

/**
 * Get organizational scope for report filtering from the authenticated user.
 * Uses same logic as count cards / recruits: getOrganizationalScopeForUser(role, org).
 */
export function getReportScope(token: DecodedToken | null): ReportScope {
  if (!token?.role || !token?.organizationalAssignment) return {};
  return getOrganizationalScopeForUser(
    token.role,
    token.organizationalAssignment
  ) as ReportScope;
}

/**
 * Merge request filters with user scope: request filters must be within scope.
 * Returns merged filters for querying (scope + validated request filters).
 */
export function mergeReportFilters(
  scope: ReportScope,
  requestFilters: Partial<ReportScope>
): ReportScope {
  const merged: ReportScope = { ...scope };

  if (requestFilters.regiment && scope.regiment && requestFilters.regiment !== scope.regiment) {
    return merged;
  }
  if (requestFilters.regiment) merged.regiment = requestFilters.regiment;

  if (requestFilters.battalion && scope.battalion && requestFilters.battalion !== scope.battalion) {
    return merged;
  }
  if (requestFilters.battalion) merged.battalion = requestFilters.battalion;

  if (requestFilters.company && scope.company && requestFilters.company !== scope.company) {
    return merged;
  }
  if (requestFilters.company) merged.company = requestFilters.company;

  if (requestFilters.series && scope.series && requestFilters.series !== scope.series) {
    return merged;
  }
  if (requestFilters.series) merged.series = requestFilters.series;

  if (requestFilters.platoon && scope.platoon && requestFilters.platoon !== scope.platoon) {
    return merged;
  }
  if (requestFilters.platoon) merged.platoon = requestFilters.platoon;

  return merged;
}
