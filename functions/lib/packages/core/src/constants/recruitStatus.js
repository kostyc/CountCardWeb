"use strict";
/**
 * Recruit Status Constants
 *
 * Defines recruit status options, metadata (labels, colors, descriptions),
 * and status transition rules for the USMC recruit training system.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_TRANSITIONS = exports.STATUS_METADATA = void 0;
exports.getStatusMetadata = getStatusMetadata;
exports.getStatusLabel = getStatusLabel;
exports.getStatusColors = getStatusColors;
exports.isStatusTransitionAllowed = isStatusTransitionAllowed;
exports.getAllowedTransitions = getAllowedTransitions;
exports.isActiveStatus = isActiveStatus;
exports.isCompletedStatus = isCompletedStatus;
exports.isSeparatedStatus = isSeparatedStatus;
exports.getAllStatuses = getAllStatuses;
exports.getStatusOptions = getStatusOptions;
/**
 * Status metadata for all recruit statuses
 */
exports.STATUS_METADATA = {
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
exports.STATUS_TRANSITIONS = {
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
function getStatusMetadata(status) {
    return exports.STATUS_METADATA[status];
}
/**
 * Get status label for a given status
 * @param status - Recruit status value
 * @returns Human-readable label
 */
function getStatusLabel(status) {
    return exports.STATUS_METADATA[status].label;
}
/**
 * Get status color classes for a given status
 * @param status - Recruit status value
 * @returns Object with color, bgColor, and textColor classes
 */
function getStatusColors(status) {
    const metadata = exports.STATUS_METADATA[status];
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
function isStatusTransitionAllowed(fromStatus, toStatus) {
    // Same status is always allowed (no-op)
    if (fromStatus === toStatus) {
        return true;
    }
    const allowedTransitions = exports.STATUS_TRANSITIONS[fromStatus];
    return allowedTransitions.includes(toStatus);
}
/**
 * Get all allowed transitions for a given status
 * @param status - Current status
 * @returns Array of allowed next statuses
 */
function getAllowedTransitions(status) {
    return exports.STATUS_TRANSITIONS[status];
}
/**
 * Check if a status represents an active recruit
 * @param status - Recruit status
 * @returns true if status is active
 */
function isActiveStatus(status) {
    return exports.STATUS_METADATA[status].isActive;
}
/**
 * Check if a status represents a completed training
 * @param status - Recruit status
 * @returns true if status is completed
 */
function isCompletedStatus(status) {
    return exports.STATUS_METADATA[status].isCompleted;
}
/**
 * Check if a status represents a separation
 * @param status - Recruit status
 * @returns true if status is separated
 */
function isSeparatedStatus(status) {
    return exports.STATUS_METADATA[status].isSeparated;
}
/**
 * Get all status options as an array
 * @returns Array of all status values
 */
function getAllStatuses() {
    return Object.keys(exports.STATUS_METADATA);
}
/**
 * Get status options for select components
 * @returns Array of status options with value and label
 */
function getStatusOptions() {
    return getAllStatuses().map((status) => ({
        value: status,
        label: getStatusLabel(status),
    }));
}
//# sourceMappingURL=recruitStatus.js.map