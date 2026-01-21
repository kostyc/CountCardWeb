'use client';

/**
 * Recruit Status Component
 * 
 * Comprehensive status management component for displaying and managing recruit status.
 * Includes status badge display, status change interface, and status history tracking.
 * 
 * @example
 * ```tsx
 * <RecruitStatus
 *   currentStatus={recruit.status}
 *   statusHistory={recruit.statusHistory}
 *   onStatusChange={handleStatusChange}
 *   canEdit={hasPermission}
 *   loading={loading}
 * />
 * ```
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/forms/Select';
import {
  getStatusMetadata,
  getStatusLabel,
  getStatusColors,
  isStatusTransitionAllowed,
  getAllowedTransitions,
  getStatusOptions,
} from '@/lib/constants/recruitStatus';
import type { RecruitStatus as RecruitStatusType } from '@/lib/validation/recruitSchemas';
import { cn } from '@/lib/components/utils';

/**
 * Status history entry interface
 */
export interface StatusHistoryEntry {
  /** Previous status */
  fromStatus: RecruitStatusType;
  /** New status */
  toStatus: RecruitStatusType;
  /** Timestamp of the change */
  timestamp: Date;
  /** User ID who made the change */
  changedBy: string;
  /** Optional reason for the change */
  reason?: string;
}

/**
 * Recruit Status component props
 */
export interface RecruitStatusProps {
  /**
   * Current recruit status
   */
  currentStatus: RecruitStatusType;
  /**
   * Status history entries
   */
  statusHistory?: StatusHistoryEntry[];
  /**
   * Handler for status changes
   */
  onStatusChange?: (newStatus: RecruitStatusType, reason?: string) => void;
  /**
   * Whether the user can edit the status
   * @default false
   */
  canEdit?: boolean;
  /**
   * Whether data is loading
   * @default false
   */
  loading?: boolean;
  /**
   * Error state
   */
  error?: Error | null;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Recruit Status Component
 * 
 * Displays current status with badge, allows status changes (if permitted),
 * and shows status history.
 */
export function RecruitStatus({
  currentStatus,
  statusHistory = [],
  onStatusChange,
  canEdit = false,
  loading = false,
  error = null,
  className,
}: RecruitStatusProps): JSX.Element {
  // Status change state
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<RecruitStatusType>(currentStatus);
  const [changeReason, setChangeReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Get current status metadata
  const statusMetadata = getStatusMetadata(currentStatus);
  const statusColors = getStatusColors(currentStatus);

  // Get allowed transitions for current status
  const allowedTransitions = getAllowedTransitions(currentStatus);
  const transitionOptions = getStatusOptions().filter((option) =>
    allowedTransitions.includes(option.value)
  );

  /**
   * Handle status change submission
   */
  const handleStatusChange = () => {
    // Validate transition
    if (!isStatusTransitionAllowed(currentStatus, newStatus)) {
      setValidationError(
        `Cannot transition from ${getStatusLabel(currentStatus)} to ${getStatusLabel(newStatus)}`
      );
      return;
    }

    // Clear validation error
    setValidationError(null);

    // Call change handler
    onStatusChange?.(newStatus, changeReason || undefined);

    // Reset editing state
    setIsEditing(false);
    setChangeReason('');
  };

  /**
   * Handle cancel editing
   */
  const handleCancel = () => {
    setIsEditing(false);
    setNewStatus(currentStatus);
    setChangeReason('');
    setValidationError(null);
  };

  // Status badge component
  const StatusBadge = () => (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold',
        statusColors.bgColor,
        statusColors.textColor,
        'border-2',
        statusColors.textColor.replace('text-', 'border-')
      )}
      aria-label={`Status: ${statusMetadata.label}`}
    >
      {statusMetadata.label}
    </span>
  );

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recruit Status</h3>
          {canEdit && !isEditing && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              Change Status
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody>
        {/* Current Status Display */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Current Status</label>
            <div className="flex items-center gap-3">
              <StatusBadge />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statusMetadata.description}
              </p>
            </div>
          </div>

          {/* Status Change Interface */}
          {isEditing && canEdit && (
            <div className="space-y-4 pt-4 border-t border-border-secondary-light dark:border-border-secondary-dark">
              <div>
                <Select
                  label="New Status"
                  required
                  options={transitionOptions}
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value as RecruitStatusType);
                    setValidationError(null);
                  }}
                  errorText={validationError || undefined}
                  helperText="Select the new status for this recruit"
                  fullWidth
                />
              </div>

              <div>
                <label
                  htmlFor="status-reason"
                  className="block text-sm font-medium mb-2"
                >
                  Reason for Change (Optional)
                </label>
                <textarea
                  id="status-reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Enter reason for status change..."
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border-2',
                    'border-border-secondary-light dark:border-border-secondary-dark',
                    'bg-background-light dark:bg-background-dark',
                    'text-text-primary-light dark:text-text-primary-dark',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'transition-all duration-200',
                    'min-h-[80px]'
                  )}
                  rows={3}
                />
              </div>

              {validationError && (
                <div
                  className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
                  role="alert"
                >
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {validationError}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStatusChange}
                  disabled={loading || newStatus === currentStatus}
                  fullWidth
                >
                  {loading ? 'Saving...' : 'Save Status Change'}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCancel}
                  disabled={loading}
                  fullWidth
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Status History */}
          {statusHistory.length > 0 && (
            <div className="pt-4 border-t border-border-secondary-light dark:border-border-secondary-dark">
              <h4 className="text-sm font-semibold mb-3">Status History</h4>
              <div className="space-y-2">
                {statusHistory
                  .slice()
                  .reverse()
                  .map((entry, index) => {
                    const fromMetadata = getStatusMetadata(entry.fromStatus);
                    const toMetadata = getStatusMetadata(entry.toStatus);
                    const toColors = getStatusColors(entry.toStatus);

                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                toColors.bgColor,
                                toColors.textColor
                              )}
                            >
                              {toMetadata.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              from {fromMetadata.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {entry.timestamp.toLocaleDateString()} at{' '}
                            {entry.timestamp.toLocaleTimeString()}
                          </p>
                          {entry.reason && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Reason: {entry.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Empty State for Status History */}
          {statusHistory.length === 0 && (
            <div className="pt-4 border-t border-border-secondary-light dark:border-border-secondary-dark">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No status history available
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
              role="alert"
            >
              <p className="text-sm text-red-800 dark:text-red-200">
                Error loading status: {error.message}
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
