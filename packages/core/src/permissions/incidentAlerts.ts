/**
 * Incident alert permissions and company CoC recipient rules (Sprint 28)
 */

import type { AppUser, OrganizationalAssignment, UserRole } from '../types/auth';
import { getEffectiveUserRole } from '../utils/effectiveOrgAssignment';
import { getPrivilegeLevel } from './roles';
import { PrivilegeLevel } from './types';

const REASSIGN_RESOLVE_ROLES: UserRole[] = [
  'senior_drill_instructor',
  'chief_drill_instructor',
  'series_commander',
  'company_first_sgt',
  'company_xo',
  'company_commander',
  'battalion_sgt_maj',
  'battalion_xo',
  'battalion_commander',
];

const PLATOON_STAFF_ROLES: UserRole[] = [
  'drill_instructor',
  'senior_drill_instructor',
];

const COMPANY_TRIAD_ROLES: UserRole[] = [
  'company_first_sgt',
  'company_xo',
  'company_commander',
];

const BATTALION_LEADERSHIP_ROLES: UserRole[] = [
  'battalion_sgt_maj',
  'battalion_xo',
  'battalion_commander',
];

/** Minimal profile shape for CoC recipient checks. */
export interface IncidentRecipientCandidate {
  role?: UserRole;
  organizationalAssignment?: OrganizationalAssignment;
}

function sameCompany(
  initiator: OrganizationalAssignment,
  candidate: OrganizationalAssignment | undefined
): boolean {
  if (!candidate) return false;
  if (!initiator.regiment || !initiator.battalion || !initiator.company) return false;
  return (
    candidate.regiment === initiator.regiment &&
    candidate.battalion === initiator.battalion &&
    candidate.company === initiator.company
  );
}

function sameBattalion(
  initiator: OrganizationalAssignment,
  candidate: OrganizationalAssignment | undefined
): boolean {
  if (!candidate) return false;
  if (!initiator.regiment || !initiator.battalion) return false;
  return (
    candidate.regiment === initiator.regiment &&
    candidate.battalion === initiator.battalion
  );
}

/**
 * Company chain of command for initial emergency fan-out (all incident types):
 * - Platoon DI / SDI on the initiator's platoon
 * - Both series CDIs in the company
 * - Series commander for the initiator's series (both if series unknown)
 * - Company XO, CO, and 1stSgt
 */
export function isCompanyChainRecipient(
  initiatorOrg: OrganizationalAssignment,
  candidate: IncidentRecipientCandidate
): boolean {
  if (!sameCompany(initiatorOrg, candidate.organizationalAssignment)) return false;
  const role = candidate.role;
  if (!role) return false;

  if (PLATOON_STAFF_ROLES.includes(role)) {
    if (!initiatorOrg.platoon) return false;
    return candidate.organizationalAssignment?.platoon === initiatorOrg.platoon;
  }

  if (role === 'chief_drill_instructor') return true;

  if (role === 'series_commander') {
    if (!initiatorOrg.series) return true;
    return candidate.organizationalAssignment?.series === initiatorOrg.series;
  }

  if (COMPANY_TRIAD_ROLES.includes(role)) return true;

  return false;
}

/**
 * Battalion leadership notified only when Company Commander escalates.
 */
export function isBattalionLeadershipRecipient(
  initiatorOrg: OrganizationalAssignment,
  candidate: IncidentRecipientCandidate
): boolean {
  if (!sameBattalion(initiatorOrg, candidate.organizationalAssignment)) return false;
  const role = candidate.role;
  if (!role) return false;
  return BATTALION_LEADERSHIP_ROLES.includes(role);
}

/** Any authenticated user with a role can initiate / claim / acknowledge. */
export function canInitiateIncidentAlert(user: AppUser | null): boolean {
  return getEffectiveUserRole(user) != null;
}

export function canClaimIncidentTask(user: AppUser | null): boolean {
  return getEffectiveUserRole(user) != null;
}

export function canReassignIncidentTask(user: AppUser | null): boolean {
  const role = getEffectiveUserRole(user);
  if (!role) return false;
  if (REASSIGN_RESOLVE_ROLES.includes(role)) return true;
  return getPrivilegeLevel(role) >= PrivilegeLevel.Level2;
}

export function canResolveIncidentAlert(user: AppUser | null): boolean {
  return canReassignIncidentTask(user);
}

/** Only the Company Commander may notify battalion leadership. */
export function canEscalateIncidentToBattalion(user: AppUser | null): boolean {
  return getEffectiveUserRole(user) === 'company_commander';
}

/** @deprecated Prefer canEscalateIncidentToBattalion — escalate is CO-only. */
export function canEscalateIncidentAlert(user: AppUser | null): boolean {
  return canEscalateIncidentToBattalion(user);
}
