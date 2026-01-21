'use client';

/**
 * Count Card Detail Component
 * 
 * Comprehensive detail view component for displaying count card information,
 * recruit list, workflow history, and action buttons.
 */

import React, { useRef, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/feedback';
import { EmptyState } from '@/components/feedback';
import { Button } from '@/components/ui/Button';
import { CountCardWorkflowActions } from './CountCardWorkflowActions';
import { CountCardWorkflowHistory } from './CountCardWorkflowHistory';
import { getFullRankName } from '@/lib/utils/ranks';
import { RankDisplay } from '@/components/recruits/RankDisplay';
import {
  formatDateTimeWithTimezone,
  formatDate,
  formatRelativeTime,
  toDate,
  getTimeSafe,
} from '@/lib/utils/datetime';
import type { CountCard } from '@/types/models';
import { cn } from '@/lib/components/utils';

/**
 * Count card detail component props
 */
export interface CountCardDetailProps {
  /**
   * Count card data
   */
  countCard: CountCard | null;
  /**
   * Callback when workflow action succeeds
   */
  onWorkflowActionSuccess?: () => void;
  /**
   * Whether data is loading
   */
  loading?: boolean;
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
 * Count Card Detail Component
 */
export function CountCardDetail({
  countCard,
  onWorkflowActionSuccess,
  loading = false,
}: CountCardDetailProps): JSX.Element {
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not found state
  if (!countCard) {
    return (
      <EmptyState
        title="Count Card Not Found"
        description="The count card you're looking for doesn't exist or has been removed."
      />
    );
  }

  // Format organizational path
  const organizationalPath = [
    countCard.regiment,
    countCard.battalion,
    countCard.company,
    countCard.series,
    countCard.platoon,
  ]
    .filter(Boolean)
    .join(' / ');

  // Calculate total recruits
  const totalRecruits = countCard.recruitCounts
    ? Object.values(countCard.recruitCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  // Extract timestamps from workflow history
  const timestamps = useMemo(() => {
    const ts: {
      type: string;
      date: Date;
      label: string;
    }[] = [];

    // Creation timestamp
    if (countCard.createdAt) {
      ts.push({
        type: 'creation',
        date: toDate(countCard.createdAt),
        label: 'Created',
      });
    }

    // Count card timestamp
    if (countCard.timestamp) {
      ts.push({
        type: 'count',
        date: toDate(countCard.timestamp),
        label: 'Count Taken',
      });
    }

    // Workflow history timestamps
    if (countCard.workflowHistory) {
      countCard.workflowHistory.forEach((entry) => {
        const entryDate = toDate(entry.timestamp);
        let label = formatWorkflowState(entry.state);
        
        // Add specific labels for key transitions
        if (entry.state === 'submitted') {
          label = 'Submitted';
        } else if (entry.state === 'approved') {
          label = 'Approved';
        } else if (entry.state === 'rejected') {
          label = 'Rejected';
        } else if (entry.state === 'consolidated') {
          label = 'Consolidated';
        } else if (entry.state === 'final_approval') {
          label = 'Final Approval';
        }

        ts.push({
          type: entry.state,
          date: entryDate,
          label,
        });
      });
    }

    // Sort by date (oldest first)
    return ts.sort((a, b) => getTimeSafe(a.date) - getTimeSafe(b.date));
  }, [countCard]);

  // Print ref
  const printRef = useRef<HTMLDivElement>(null);

  /**
   * Handle print
   */
  const handlePrint = () => {
    if (!printRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Get print content
    const printContent = printRef.current.innerHTML;

    // Create print document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Count Card: ${countCard.countCardId}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.5;
              color: #000;
              background: #fff;
              padding: 20px;
            }
            .print-header {
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .print-header h1 {
              font-size: 18pt;
              margin-bottom: 5px;
            }
            .print-section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .print-section h2 {
              font-size: 14pt;
              border-bottom: 1px solid #000;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .print-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 15px;
            }
            .print-label {
              font-weight: bold;
              font-size: 10pt;
            }
            .print-value {
              margin-bottom: 8px;
            }
            .print-counts {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 10px;
              margin-top: 10px;
            }
            .print-count-item {
              text-align: center;
              border: 1px solid #000;
              padding: 10px;
            }
            .print-count-number {
              font-size: 20pt;
              font-weight: bold;
            }
            .print-count-label {
              font-size: 10pt;
              text-transform: capitalize;
            }
            .print-history {
              margin-top: 10px;
            }
            .print-history-item {
              border-left: 3px solid #000;
              padding-left: 10px;
              margin-bottom: 10px;
            }
            .print-history-state {
              font-weight: bold;
              margin-bottom: 3px;
            }
            .print-history-details {
              font-size: 10pt;
              color: #333;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      {/* Header with Print Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-text-heading-light dark:text-text-heading-dark">
            Count Card: {countCard.countCardId}
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Accountability record for {organizationalPath || 'Unknown Organization'}
          </p>
        </div>
        <Button variant="secondary" onClick={handlePrint} className="no-print">
          Print
        </Button>
      </div>

      {/* Workflow Actions */}
      <div className="no-print">
        <CountCardWorkflowActions
          countCard={countCard}
          onSuccess={onWorkflowActionSuccess}
        />
      </div>

      {/* Print Content - Hidden on screen, visible when printing */}
      <div ref={printRef} className="hidden">
        {/* Print Header */}
        <div className="print-header">
          <h1>Count Card: {countCard.countCardId}</h1>
          <p>Accountability record for {organizationalPath || 'Unknown Organization'}</p>
          <p>Generated: {formatDate(new Date())}</p>
        </div>

        {/* Print Information */}
        <div className="print-section">
          <h2>Count Card Information</h2>
          <div className="print-grid">
            <div className="print-value">
              <span className="print-label">Count Card ID:</span> {countCard.countCardId}
            </div>
            <div className="print-value">
              <span className="print-label">Status:</span> {countCard.status.charAt(0).toUpperCase() + countCard.status.slice(1)}
            </div>
            <div className="print-value">
              <span className="print-label">Workflow State:</span> {formatWorkflowState(countCard.workflowState)}
            </div>
            <div className="print-value">
              <span className="print-label">Location:</span> {countCard.location}
            </div>
            <div className="print-value">
              <span className="print-label">Date & Time:</span> {formatDate(countCard.timestamp)}
            </div>
            <div className="print-value">
              <span className="print-label">Total Recruits:</span> {totalRecruits}
            </div>
          </div>
        </div>

        {/* Print Recruit Counts */}
        {countCard.recruitCounts && Object.keys(countCard.recruitCounts).length > 0 && (
          <div className="print-section">
            <h2>Recruit Counts by Status</h2>
            <div className="print-counts">
              {Object.entries(countCard.recruitCounts).map(([status, count]) => (
                <div key={status} className="print-count-item">
                  <div className="print-count-number">{count}</div>
                  <div className="print-count-label">{status}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Print Workflow History */}
        {countCard.workflowHistory && countCard.workflowHistory.length > 0 && (
          <div className="print-section">
            <h2>Workflow History</h2>
            <div className="print-history">
              {countCard.workflowHistory.map((entry, index) => {
                const entryDate = toDate(entry.timestamp);
                return (
                  <div key={index} className="print-history-item">
                    <div className="print-history-state">
                      {formatWorkflowState(entry.state)}
                    </div>
                    <div className="print-history-details">
                      {formatDate(entryDate)} - {entry.notes || 'No notes'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
          Count Card Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Count Card ID
            </label>
            <p className="text-text-primary-light dark:text-text-primary-dark font-mono">
              {countCard.countCardId}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Status
            </label>
            <p className="text-text-primary-light dark:text-text-primary-dark">
              {countCard.status.charAt(0).toUpperCase() + countCard.status.slice(1)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Workflow State
            </label>
            <p className="text-text-primary-light dark:text-text-primary-dark">
              {formatWorkflowState(countCard.workflowState)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Location
            </label>
            <p className="text-text-primary-light dark:text-text-primary-dark">
              {countCard.location}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Date & Time
            </label>
            <p className="text-text-primary-light dark:text-text-primary-dark">
              {formatDateTimeWithTimezone(countCard.timestamp)}
            </p>
            <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mt-1">
              {formatRelativeTime(countCard.timestamp)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
              Total Recruits
            </label>
            <p className="text-text-primary-light dark:text-text-primary-dark">
              {totalRecruits}
            </p>
          </div>
        </div>

        {/* Timestamps Section */}
        {timestamps.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border-primary-light dark:border-border-primary-dark">
            <h3 className="text-lg font-semibold mb-3 text-text-heading-light dark:text-text-heading-dark">
              Timeline
            </h3>
            <div className="space-y-3">
              {timestamps.map((ts, index) => (
                <div
                  key={`${ts.type}-${index}`}
                  className="flex items-start gap-4 p-3 bg-background-card-light dark:bg-background-card-dark rounded-lg"
                >
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        {ts.label}
                      </p>
                      <p className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark whitespace-nowrap">
                        {formatRelativeTime(ts.date)}
                      </p>
                    </div>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                      {formatDateTimeWithTimezone(ts.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recruit Counts Summary */}
        {countCard.recruitCounts && Object.keys(countCard.recruitCounts).length > 0 && (
          <div className="mt-6 pt-6 border-t border-border-primary-light dark:border-border-primary-dark">
            <h3 className="text-lg font-semibold mb-3 text-text-heading-light dark:text-text-heading-dark">
              Recruit Counts by Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(countCard.recruitCounts).map(([status, count]) => (
                <div key={status} className="text-center p-3 bg-background-card-light dark:bg-background-card-dark rounded-lg">
                  <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                    {count}
                  </p>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark capitalize">
                    {status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Workflow History */}
      {countCard.workflowHistory && countCard.workflowHistory.length > 0 && (
        <CountCardWorkflowHistory workflowHistory={countCard.workflowHistory} />
      )}
    </div>
  );
}
