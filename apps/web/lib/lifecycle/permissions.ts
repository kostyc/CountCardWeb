/**
 * Server-side lifecycle workflow permissions (Sprint 27)
 */

import type { DecodedToken } from '@/lib/permissions/server';
import { verifyOrganizationAccess } from '@/lib/permissions/server';
import {
  canPerformReceivingWorkflow,
  canPerformIncomingCustodyWorkflow,
  isFullAdminFromClaims,
} from '@countcard/core/permissions/adminAccess';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import { isTrainingCustodyPhase } from '@countcard/core/constants/custodyPhase';
import type { AppUser, OrganizationalAssignment } from '@/types/auth';
import type { RecruitProfile, TransferBatch } from '@/types/models';

export function buildAppUserFromToken(token: DecodedToken): AppUser {
  return {
    uid: token.uid,
    email: token.email,
    customClaims: {
      role: token.role,
      admin: token.admin,
      organizationalAssignment: token.organizationalAssignment,
    },
  } as AppUser;
}

export function isFullAdminToken(token: DecodedToken | null): boolean {
  if (!token) return false;
  return isFullAdminFromClaims({
    email: token.email,
    role: token.role,
    admin: token.admin,
  });
}

export function canManageReceivingBatches(token: DecodedToken | null): boolean {
  if (!token) return false;
  return canPerformReceivingWorkflow(buildAppUserFromToken(token));
}

export function canViewTransferBatch(token: DecodedToken | null, batch: TransferBatch): boolean {
  if (!token) return false;
  if (isFullAdminToken(token)) return true;
  if (canManageReceivingBatches(token)) return true;
  if (canPerformIncomingCustodyWorkflow(buildAppUserFromToken(token))) {
    return verifyOrganizationAccess(token, batch.destinationAssignment as OrganizationalAssignment);
  }
  return false;
}

export function canAcceptRejectBatch(token: DecodedToken | null, batch: TransferBatch): boolean {
  if (!token) return false;
  if (isFullAdminToken(token)) return true;
  if (!canPerformIncomingCustodyWorkflow(buildAppUserFromToken(token))) return false;
  return verifyOrganizationAccess(token, batch.destinationAssignment as OrganizationalAssignment);
}

export function filterTransferBatchesForToken(
  token: DecodedToken,
  batches: TransferBatch[]
): TransferBatch[] {
  if (isFullAdminToken(token) || canManageReceivingBatches(token)) {
    return batches;
  }
  if (canPerformIncomingCustodyWorkflow(buildAppUserFromToken(token))) {
    return batches.filter((b) => canViewTransferBatch(token, b));
  }
  return [];
}

export function canEditRecruitProgress(
  token: DecodedToken | null,
  recruit: RecruitProfile
): boolean {
  if (!token) return false;
  const editCheck = canEditRecruit(buildAppUserFromToken(token), recruit);
  if (!editCheck.allowed) return false;
  return recruit.custodyPhase == null || isTrainingCustodyPhase(recruit.custodyPhase);
}

export function canCreateDiCard(token: DecodedToken | null): boolean {
  if (!token) return false;
  if (isFullAdminToken(token)) return true;
  const role = token.role;
  const allowed = [
    'senior_drill_instructor',
    'chief_drill_instructor',
    'company_commander',
    'company_first_sgt',
    'series_commander',
  ] as const;
  return !!role && allowed.includes(role as (typeof allowed)[number]);
}

export function canCreateOrgChannel(token: DecodedToken | null): boolean {
  if (!token) return false;
  if (isFullAdminToken(token)) return true;
  return (
    canManageReceivingBatches(token) ||
    canPerformIncomingCustodyWorkflow(buildAppUserFromToken(token))
  );
}

export function canSingleRecruitTransfer(recruit: RecruitProfile): boolean {
  return recruit.custodyPhase == null || isTrainingCustodyPhase(recruit.custodyPhase);
}
