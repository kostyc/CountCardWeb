'use client';

/**
 * Count Card Form Component
 * 
 * Comprehensive form component for creating count cards with recruit selection,
 * accountability status assignment, timestamp, and location tracking.
 * 
 * @example
 * ```tsx
 * <CountCardForm
 *   onSubmit={handleSubmit}
 *   onSaveDraft={handleSaveDraft}
 *   onCancel={handleCancel}
 *   errors={errors}
 *   loading={loading}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getRecruitsByPlatoon } from '@/lib/services/firestore/recruits';
import { getFullRankName } from '@/lib/utils/ranks';
import { RankDisplay } from '@/components/recruits/RankDisplay';
import { Spinner, EmptyState } from '@/components/feedback';
import { logError } from '@/lib/utils/logger';
import type { RecruitProfile } from '@/types/models';
import type { SelectOption } from '@/components/forms/Select';
import { cn } from '@/lib/components/utils';

/**
 * Accountability status type
 */
export type AccountabilityStatus = 'present' | 'absent' | 'excused' | 'medical' | 'other';

/**
 * Recruit accountability entry
 */
export interface RecruitAccountability {
  recruitId: string;
  recruit: RecruitProfile;
  status: AccountabilityStatus;
  notes?: string;
}

/**
 * Count card form data type
 */
export interface CountCardFormData {
  location: string;
  timestamp: string; // ISO date string
  recruits: RecruitAccountability[];
  notes?: string;
}

/**
 * Count card form errors type
 */
export interface CountCardFormErrors {
  location?: string;
  timestamp?: string;
  recruits?: string;
  general?: string;
}

/**
 * Count card form props
 */
export interface CountCardFormProps {
  /**
   * User's platoon (auto-filtered)
   */
  userPlatoon?: string;
  /**
   * Submit handler (submits to Duty Senior Drill Instructor)
   */
  onSubmit: (data: CountCardFormData) => void | Promise<void>;
  /**
   * Save draft handler
   */
  onSaveDraft: (data: CountCardFormData) => void | Promise<void>;
  /**
   * Cancel handler
   */
  onCancel?: () => void;
  /**
   * Form validation errors
   */
  errors?: CountCardFormErrors;
  /**
   * Whether form is in loading state
   * @default false
   */
  loading?: boolean;
  /**
   * Whether form is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * Accountability status options
 */
const ACCOUNTABILITY_STATUS_OPTIONS: SelectOption[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'excused', label: 'Excused' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

/**
 * Count Card Form Component
 */
export function CountCardForm({
  userPlatoon,
  onSubmit,
  onSaveDraft,
  onCancel,
  errors = {},
  loading = false,
  disabled = false,
}: CountCardFormProps): JSX.Element {
  // Form state
  const [formData, setFormData] = useState<CountCardFormData>({
    location: '',
    timestamp: new Date().toISOString().slice(0, 16), // datetime-local format
    recruits: [],
    notes: '',
  });

  // Recruit selection state
  const [availableRecruits, setAvailableRecruits] = useState<RecruitProfile[]>([]);
  const [selectedRecruitIds, setSelectedRecruitIds] = useState<Set<string>>(new Set());
  const [loadingRecruits, setLoadingRecruits] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load recruits for the user's platoon
  useEffect(() => {
    if (!userPlatoon) {
      return;
    }

    const loadRecruits = async () => {
      setLoadingRecruits(true);
      try {
        const result = await getRecruitsByPlatoon(userPlatoon, {
          pageSize: 1000, // Get all recruits in platoon
        });
        setAvailableRecruits(result.items);
      } catch (error) {
        logError(error instanceof Error ? error : new Error(String(error)), 'CountCardForm.loadRecruits');
      } finally {
        setLoadingRecruits(false);
      }
    };

    loadRecruits();
  }, [userPlatoon]);

  // Filter recruits by search term
  const filteredRecruits = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return availableRecruits;
    }
    const term = searchTerm.toLowerCase();
    return availableRecruits.filter(
      (recruit) =>
        recruit.firstName.toLowerCase().includes(term) ||
        recruit.lastName.toLowerCase().includes(term) ||
        recruit.recruitId.toLowerCase().includes(term)
    );
  }, [availableRecruits, searchTerm]);

  // Get selected recruits with accountability status
  const selectedRecruits = React.useMemo(() => {
    return formData.recruits.filter((r) => selectedRecruitIds.has(r.recruitId));
  }, [formData.recruits, selectedRecruitIds]);

  /**
   * Handle recruit selection toggle
   */
  const handleRecruitToggle = (recruitId: string) => {
    const newSelected = new Set(selectedRecruitIds);
    if (newSelected.has(recruitId)) {
      newSelected.delete(recruitId);
      // Remove from form data
      setFormData((prev) => ({
        ...prev,
        recruits: prev.recruits.filter((r) => r.recruitId !== recruitId),
      }));
    } else {
      newSelected.add(recruitId);
      // Add to form data with default status
      const recruit = availableRecruits.find((r) => r.recruitId === recruitId);
      if (recruit) {
        setFormData((prev) => ({
          ...prev,
          recruits: [
            ...prev.recruits,
            {
              recruitId,
              recruit,
              status: 'present',
            },
          ],
        }));
      }
    }
    setSelectedRecruitIds(newSelected);
  };

  /**
   * Handle bulk recruit selection
   */
  const handleBulkSelect = () => {
    if (selectedRecruitIds.size === filteredRecruits.length) {
      // Deselect all
      setSelectedRecruitIds(new Set());
      setFormData((prev) => ({
        ...prev,
        recruits: [],
      }));
    } else {
      // Select all filtered
      const newSelected = new Set(filteredRecruits.map((r) => r.recruitId));
      setSelectedRecruitIds(newSelected);
      setFormData((prev) => {
        const existingIds = new Set(prev.recruits.map((r) => r.recruitId));
        const newRecruits = filteredRecruits
          .filter((r) => !existingIds.has(r.recruitId))
          .map((recruit) => ({
            recruitId: recruit.recruitId,
            recruit,
            status: 'present' as AccountabilityStatus,
          }));
        return {
          ...prev,
          recruits: [...prev.recruits, ...newRecruits],
        };
      });
    }
  };

  /**
   * Handle accountability status change
   */
  const handleStatusChange = (recruitId: string, status: AccountabilityStatus) => {
    setFormData((prev) => ({
      ...prev,
      recruits: prev.recruits.map((r) =>
        r.recruitId === recruitId ? { ...r, status, notes: status === 'other' ? r.notes : undefined } : r
      ),
    }));
  };

  /**
   * Handle notes change for recruit
   */
  const handleNotesChange = (recruitId: string, notes: string) => {
    setFormData((prev) => ({
      ...prev,
      recruits: prev.recruits.map((r) => (r.recruitId === recruitId ? { ...r, notes } : r)),
    }));
  };

  /**
   * Handle bulk status assignment
   */
  const handleBulkStatusChange = (status: AccountabilityStatus) => {
    setFormData((prev) => ({
      ...prev,
      recruits: prev.recruits.map((r) => ({
        ...r,
        status,
        notes: status === 'other' ? r.notes : undefined,
      })),
    }));
  };

  /**
   * Handle form field change
   */
  const handleFieldChange = (field: keyof CountCardFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Validate form
   */
  const validateForm = (): boolean => {
    if (!formData.location.trim()) {
      return false;
    }
    if (!formData.timestamp) {
      return false;
    }
    if (formData.recruits.length === 0) {
      return false;
    }
    // All recruits must have a status
    if (formData.recruits.some((r) => !r.status)) {
      return false;
    }
    // Recruits with "other" status must have notes
    if (formData.recruits.some((r) => r.status === 'other' && !r.notes?.trim())) {
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    await onSubmit(formData);
  };

  /**
   * Handle save draft
   */
  const handleSaveDraftClick = async () => {
    await onSaveDraft(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-text-heading-light dark:text-text-heading-dark">
          Count Card Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="text"
            label="Location"
            placeholder="Enter location"
            value={formData.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            required
            errorText={errors.location}
            disabled={disabled || loading}
            fullWidth
          />
          <Input
            type="datetime-local"
            label="Date & Time"
            value={formData.timestamp}
            onChange={(e) => handleFieldChange('timestamp', e.target.value)}
            required
            errorText={errors.timestamp}
            disabled={disabled || loading}
            fullWidth
          />
        </div>
        <div className="mt-4">
          <Textarea
            label="Additional Notes (Optional)"
            placeholder="Enter any additional notes..."
            value={formData.notes || ''}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            disabled={disabled || loading}
            fullWidth
            rows={4}
          />
        </div>
      </Card>

      {/* Recruit Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
            Recruit Selection
          </h2>
          {filteredRecruits.length > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleBulkSelect}
              disabled={disabled || loading || loadingRecruits}
            >
              {selectedRecruitIds.size === filteredRecruits.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        {!userPlatoon ? (
          <EmptyState
            title="No Platoon Assigned"
            description="You must be assigned to a platoon to create count cards."
          />
        ) : loadingRecruits ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="mb-4">
              <Input
                type="search"
                placeholder="Search recruits by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={disabled || loading}
                fullWidth
              />
            </div>

            {/* Recruit List */}
            {filteredRecruits.length === 0 ? (
              <EmptyState
                title="No Recruits Found"
                description={searchTerm ? 'No recruits match your search.' : 'No recruits found in your platoon.'}
              />
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto border border-border-primary-light dark:border-border-primary-dark rounded-lg p-4">
                {filteredRecruits.map((recruit) => {
                  const isSelected = selectedRecruitIds.has(recruit.recruitId);
                  return (
                    <div
                      key={recruit.recruitId}
                      className={cn(
                        'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                          : 'bg-background-card-light dark:bg-background-card-dark border-border-primary-light dark:border-border-primary-dark hover:bg-background-hover-light dark:hover:bg-background-hover-dark'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleRecruitToggle(recruit.recruitId)}
                        disabled={disabled || loading}
                        className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <RankDisplay rank={recruit.rank} size="sm" />
                      <span className="flex-1 text-text-primary-light dark:text-text-primary-dark">
                        {recruit.firstName} {recruit.lastName}
                      </span>
                      <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {recruit.recruitId}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedRecruitIds.size > 0 && (
              <div className="mt-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {selectedRecruitIds.size} recruit{selectedRecruitIds.size !== 1 ? 's' : ''} selected
              </div>
            )}
          </>
        )}
      </Card>

      {/* Accountability Status Assignment */}
      {selectedRecruits.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
              Accountability Status
            </h2>
            <div className="flex gap-2">
              <Select
                label="Bulk Assign Status"
                options={ACCOUNTABILITY_STATUS_OPTIONS}
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as AccountabilityStatus);
                  }
                }}
                placeholder="Bulk assign..."
                disabled={disabled || loading}
                size="sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            {formData.recruits
              .filter((r) => selectedRecruitIds.has(r.recruitId))
              .map((recruitAccountability) => {
                const recruit = recruitAccountability.recruit;
                return (
                  <div
                    key={recruitAccountability.recruitId}
                    className="p-4 border border-border-primary-light dark:border-border-primary-dark rounded-lg bg-background-card-light dark:bg-background-card-dark"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <RankDisplay rank={recruit.rank} size="sm" />
                      <span className="flex-1 font-medium text-text-primary-light dark:text-text-primary-dark">
                        {recruit.firstName} {recruit.lastName}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Status"
                        options={ACCOUNTABILITY_STATUS_OPTIONS}
                        value={recruitAccountability.status}
                        onChange={(e) =>
                          handleStatusChange(recruitAccountability.recruitId, e.target.value as AccountabilityStatus)
                        }
                        required
                        disabled={disabled || loading}
                        fullWidth
                      />
                      {recruitAccountability.status === 'other' && (
                        <Input
                          type="text"
                          label="Notes (Required for Other)"
                          placeholder="Explain other status..."
                          value={recruitAccountability.notes || ''}
                          onChange={(e) => handleNotesChange(recruitAccountability.recruitId, e.target.value)}
                          required
                          disabled={disabled || loading}
                          fullWidth
                        />
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <p className="text-sm text-error-600 dark:text-error-400">{errors.general}</p>
        </div>
      )}

      {/* Form Validation Errors */}
      {errors.recruits && (
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
          <p className="text-sm text-error-600 dark:text-error-400">{errors.recruits}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={disabled || loading}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={handleSaveDraftClick}
          disabled={disabled || loading || formData.recruits.length === 0}
        >
          Save Draft
        </Button>
        <Button type="submit" variant="primary" disabled={disabled || loading || !validateForm()}>
          {loading ? 'Submitting...' : 'Submit to Duty Senior Drill Instructor'}
        </Button>
      </div>
    </form>
  );
}
