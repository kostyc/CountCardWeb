'use client';

/**
 * Count Card Workflow History Component
 * 
 * Displays workflow history timeline showing all state transitions,
 * approvals, rejections, and notes.
 */

import React from 'react';
import { Card } from '@/components/ui/Card';
import { formatDateTimeWithTimezone, formatRelativeTime, getTimeSafe } from '@/lib/utils/datetime';
import type { WorkflowHistoryEntry } from '@/types/models';
import { cn } from '@/lib/components/utils';

/**
 * Count card workflow history component props
 */
export interface CountCardWorkflowHistoryProps {
  /**
   * Workflow history entries
   */
  workflowHistory: WorkflowHistoryEntry[];
}

/**
 * Format workflow state for display
 */
function formatWorkflowState(state: string): string {
  return state
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get state color for visual indication
 */
function getStateColor(state: string): string {
  const stateColors: Record<string, string> = {
    draft: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    submitted: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    under_review: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    approved: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    rejected: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    consolidated: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    final_approval: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200',
  };
  return stateColors[state] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
}

/**
 * Count Card Workflow History Component
 */
export function CountCardWorkflowHistory({
  workflowHistory,
}: CountCardWorkflowHistoryProps): JSX.Element | null {
  if (!workflowHistory || workflowHistory.length === 0) {
    return null;
  }

  // Sort history by timestamp (oldest first)
  const sortedHistory = [...workflowHistory].sort((a, b) => {
    return getTimeSafe(a.timestamp) - getTimeSafe(b.timestamp);
  });

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
        Workflow History
      </h2>
      <div className="space-y-4">
        {sortedHistory.map((entry, index) => (
          <div
            key={index}
            className={cn(
              'relative pl-8 pb-4',
              index < sortedHistory.length - 1 && 'border-l-2 border-border-primary-light dark:border-border-primary-dark'
            )}
          >
            {/* Timeline dot */}
            <div
              className={cn(
                'absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-background-light dark:border-background-dark',
                getStateColor(entry.state)
              )}
            />

            {/* Entry content */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    getStateColor(entry.state)
                  )}
                >
                  {formatWorkflowState(entry.state)}
                </span>
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {formatDateTimeWithTimezone(entry.timestamp)}
                </span>
              </div>
              {entry.notes && (
                <p className="text-sm text-text-primary-light dark:text-text-primary-dark mt-1">
                  {entry.notes}
                </p>
              )}
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark">
                  {formatRelativeTime(entry.timestamp)}
                </p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  User ID: {entry.userId}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
