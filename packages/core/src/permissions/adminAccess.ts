/**
 * Full admin access — bypasses org scope and grants all role workflows
 * (Receiving intake, transfer batches, company custody, DI cards, etc.)
 */

import type { AppUser, UserRole } from '@countcard/core/types/auth';
import { isAdminRole } from './roles';
import { isBootstrapAdminEmail, parseBootstrapAdminEmails } from './bootstrapAdmin';

function getUserOrgAssignment(user: AppUser | null) {
  if (!user) return null;
  return user.customClaims?.organizationalAssignment ?? user.profile?.organizationalAssignment ?? null;
}

/** Client-safe bootstrap list (NEXT_PUBLIC); server may also read BOOTSTRAP_ADMIN_EMAILS */
export function getBootstrapAdminEmailsFromEnv(): string[] {
  const raw =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS ?? process.env.BOOTSTRAP_ADMIN_EMAILS
      : undefined;
  return parseBootstrapAdminEmails(raw);
}

export interface AdminClaimsInput {
  email?: string | null;
  role?: UserRole;
  admin?: boolean;
}

/**
 * Full admin from token/profile claims (server + client).
 */
export function isFullAdminFromClaims(input: AdminClaimsInput): boolean {
  const bootstrapRaw =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS ?? process.env.BOOTSTRAP_ADMIN_EMAILS
      : undefined;

  if (isBootstrapAdminEmail(input.email, bootstrapRaw)) {
    return true;
  }

  if (input.admin === true) {
    return true;
  }

  if (input.role && isAdminRole(input.role)) {
    return true;
  }

  return false;
}

/**
 * True when user has unrestricted access to all features and org scopes.
 */
export function isFullAdminUser(user: AppUser | null): boolean {
  if (!user) return false;

  return isFullAdminFromClaims({
    email: user.email ?? user.profile?.email,
    role: user.customClaims?.role ?? user.profile?.role,
    admin: user.customClaims?.admin,
  });
}

/**
 * Support Battalion / Receiving Company workflows (intake, checklist, transfer batches).
 * Full admins always have access; others need Receiving org assignment.
 */
export function canPerformReceivingWorkflow(user: AppUser | null): boolean {
  if (isFullAdminUser(user)) return true;

  const org = getUserOrgAssignment(user);
  return org?.battalion === 'Support' && org?.company === 'Receiving';
}

/**
 * Destination company custody accept/reject on incoming transfer batches.
 */
export function canPerformIncomingCustodyWorkflow(user: AppUser | null): boolean {
  if (isFullAdminUser(user)) return true;

  const role = user?.customClaims?.role ?? user?.profile?.role;
  if (!role) return false;

  const companyRoles = [
    'company_commander',
    'company_first_sgt',
    'chief_drill_instructor',
    'senior_drill_instructor',
    'company_xo',
    'series_commander',
  ] as const;

  return companyRoles.includes(role as (typeof companyRoles)[number]);
}
