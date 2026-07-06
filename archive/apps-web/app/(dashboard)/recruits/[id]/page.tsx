'use client';

/**
 * Recruit Detail Page
 * 
 * Page for displaying comprehensive recruit information including
 * personal details, organizational assignment, emergency contacts,
 * and count card history.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { getRecruitProfileById } from '@/lib/services/firestore/recruits';
import { getEmergencyContactsByRecruit } from '@/lib/services/firestore/emergencyContacts';
import { deleteRecruitProfile } from '@/lib/services/firestore/recruits';
import { logError, logInfo } from '@/lib/utils/logger';
import { useToast } from '@/context/ToastContext';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import { RecruitDetail } from '@/components/recruits/RecruitDetail';
import ErrorState from '@/components/feedback/ErrorState';
import { isTrainingCustodyPhase } from '@countcard/core/constants/custodyPhase';
import type { RecruitProfile } from '@/types/models';
import type { EmergencyContact } from '@/types/models';

/**
 * Get breadcrumb items
 */
function getBreadcrumbItems(recruitId: string, recruitName?: string) {
  return [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Recruits', href: '/recruits' },
    { label: recruitName || 'Recruit', href: `/recruits/${recruitId}` },
  ];
}

export default function RecruitDetailPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { canView, canEdit, canDelete } = useRecruitPermissions();

  const recruitId = params?.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Check permissions
  const permissions = useMemo(() => {
    if (!recruit) {
      return {
        canView: { allowed: false, reason: 'Recruit not loaded' },
        canEdit: { allowed: false, reason: 'Recruit not loaded' },
        canDelete: { allowed: false, reason: 'Recruit not loaded' },
        canTransfer: false,
      };
    }
    return {
      canView: canView(recruit),
      canEdit: canEdit(recruit),
      canDelete: canDelete(recruit),
      canTransfer:
        canEdit(recruit).allowed &&
        (recruit.custodyPhase == null || isTrainingCustodyPhase(recruit.custodyPhase)),
    };
  }, [recruit, canView, canEdit, canDelete]);

  /**
   * Load recruit data
   */
  useEffect(() => {
    async function loadRecruit() {
      if (!recruitId || !user) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load recruit profile
        const recruitData = await getRecruitProfileById(recruitId);
        if (!recruitData) {
          setError(new Error('Recruit not found'));
          setLoading(false);
          return;
        }
        setRecruit(recruitData);

        // Check if user can view this recruit
        const viewCheck = canView(recruitData);
        if (!viewCheck.allowed) {
          setError(new Error(viewCheck.reason || 'You do not have permission to view this recruit'));
          setLoading(false);
          return;
        }

        // Load emergency contacts
        try {
          const contactsResult = await getEmergencyContactsByRecruit(recruitId);
          setEmergencyContacts(contactsResult.items);
        } catch (contactError) {
          // Log but don't fail the page if emergency contacts fail to load
          logError(contactError instanceof Error ? contactError : new Error(String(contactError)), 'Failed to load emergency contacts');
        }

        setLoading(false);
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'Failed to load recruit profile');
        setError(err as Error);
        setLoading(false);
      }
    }

    loadRecruit();
  }, [recruitId, user]);

  /**
   * Handle modify
   */
  const handleModify = () => {
    router.push(`/recruits/${recruitId}/edit`);
  };

  /**
   * Handle transfer
   */
  const handleTransfer = () => {
    router.push(`/recruits/${recruitId}/transfer`);
  };

  /**
   * Handle delete
   */
  const handleDelete = async () => {
    if (!recruit) return;

    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete recruit "${recruit.firstName} ${recruit.lastName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await deleteRecruitProfile(recruitId);

      logInfo('Recruit profile deleted successfully', 'RecruitDetailPage', { recruitId });

      // Show success message
      showToast({
        variant: 'success',
        message: `Recruit "${recruit.firstName} ${recruit.lastName}" deleted successfully.`,
      });

      // Redirect to recruit list
      router.push('/recruits');
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'Failed to delete recruit profile');
      showToast({
        variant: 'error',
        message: 'Failed to delete recruit. Please try again.',
      });
      setDeleting(false);
    }
  };

  // Get breadcrumb items
  const breadcrumbItems = getBreadcrumbItems(
    recruitId,
    recruit ? `${recruit.firstName} ${recruit.lastName}` : undefined
  );

  return (
    <Container>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />

        {loading || !user ? (
          <RecruitDetail
            recruit={recruit}
            emergencyContacts={emergencyContacts}
            loading={loading}
            error={error}
            recruitId={recruitId}
          />
        ) : permissions.canView.allowed ? (
          <RecruitDetail
            recruit={recruit}
            emergencyContacts={emergencyContacts}
            loading={loading}
            error={error}
            onModify={permissions.canEdit.allowed ? handleModify : undefined}
            onTransfer={permissions.canTransfer ? handleTransfer : undefined}
            onDelete={permissions.canDelete.allowed ? handleDelete : undefined}
            showModifyButton={permissions.canEdit.allowed}
            showTransferButton={permissions.canTransfer}
            showDeleteButton={permissions.canDelete.allowed}
            recruitId={recruitId}
          />
        ) : (
          <ErrorState
            title="Access Denied"
            message={permissions.canView.reason || 'You do not have permission to view this recruit'}
            retryLabel="Go Back"
            onRetry={() => router.push('/recruits')}
          />
        )}
      </div>
    </Container>
  );
}
