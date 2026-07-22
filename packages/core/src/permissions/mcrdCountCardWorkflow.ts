/**
 * MCRD count card workflow — role and state gates (Depot Order 1513.6).
 *
 * Chain:
 *   draft ──(DI submit)──► submitted ──(SDI consolidate)──► under_review
 *        ◄──(reject)──                                          │
 *                                                               ▼
 *   final_approval ◄──(BSM / Co XO / CO)── consolidated ◄──(1stSgt / Series)
 *                                              ▲                    │
 *                                              └──(CDI validate)── approved
 */

import type { UserRole } from '../types/auth';
import type { WorkflowState } from '../validation/countCardSchemas';

export type McrdWorkflowAction =
  | 'submit'
  | 'reject'
  | 'sdi_consolidate'
  | 'cdi_validate'
  | 'forward'
  | 'final_approve';

export const MCRD_WORKFLOW_ACTION_LABELS: Record<McrdWorkflowAction, string> = {
  submit: 'Submit to SDI',
  reject: 'Reject',
  sdi_consolidate: 'Consolidate & Forward to CDI',
  cdi_validate: 'Validate & Forward to 1stSgt / Series',
  forward: 'Forward to Battalion / Company',
  final_approve: 'Final Approve',
};

const ACTION_ROLES: Record<McrdWorkflowAction, readonly UserRole[]> = {
  submit: ['drill_instructor', 'senior_drill_instructor'],
  reject: ['senior_drill_instructor', 'chief_drill_instructor'],
  sdi_consolidate: ['senior_drill_instructor'],
  cdi_validate: ['chief_drill_instructor'],
  forward: ['company_first_sgt', 'series_commander'],
  final_approve: ['battalion_sgt_maj', 'company_xo', 'company_commander'],
};

const ACTION_STATES: Record<McrdWorkflowAction, readonly WorkflowState[]> = {
  submit: ['draft', 'rejected'],
  reject: ['submitted', 'under_review', 'approved'],
  sdi_consolidate: ['submitted', 'under_review'],
  cdi_validate: ['under_review'],
  forward: ['approved'],
  final_approve: ['consolidated'],
};

export function roleAllowsMcrdWorkflowAction(
  role: UserRole | null | undefined,
  action: McrdWorkflowAction
): boolean {
  if (!role) return false;
  return ACTION_ROLES[action].includes(role);
}

export function stateAllowsMcrdWorkflowAction(
  workflowState: WorkflowState,
  action: McrdWorkflowAction
): boolean {
  return ACTION_STATES[action].includes(workflowState);
}

export function getMcrdWorkflowActions(
  role: UserRole | null | undefined,
  workflowState: WorkflowState
): McrdWorkflowAction[] {
  if (!role) return [];
  return (Object.keys(ACTION_ROLES) as McrdWorkflowAction[]).filter(
    (action) =>
      roleAllowsMcrdWorkflowAction(role, action) &&
      stateAllowsMcrdWorkflowAction(workflowState, action)
  );
}

/** Human-readable workflow state for UI badges. */
export const MCRD_WORKFLOW_STATE_LABELS: Record<WorkflowState, string> = {
  draft: 'Draft',
  submitted: 'Submitted — awaiting SDI',
  under_review: 'SDI consolidated — awaiting CDI',
  approved: 'CDI validated — awaiting 1stSgt / Series',
  rejected: 'Rejected',
  consolidated: 'Forwarded — awaiting final approval',
  final_approval: 'Final approval complete',
};
