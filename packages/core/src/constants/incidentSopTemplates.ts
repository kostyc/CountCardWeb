/**
 * PLACEHOLDER_SOP — Do not treat as official MCRD / depot SOP until command
 * replaces this content. When official medical SOP arrives, update this file
 * (or load remote `incidentSopConfig` in a follow-up) and bump sopVersion.
 */

import type { IncidentType, IncidentSopSource } from '../types/models';

export const PLACEHOLDER_SOP_VERSION = 'placeholder-2026-07-22';

export interface IncidentSopTaskTemplate {
  taskKey: string;
  label: string;
  instructions: string;
  sortOrder: number;
}

export interface IncidentSopTemplate {
  incidentType: IncidentType;
  titlePrefix: string;
  sopSource: IncidentSopSource;
  sopVersion: string;
  /**
   * Initial fan-out level. Product rule: always company CoC regardless of type.
   * Battalion notify is Company Commander only (not driven by this field).
   */
  initialEscalation: 'company';
  tasks: IncidentSopTaskTemplate[];
}

const NOTIFY_CHAIN_INSTRUCTIONS =
  'Confirm platoon staff, both CDIs, series commander, and company XO / CO / 1stSgt are aware. In-app alert fans out to that company chain. Only the Company Commander can notify battalion (Bn CO / XO / SgtMaj).';

const MEDICAL_TASKS: IncidentSopTaskTemplate[] = [
  {
    taskKey: 'dial_911',
    label: 'Dial 911 / emergency services',
    instructions: 'Call emergency services immediately. State location and nature of injury.',
    sortOrder: 1,
  },
  {
    taskKey: 'cpr_as_needed',
    label: 'Start CPR if needed',
    instructions: 'If the casualty is unresponsive and not breathing normally, begin CPR until EMS arrives.',
    sortOrder: 2,
  },
  {
    taskKey: 'guide_ambulance',
    label: 'Guide the ambulance from the street',
    instructions: 'Task someone to go to the street / entry point and flag down / guide EMS to the casualty.',
    sortOrder: 3,
  },
  {
    taskKey: 'clear_scene',
    label: 'Clear the scene / keep recruits away',
    instructions: 'Move bystanders and recruits clear of the casualty and EMS approach path.',
    sortOrder: 4,
  },
  {
    taskKey: 'meet_ems',
    label: 'Meet EMS with patient info',
    instructions: 'Designate someone to meet EMS with known medical info, allergies, and what happened.',
    sortOrder: 5,
  },
  {
    taskKey: 'notify_chain',
    label: 'Confirm chain of command notified',
    instructions: NOTIFY_CHAIN_INSTRUCTIONS,
    sortOrder: 6,
  },
  {
    taskKey: 'preserve_scene',
    label: 'Preserve scene / notes for after-action',
    instructions: 'Do not disturb evidence if applicable. Note times, witnesses, and actions taken.',
    sortOrder: 7,
  },
];

const HEAT_TASKS: IncidentSopTaskTemplate[] = [
  {
    taskKey: 'move_to_shade',
    label: 'Move casualty to shade / cool area',
    instructions: 'Get the casualty out of direct sun; begin cooling per heat-injury guidance.',
    sortOrder: 1,
  },
  {
    taskKey: 'dial_911_heat',
    label: 'Dial 911 if heat stroke suspected',
    instructions: 'Altered mental status, hot skin, collapse — treat as emergency and call 911.',
    sortOrder: 2,
  },
  {
    taskKey: 'guide_ambulance_heat',
    label: 'Guide EMS from the street',
    instructions: 'Send someone to the entry point to guide ambulance/EMS.',
    sortOrder: 3,
  },
  {
    taskKey: 'notify_chain_heat',
    label: 'Notify chain of command',
    instructions: NOTIFY_CHAIN_INSTRUCTIONS,
    sortOrder: 4,
  },
];

const MISSING_TASKS: IncidentSopTaskTemplate[] = [
  {
    taskKey: 'last_known',
    label: 'Establish last known location / time',
    instructions: 'Record when and where the recruit was last seen and by whom.',
    sortOrder: 1,
  },
  {
    taskKey: 'immediate_search',
    label: 'Begin immediate area search',
    instructions: 'Organize a controlled search of barracks, heads, and nearby areas.',
    sortOrder: 2,
  },
  {
    taskKey: 'notify_chain_missing',
    label: 'Notify chain of command',
    instructions: NOTIFY_CHAIN_INSTRUCTIONS,
    sortOrder: 3,
  },
  {
    taskKey: 'secure_gear',
    label: 'Secure personal gear / accountability',
    instructions: 'Account for remaining recruits; secure the missing recruit’s gear if found.',
    sortOrder: 4,
  },
];

const SECURITY_TASKS: IncidentSopTaskTemplate[] = [
  {
    taskKey: 'secure_area',
    label: 'Secure the immediate area',
    instructions: 'Move personnel to safety; control access to the scene.',
    sortOrder: 1,
  },
  {
    taskKey: 'notify_pmo',
    label: 'Notify PMO / security as required',
    instructions: 'Contact PMO or depot security per local SOP.',
    sortOrder: 2,
  },
  {
    taskKey: 'notify_chain_security',
    label: 'Notify chain of command',
    instructions: NOTIFY_CHAIN_INSTRUCTIONS,
    sortOrder: 3,
  },
  {
    taskKey: 'preserve_scene_security',
    label: 'Preserve scene',
    instructions: 'Limit disturbance until security or investigators arrive.',
    sortOrder: 4,
  },
];

const OTHER_TASKS: IncidentSopTaskTemplate[] = [
  {
    taskKey: 'assess_scene',
    label: 'Assess scene and protect life',
    instructions: 'Ensure immediate life safety; request EMS if anyone is injured.',
    sortOrder: 1,
  },
  {
    taskKey: 'notify_chain_other',
    label: 'Notify chain of command',
    instructions: NOTIFY_CHAIN_INSTRUCTIONS,
    sortOrder: 2,
  },
  {
    taskKey: 'document_actions',
    label: 'Document actions and times',
    instructions: 'Record what happened, who responded, and times for after-action.',
    sortOrder: 3,
  },
];

export const INCIDENT_SOP_TEMPLATES: Record<IncidentType, IncidentSopTemplate> = {
  medical_injury: {
    incidentType: 'medical_injury',
    titlePrefix: 'MEDICAL EMERGENCY',
    sopSource: 'placeholder',
    sopVersion: PLACEHOLDER_SOP_VERSION,
    initialEscalation: 'company',
    tasks: MEDICAL_TASKS,
  },
  heat_casualty: {
    incidentType: 'heat_casualty',
    titlePrefix: 'HEAT CASUALTY',
    sopSource: 'placeholder',
    sopVersion: PLACEHOLDER_SOP_VERSION,
    initialEscalation: 'company',
    tasks: HEAT_TASKS,
  },
  missing_recruit: {
    incidentType: 'missing_recruit',
    titlePrefix: 'MISSING RECRUIT',
    sopSource: 'placeholder',
    sopVersion: PLACEHOLDER_SOP_VERSION,
    initialEscalation: 'company',
    tasks: MISSING_TASKS,
  },
  security: {
    incidentType: 'security',
    titlePrefix: 'SECURITY INCIDENT',
    sopSource: 'placeholder',
    sopVersion: PLACEHOLDER_SOP_VERSION,
    initialEscalation: 'company',
    tasks: SECURITY_TASKS,
  },
  other: {
    incidentType: 'other',
    titlePrefix: 'EMERGENCY',
    sopSource: 'placeholder',
    sopVersion: PLACEHOLDER_SOP_VERSION,
    initialEscalation: 'company',
    tasks: OTHER_TASKS,
  },
};

export function getIncidentSopTemplate(type: IncidentType): IncidentSopTemplate {
  return INCIDENT_SOP_TEMPLATES[type];
}

export const INCIDENT_TYPE_OPTIONS: Array<{ value: IncidentType; label: string }> = [
  { value: 'medical_injury', label: 'Medical / injury' },
  { value: 'heat_casualty', label: 'Heat casualty' },
  { value: 'missing_recruit', label: 'Missing recruit' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other emergency' },
];
