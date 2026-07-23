/**
 * Full admin access — bypasses org scope and grants all role workflows
 * (Receiving intake, transfer batches, company custody, DI cards, etc.)
 *
 * Full admin = bootstrap admin email OR `admin: true` custom claim only.
 * Leadership roles (company/battalion CoC) use role permissions + org scope —
 * they are not unrestricted full admins.
 */

import type { AppUser, UserRole } from '@countcard/core/types/auth';
import {
  getEffectiveOrganizationalAssignment,
  getEffectiveUserRole,
} from '../utils/effectiveOrgAssignment';
import { isBootstrapAdminEmail, parseBootstrapAdminEmails } from './bootstrapAdmin';

function readBootstrapAdminEmailsRaw(): string | undefined {
  if (typeof process === 'undefined') return undefined;
  return (
    process.env.EXPO_PUBLIC_BOOTSTRAP_ADMIN_EMAILS ??
    process.env.NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAILS ??
    process.env.BOOTSTRAP_ADMIN_EMAILS
  );
}

/** Client-safe bootstrap list (EXPO_PUBLIC / NEXT_PUBLIC); server may also read BOOTSTRAP_ADMIN_EMAILS */
export function getBootstrapAdminEmailsFromEnv(): string[] {
  return parseBootstrapAdminEmails(readBootstrapAdminEmailsRaw());
}

export interface AdminClaimsInput {
  email?: string | null;
  /** @deprecated Ignored — leadership roles are not full admins. Kept for call-site compat. */
  role?: UserRole;
  admin?: boolean;
}

/**
 * Full admin from token/profile claims (server + client).
 * Bootstrap email or `admin === true` only — not leadership roles.
 */
export function isFullAdminFromClaims(input: AdminClaimsInput): boolean {
  if (isBootstrapAdminEmail(input.email, readBootstrapAdminEmailsRaw())) {
    return true;
  }

  if (input.admin === true) {
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
    role: getEffectiveUserRole(user),
    admin: user.customClaims?.admin,
  });
}

/**
 * Support Battalion / Receiving Company workflows (intake, checklist, transfer batches).
 * Full admins always have access; others need Receiving org assignment (profile-first).
 */
export function canPerformReceivingWorkflow(user: AppUser | null): boolean {
  if (isFullAdminUser(user)) return true;

  const org = getEffectiveOrganizationalAssignment(user);
  return org?.battalion === 'Support' && org?.company === 'Receiving';
}

/**
 * Destination company custody accept/reject on incoming transfer batches.
 */
export function canPerformIncomingCustodyWorkflow(user: AppUser | null): boolean {
  if (isFullAdminUser(user)) return true;

  const role = getEffectiveUserRole(user);
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
