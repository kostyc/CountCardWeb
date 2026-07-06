/**
 * Default receiving medical/admin checklist items
 */

export const RECEIVING_CHECKLIST_ITEMS = [
  'immunizations',
  'vision',
  'dental',
  'drug_test',
  'other',
] as const;

export type ReceivingChecklistItem = (typeof RECEIVING_CHECKLIST_ITEMS)[number];

export const RECEIVING_CHECKLIST_LABELS: Record<ReceivingChecklistItem, string> = {
  immunizations: 'Immunizations / Shots',
  vision: 'Vision Screening',
  dental: 'Dental',
  drug_test: 'Drug Test',
  other: 'Other Medical / Admin',
};

export function createDefaultReceivingChecklist(): Array<{
  item: ReceivingChecklistItem;
  completed: boolean;
}> {
  return RECEIVING_CHECKLIST_ITEMS.map((item) => ({ item, completed: false }));
}

export function isReceivingChecklistComplete(
  checklist?: Array<{ item: string; completed: boolean }>
): boolean {
  if (!checklist || checklist.length === 0) return false;
  return checklist.every((entry) => entry.completed);
}
