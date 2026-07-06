'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { useToast } from '@/context/ToastContext';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import Spinner from '@/components/feedback/Spinner';
import ErrorState from '@/components/feedback/ErrorState';
import {
  RecruitTransferForm,
  type RecruitTransferFormData,
} from '@/components/recruits/RecruitTransferForm';
import {
  getRecruitProfileById,
} from '@/lib/services/firestore/recruits';
import { transferRecruitViaApi } from '@countcard/api-client';
import { validateOrganizationalAssignment } from '@/lib/services/firestore/organizations';
import { logError, logInfo } from '@/lib/utils/logger';
import { isTrainingCustodyPhase } from '@countcard/core/constants/custodyPhase';
import type { RecruitProfile } from '@/types/models';
import type { OrganizationalAssignment } from '@/types/auth';

function getBreadcrumbItems(recruitId: string, recruitName?: string) {
  return [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Recruits', href: '/recruits' },
    { label: recruitName || 'Recruit', href: `/recruits/${recruitId}` },
    { label: 'Transfer', href: `/recruits/${recruitId}/transfer` },
  ];
}

export default function TransferRecruitPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { canEdit } = useRecruitPermissions();
  const recruitId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canTransferRecruit = useMemo(() => {
    if (!recruit) return { allowed: false, reason: 'Recruit not loaded' };
    if (recruit.custodyPhase && !isTrainingCustodyPhase(recruit.custodyPhase)) {
      return {
        allowed: false,
        reason: 'Single-recruit transfer requires training custody. Use Receiving transfer batch workflow.',
      };
    }
    return canEdit(recruit);
  }, [recruit, canEdit]);

  useEffect(() => {
    async function loadRecruit() {
      if (!recruitId) {
        setError(new Error('Recruit ID is required'));
        setLoading(false);
        return;
      }

      try {
        const recruitData = await getRecruitProfileById(recruitId);
        if (!recruitData) {
          setError(new Error('Recruit not found'));
          setLoading(false);
          return;
        }

        const editCheck = canEdit(recruitData);
        if (!editCheck.allowed) {
          setError(new Error(editCheck.reason || 'You do not have permission to transfer this recruit'));
          setLoading(false);
          return;
        }

        setRecruit(recruitData);
        setLoading(false);
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'Failed to load recruit for transfer');
        setError(err as Error);
        setLoading(false);
      }
    }

    loadRecruit();
  }, [recruitId, canEdit]);

  async function handleSubmit(formData: RecruitTransferFormData) {
    if (!user || !recruit) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (formData.battalion && formData.company) {
        const orgValidation = validateOrganizationalAssignment({
          regiment: formData.regiment as OrganizationalAssignment['regiment'],
          battalion: formData.battalion as OrganizationalAssignment['battalion'],
          company: formData.company as OrganizationalAssignment['company'],
          series: formData.series as OrganizationalAssignment['series'],
          platoon: formData.platoon,
        });

        if (!orgValidation.valid) {
          setSubmitError(orgValidation.error || 'Invalid organizational assignment');
          setSubmitting(false);
          return;
        }
      }

      await transferRecruitViaApi(
        recruitId,
        {
          regiment: formData.regiment,
          battalion: formData.battalion,
          company: formData.company,
          series: formData.series,
          platoon: formData.platoon,
        },
        formData.reason
      );

      logInfo('Recruit transferred successfully', 'TransferRecruitPage', { recruitId });

      showToast({
        variant: 'success',
        message: `${recruit.firstName} ${recruit.lastName} transferred successfully.`,
      });

      router.push(`/recruits/${recruitId}`);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'Failed to transfer recruit');
      setSubmitError(err instanceof Error ? err.message : 'Failed to transfer recruit. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !recruit || !canTransferRecruit.allowed) {
    return (
      <Container>
        <ErrorState
          title={canTransferRecruit.allowed ? 'Failed to Load Recruit' : 'Access Denied'}
          message={
            canTransferRecruit.allowed
              ? error?.message || 'Recruit not found'
              : canTransferRecruit.reason || 'You do not have permission to transfer this recruit'
          }
          retryLabel="Back to Recruits"
          onRetry={() => router.push('/recruits')}
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Breadcrumbs
          items={getBreadcrumbItems(recruitId, `${recruit.firstName} ${recruit.lastName}`)}
        />
        <RecruitTransferForm
          recruit={recruit}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/recruits/${recruitId}`)}
          loading={submitting}
          error={submitError ?? undefined}
        />
      </div>
    </Container>
  );
}
