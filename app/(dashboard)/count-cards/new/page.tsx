'use client';

/**
 * Count Card Creation Page
 * 
 * Page for creating new count cards with recruit selection, accountability status assignment,
 * and submission to Duty Senior Drill Instructor. Accessible only to Drill Instructor role.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CountCardForm, type CountCardFormData, type CountCardFormErrors } from '@/components/countCards/CountCardForm';
import { createCountCard } from '@/lib/services/firestore/countCards';
import { countCardCreateSchema } from '@/lib/validation/countCardSchemas';
import { logError, logInfo } from '@/lib/utils/logger';
import { useToast } from '@/context/ToastContext';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { ErrorState } from '@/components/feedback/ErrorState';
import { checkPermission } from '@/lib/permissions/utils';
import { Timestamp } from 'firebase/firestore';

/**
 * Breadcrumb items
 */
const breadcrumbItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Count Cards', href: '/count-cards' },
  { label: 'Create Count Card', href: '/count-cards/new' },
];

/**
 * Generate count card ID
 */
function generateCountCardId(): string {
  return `CC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export default function CreateCountCardPage(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Form state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<CountCardFormErrors>({});

  // Get user's platoon from organizational assignment
  const userPlatoon = user?.customClaims?.organizationalAssignment?.platoon ||
    user?.profile?.organizationalAssignment?.platoon;

  // Check if user can create count cards
  const canCreateCountCard = checkPermission(user, 'create_count_card');

  useEffect(() => {
    if (user && !canCreateCountCard.allowed) {
      showToast({
        type: 'error',
        message: 'You do not have permission to create count cards.',
      });
      router.push('/dashboard');
    }
  }, [user, canCreateCountCard.allowed, showToast, router]);

  /**
   * Handle form submission (submit to Duty Senior Drill Instructor)
   */
  const handleSubmit = async (formData: CountCardFormData) => {
    if (!user) {
      showToast({
        type: 'error',
        message: 'You must be logged in to create a count card.',
      });
      return;
    }

    if (!userPlatoon) {
      setErrors({
        general: 'You must be assigned to a platoon to create count cards.',
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Generate count card ID
      const countCardId = generateCountCardId();

      // Get user's organizational assignment
      const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
      if (!userOrg) {
        throw new Error('User organizational assignment not found');
      }

      // Calculate recruit counts by status
      const recruitCounts: Record<string, number> = {};
      formData.recruits.forEach((recruit) => {
        const status = recruit.status;
        recruitCounts[status] = (recruitCounts[status] || 0) + 1;
      });

      // Create workflow history entry
      const workflowHistory = [
        {
          state: 'submitted' as const,
          timestamp: Timestamp.now(),
          userId: user.uid,
          notes: 'Count card submitted to Duty Senior Drill Instructor',
        },
      ];

      // Validate form data
      const validationResult = countCardCreateSchema.safeParse({
        countCardId,
        platoon: userPlatoon,
        company: userOrg.company || '',
        battalion: userOrg.battalion || '',
        regiment: userOrg.regiment,
        status: 'pending',
        workflowState: 'submitted',
        submittedBy: user.uid,
        location: formData.location,
        timestamp: new Date(formData.timestamp),
        recruitCounts,
        workflowHistory,
      });

      if (!validationResult.success) {
        // Map validation errors to form errors
        const formErrors: CountCardFormErrors = {};
        validationResult.error.errors.forEach((error) => {
          const field = error.path[0] as string;
          if (field === 'location') {
            formErrors.location = error.message;
          } else if (field === 'timestamp') {
            formErrors.timestamp = error.message;
          } else {
            formErrors.general = error.message;
          }
        });
        setErrors(formErrors);
        setLoading(false);
        return;
      }

      // Create count card
      await createCountCard(
        countCardId,
        {
          countCardId,
          platoon: userPlatoon,
          company: userOrg.company || '',
          battalion: userOrg.battalion || '',
          regiment: userOrg.regiment,
          status: 'pending',
          workflowState: 'submitted',
          submittedBy: user.uid,
          location: formData.location,
          timestamp: new Date(formData.timestamp),
          recruitCounts,
          workflowHistory,
          createdBy: user.uid,
        },
        user.uid
      );

      logInfo('Count card created and submitted successfully', { countCardId });

      // Show success message
      showToast({
        type: 'success',
        message: 'Count card submitted successfully to Duty Senior Drill Instructor.',
      });

      // Redirect to count cards list
      router.push('/count-cards');
    } catch (error) {
      logError('Failed to create count card', error as Error);
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to create count card. Please try again.',
      });
      setLoading(false);
    }
  };

  /**
   * Handle save draft
   */
  const handleSaveDraft = async (formData: CountCardFormData) => {
    if (!user) {
      showToast({
        type: 'error',
        message: 'You must be logged in to save a count card draft.',
      });
      return;
    }

    if (!userPlatoon) {
      setErrors({
        general: 'You must be assigned to a platoon to create count cards.',
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Generate count card ID
      const countCardId = generateCountCardId();

      // Get user's organizational assignment
      const userOrg = user.customClaims?.organizationalAssignment || user.profile?.organizationalAssignment;
      if (!userOrg) {
        throw new Error('User organizational assignment not found');
      }

      // Calculate recruit counts by status
      const recruitCounts: Record<string, number> = {};
      formData.recruits.forEach((recruit) => {
        const status = recruit.status;
        recruitCounts[status] = (recruitCounts[status] || 0) + 1;
      });

      // Create workflow history entry for draft
      const workflowHistory = [
        {
          state: 'draft' as const,
          timestamp: Timestamp.now(),
          userId: user.uid,
          notes: 'Count card saved as draft',
        },
      ];

      // Validate form data for draft (less strict)
      const validationResult = countCardCreateSchema.safeParse({
        countCardId,
        platoon: userPlatoon,
        company: userOrg.company || '',
        battalion: userOrg.battalion || '',
        regiment: userOrg.regiment,
        status: 'pending',
        workflowState: 'draft',
        submittedBy: user.uid,
        location: formData.location || 'Draft',
        timestamp: formData.timestamp ? new Date(formData.timestamp) : new Date(),
        recruitCounts,
        workflowHistory,
      });

      if (!validationResult.success) {
        const formErrors: CountCardFormErrors = {};
        validationResult.error.errors.forEach((error) => {
          const field = error.path[0] as string;
          if (field === 'location') {
            formErrors.location = error.message;
          } else if (field === 'timestamp') {
            formErrors.timestamp = error.message;
          } else {
            formErrors.general = error.message;
          }
        });
        setErrors(formErrors);
        setLoading(false);
        return;
      }

      // Create count card as draft
      await createCountCard(
        countCardId,
        {
          countCardId,
          platoon: userPlatoon,
          company: userOrg.company || '',
          battalion: userOrg.battalion || '',
          regiment: userOrg.regiment,
          status: 'pending',
          workflowState: 'draft',
          submittedBy: user.uid,
          location: formData.location || 'Draft',
          timestamp: formData.timestamp ? new Date(formData.timestamp) : new Date(),
          recruitCounts,
          workflowHistory,
          createdBy: user.uid,
        },
        user.uid
      );

      logInfo('Count card saved as draft', { countCardId });

      // Show success message
      showToast({
        type: 'success',
        message: 'Count card saved as draft successfully.',
      });

      // Redirect to count cards list
      router.push('/count-cards');
    } catch (error) {
      logError('Failed to save count card draft', error as Error);
      showToast({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to save count card draft. Please try again.',
      });
      setLoading(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.push('/count-cards');
  };

  // Show error if user cannot create count cards
  if (user && !canCreateCountCard.allowed) {
    return (
      <Container>
        <ErrorState
          title="Access Denied"
          message="You do not have permission to create count cards."
          actionLabel="Go Back"
          onAction={() => router.push('/dashboard')}
        />
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div>
          <h1 className="text-2xl font-bold mb-2 text-text-heading-light dark:text-text-heading-dark">
            Create Count Card
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Select recruits and assign accountability status. Save as draft or submit to Duty Senior Drill Instructor.
          </p>
        </div>
        <CountCardForm
          userPlatoon={userPlatoon}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          onCancel={handleCancel}
          errors={errors}
          loading={loading}
        />
      </div>
    </Container>
  );
}
