'use client';

/**
 * Count Cards List Page
 * 
 * Displays a list of count cards with filtering, search, sorting, and pagination capabilities.
 * Implements role-based access control to show only count cards within the user's authorized scope.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { listCountCards, getCountCardsByDateRange } from '@/lib/services/firestore/countCards';
import { getOrganizationalScopeForUser } from '@/lib/services/firestore/organizations';
import { logError } from '@/lib/utils/logger';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/navigation';
import { CountCardList, type CountCardFilters, type CountCardSortField } from '@/components/countCards/CountCardList';
import { Spinner } from '@/components/feedback';
import { ErrorState } from '@/components/feedback';
import { Button } from '@/components/ui/Button';
import { checkPermission } from '@/lib/permissions/utils';
import type { CountCard } from '@/types/models';
import type { SortOrder } from '@/components/countCards/CountCardList';
import type { PaginationResult } from '@/lib/services/firestore/base';
import type { Regiment } from '@/types/auth';

/**
 * Breadcrumb items
 */
const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Count Cards', href: '/count-cards' },
];

/**
 * Get organizational scope for count card filtering
 * Returns the organizational filters that should be applied based on user's role
 */
function getCountCardOrganizationalScope(user: any): {
  regiment?: Regiment;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
} {
  if (!user) {
    return {};
  }

  const role = user.customClaims?.role || user.profile?.role;
  const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;

  if (!role || !userOrg) {
    return {};
  }

  // Get organizational scope using the same logic as recruits
  return getOrganizationalScopeForUser(role, userOrg);
}

export default function CountCardsPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const canCreateCountCard = checkPermission(user, 'create_count_card');

  // State
  const [countCards, setCountCards] = useState<CountCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);

  // Filter state
  const [filters, setFilters] = useState<CountCardFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<CountCardSortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pageSize] = useState(25);

  // Get organizational scope for filtering
  const organizationalScope = useMemo(
    () => (user ? getCountCardOrganizationalScope(user) : {}),
    [user]
  );

  /**
   * Load count cards
   */
  const loadCountCards = useCallback(
    async (reset = false) => {
      if (!user) {
        setError(new Error('You must be logged in to view count cards'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Merge user's organizational scope with filters
        const mergedFilters: CountCardFilters = {
          ...organizationalScope,
          ...filters,
        };

        let result: PaginationResult<CountCard>;

        // Use date range query if date filters are provided
        if (filters.startDate || filters.endDate) {
          const startDate = filters.startDate ? new Date(filters.startDate) : new Date(0);
          const endDate = filters.endDate
            ? new Date(filters.endDate + 'T23:59:59')
            : new Date();

          result = await getCountCardsByDateRange(
            startDate,
            endDate,
            {
              regiment: mergedFilters.regiment,
              battalion: mergedFilters.battalion,
              company: mergedFilters.company,
              series: mergedFilters.series,
              platoon: mergedFilters.platoon,
              status: mergedFilters.status,
              workflowState: mergedFilters.workflowState,
            },
            {
              pageSize: reset ? pageSize : undefined,
              lastDoc: reset ? undefined : lastDoc,
            }
          );
        } else {
          // Use regular list query
          result = await listCountCards(
            {
              regiment: mergedFilters.regiment,
              battalion: mergedFilters.battalion,
              company: mergedFilters.company,
              series: mergedFilters.series,
              platoon: mergedFilters.platoon,
              status: mergedFilters.status,
              workflowState: mergedFilters.workflowState,
            },
            {
              pageSize: reset ? pageSize : undefined,
              lastDoc: reset ? undefined : lastDoc,
            }
          );
        }

        // Apply client-side search filtering if search term is provided
        let filteredResults = result.items;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          filteredResults = result.items.filter((countCard) => {
            return (
              countCard.countCardId.toLowerCase().includes(term) ||
              countCard.location.toLowerCase().includes(term)
            );
          });
        }

        // Apply client-side sorting
        filteredResults.sort((a, b) => {
          let aValue: any;
          let bValue: any;

          switch (sortField) {
            case 'timestamp':
              aValue = a.timestamp instanceof Date ? a.timestamp : a.timestamp?.toDate?.() || new Date(0);
              bValue = b.timestamp instanceof Date ? b.timestamp : b.timestamp?.toDate?.() || new Date(0);
              break;
            case 'status':
              aValue = a.status;
              bValue = b.status;
              break;
            case 'workflowState':
              aValue = a.workflowState;
              bValue = b.workflowState;
              break;
            case 'location':
              aValue = a.location;
              bValue = b.location;
              break;
            case 'createdAt':
              aValue = a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate?.() || new Date(0);
              bValue = b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate?.() || new Date(0);
              break;
            case 'updatedAt':
              aValue = a.updatedAt instanceof Date ? a.updatedAt : a.updatedAt?.toDate?.() || new Date(0);
              bValue = b.updatedAt instanceof Date ? b.updatedAt : b.updatedAt?.toDate?.() || new Date(0);
              break;
            default:
              return 0;
          }

          if (aValue < bValue) {
            return sortOrder === 'asc' ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortOrder === 'asc' ? 1 : -1;
          }
          return 0;
        });

        if (reset) {
          setCountCards(filteredResults);
        } else {
          setCountCards((prev) => [...prev, ...filteredResults]);
        }

        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore || false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logError(error, 'Failed to load count cards');
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [user, filters, searchTerm, sortField, sortOrder, lastDoc, pageSize, organizationalScope]
  );

  /**
   * Load count cards on mount and when filters/search change
   */
  useEffect(() => {
    setLastDoc(null);
    loadCountCards(true);
  }, [filters, searchTerm, sortField, sortOrder]);

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilters: CountCardFilters) => {
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
  const handleSortChange = (field: CountCardSortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setLastDoc(null);
  };

  /**
   * Handle count card click
   */
  const handleCountCardClick = (countCardId: string) => {
    router.push(`/count-cards/${countCardId}`);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    loadCountCards(false);
  };

  // Error state
  if (error) {
    return (
      <Container>
        <ErrorState
          title="Failed to Load Count Cards"
          message={error.message}
          retryLabel="Try Again"
          onRetry={() => {
            setError(null);
            loadCountCards(true);
          }}
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 text-text-heading-light dark:text-text-heading-dark">
              Count Cards
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              View and manage count card accountability records.
            </p>
          </div>
          {canCreateCountCard.allowed && (
            <Button variant="primary" onClick={() => router.push('/count-cards/new')}>
              Create Count Card
            </Button>
          )}
        </div>

        <CountCardList
          countCards={countCards}
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
          onCountCardClick={handleCountCardClick}
          pageSize={pageSize}
        />
      </div>
    </Container>
  );
}
