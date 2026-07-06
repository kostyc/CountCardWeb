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
import { getRecruitRankOptions } from '@/lib/utils/ranks';
import { RankDisplay } from './RankDisplay';
import { RecruitCompanyColumnView } from './RecruitCompanyColumnView';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import type {
  RecruitListViewMode,
  RecruitListFilterLevel,
  RecruitOrganizationalScope,
  RecruitSortField,
  RecruitSortOrder,
} from '@/lib/permissions/recruits';
import type { RecruitProfile } from '@/types/models';
import type { RecruitStatus } from '@/lib/validation/recruitSchemas';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import type { Regiment } from '@/types/auth';
import type { Battalion, Company } from '@/lib/validation/organizationSchemas';
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
  rank?: RecruitRank;
}

/**
 * Sort field type
 */
export type SortField = RecruitSortField;
export type SortOrder = RecruitSortOrder;

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
   * Show import/create actions in empty state
   */
  showRecruitActions?: boolean;
  onImportClick?: () => void;
  onCreateClick?: () => void;
  onModifyClick?: (recruitId: string) => void;
  onTransferClick?: (recruitId: string) => void;
  canModifyRecruit?: (recruit: RecruitProfile) => boolean;
  canTransferRecruit?: (recruit: RecruitProfile) => boolean;
  /**
   * View mode (table or card)
   * @default 'table'
   */
  viewMode?: 'table' | 'card';
  listViewMode?: RecruitListViewMode;
  filterLevel?: RecruitListFilterLevel;
  scopeLabel?: string | null;
  battalionCompanies?: Company[];
  recruitsByCompany?: Record<string, RecruitProfile[]>;
  lockedOrgScope?: RecruitOrganizationalScope;
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
  { value: 'series', label: 'Series' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
];

function canShowOrgFilter(
  filterLevel: RecruitListFilterLevel,
  field: 'regiment' | 'battalion' | 'company' | 'series' | 'platoon'
): boolean {
  if (filterLevel === 'platoon') return false;
  if (filterLevel === 'series') return field === 'platoon';
  if (filterLevel === 'company') return field === 'series' || field === 'platoon';
  if (filterLevel === 'battalion') {
    return field === 'company' || field === 'series' || field === 'platoon';
  }
  return true;
}

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
  showRecruitActions = false,
  onImportClick,
  onCreateClick,
  onModifyClick,
  onTransferClick,
  canModifyRecruit,
  canTransferRecruit,
  viewMode = 'table',
  listViewMode = 'flat',
  filterLevel = 'platoon',
  battalionCompanies = [],
  recruitsByCompany = {},
  lockedOrgScope = {},
}: RecruitListProps): JSX.Element {
  const showRowActions = Boolean(onModifyClick || onTransferClick);
  const [currentViewMode, setCurrentViewMode] = useState<'table' | 'card' | 'columns'>(
    listViewMode === 'company_columns' ? 'columns' : viewMode
  );
  const showFlatViewToggle = listViewMode === 'flat';

  const effectiveBattalion = filters.battalion || lockedOrgScope.battalion;
  const effectiveCompany = filters.company || lockedOrgScope.company;

  const companyOptions: SelectOption[] = useMemo(() => {
    if (!effectiveBattalion) return [];
    const companies = getCompaniesByBattalion(effectiveBattalion as Battalion);
    return companies.map((company) => ({
      value: company,
      label: company,
    }));
  }, [effectiveBattalion]);

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

  // Series options
  const seriesOptions: SelectOption[] = useMemo(
    () => [
      { value: 'Lead', label: 'Lead Series' },
      { value: 'Follow', label: 'Follow Series' },
    ],
    []
  );

  // Rank options
  const rankOptions = useMemo(() => getRecruitRankOptions(), []);

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
          newFilters.rank = value as RecruitRank;
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

  const renderOrgFilters = () => (
    <>
      {canShowOrgFilter(filterLevel, 'regiment') ? (
        <Select
          label="Regiment"
          options={regimentOptions}
          value={filters.regiment || ''}
          onChange={(e) => handleFilterChange('regiment', e.target.value || undefined)}
          placeholder="All Regiments"
          fullWidth
        />
      ) : null}

      {canShowOrgFilter(filterLevel, 'battalion') ? (
        <Select
          label="Battalion"
          options={battalionOptions}
          value={filters.battalion || ''}
          onChange={(e) => handleFilterChange('battalion', e.target.value || undefined)}
          placeholder="All Battalions"
          disabled={!filters.regiment}
          fullWidth
        />
      ) : null}

      {canShowOrgFilter(filterLevel, 'company') ? (
        <Select
          label="Company"
          options={companyOptions}
          value={filters.company || ''}
          onChange={(e) => handleFilterChange('company', e.target.value || undefined)}
          placeholder="All Companies"
          disabled={!effectiveBattalion}
          fullWidth
        />
      ) : null}

      {canShowOrgFilter(filterLevel, 'series') ? (
        <Select
          label="Series"
          options={seriesOptions}
          value={filters.series || ''}
          onChange={(e) => handleFilterChange('series', e.target.value || undefined)}
          placeholder="All Series"
          disabled={filterLevel === 'battalion' ? !filters.company : !effectiveCompany}
          fullWidth
        />
      ) : null}

      {canShowOrgFilter(filterLevel, 'platoon') ? (
        <Input
          type="text"
          label="Platoon"
          placeholder="0000"
          value={filters.platoon || ''}
          onChange={(e) => handleFilterChange('platoon', e.target.value || undefined)}
          disabled={filterLevel === 'battalion' ? !filters.company : filterLevel === 'company' ? false : !effectiveCompany}
          fullWidth
        />
      ) : null}
    </>
  );

  const renderViewToggle = () => (
    <div className="flex items-center gap-2">
      {listViewMode === 'company_columns' ? (
        <Button
          variant={currentViewMode === 'columns' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setCurrentViewMode('columns')}
        >
          Columns
        </Button>
      ) : null}
      {showFlatViewToggle || listViewMode === 'company_columns' ? (
        <>
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
        </>
      ) : null}
    </div>
  );
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

  const renderSortControls = () => (
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
  );

  const renderFiltersGrid = (includeSort = false) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-4">
        <Input
          type="text"
          label="Search"
          placeholder="Search by last name or EDIPI..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          fullWidth
        />
      </div>
      {renderOrgFilters()}
      <Select
        label="Status"
        options={RECRUIT_STATUS_OPTIONS}
        value={filters.status || ''}
        onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
        placeholder="All Statuses"
        fullWidth
      />
      <Select
        label="Rank"
        options={rankOptions}
        value={filters.rank || ''}
        onChange={(e) => handleFilterChange('rank', e.target.value || undefined)}
        placeholder="All Ranks"
        fullWidth
      />
      {includeSort ? renderSortControls() : null}
    </div>
  );

  if (!loading && recruits.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
                Filters
              </h3>
              {hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : null}
            </div>
            {renderFiltersGrid()}
          </div>
        </Card>

        <EmptyState
          title="No Recruits Found"
          description={
            hasActiveFilters
              ? 'No recruits match your current filters. Try adjusting your search or filters.'
              : 'No recruits yet. Import a roster from Excel, PDF, or photos — or add recruits one at a time.'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : showRecruitActions ? 'Add Recruit' : undefined}
          onAction={
            hasActiveFilters
              ? handleClearFilters
              : showRecruitActions && onCreateClick
                ? onCreateClick
                : undefined
          }
          secondaryActionLabel={
            !hasActiveFilters && showRecruitActions && onImportClick ? 'Import roster' : undefined
          }
          onSecondaryAction={!hasActiveFilters && showRecruitActions ? onImportClick : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
              Filters
            </h3>
            <div className="flex items-center gap-4">
              {hasActiveFilters ? (
                <Button variant="secondary" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              ) : null}
              {renderViewToggle()}
            </div>
          </div>
          {renderFiltersGrid(true)}
        </div>
      </Card>

      {currentViewMode === 'columns' ? (
        <RecruitCompanyColumnView
          companies={battalionCompanies}
          recruitsByCompany={recruitsByCompany}
          loading={loading}
          onRecruitClick={onRecruitClick}
        />
      ) : currentViewMode === 'table' ? (
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
                  {showRowActions ? (
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-primary-light dark:text-text-primary-dark">
                      Actions
                    </th>
                  ) : null}
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
                        EDIPI: {formatEdipiForDisplay(recruit)}
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
                    {showRowActions ? (
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          {onModifyClick && canModifyRecruit?.(recruit) ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onModifyClick(recruit.id)}
                            >
                              Modify
                            </Button>
                          ) : null}
                          {onTransferClick && canTransferRecruit?.(recruit) ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => onTransferClick(recruit.id)}
                            >
                              Transfer
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
                {loading && (
                  <tr>
                    <td colSpan={showRowActions ? 6 : 5} className="px-6 py-4">
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
                    EDIPI: {formatEdipiForDisplay(recruit)}
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
                {showRowActions ? (
                  <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                    {onModifyClick && canModifyRecruit?.(recruit) ? (
                      <Button variant="secondary" size="sm" onClick={() => onModifyClick(recruit.id)}>
                        Modify
                      </Button>
                    ) : null}
                    {onTransferClick && canTransferRecruit?.(recruit) ? (
                      <Button variant="secondary" size="sm" onClick={() => onTransferClick(recruit.id)}>
                        Transfer
                      </Button>
                    ) : null}
                  </div>
                ) : null}
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
