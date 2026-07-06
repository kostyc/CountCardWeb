'use client';

/**
 * Count Card List Component
 * 
 * Displays a list of count cards with filtering, search, sorting, and pagination.
 * Supports both table and card view modes.
 * 
 * @example
 * ```tsx
 * <CountCardList
 *   countCards={countCards}
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   searchTerm={searchTerm}
 *   onSearchChange={handleSearchChange}
 *   onCountCardClick={handleCountCardClick}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/feedback';
import { getCompaniesByBattalion, getAllBattalions } from '@/lib/services/firestore/organizations';
import type { CountCard } from '@/types/models';
import type { CountCardStatus, WorkflowState } from '@/lib/validation/countCardSchemas';
import type { Regiment } from '@/types/auth';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';
import type { SelectOption } from '@/components/forms/Select';
import { cn } from '@/lib/components/utils';

/**
 * Count card filters type
 */
export interface CountCardFilters {
  regiment?: Regiment;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
  status?: CountCardStatus;
  workflowState?: WorkflowState;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/**
 * Sort field type
 */
export type CountCardSortField = 'timestamp' | 'status' | 'workflowState' | 'location' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

/**
 * Count card list component props
 */
export interface CountCardListProps {
  /**
   * List of count cards to display
   */
  countCards: CountCard[];
  /**
   * Current filters
   */
  filters: CountCardFilters;
  /**
   * Filter change handler
   */
  onFilterChange: (filters: CountCardFilters) => void;
  /**
   * Current search term
   */
  searchTerm: string;
  /**
   * Search change handler
   */
  onSearchChange: (term: string) => void;
  /**
   * Current sort field
   */
  sortField: CountCardSortField;
  /**
   * Current sort order
   */
  sortOrder: SortOrder;
  /**
   * Sort change handler
   */
  onSortChange: (field: CountCardSortField, order: SortOrder) => void;
  /**
   * Whether data is loading
   */
  loading?: boolean;
  /**
   * Whether there are more items to load
   */
  hasMore?: boolean;
  /**
   * Load more handler
   */
  onLoadMore?: () => void;
  /**
   * Count card click handler
   */
  onCountCardClick: (countCardId: string) => void;
  /**
   * View mode (table or card)
   * @default 'table'
   */
  viewMode?: 'table' | 'card';
  /**
   * Page size
   */
  pageSize?: number;
  /**
   * Total count
   */
  totalCount?: number;
}

/**
 * Count card status options
 */
const COUNT_CARD_STATUS_OPTIONS: SelectOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'consolidated', label: 'Consolidated' },
];

/**
 * Workflow state options
 */
const WORKFLOW_STATE_OPTIONS: SelectOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'consolidated', label: 'Consolidated' },
  { value: 'final_approval', label: 'Final Approval' },
];

/**
 * Sort field options
 */
const SORT_FIELD_OPTIONS: SelectOption[] = [
  { value: 'timestamp', label: 'Date & Time' },
  { value: 'status', label: 'Status' },
  { value: 'workflowState', label: 'Workflow State' },
  { value: 'location', label: 'Location' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
];

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
 * Format date for display
 */
function formatDate(date: Date | any): string {
  if (!date) return 'N/A';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format organizational path
 */
function formatOrganizationalPath(countCard: CountCard): string {
  const path = [
    countCard.regiment,
    countCard.battalion,
    countCard.company,
    countCard.series,
    countCard.platoon,
  ]
    .filter(Boolean)
    .join(' / ');
  return path || 'Unknown';
}

/**
 * Count Card List Component
 */
export function CountCardList({
  countCards,
  filters,
  onFilterChange,
  searchTerm,
  onSearchChange,
  sortField,
  sortOrder,
  onSortChange,
  loading = false,
  hasMore = false,
  onLoadMore,
  onCountCardClick,
  viewMode = 'table',
  pageSize = 25,
  totalCount,
}: CountCardListProps): JSX.Element {
  const router = useRouter();
  // View mode state
  const [currentViewMode, setCurrentViewMode] = useState<'table' | 'card'>(viewMode);

  // Regiment options
  const regimentOptions: SelectOption[] = useMemo(
    () => [
      { value: 'West', label: 'West' },
      { value: 'East', label: 'East' },
    ],
    []
  );

  // Battalion options
  const battalionOptions: SelectOption[] = useMemo(
    () =>
      getAllBattalions().map((battalion) => ({
        value: battalion,
        label: `${battalion} Battalion`,
      })),
    []
  );

  // Company options (filtered by battalion)
  const companyOptions: SelectOption[] = useMemo(() => {
    if (!filters.battalion) {
      return [];
    }
    const companies = getCompaniesByBattalion(filters.battalion as Battalion);
    return companies.map((company) => ({
      value: company,
      label: company,
    }));
  }, [filters.battalion]);

  // Series options
  const seriesOptions: SelectOption[] = useMemo(
    () => [
      { value: 'Lead', label: 'Lead Series' },
      { value: 'Follow', label: 'Follow Series' },
    ],
    []
  );

  // Check if there are active filters
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.regiment ||
      filters.battalion ||
      filters.company ||
      filters.series ||
      filters.platoon ||
      filters.status ||
      filters.workflowState ||
      filters.startDate ||
      filters.endDate
    );
  }, [filters]);

  /**
   * Handle clear filters
   */
  const handleClearFilters = () => {
    onFilterChange({
      regiment: undefined,
      battalion: undefined,
      company: undefined,
      series: undefined,
      platoon: undefined,
      status: undefined,
      workflowState: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  /**
   * Handle quick date filter
   */
  const handleQuickDateFilter = (period: 'today' | 'week' | 'month' | 'lastMonth') => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (period) {
      case 'today':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'lastMonth':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setDate(1);
        endDate = new Date(now);
        endDate.setDate(0); // Last day of previous month
        break;
    }

    onFilterChange({
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  // Loading state
  if (loading && countCards.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && countCards.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="No Count Cards Found"
          description={
            hasActiveFilters || searchTerm
              ? 'No count cards match your current filters. Try adjusting your search or filters.'
              : 'No count cards have been created yet. Create your first count card to get started.'
          }
          actionLabel={hasActiveFilters || searchTerm ? 'Clear Filters' : undefined}
          onAction={hasActiveFilters || searchTerm ? handleClearFilters : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
              Filters
            </h3>
            <div className="flex items-center gap-4">
              {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant={currentViewMode === 'table' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentViewMode('table')}
                >
                  Table
                </Button>
                <Button
                  variant={currentViewMode === 'card' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setCurrentViewMode('card')}
                >
                  Cards
                </Button>
              </div>
            </div>
          </div>

          {/* Search */}
          <div>
            <Input
              type="search"
              placeholder="Search by count card ID, location, or recruit name..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              fullWidth
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Regiment */}
            <Select
              label="Regiment"
              options={regimentOptions}
              value={filters.regiment || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  regiment: e.target.value as Regiment | undefined,
                  battalion: undefined, // Reset dependent filters
                  company: undefined,
                  series: undefined,
                  platoon: undefined,
                })
              }
              placeholder="All Regiments"
            />

            {/* Battalion */}
            <Select
              label="Battalion"
              options={battalionOptions}
              value={filters.battalion || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  battalion: e.target.value || undefined,
                  company: undefined, // Reset dependent filters
                  series: undefined,
                  platoon: undefined,
                })
              }
              placeholder="All Battalions"
              disabled={!filters.regiment}
            />

            {/* Company */}
            <Select
              label="Company"
              options={companyOptions}
              value={filters.company || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  company: e.target.value || undefined,
                  series: undefined, // Reset dependent filters
                  platoon: undefined,
                })
              }
              placeholder="All Companies"
              disabled={!filters.battalion}
            />

            {/* Series */}
            <Select
              label="Series"
              options={seriesOptions}
              value={filters.series || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  series: e.target.value || undefined,
                })
              }
              placeholder="All Series"
            />

            {/* Platoon */}
            <Input
              type="text"
              label="Platoon"
              placeholder="Enter platoon ID"
              value={filters.platoon || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  platoon: e.target.value || undefined,
                })
              }
            />

            {/* Status */}
            <Select
              label="Status"
              options={COUNT_CARD_STATUS_OPTIONS}
              value={filters.status || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  status: e.target.value as CountCardStatus | undefined,
                })
              }
              placeholder="All Statuses"
            />

            {/* Workflow State */}
            <Select
              label="Workflow State"
              options={WORKFLOW_STATE_OPTIONS}
              value={filters.workflowState || ''}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  workflowState: e.target.value as WorkflowState | undefined,
                })
              }
              placeholder="All States"
            />

            {/* Sort Field */}
            <Select
              label="Sort By"
              options={SORT_FIELD_OPTIONS}
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as CountCardSortField, sortOrder)}
            />
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                type="date"
                label="Start Date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    startDate: e.target.value || undefined,
                  })
                }
                fullWidth
              />
            </div>
            <div className="lg:col-span-2">
              <Input
                type="date"
                label="End Date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    endDate: e.target.value || undefined,
                  })
                }
                fullWidth
              />
            </div>
            <div className="lg:col-span-2 flex items-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickDateFilter('today')}
              >
                Today
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickDateFilter('week')}
              >
                This Week
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleQuickDateFilter('month')}
              >
                This Month
              </Button>
            </div>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <Button
              variant={sortOrder === 'asc' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onSortChange(sortField, 'asc')}
            >
              Ascending
            </Button>
            <Button
              variant={sortOrder === 'desc' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onSortChange(sortField, 'desc')}
            >
              Descending
            </Button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      {totalCount !== undefined && (
        <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Showing {countCards.length} of {totalCount} count cards
        </div>
      )}

      {/* Table View */}
      {currentViewMode === 'table' && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-hover-light dark:bg-background-hover-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Count Card ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Workflow State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Recruits
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary-light dark:divide-border-primary-dark">
                {countCards.map((countCard) => {
                  const totalRecruits = countCard.recruitCounts
                    ? Object.values(countCard.recruitCounts).reduce((sum, count) => sum + count, 0)
                    : 0;

                  return (
                    <tr
                      key={countCard.countCardId}
                      className="hover:bg-background-hover-light dark:hover:bg-background-hover-dark cursor-pointer transition-colors"
                      onClick={() => onCountCardClick(countCard.countCardId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark font-mono">
                          {countCard.countCardId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary-light dark:text-text-primary-dark">
                          {formatDate(countCard.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary-light dark:text-text-primary-dark">
                          {countCard.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-primary-light dark:text-text-primary-dark">
                          {formatOrganizationalPath(countCard)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                            countCard.status === 'approved'
                              ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                              : countCard.status === 'rejected'
                              ? 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200'
                              : countCard.status === 'consolidated'
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                              : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'
                          )}
                        >
                          {countCard.status.charAt(0).toUpperCase() + countCard.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                          {formatWorkflowState(countCard.workflowState)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary-light dark:text-text-primary-dark">
                          {totalRecruits}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCountCardClick(countCard.countCardId);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Card View */}
      {currentViewMode === 'card' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {countCards.map((countCard) => {
            const totalRecruits = countCard.recruitCounts
              ? Object.values(countCard.recruitCounts).reduce((sum, count) => sum + count, 0)
              : 0;

            return (
              <Card
                key={countCard.countCardId}
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => onCountCardClick(countCard.countCardId)}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark font-mono">
                      {countCard.countCardId}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex px-2 py-1 text-xs font-semibold rounded-full',
                        countCard.status === 'approved'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                          : countCard.status === 'rejected'
                          ? 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200'
                          : countCard.status === 'consolidated'
                          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                          : 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-200'
                      )}
                    >
                      {countCard.status.charAt(0).toUpperCase() + countCard.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Date: </span>
                      <span className="text-text-primary-light dark:text-text-primary-dark">
                        {formatDate(countCard.timestamp)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Location: </span>
                      <span className="text-text-primary-light dark:text-text-primary-dark">
                        {countCard.location}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Organization: </span>
                      <span className="text-text-primary-light dark:text-text-primary-dark">
                        {formatOrganizationalPath(countCard)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Workflow: </span>
                      <span className="text-text-primary-light dark:text-text-primary-dark">
                        {formatWorkflowState(countCard.workflowState)}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-secondary-light dark:text-text-secondary-dark">Recruits: </span>
                      <span className="text-text-primary-light dark:text-text-primary-dark">{totalRecruits}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border-primary-light dark:border-border-primary-dark">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={(e) => {
                        e.stopPropagation();
                        onCountCardClick(countCard.countCardId);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}
