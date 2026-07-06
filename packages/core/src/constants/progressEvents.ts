import type { ProgressEventType } from '../validation/lifecycleSchemas';

/** Canonical display order — IST (initial_drill) is first at receiving. */
export const PROGRESS_EVENT_ORDER: ProgressEventType[] = [
  'initial_drill',
  'initial_pft',
  'initial_cft',
  'initial_inspection',
  'final_pft',
  'final_cft',
  'final_drill',
  'final_inspection',
  'bn_co_inspection',
  'hike',
  'general_comment',
];

export const PROGRESS_EVENT_LABELS: Record<ProgressEventType, string> = {
  initial_drill: 'IST',
  initial_pft: 'Initial PFT',
  initial_cft: 'Initial CFT',
  initial_inspection: 'Initial Inspection',
  final_pft: 'Final PFT',
  final_cft: 'Final CFT',
  final_drill: 'Final Drill',
  final_inspection: 'Final Inspection',
  bn_co_inspection: 'Bn Co Inspection',
  hike: 'Hiking',
  general_comment: 'General Comment',
};

export function progressEventLabel(type: ProgressEventType): string {
  return PROGRESS_EVENT_LABELS[type] ?? type.replace(/_/g, ' ');
}
