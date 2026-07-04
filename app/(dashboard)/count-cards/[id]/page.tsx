'use client';

/**
 * Count Card Detail Page
 * 
 * Page for displaying comprehensive count card information including
 * metadata, recruit list, workflow history, and action buttons.
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCountCardById } from '@/lib/services/firestore/countCards';
import { logError } from '@/lib/utils/logger';
import { useToast } from '@/context/ToastContext';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import ErrorState from '@/components/feedback/ErrorState';
import Spinner from '@/components/feedback/Spinner';
import { CountCardDetail } from '@/components/countCards/CountCardDetail';
import type { CountCard } from '@/types/models';

/**
 * Get breadcrumb items
 */
function getBreadcrumbItems(countCardId: string) {
  return [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Count Cards', href: '/count-cards' },
    { label: countCardId || 'Count Card', href: `/count-cards/${countCardId}` },
  ];
}

export default function CountCardDetailPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const countCardId = params?.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [countCard, setCountCard] = useState<CountCard | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load count card data
   */
  useEffect(() => {
    async function loadCountCard() {
      if (!countCardId) {
        setError(new Error('Count card ID is required'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load count card
        const countCardData = await getCountCardById(countCardId);
        if (!countCardData) {
          setError(new Error('Count card not found'));
          setLoading(false);
          return;
        }
        setCountCard(countCardData);

        setLoading(false);
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'Failed to load count card');
        setError(err as Error);
        setLoading(false);
      }
    }

    if (user) {
      loadCountCard();
    }
  }, [countCardId, user]);

  /**
   * Handle workflow action success
   */
  const handleWorkflowActionSuccess = () => {
    // Reload count card to get updated state
    if (countCardId) {
      getCountCardById(countCardId)
        .then((updatedCountCard) => {
          if (updatedCountCard) {
            setCountCard(updatedCountCard);
          }
        })
        .catch((err) => {
          logError(err instanceof Error ? err : new Error(String(err)), 'Failed to reload count card');
        });
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  // Error state
  if (error || !countCard) {
    return (
      <Container>
        <ErrorState
          title="Failed to Load Count Card"
          message={error?.message || 'Count card not found'}
          retryLabel="Back to Count Cards"
          onRetry={() => router.push('/count-cards')}
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Breadcrumbs items={getBreadcrumbItems(countCardId)} />
        <CountCardDetail
          countCard={countCard}
          onWorkflowActionSuccess={handleWorkflowActionSuccess}
        />
      </div>
    </Container>
  );
}
