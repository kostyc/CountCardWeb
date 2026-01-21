'use client';

/**
 * Count Card Status Statistics Component
 * 
 * Displays status summary statistics, trends, and organizational breakdown
 * for count cards. Provides insights into accountability status distribution,
 * workflow state distribution, and trends over time.
 * 
 * @example
 * ```tsx
 * <CountCardStatusStats
 *   countCards={countCards}
 *   dateRange={{ startDate, endDate }}
 *   organizationalScope={organizationalScope}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Spinner, EmptyState } from '@/components/feedback';
import type { CountCard } from '@/types/models';
import type { CountCardStatus, WorkflowState } from '@/lib/validation/countCardSchemas';
import { cn } from '@/lib/components/utils';
import { formatDate, toDate } from '@/lib/utils/datetime';

/**
 * Status statistics data structure
 */
export interface StatusStatistics {
  /** Total count cards */
  total: number;
  /** Count cards by status */
  byStatus: Record<CountCardStatus, number>;
  /** Count cards by workflow state */
  byWorkflowState: Record<WorkflowState, number>;
  /** Accountability status distribution (from recruitCounts) */
  accountabilityStatus: {
    present: number;
    absent: number;
    excused: number;
    medical: number;
    other: number;
    total: number;
  };
  /** Count cards by organizational unit */
  byOrganization: {
    byRegiment: Record<string, number>;
    byBattalion: Record<string, number>;
    byCompany: Record<string, number>;
    bySeries: Record<string, number>;
    byPlatoon: Record<string, number>;
  };
  /** Trends over time (daily counts) */
  trends: Array<{
    date: string;
    count: number;
    byStatus: Record<CountCardStatus, number>;
  }>;
}

/**
 * Count card status statistics component props
 */
export interface CountCardStatusStatsProps {
  /**
   * List of count cards to analyze
   */
  countCards: CountCard[];
  /**
   * Date range for statistics
   */
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  /**
   * Organizational scope filter
   */
  organizationalScope?: {
    regiment?: string;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
  };
  /**
   * Whether data is loading
   */
  loading?: boolean;
  /**
   * Show trends chart
   */
  showTrends?: boolean;
  /**
   * Show organizational breakdown
   */
  showOrganizationalBreakdown?: boolean;
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
 * Format status for display
 */
function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Calculate statistics from count cards
 */
function calculateStatistics(countCards: CountCard[]): StatusStatistics {
  const stats: StatusStatistics = {
    total: countCards.length,
    byStatus: {
      pending: 0,
      approved: 0,
      rejected: 0,
      consolidated: 0,
    },
    byWorkflowState: {
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      consolidated: 0,
      final_approval: 0,
    },
    accountabilityStatus: {
      present: 0,
      absent: 0,
      excused: 0,
      medical: 0,
      other: 0,
      total: 0,
    },
    byOrganization: {
      byRegiment: {},
      byBattalion: {},
      byCompany: {},
      bySeries: {},
      byPlatoon: {},
    },
    trends: [],
  };

  // Process each count card
  countCards.forEach((countCard) => {
    // Count by status
    stats.byStatus[countCard.status] = (stats.byStatus[countCard.status] || 0) + 1;

    // Count by workflow state
    stats.byWorkflowState[countCard.workflowState] =
      (stats.byWorkflowState[countCard.workflowState] || 0) + 1;

    // Count accountability status from recruitCounts
    if (countCard.recruitCounts) {
      Object.entries(countCard.recruitCounts).forEach(([status, count]) => {
        if (status in stats.accountabilityStatus) {
          stats.accountabilityStatus[status as keyof typeof stats.accountabilityStatus] += count;
          stats.accountabilityStatus.total += count;
        }
      });
    }

    // Count by organizational unit
    if (countCard.regiment) {
      stats.byOrganization.byRegiment[countCard.regiment] =
        (stats.byOrganization.byRegiment[countCard.regiment] || 0) + 1;
    }
    if (countCard.battalion) {
      stats.byOrganization.byBattalion[countCard.battalion] =
        (stats.byOrganization.byBattalion[countCard.battalion] || 0) + 1;
    }
    if (countCard.company) {
      stats.byOrganization.byCompany[countCard.company] =
        (stats.byOrganization.byCompany[countCard.company] || 0) + 1;
    }
    if (countCard.series) {
      stats.byOrganization.bySeries[countCard.series] =
        (stats.byOrganization.bySeries[countCard.series] || 0) + 1;
    }
    if (countCard.platoon) {
      stats.byOrganization.byPlatoon[countCard.platoon] =
        (stats.byOrganization.byPlatoon[countCard.platoon] || 0) + 1;
    }
  });

  // Calculate trends (group by date)
  const trendsMap = new Map<string, { count: number; byStatus: Record<CountCardStatus, number> }>();
  countCards.forEach((countCard) => {
    const timestamp = toDate(countCard.timestamp);
    const dateKey = formatDate(timestamp).split(',')[0]; // Get date part only

    if (!trendsMap.has(dateKey)) {
      trendsMap.set(dateKey, {
        count: 0,
        byStatus: {
          pending: 0,
          approved: 0,
          rejected: 0,
          consolidated: 0,
        },
      });
    }

    const trend = trendsMap.get(dateKey)!;
    trend.count += 1;
    trend.byStatus[countCard.status] = (trend.byStatus[countCard.status] || 0) + 1;
  });

  // Convert trends map to array and sort by date
  stats.trends = Array.from(trendsMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return stats;
}

/**
 * Count Card Status Statistics Component
 */
export function CountCardStatusStats({
  countCards,
  dateRange,
  organizationalScope,
  loading = false,
  showTrends = true,
  showOrganizationalBreakdown = true,
}: CountCardStatusStatsProps): JSX.Element {
  // Calculate statistics
  const statistics = useMemo(() => calculateStatistics(countCards), [countCards]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (countCards.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          title="No Count Cards Available"
          description="No count cards found for the selected filters. Statistics will appear here when count cards are available."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Total Count Cards
          </div>
          <div className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {statistics.total}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Approved
          </div>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">
            {statistics.byStatus.approved}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Pending
          </div>
          <div className="text-3xl font-bold text-warning-600 dark:text-warning-400">
            {statistics.byStatus.pending}
          </div>
        </Card>
        <Card className="p-6">
          <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Rejected
          </div>
          <div className="text-3xl font-bold text-error-600 dark:text-error-400">
            {statistics.byStatus.rejected}
          </div>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Count Card Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
            Count Card Status Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(statistics.byStatus).map(([status, count]) => {
              const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0;
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-primary-light dark:text-text-primary-dark">
                      {formatStatus(status)}
                    </span>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-background-hover-light dark:bg-background-hover-dark rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        status === 'approved'
                          ? 'bg-success-500'
                          : status === 'rejected'
                          ? 'bg-error-500'
                          : status === 'consolidated'
                          ? 'bg-primary-500'
                          : 'bg-warning-500'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Workflow State Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
            Workflow State Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(statistics.byWorkflowState).map(([state, count]) => {
              const percentage = statistics.total > 0 ? (count / statistics.total) * 100 : 0;
              if (count === 0) return null;
              return (
                <div key={state} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-primary-light dark:text-text-primary-dark">
                      {formatWorkflowState(state)}
                    </span>
                    <span className="text-text-secondary-light dark:text-text-secondary-dark">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-background-hover-light dark:bg-background-hover-dark rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Accountability Status Summary */}
      {statistics.accountabilityStatus.total > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
            Accountability Status Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(statistics.accountabilityStatus)
              .filter(([key]) => key !== 'total')
              .map(([status, count]) => {
                const percentage =
                  statistics.accountabilityStatus.total > 0
                    ? (count / statistics.accountabilityStatus.total) * 100
                    : 0;
                return (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">
                      {count}
                    </div>
                    <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {formatStatus(status)}
                    </div>
                    <div className="text-xs text-text-tertiary-light dark:text-text-tertiary-dark mt-1">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 pt-4 border-t border-border-primary-light dark:border-border-primary-dark">
            <div className="text-center">
              <div className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">
                {statistics.accountabilityStatus.total}
              </div>
              <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Total Recruits Accounted
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Organizational Breakdown */}
      {showOrganizationalBreakdown && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
            Count Cards by Organizational Unit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* By Regiment */}
            {Object.keys(statistics.byOrganization.byRegiment).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-text-secondary-light dark:text-text-secondary-dark">
                  By Regiment
                </h4>
                <div className="space-y-2">
                  {Object.entries(statistics.byOrganization.byRegiment)
                    .sort(([, a], [, b]) => b - a)
                    .map(([regiment, count]) => (
                      <div
                        key={regiment}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-text-primary-light dark:text-text-primary-dark">
                          {regiment}
                        </span>
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* By Battalion */}
            {Object.keys(statistics.byOrganization.byBattalion).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-text-secondary-light dark:text-text-secondary-dark">
                  By Battalion
                </h4>
                <div className="space-y-2">
                  {Object.entries(statistics.byOrganization.byBattalion)
                    .sort(([, a], [, b]) => b - a)
                    .map(([battalion, count]) => (
                      <div
                        key={battalion}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-text-primary-light dark:text-text-primary-dark">
                          {battalion}
                        </span>
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* By Company */}
            {Object.keys(statistics.byOrganization.byCompany).length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-text-secondary-light dark:text-text-secondary-dark">
                  By Company
                </h4>
                <div className="space-y-2">
                  {Object.entries(statistics.byOrganization.byCompany)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([company, count]) => (
                      <div
                        key={company}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-text-primary-light dark:text-text-primary-dark">
                          {company}
                        </span>
                        <span className="text-text-secondary-light dark:text-text-secondary-dark">
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Trends Over Time */}
      {showTrends && statistics.trends.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
            Trends Over Time
          </h3>
          <div className="space-y-2">
            {statistics.trends.slice(-14).map((trend) => (
              <div key={trend.date} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary-light dark:text-text-primary-dark">
                    {trend.date}
                  </span>
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">
                    {trend.count} count card{trend.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-full bg-background-hover-light dark:bg-background-hover-dark rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        statistics.trends.length > 0
                          ? (trend.count / Math.max(...statistics.trends.map((t) => t.count))) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
