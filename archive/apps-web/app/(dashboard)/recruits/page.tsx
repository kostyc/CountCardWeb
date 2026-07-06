'use client';

/**
 * Recruit List Page
 *
 * Displays recruits with role-based layout: battalion staff see company columns;
 * company/series/platoon staff see scoped flat lists with sort.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listRecruits } from '@/lib/services/firestore/recruits';
import { matchesRecruitSearch } from '@countcard/core/utils/recruitSearch';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { sortRecruits } from '@/lib/permissions/recruits';
import type { RecruitSortField, RecruitSortOrder } from '@/lib/permissions/recruits';
import { getCompaniesByBattalion } from '@countcard/core/constants/organizations';
import { logError } from '@/lib/utils/logger';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { RecruitList } from '@/components/recruits/RecruitList';
import { RecruitQuickActions } from '@/components/recruits/RecruitQuickActions';
import Spinner from '@/components/feedback/Spinner';
import ErrorState from '@/components/feedback/ErrorState';
import type { RecruitProfile } from '@/types/models';
import { isTrainingCustodyPhase } from '@countcard/core/constants/custodyPhase';
import type { RecruitStatus } from '@/lib/validation/recruitSchemas';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import type { Regiment } from '@/types/auth';
import type { Battalion, Company } from '@/lib/validation/organizationSchemas';
import type { PaginationResult } from '@/lib/services/firestore/base';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export interface RecruitFilters {
  regiment?: Regiment;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
  status?: RecruitStatus;
  rank?: RecruitRank;
}

export type SortField = RecruitSortField;
export type SortOrder = RecruitSortOrder;

const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recruits', href: '/recruits' },
];

const BATTALION_PAGE_SIZE = 100;
const FLAT_PAGE_SIZE = 20;

async function fetchAllBattalionRecruits(
  mergedFilters: RecruitFilters
): Promise<RecruitProfile[]> {
  const all: RecruitProfile[] = [];
  let lastDoc: PaginationResult<RecruitProfile>['lastDoc'];
  let hasMore = true;

  while (hasMore) {
    const result = await listRecruits(mergedFilters, {
      pageSize: BATTALION_PAGE_SIZE,
      lastDoc,
    });
    all.push(...result.items);
    lastDoc = result.lastDoc;
    hasMore = result.hasMore ?? false;
  }

  return all;
}

export default function RecruitsPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const {
    getOrganizationalScope,
    listViewMode,
    filterLevel,
    scopeLabel,
    canView,
    canCreateAny,
    canEdit,
  } = useRecruitPermissions();

  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);

  const [filters, setFilters] = useState<RecruitFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const organizationalScope = useMemo(() => getOrganizationalScope(), [getOrganizationalScope]);

  const userBattalion = useMemo((): Battalion | undefined => {
    const battalion =
      user?.customClaims?.organizationalAssignment?.battalion ||
      user?.profile?.organizationalAssignment?.battalion;
    return battalion as Battalion | undefined;
  }, [user]);

  const battalionCompanies = useMemo((): Company[] => {
    if (!userBattalion) return [];
    return getCompaniesByBattalion(userBattalion);
  }, [userBattalion]);

  const loadRecruits = useCallback(
    async (reset = false) => {
      if (!user) {
        setError(new Error('You must be logged in to view recruits'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        if (searchTerm.trim()) {
          const mergedFilters: RecruitFilters = {
            ...(organizationalScope as RecruitFilters),
            ...filters,
          };
          const allItems = await fetchAllBattalionRecruits(mergedFilters);
          setRecruits(allItems);
          setLastDoc(undefined);
          setHasMore(false);
          return;
        }

        const mergedFilters: RecruitFilters = {
          ...(organizationalScope as RecruitFilters),
          ...filters,
        };

        if (listViewMode === 'company_columns' && reset) {
          const allItems = await fetchAllBattalionRecruits(mergedFilters);
          setRecruits(allItems);
          setLastDoc(undefined);
          setHasMore(false);
          return;
        }

        const result = await listRecruits(mergedFilters, {
          pageSize: reset ? FLAT_PAGE_SIZE : undefined,
          lastDoc: reset ? undefined : lastDoc,
        });

        if (reset) {
          setRecruits(result.items);
        } else {
          setRecruits((prev) => [...prev, ...result.items]);
        }

        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore || false);
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'Failed to load recruits');
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [user, filters, searchTerm, lastDoc, organizationalScope, listViewMode]
  );

  useEffect(() => {
    setLastDoc(undefined);
    loadRecruits(true);
  }, [filters, searchTerm, listViewMode, organizationalScope]);

  const handleFilterChange = (newFilters: RecruitFilters) => {
    setFilters(newFilters);
    setLastDoc(undefined);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setLastDoc(undefined);
  };

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadRecruits(false);
    }
  };

  const handleRecruitClick = (recruitId: string) => {
    router.push(`/recruits/${recruitId}`);
  };

  const handleCreateRecruit = () => {
    router.push('/recruits/create');
  };

  const handleModifyRecruit = (recruitId: string) => {
    router.push(`/recruits/${recruitId}/edit`);
  };

  const handleTransferRecruit = (recruitId: string) => {
    router.push(`/recruits/${recruitId}/transfer`);
  };

  const handleImportRecruits = () => {
    router.push('/recruits/import');
  };

  const filteredRecruits = useMemo(() => {
    return recruits
      .filter((recruit) => canView(recruit).allowed)
      .filter((recruit) => matchesRecruitSearch(recruit, searchTerm));
  }, [recruits, canView, searchTerm]);

  const sortedRecruits = useMemo(
    () => sortRecruits(filteredRecruits, sortField, sortOrder),
    [filteredRecruits, sortField, sortOrder]
  );

  const recruitsByCompany = useMemo(() => {
    const grouped: Record<string, RecruitProfile[]> = {};
    for (const company of battalionCompanies) {
      grouped[company] = [];
    }
    for (const recruit of sortedRecruits) {
      const company = recruit.company;
      if (company && grouped[company]) {
        grouped[company].push(recruit);
      }
    }
    return grouped;
  }, [sortedRecruits, battalionCompanies]);

  const showListError = Boolean(error && recruits.length === 0 && !loading);
  const showInitialLoading = loading && recruits.length === 0 && !error;

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <RecruitQuickActions />
        </div>

        {scopeLabel ? (
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Viewing: <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{scopeLabel}</span>
          </p>
        ) : null}

        {showListError ? (
          <ErrorState
            title="Failed to Load Recruits"
            message={error?.message ?? 'Unable to load recruits.'}
            retryLabel="Retry"
            onRetry={() => {
              setError(null);
              setLastDoc(undefined);
              loadRecruits(true);
            }}
            secondaryActionLabel={canCreateAny ? 'Import roster' : undefined}
            onSecondaryAction={canCreateAny ? handleImportRecruits : undefined}
          />
        ) : showInitialLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
          </div>
        ) : (
          <RecruitList
            recruits={sortedRecruits}
            filters={filters}
            onFilterChange={handleFilterChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onRecruitClick={handleRecruitClick}
            showRecruitActions={canCreateAny}
            onImportClick={handleImportRecruits}
            onCreateClick={handleCreateRecruit}
            onModifyClick={handleModifyRecruit}
            onTransferClick={handleTransferRecruit}
            canModifyRecruit={(recruit) => canEdit(recruit).allowed}
            canTransferRecruit={(recruit) =>
              canEdit(recruit).allowed &&
              (recruit.custodyPhase == null || isTrainingCustodyPhase(recruit.custodyPhase))
            }
            listViewMode={listViewMode}
            filterLevel={filterLevel}
            scopeLabel={scopeLabel}
            battalionCompanies={battalionCompanies}
            recruitsByCompany={recruitsByCompany}
            lockedOrgScope={organizationalScope}
          />
        )}
      </div>
    </Container>
  );
}
