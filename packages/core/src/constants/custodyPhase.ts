/**
 * Custody phase constants for recruit lifecycle workflow
 */

export const CUSTODY_PHASES = [
  'receiving',
  'receiving_ready',
  'transfer_pending',
  'in_transit',
  'training',
] as const;

export type CustodyPhase = (typeof CUSTODY_PHASES)[number];

export const CUSTODY_PHASE_METADATA: Record<
  CustodyPhase,
  { label: string; description: string }
> = {
  receiving: {
    label: 'Receiving',
    description: 'Recruit at Receiving Company; intake in progress',
  },
  receiving_ready: {
    label: 'Receiving Ready',
    description: 'Medical checklist complete; eligible for transfer batch',
  },
  transfer_pending: {
    label: 'Transfer Pending',
    description: 'On published roster awaiting Friday pickup',
  },
  in_transit: {
    label: 'In Transit',
    description: 'Marched to destination; awaiting custody acceptance',
  },
  training: {
    label: 'Training',
    description: 'Destination company has accepted custody',
  },
};

export const RECEIVING_PLATOON = '0000';

export const RECEIVING_DEFAULT_ASSIGNMENT = {
  battalion: 'Support' as const,
  company: 'Receiving' as const,
  platoon: RECEIVING_PLATOON,
};

export function isTrainingCustodyPhase(phase?: CustodyPhase): boolean {
  return phase === 'training';
}

export function canEditOrgAssignment(phase?: CustodyPhase): boolean {
  return isTrainingCustodyPhase(phase);
}
