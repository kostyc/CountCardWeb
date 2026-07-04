'use client';

/**
 * Recruit Edit Page
 * 
 * Page for editing existing recruit profiles with pre-populated form data,
 * validation, and organizational assignment updates.
 */

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { RecruitForm, type RecruitFormData, type RecruitFormErrors } from '@/components/recruits/RecruitForm';
import { getRecruitProfileById, updateRecruitProfile } from '@/lib/services/firestore/recruits';
import { recruitUpdateSchema } from '@/lib/validation/recruitSchemas';
import { validateOrganizationalAssignment } from '@/lib/services/firestore/organizations';
import { logError, logInfo } from '@/lib/utils/logger';
import { useToast } from '@/context/ToastContext';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import Spinner from '@/components/feedback/Spinner';
import ErrorState from '@/components/feedback/ErrorState';
import type { RecruitProfile } from '@/types/models';
import type { OrganizationalAssignment } from '@/types/auth';

/**
 * Get breadcrumb items
 */
function getBreadcrumbItems(recruitId: string, recruitName?: string) {
  return [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Recruits', href: '/recruits' },
    { label: recruitName || 'Recruit', href: `/recruits/${recruitId}` },
    { label: 'Edit', href: `/recruits/${recruitId}/edit` },
  ];
}

export default function EditRecruitPage(): JSX.Element {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { canEdit } = useRecruitPermissions();

  const recruitId = params?.id as string;

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<RecruitFormErrors>({});
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Check permissions
  const canEditRecruit = useMemo(() => {
    if (!recruit) return { allowed: false, reason: 'Recruit not loaded' };
    return canEdit(recruit);
  }, [recruit, canEdit]);

  /**
   * Load recruit data
   */
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

        // Check if user can edit this recruit
        const editCheck = canEdit(recruitData);
        if (!editCheck.allowed) {
          setError(new Error(editCheck.reason || 'You do not have permission to edit this recruit'));
          setLoading(false);
          return;
        }

        setRecruit(recruitData);
        setLoading(false);
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'Failed to load recruit profile');
        setError(err as Error);
        setLoading(false);
      }
    }

    loadRecruit();
  }, [recruitId]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (formData: RecruitFormData) => {
    if (!user || !recruit) {
      showToast({
        variant: 'error',
        message: 'You must be logged in to edit a recruit profile.',
      });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // Validate form data
      const validationResult = recruitUpdateSchema.safeParse({
        recruitId: formData.recruitId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        rank: formData.rank,
        status: formData.status,
        regiment: formData.regiment,
        battalion: formData.battalion,
        company: formData.company,
        series: formData.series,
        platoon: formData.platoon,
        photoUrl: formData.photoUrl,
        updatedBy: user.uid,
      });

      if (!validationResult.success) {
        // Map validation errors to form errors
        const formErrors: RecruitFormErrors = {};
        validationResult.error.issues.forEach((error) => {
          const field = String(error.path[0]);
          if (field === 'regiment' || field === 'battalion' || field === 'company' || field === 'series' || field === 'platoon') {
            if (!formErrors.organizational) {
              formErrors.organizational = {};
            }
            formErrors.organizational[field as keyof NonNullable<RecruitFormErrors['organizational']>] = error.message;
          } else {
            (formErrors as Record<string, string>)[field] = error.message;
          }
        });
        setErrors(formErrors);
        setSubmitting(false);
        return;
      }

      // Validate organizational assignment
      if (formData.battalion && formData.company) {
        const orgValidation = validateOrganizationalAssignment({
          regiment: formData.regiment as 'West' | 'East' | undefined,
          battalion: formData.battalion as OrganizationalAssignment['battalion'],
          company: formData.company as OrganizationalAssignment['company'],
          series: formData.series as OrganizationalAssignment['series'],
          platoon: formData.platoon,
        });

        if (!orgValidation.valid) {
          setErrors({
            organizational: {
              company: orgValidation.error,
            },
          });
          setSubmitting(false);
          return;
        }
      }

      // Update recruit profile
      await updateRecruitProfile(
        recruitId,
        {
          recruitId: formData.recruitId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          rank: formData.rank as any,
          status: formData.status as any,
          regiment: formData.regiment as any,
          battalion: formData.battalion,
          company: formData.company,
          series: formData.series,
          platoon: formData.platoon,
          photoUrl: formData.photoUrl,
          updatedBy: user.uid,
        },
        user.uid
      );

      logInfo('Recruit profile updated successfully', 'EditRecruitPage', { recruitId });

      // Show success message
      showToast({
        variant: 'success',
        message: 'Recruit profile "' + formData.firstName + ' ' + formData.lastName + '" updated successfully.',
      });

      // Redirect to recruit detail page
      router.push(`/recruits/${recruitId}`);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'Failed to update recruit profile');
      showToast({
        variant: 'error',
        message: err instanceof Error ? err.message : 'Failed to update recruit profile. Please try again.',
      });
      setSubmitting(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.push(`/recruits/${recruitId}`);
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
  if (error || !recruit || !canEditRecruit.allowed) {
    return (
      <Container>
        <ErrorState
          title={canEditRecruit.allowed ? "Failed to Load Recruit" : "Access Denied"}
          message={canEditRecruit.allowed ? (error?.message || 'Recruit not found') : (canEditRecruit.reason || 'You do not have permission to edit this recruit')}
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
        <RecruitForm
          initialData={recruit}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          errors={errors}
          loading={submitting}
          mode="edit"
        />
      </div>
    </Container>
  );
}
