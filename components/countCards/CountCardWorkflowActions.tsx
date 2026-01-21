'use client';

/**
 * Count Card Workflow Actions Component
 * 
 * Displays workflow action buttons (Approve, Reject, Consolidate, Final Approve)
 * based on count card state and user permissions.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { checkPermission } from '@/lib/permissions/utils';
import { logError, logInfo } from '@/lib/utils/logger';
import { Textarea } from '@/components/forms/Textarea';
import { Input } from '@/components/forms/Input';
import type { CountCard } from '@/types/models';
import type { WorkflowState } from '@/lib/validation/countCardSchemas';

/**
 * Count card workflow actions component props
 */
export interface CountCardWorkflowActionsProps {
  /**
   * Count card data
   */
  countCard: CountCard;
  /**
   * Callback when workflow action succeeds
   */
  onSuccess?: () => void;
}

/**
 * Count Card Workflow Actions Component
 */
export function CountCardWorkflowActions({
  countCard,
  onSuccess,
}: CountCardWorkflowActionsProps): JSX.Element | null {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'consolidate' | 'final-approve' | null>(null);
  const [notes, setNotes] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [loading, setLoading] = useState(false);

  // Check permissions
  const canApprove = checkPermission(user, 'approve_count_card');
  const canReject = checkPermission(user, 'reject_count_card');
  const canConsolidate = checkPermission(user, 'consolidate_count_cards');

  // Determine which actions are available based on workflow state
  const canShowApprove = canApprove.allowed && (countCard.workflowState === 'submitted' || countCard.workflowState === 'under_review');
  const canShowReject = canReject.allowed && (countCard.workflowState === 'submitted' || countCard.workflowState === 'under_review');
  const canShowConsolidate = canConsolidate.allowed && countCard.workflowState === 'approved';
  const canShowFinalApprove = canConsolidate.allowed && countCard.workflowState === 'consolidated';

  // If no actions available, don't render
  if (!canShowApprove && !canShowReject && !canShowConsolidate && !canShowFinalApprove) {
    return null;
  }

  /**
   * Handle workflow action
   */
  const handleAction = async (action: 'approve' | 'reject' | 'consolidate' | 'final-approve') => {
    if (!user) {
      showToast({
        variant: 'error',
        message: 'You must be logged in to perform this action.',
      });
      return;
    }

    // Validate required fields
    if (action === 'reject' && !notes.trim()) {
      showToast({
        variant: 'error',
        message: 'Rejection notes are required.',
      });
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      const endpoint = `/api/count-cards/${countCard.countCardId}/${action}`;
      const body: any = { notes: notes.trim() || undefined };
      
      if (action === 'approve' || action === 'consolidate') {
        // For approve/consolidate, submittedTo is optional (comma-separated user IDs)
        if (submittedTo.trim()) {
          body.submittedTo = submittedTo.split(',').map((id) => id.trim()).filter(Boolean);
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Action failed: ${response.statusText}`);
      }

      logInfo(`Count card ${action} action completed`, 'CountCardWorkflowActions', { countCardId: countCard.countCardId });

      showToast({
        variant: 'success',
        message: `Count card ${action === 'reject' ? 'rejected' : action === 'approve' ? 'approved' : action === 'consolidate' ? 'consolidated' : 'final approved'} successfully.`,
      });

      // Reset form
      setActionType(null);
      setNotes('');
      setSubmittedTo('');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      logError(error as Error, 'CountCardWorkflowActions.handleAction');
      showToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to perform action. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
        Workflow Actions
      </h2>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        {canShowApprove && (
          <Button
            variant="primary"
            onClick={() => setActionType('approve')}
            disabled={loading || actionType !== null}
          >
            Approve & Forward
          </Button>
        )}
        {canShowReject && (
          <Button
            variant="secondary"
            onClick={() => setActionType('reject')}
            disabled={loading || actionType !== null}
          >
            Reject
          </Button>
        )}
        {canShowConsolidate && (
          <Button
            variant="primary"
            onClick={() => setActionType('consolidate')}
            disabled={loading || actionType !== null}
          >
            Consolidate & Forward
          </Button>
        )}
        {canShowFinalApprove && (
          <Button
            variant="primary"
            onClick={() => setActionType('final-approve')}
            disabled={loading || actionType !== null}
          >
            Final Approve
          </Button>
        )}
      </div>

      {/* Action Form */}
      {actionType && (
        <div className="mt-4 p-4 border border-border-primary-light dark:border-border-primary-dark rounded-lg bg-background-card-light dark:bg-background-card-dark">
          <h3 className="text-lg font-semibold mb-3 text-text-heading-light dark:text-text-heading-dark">
            {actionType === 'approve' && 'Approve Count Card'}
            {actionType === 'reject' && 'Reject Count Card'}
            {actionType === 'consolidate' && 'Consolidate Count Card'}
            {actionType === 'final-approve' && 'Final Approve Count Card'}
          </h3>

          {(actionType === 'approve' || actionType === 'consolidate') && (
            <div className="mb-4">
              <Input
                type="text"
                label="Forward To (Optional - comma-separated user IDs)"
                placeholder="user-id-1, user-id-2"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
                disabled={loading}
                fullWidth
              />
            </div>
          )}

          <div className="mb-4">
            <Textarea
              label={actionType === 'reject' ? 'Rejection Notes (Required)' : 'Notes (Optional)'}
              placeholder={actionType === 'reject' ? 'Enter reason for rejection...' : 'Enter notes...'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required={actionType === 'reject'}
              disabled={loading}
              fullWidth
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => handleAction(actionType)}
              disabled={loading || (actionType === 'reject' && !notes.trim())}
            >
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setActionType(null);
                setNotes('');
                setSubmittedTo('');
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
