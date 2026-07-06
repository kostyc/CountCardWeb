/**
 * Receiving-mode bulk import helpers — Support/Receiving org + custody lifecycle fields.
 */

import { RECEIVING_DEFAULT_ASSIGNMENT, RECEIVING_PLATOON } from '../constants/custodyPhase';
import { createDefaultReceivingChecklist } from '../constants/receivingChecklist';
import type { Regiment } from '../types/auth';
import type { ParsedRecruitImportRow } from './recruitExcelImport';

type ReceivingImportRow = Pick<
  ParsedRecruitImportRow,
  'regiment' | 'battalion' | 'company' | 'series' | 'platoon'
> &
  Record<string, unknown>;

export function applyReceivingImportOrg<T extends ReceivingImportRow>(
  row: T,
  regiment: Regiment | string = 'West'
): T {
  return {
    ...row,
    regiment: regiment as T['regiment'],
    battalion: RECEIVING_DEFAULT_ASSIGNMENT.battalion,
    company: RECEIVING_DEFAULT_ASSIGNMENT.company,
    platoon: RECEIVING_PLATOON,
  };
}

export function buildReceivingCustodyFields(): {
  custodyPhase: 'receiving';
  receivingChecklist: ReturnType<typeof createDefaultReceivingChecklist>;
} {
  return {
    custodyPhase: 'receiving',
    receivingChecklist: createDefaultReceivingChecklist(),
  };
}
