'use client';

/**
 * Recruit List Component
 * 
 * Displays a list of recruits with filtering, search, sorting, and pagination.
 * Supports both table and card view modes.
 * 
 * @example
 * ```tsx
 * <RecruitList
 *   recruits={recruits}
 *   filters={filters}
 *   onFilterChange={handleFilterChange}
 *   searchTerm={searchTerm}
 *   onSearchChange={handleSearchChange}
 *   onRecruitClick={handleRecruitClick}
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/feedback';
import { getCompaniesByBattalion, getAllBattalions } from '@/lib/services/firestore/organizations';
import { getRankOptions } from '@/lib/utils/ranks';
import { RankDisplay } from './RankDisplay';
import type { RecruitProfile } from '@/types/models';
import type { RecruitStatus } from '@/lib/validation/recruitSchemas';
import type { USMCRank, Regiment } from '@/types/auth';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';
import type { SelectOption } from '@/components/forms/Select';

/**
 * Recruit filters type
 */
export interface RecruitFilters {
  regiment?: Regiment;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
  status?: RecruitStatus;
  rank?: USMCRank;
}

/**
 * Sort field type
 */
export type SortField = 'name' | 'rank' | 'status' | 'platoon' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

/**
 * Recruit list component props
 */
export interface RecruitListProps {
  /**
   * List of recruits to display
   */
  recruits: RecruitProfile[];
  /**
   * Current filters
   */
  filters: RecruitFilters;
  /**
   * Filter change handler
   */
  onFilterChange: (filters: RecruitFilters) => void;
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
  sortField: SortField;
  /**
   * Current sort order
   */
  sortOrder: SortOrder;
  /**
   * Sort change handler
   */
  onSortChange: (field: SortField, order: SortOrder) => void;
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
   * Recruit click handler
   */
  onRecruitClick: (recruitId: string) => void;
  /**
   * View mode (table or card)
   * @default 'table'
   */
  viewMode?: 'table' | 'card';
}

/**
 * Recruit status options
 */
const RECRUIT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'separated', label: 'Separated' },
  { value: 'medical_hold', label: 'Medical Hold' },
  { value: 'other', label: 'Other' },
];

/**
 * Sort field options
 */
const SORT_FIELD_OPTIONS: SelectOption[] = [
  { value: 'name', label: 'Name' },
  { value: 'rank', label: 'Rank' },
  { value: 'status', label: 'Status' },
  { value: 'platoon', label: 'Platoon' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
];

/**
 * Recruit List Component
 */
export function RecruitList({
  recruits,
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
  onRecruitClick,
  viewMode = 'table',
}: RecruitListProps): JSX.Element {
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

  // Rank options
  const rankOptions = useMemo(() => getRankOptions(), []);

  /**
   * Handle filter change
   */
  const handleFilterChange = (field: keyof RecruitFilters, value: string | undefined) => {
    const newFilters: RecruitFilters = { ...filters };

    if (value === '' || value === undefined) {
      delete newFilters[field];
    } else {
      // Type-safe assignment based on field type
      switch (field) {
        case 'regiment':
          newFilters.regiment = value as Regiment;
          break;
        case 'battalion':
          newFilters.battalion = value;
          break;
        case 'company':
          newFilters.company = value;
          break;
        case 'series':
          newFilters.series = value;
          break;
        case 'platoon':
          newFilters.platoon = value;
          break;
        case 'status':
          newFilters.status = value as RecruitStatus;
          break;
        case 'rank':
          newFilters.rank = value as USMCRank;
          break;
        default:
          // TypeScript will catch any missing cases
          const _exhaustive: never = field;
          return _exhaustive;
      }
    }

    // Reset dependent filters when parent changes
    if (field === 'regiment') {
      delete newFilters.battalion;
      delete newFilters.company;
      delete newFilters.series;
      delete newFilters.platoon;
    } else if (field === 'battalion') {
      delete newFilters.company;
      delete newFilters.series;
      delete newFilters.platoon;
    } else if (field === 'company') {
      delete newFilters.series;
      delete newFilters.platoon;
    } else if (field === 'series') {
      delete newFilters.platoon;
    }

    onFilterChange(newFilters);
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    onFilterChange({});
    onSearchChange('');
  };

  /**
   * Handle sort change
   */
  const handleSortFieldChange = (field: string) => {
    onSortChange(field as SortField, sortOrder);
  };

  const handleSortOrderToggle = () => {
    onSortChange(sortField, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      !!filters.regiment ||
      !!filters.battalion ||
      !!filters.company ||
      !!filters.series ||
      !!filters.platoon ||
      !!filters.status ||
      !!filters.rank ||
      !!searchTerm.trim()
    );
  }, [filters, searchTerm]);

  // Empty state
  if (!loading && recruits.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                Filters
              </h3>
              {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="lg:col-span-4">
                <Input
                  type="text"
                  label="Search"
                  placeholder="Search by name or recruit ID..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  fullWidth
                />
              </div>

              {/* Regiment */}
              <Select
                label="Regiment"
                options={regimentOptions}
                value={filters.regiment || ''}
                onChange={(e) => handleFilterChange('regiment', e.target.value || undefined)}
                placeholder="All Regiments"
                fullWidth
              />

              {/* Battalion */}
              <Select
                label="Battalion"
                options={battalionOptions}
                value={filters.battalion || ''}
                onChange={(e) => handleFilterChange('battalion', e.target.value || undefined)}
                placeholder="All Battalions"
                disabled={!filters.regiment}
                fullWidth
              />

              {/* Company */}
              <Select
                label="Company"
                options={companyOptions}
                value={filters.company || ''}
                onChange={(e) => handleFilterChange('company', e.target.value || undefined)}
                placeholder="All Companies"
                disabled={!filters.battalion}
                fullWidth
              />

              {/* Series */}
              <Select
                label="Series"
                options={seriesOptions}
                value={filters.series || ''}
                onChange={(e) => handleFilterChange('series', e.target.value || undefined)}
                placeholder="All Series"
                disabled={!filters.company}
                fullWidth
              />

              {/* Platoon */}
              <Input
                type="text"
                label="Platoon"
                placeholder="0000"
                value={filters.platoon || ''}
                onChange={(e) => handleFilterChange('platoon', e.target.value || undefined)}
                disabled={!filters.company}
                fullWidth
              />

              {/* Status */}
              <Select
                label="Status"
                options={RECRUIT_STATUS_OPTIONS}
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                placeholder="All Statuses"
                fullWidth
              />

              {/* Rank */}
              <Select
                label="Rank"
                options={rankOptions}
                value={filters.rank || ''}
                onChange={(e) => handleFilterChange('rank', e.target.value || undefined)}
                placeholder="All Ranks"
                fullWidth
              />
            </div>
          </div>
        </Card>

        <EmptyState
          title="No Recruits Found"
          description={
            hasActiveFilters
              ? 'No recruits match your current filters. Try adjusting your search or filters.'
              : 'No recruits have been created yet. Create your first recruit to get started.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : 'Create Recruit'}
          onAction={hasActiveFilters ? handleClearFilters : undefined}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-4">
              <Input
                type="text"
                label="Search"
                placeholder="Search by name or recruit ID..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                fullWidth
              />
            </div>

            {/* Regiment */}
            <Select
              label="Regiment"
              options={regimentOptions}
              value={filters.regiment || ''}
              onChange={(e) => handleFilterChange('regiment', e.target.value || undefined)}
              placeholder="All Regiments"
              fullWidth
            />

            {/* Battalion */}
            <Select
              label="Battalion"
              options={battalionOptions}
              value={filters.battalion || ''}
              onChange={(e) => handleFilterChange('battalion', e.target.value || undefined)}
              placeholder="All Battalions"
              disabled={!filters.regiment}
              fullWidth
            />

            {/* Company */}
            <Select
              label="Company"
              options={companyOptions}
              value={filters.company || ''}
              onChange={(e) => handleFilterChange('company', e.target.value || undefined)}
              placeholder="All Companies"
              disabled={!filters.battalion}
              fullWidth
            />

            {/* Series */}
            <Select
              label="Series"
              options={seriesOptions}
              value={filters.series || ''}
              onChange={(e) => handleFilterChange('series', e.target.value || undefined)}
              placeholder="All Series"
              disabled={!filters.company}
              fullWidth
            />

            {/* Platoon */}
            <Input
              type="text"
              label="Platoon"
              placeholder="0000"
              value={filters.platoon || ''}
              onChange={(e) => handleFilterChange('platoon', e.target.value || undefined)}
              disabled={!filters.company}
              fullWidth
            />

            {/* Status */}
            <Select
              label="Status"
              options={RECRUIT_STATUS_OPTIONS}
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              placeholder="All Statuses"
              fullWidth
            />

            {/* Rank */}
            <Select
              label="Rank"
              options={rankOptions}
              value={filters.rank || ''}
              onChange={(e) => handleFilterChange('rank', e.target.value || undefined)}
              placeholder="All Ranks"
              fullWidth
            />

            {/* Sort */}
            <div className="lg:col-span-2 flex gap-2">
              <Select
                label="Sort By"
                options={SORT_FIELD_OPTIONS}
                value={sortField}
                onChange={(e) => handleSortFieldChange(e.target.value)}
                fullWidth
              />
              <Button
                variant="secondary"
                onClick={handleSortOrderToggle}
                className="mt-6"
                aria-label={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recruit List */}
      {currentViewMode === 'table' ? (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary-light dark:bg-background-secondary-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
                    Platoon
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary-light dark:divide-border-primary-dark">
                {recruits.map((recruit) => (
                  <tr
                    key={recruit.id}
                    onClick={() => onRecruitClick(recruit.id)}
                    className="cursor-pointer hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                        {recruit.lastName}, {recruit.firstName}
                      </div>
                      <div className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {recruit.recruitId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recruit.rank ? (
                        <RankDisplay rank={recruit.rank} size="sm" />
                      ) : (
                        <div className="text-sm text-text-primary-light dark:text-text-primary-dark">—</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          recruit.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : recruit.status === 'graduated'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {recruit.status || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary-light dark:text-text-primary-dark">
                        {[
                          recruit.regiment,
                          recruit.battalion,
                          recruit.company,
                          recruit.series,
                        ]
                          .filter(Boolean)
                          .join(' / ') || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-primary-light dark:text-text-primary-dark">
                        {recruit.platoon || '—'}
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4">
                      <Skeleton lines={3} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recruits.map((recruit) => (
            <Card
              key={recruit.id}
              onClick={() => onRecruitClick(recruit.id)}
              className="cursor-pointer hover:shadow-xl transition-shadow p-6"
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {recruit.lastName}, {recruit.firstName}
                  </h3>
                  <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    {recruit.recruitId}
                  </p>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Rank:
                    </span>{' '}
                    {recruit.rank ? (
                      <RankDisplay rank={recruit.rank} size="sm" />
                    ) : (
                      <span className="text-sm text-text-primary-light dark:text-text-primary-dark">—</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Status:
                    </span>{' '}
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                        recruit.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : recruit.status === 'graduated'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {recruit.status || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Organization:
                    </span>{' '}
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {[
                        recruit.regiment,
                        recruit.battalion,
                        recruit.company,
                        recruit.series,
                      ]
                        .filter(Boolean)
                        .join(' / ') || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                      Platoon:
                    </span>{' '}
                    <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                      {recruit.platoon || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
          {loading && (
            <>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton lines={4} />
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && onLoadMore && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={onLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {/* Loading indicator at bottom */}
      {loading && recruits.length > 0 && (
        <div className="flex justify-center">
          <Skeleton lines={1} />
        </div>
      )}
    </div>
  );
}
