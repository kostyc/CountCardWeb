'use client';

/**
 * Recruit Creation Page
 * 
 * Page for creating new recruit profiles with all required fields,
 * validation, and organizational assignment.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { RecruitForm, type RecruitFormData, type RecruitFormErrors } from '@/components/recruits/RecruitForm';
import { createRecruitProfile } from '@/lib/services/firestore/recruits';
import { recruitCreateSchema } from '@/lib/validation/recruitSchemas';
import { validateOrganizationalAssignment } from '@/lib/services/firestore/organizations';
import { logError, logInfo } from '@/lib/utils/logger';
import { useToast } from '@/context/ToastContext';
import { Container } from '@/components/ui/Container';
import Breadcrumbs from '@/components/navigation/Breadcrumbs';
import ErrorState from '@/components/feedback/ErrorState';
import { RecruitQuickActions } from '@/components/recruits/RecruitQuickActions';
import { deriveRecruitDocumentId, normalizeEdipiDigits } from '@countcard/core/utils/recruitEdipi';
import type { OrganizationalAssignment } from '@/types/auth';

/**
 * Breadcrumb items
 */
const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recruits', href: '/recruits' },
  { label: 'Add Recruit', href: '/recruits/create' },
];

export default function CreateRecruitPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { canCreateAny, canCreate } = useRecruitPermissions();

  // Form state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<RecruitFormErrors>({});

  // Check if user can create recruits
  useEffect(() => {
    if (user && !canCreateAny) {
      showToast({
        variant: 'error',
        message: 'You do not have permission to create recruits.',
      });
      router.push('/recruits');
    }
  }, [user, canCreateAny, showToast, router]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (formData: RecruitFormData) => {
    if (!user) {
      showToast({
        variant: 'error',
        message: 'You must be logged in to create a recruit profile.',
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const recruitDocId = deriveRecruitDocumentId(formData.edipi);
      const edipiDigits = normalizeEdipiDigits(formData.edipi);

      // Validate form data
      const validationResult = recruitCreateSchema.safeParse({
        recruitId: recruitDocId,
        edipi: edipiDigits || undefined,
        weaponsSerialNumber: formData.weaponsSerialNumber,
        rcoSerialNumber: formData.rcoSerialNumber,
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
        medicalNotes: formData.medicalNotes,
        dietaryRestrictions: formData.dietaryRestrictions,
        preferredContactMethod: formData.preferredContactMethod || undefined,
        extendedNotes: formData.extendedNotes,
        privacy: formData.fullProfileVisibleTo
          ? { fullProfileVisibleTo: formData.fullProfileVisibleTo }
          : undefined,
        createdBy: user.uid,
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
        setLoading(false);
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
          setLoading(false);
          return;
        }

        // Check if user can create recruit in this organizational assignment
        const targetOrg: OrganizationalAssignment = {
          regiment: formData.regiment as 'West' | 'East' | undefined,
          battalion: formData.battalion as OrganizationalAssignment['battalion'],
          company: formData.company as OrganizationalAssignment['company'],
          series: formData.series as OrganizationalAssignment['series'],
          platoon: formData.platoon,
        };

        const permissionCheck = canCreate(targetOrg);
        if (!permissionCheck.allowed) {
          setErrors({
            organizational: {
              platoon: permissionCheck.reason || 'You do not have permission to create recruits in this organizational assignment',
            },
          });
          setLoading(false);
          return;
        }
      }

      // Create recruit profile
      await createRecruitProfile(
        recruitDocId,
        {
          recruitId: recruitDocId,
          edipi: edipiDigits || undefined,
          weaponsSerialNumber: formData.weaponsSerialNumber,
          rcoSerialNumber: formData.rcoSerialNumber,
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
          medicalNotes: formData.medicalNotes,
          dietaryRestrictions: formData.dietaryRestrictions,
          preferredContactMethod: formData.preferredContactMethod || undefined,
          extendedNotes: formData.extendedNotes,
          privacy: formData.fullProfileVisibleTo
            ? { fullProfileVisibleTo: formData.fullProfileVisibleTo }
            : undefined,
          createdBy: user.uid,
        },
        user.uid
      );

      logInfo('Recruit profile created successfully', 'CreateRecruitPage', { recruitId: recruitDocId });

      // Show success message
      showToast({
        variant: 'success',
        message: `Recruit profile "${formData.firstName} ${formData.lastName}" created successfully.`,
      });

      // Redirect to recruit detail page
      router.push(`/recruits/${recruitDocId}`);
    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), 'Failed to create recruit profile');
      showToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to create recruit profile. Please try again.',
      });
      setLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.push('/recruits');
  };

  // Show error if user cannot create recruits
  if (user && !canCreateAny) {
    return (
      <Container>
        <ErrorState
          title="Access Denied"
          message="You do not have permission to create recruits."
          retryLabel="Go Back"
          onRetry={() => router.push('/recruits')}
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Breadcrumbs items={breadcrumbItems} />
          <RecruitQuickActions hideCreate />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Adding one recruit? Use the form below. Have a spreadsheet or roster photos?{' '}
          <button
            type="button"
            className="font-medium text-[#001e2e] dark:text-sky-300 underline"
            onClick={() => router.push('/recruits/import')}
          >
            Import roster
          </button>{' '}
          instead.
        </p>
        <RecruitForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          errors={errors}
          loading={loading}
          mode="create"
        />
      </div>
    </Container>
  );
}
