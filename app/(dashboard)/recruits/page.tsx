'use client';

/**
 * Recruit List Page
 * 
 * Displays a list of recruits with filtering, search, sorting, and pagination capabilities.
 * Implements role-based access control to show only recruits within the user's authorized scope.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listRecruits, searchRecruits } from '@/lib/services/firestore/recruits';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { logError } from '@/lib/utils/logger';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { RecruitList } from '@/components/recruits/RecruitList';
import { Spinner } from '@/components/feedback/Spinner';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Button } from '@/components/ui/Button';
import type { RecruitProfile } from '@/types/models';
import type { RecruitStatus } from '@/lib/validation/recruitSchemas';
import type { USMCRank, Regiment } from '@/types/auth';
import type { PaginationResult } from '@/lib/services/firestore/base';

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
 * Sort options
 */
export type SortField = 'name' | 'rank' | 'status' | 'platoon' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

/**
 * Breadcrumb items
 */
const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recruits', href: '/recruits' },
];

export default function RecruitsPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { getOrganizationalScope, canView, canCreateAny } = useRecruitPermissions();

  // State
  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);

  // Filter state
  const [filters, setFilters] = useState<RecruitFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [pageSize] = useState(20);

  // Get organizational scope for filtering
  const organizationalScope = useMemo(() => getOrganizationalScope(), [getOrganizationalScope]);

  /**
   * Load recruits
   */
  const loadRecruits = useCallback(async (reset = false) => {
    if (!user) {
      setError(new Error('You must be logged in to view recruits'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let result: PaginationResult<RecruitProfile>;

      if (searchTerm.trim()) {
        // Use search if search term is provided
        result = await searchRecruits(searchTerm.trim(), {
          pageSize: reset ? pageSize : undefined,
          lastDoc: reset ? undefined : lastDoc,
        });
      } else {
        // Merge user's organizational scope with filters
        const mergedFilters: RecruitFilters = {
          ...organizationalScope,
          ...filters,
        };

        // Use filtered list
        result = await listRecruits(mergedFilters, {
          pageSize: reset ? pageSize : undefined,
          lastDoc: reset ? undefined : lastDoc,
        });
      }

      if (reset) {
        setRecruits(result.items);
      } else {
        setRecruits((prev) => [...prev, ...result.items]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore || false);
    } catch (err) {
      logError('Failed to load recruits', err as Error);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, filters, searchTerm, lastDoc, pageSize, organizationalScope]);

  /**
   * Load recruits on mount and when filters/search change
   */
  useEffect(() => {
    setLastDoc(null);
    loadRecruits(true);
  }, [filters, searchTerm, sortField, sortOrder]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilters: RecruitFilters) => {
    setFilters(newFilters);
    setLastDoc(null);
  };

  /**
   * Handle search change
   */
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setLastDoc(null);
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setLastDoc(null);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadRecruits(false);
    }
  };

  /**
   * Handle recruit click
   */
  const handleRecruitClick = (recruitId: string) => {
    router.push(`/recruits/${recruitId}`);
  };

  /**
   * Handle create recruit
   */
  const handleCreateRecruit = () => {
    router.push('/recruits/create');
  };

  // Filter recruits by permissions (client-side check for additional security)
  const filteredRecruits = useMemo(() => {
    return recruits.filter((recruit) => {
      const permissionCheck = canView(recruit);
      return permissionCheck.allowed;
    });
  }, [recruits, canView]);

  // Sort recruits client-side (since Firestore ordering is limited)
  const sortedRecruits = [...filteredRecruits].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = `${a.lastName} ${a.firstName}`.toLowerCase();
        bValue = `${b.lastName} ${b.firstName}`.toLowerCase();
        break;
      case 'rank':
        aValue = a.rank || '';
        bValue = b.rank || '';
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'platoon':
        aValue = a.platoon || '';
        bValue = b.platoon || '';
        break;
      case 'createdAt':
        aValue = a.createdAt?.getTime() || 0;
        bValue = b.createdAt?.getTime() || 0;
        break;
      case 'updatedAt':
        aValue = a.updatedAt?.getTime() || 0;
        bValue = b.updatedAt?.getTime() || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Loading state
  if (loading && recruits.length === 0) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  // Error state
  if (error && recruits.length === 0) {
    return (
      <Container>
        <ErrorState
          title="Failed to Load Recruits"
          message={error.message}
          actionLabel="Retry"
          onAction={() => {
            setError(null);
            setLastDoc(null);
            loadRecruits(true);
          }}
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          {canCreateAny && (
            <Button
              variant="primary"
              onClick={handleCreateRecruit}
              className="z-10"
            >
              Create Recruit
            </Button>
          )}
        </div>

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
        />
      </div>
    </Container>
  );
}
