/**
 * Recruit Status Constants
 * 
 * Defines recruit status options, metadata (labels, colors, descriptions),
 * and status transition rules for the USMC recruit training system.
 */

import type { RecruitStatus } from '@countcard/core/validation/recruitSchemas';

/**
 * Status metadata interface
 */
export interface StatusMetadata {
  /** Status value */
  value: RecruitStatus;
  /** Human-readable label */
  label: string;
  /** Color for UI display (Tailwind CSS classes) */
  color: string;
  /** Background color for badges (Tailwind CSS classes) */
  bgColor: string;
  /** Text color for badges (Tailwind CSS classes) */
  textColor: string;
  /** Description of the status */
  description: string;
  /** Whether this status represents an active recruit */
  isActive: boolean;
  /** Whether this status represents a completed training */
  isCompleted: boolean;
  /** Whether this status represents a separation */
  isSeparated: boolean;
}

/**
 * Status metadata for all recruit statuses
 */
export const STATUS_METADATA: Record<RecruitStatus, StatusMetadata> = {
  active: {
    value: 'active',
    label: 'Active',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    description: 'Recruit is currently in active training',
    isActive: true,
    isCompleted: false,
    isSeparated: false,
  },
  inactive: {
    value: 'inactive',
    label: 'Inactive',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    description: 'Recruit is temporarily inactive',
    isActive: false,
    isCompleted: false,
    isSeparated: false,
  },
  transferred: {
    value: 'transferred',
    label: 'Transferred',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    description: 'Recruit has been transferred to another unit',
    isActive: false,
    isCompleted: false,
    isSeparated: false,
  },
  graduated: {
    value: 'graduated',
    label: 'Graduated',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    description: 'Recruit has successfully completed training',
    isActive: false,
    isCompleted: true,
    isSeparated: false,
  },
  separated: {
    value: 'separated',
    label: 'Separated',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    description: 'Recruit has been separated from the Marine Corps',
    isActive: false,
    isCompleted: false,
    isSeparated: true,
  },
  medical_hold: {
    value: 'medical_hold',
    label: 'Medical Hold',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    description: 'Recruit is on medical hold',
    isActive: false,
    isCompleted: false,
    isSeparated: false,
  },
  other: {
    value: 'other',
    label: 'Other',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    description: 'Recruit status is in another category',
    isActive: false,
    isCompleted: false,
    isSeparated: false,
  },
};

/**
 * Status transition rules
 * Defines which status transitions are allowed
 * 
 * Key: Current status
 * Value: Array of allowed next statuses
 */
export const STATUS_TRANSITIONS: Record<RecruitStatus, RecruitStatus[]> = {
  // Active recruits can transition to most statuses
  active: ['inactive', 'transferred', 'graduated', 'separated', 'medical_hold', 'other'],
  
  // Inactive recruits can return to active or move to other statuses
  inactive: ['active', 'transferred', 'graduated', 'separated', 'medical_hold', 'other'],
  
  // Transferred recruits typically don't change status (but can for corrections)
  transferred: ['active', 'inactive', 'other'],
  
  // Graduated recruits cannot change status (final state)
  graduated: [],
  
  // Separated recruits cannot change status (final state)
  separated: [],
  
  // Medical hold can transition to active or other statuses
  medical_hold: ['active', 'inactive', 'transferred', 'graduated', 'separated', 'other'],
  
  // Other status can transition to most statuses
  other: ['active', 'inactive', 'transferred', 'graduated', 'separated', 'medical_hold'],
};

/**
 * Get status metadata for a given status
 * @param status - Recruit status value
 * @returns Status metadata
 */
export function getStatusMetadata(status: RecruitStatus): StatusMetadata {
  return STATUS_METADATA[status];
}

/**
 * Get status label for a given status
 * @param status - Recruit status value
 * @returns Human-readable label
 */
export function getStatusLabel(status: RecruitStatus): string {
  return STATUS_METADATA[status].label;
}

/**
 * Get status color classes for a given status
 * @param status - Recruit status value
 * @returns Object with color, bgColor, and textColor classes
 */
export function getStatusColors(status: RecruitStatus): {
  color: string;
  bgColor: string;
  textColor: string;
} {
  const metadata = STATUS_METADATA[status];
  return {
    color: metadata.color,
    bgColor: metadata.bgColor,
    textColor: metadata.textColor,
  };
}

/**
 * Check if a status transition is allowed
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @returns true if transition is allowed
 */
export function isStatusTransitionAllowed(
  fromStatus: RecruitStatus,
  toStatus: RecruitStatus
): boolean {
  // Same status is always allowed (no-op)
  if (fromStatus === toStatus) {
    return true;
  }
  
  const allowedTransitions = STATUS_TRANSITIONS[fromStatus];
  return allowedTransitions.includes(toStatus);
}

/**
 * Get all allowed transitions for a given status
 * @param status - Current status
 * @returns Array of allowed next statuses
 */
export function getAllowedTransitions(status: RecruitStatus): RecruitStatus[] {
  return STATUS_TRANSITIONS[status];
}

/**
 * Check if a status represents an active recruit
 * @param status - Recruit status
 * @returns true if status is active
 */
export function isActiveStatus(status: RecruitStatus): boolean {
  return STATUS_METADATA[status].isActive;
}

/**
 * Check if a status represents a completed training
 * @param status - Recruit status
 * @returns true if status is completed
 */
export function isCompletedStatus(status: RecruitStatus): boolean {
  return STATUS_METADATA[status].isCompleted;
}

/**
 * Check if a status represents a separation
 * @param status - Recruit status
 * @returns true if status is separated
 */
export function isSeparatedStatus(status: RecruitStatus): boolean {
  return STATUS_METADATA[status].isSeparated;
}

/**
 * Get all status options as an array
 * @returns Array of all status values
 */
export function getAllStatuses(): RecruitStatus[] {
  return Object.keys(STATUS_METADATA) as RecruitStatus[];
}

/**
 * Get status options for select components
 * @returns Array of status options with value and label
 */
export function getStatusOptions(): Array<{ value: RecruitStatus; label: string }> {
  return getAllStatuses().map((status) => ({
    value: status,
    label: getStatusLabel(status),
  }));
}
