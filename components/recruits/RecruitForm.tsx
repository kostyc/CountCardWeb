'use client';

/**
 * Recruit Form Component
 * 
 * Comprehensive form component for creating and editing recruit profiles.
 * Includes all required and optional fields, validation, and organizational assignment.
 * 
 * @example
 * ```tsx
 * <RecruitForm
 *   initialData={recruit}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   errors={errors}
 *   loading={loading}
 * />
 * ```
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OrganizationalAssignment, type OrganizationalAssignmentValue } from './OrganizationalAssignment';
import { RecruitPhotoUpload } from './RecruitPhotoUpload';
import { getRankOptions } from '@/lib/utils/ranks';
import type { USMCRank } from '@/types/auth';
import type { RecruitStatus } from '@/lib/validation/recruitSchemas';
import type { RecruitProfile } from '@/types/models';

/**
 * Recruit form data type
 */
export interface RecruitFormData {
  recruitId: string;
  firstName: string;
  lastName: string;
  rank: USMCRank | '';
  status: RecruitStatus | '';
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon: string;
  photoUrl?: string;
}

/**
 * Recruit form errors type
 */
export interface RecruitFormErrors {
  recruitId?: string;
  firstName?: string;
  lastName?: string;
  rank?: string;
  status?: string;
  platoon?: string;
  photoUrl?: string;
  organizational?: {
    regiment?: string;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
  };
}

/**
 * Recruit form props
 */
export interface RecruitFormProps {
  /**
   * Initial form data (for edit mode)
   */
  initialData?: Partial<RecruitProfile>;
  /**
   * Submit handler
   */
  onSubmit: (data: RecruitFormData) => void | Promise<void>;
  /**
   * Cancel handler
   */
  onCancel?: () => void;
  /**
   * Form validation errors
   */
  errors?: RecruitFormErrors;
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
  /**
   * Form mode (create or edit)
   * @default 'create'
   */
  mode?: 'create' | 'edit';
}

/**
 * Recruit status options
 */
const RECRUIT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'separated', label: 'Separated' },
  { value: 'medical_hold', label: 'Medical Hold' },
  { value: 'other', label: 'Other' },
];

/**
 * Recruit Form Component
 */
export function RecruitForm({
  initialData,
  onSubmit,
  onCancel,
  errors = {},
  loading = false,
  disabled = false,
  mode = 'create',
}: RecruitFormProps): JSX.Element {
  // Form state
  const [formData, setFormData] = useState<RecruitFormData>({
    recruitId: initialData?.recruitId || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    rank: initialData?.rank || '',
    status: initialData?.status || '',
    regiment: initialData?.regiment,
    battalion: initialData?.battalion,
    company: initialData?.company,
    series: initialData?.series,
    platoon: initialData?.platoon || '',
    photoUrl: initialData?.photoUrl,
  });

  // Organizational assignment state
  const [organizationalAssignment, setOrganizationalAssignment] = useState<OrganizationalAssignmentValue>({
    regiment: initialData?.regiment,
    battalion: initialData?.battalion,
    company: initialData?.company,
    series: initialData?.series,
    platoon: initialData?.platoon,
  });

  // Update form data when organizational assignment changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      regiment: organizationalAssignment.regiment,
      battalion: organizationalAssignment.battalion,
      company: organizationalAssignment.company,
      series: organizationalAssignment.series,
      platoon: organizationalAssignment.platoon || '',
    }));
  }, [organizationalAssignment]);

  /**
   * Handle form field change
   */
  const handleFieldChange = (field: keyof RecruitFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Rank options
  const rankOptions = getRankOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
          {mode === 'create' ? 'Create Recruit Profile' : 'Edit Recruit Profile'}
        </h2>

        {/* Personal Information Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Personal Information
          </h3>

          {/* Recruit ID */}
          <Input
            type="text"
            label="Recruit ID"
            required
            value={formData.recruitId}
            onChange={(e) => handleFieldChange('recruitId', e.target.value)}
            placeholder="Enter recruit ID"
            errorText={errors.recruitId}
            helperText="Unique identifier for the recruit"
            disabled={disabled || loading || mode === 'edit'}
            fullWidth
          />

          {/* First Name */}
          <Input
            type="text"
            label="First Name"
            required
            value={formData.firstName}
            onChange={(e) => handleFieldChange('firstName', e.target.value)}
            placeholder="Enter first name"
            errorText={errors.firstName}
            helperText="Recruit's first name"
            disabled={disabled || loading}
            fullWidth
          />

          {/* Last Name */}
          <Input
            type="text"
            label="Last Name"
            required
            value={formData.lastName}
            onChange={(e) => handleFieldChange('lastName', e.target.value)}
            placeholder="Enter last name"
            errorText={errors.lastName}
            helperText="Recruit's last name"
            disabled={disabled || loading}
            fullWidth
          />

          {/* Rank */}
          <Select
            label="Rank"
            required
            options={rankOptions}
            value={formData.rank}
            onChange={(e) => handleFieldChange('rank', e.target.value)}
            placeholder="Select rank"
            errorText={errors.rank}
            helperText="USMC rank (E-5 through E-9 for Enlisted, O-1 through O-6 for Officers)"
            disabled={disabled || loading}
            fullWidth
          />

          {/* Status */}
          <Select
            label="Status"
            required
            options={RECRUIT_STATUS_OPTIONS}
            value={formData.status}
            onChange={(e) => handleFieldChange('status', e.target.value)}
            placeholder="Select status"
            errorText={errors.status}
            helperText="Current recruit status"
            disabled={disabled || loading}
            fullWidth
          />
        </div>

        {/* Organizational Assignment Section */}
        <div className="mb-6">
          <OrganizationalAssignment
            value={organizationalAssignment}
            onChange={setOrganizationalAssignment}
            errors={errors.organizational}
            required
            disabled={disabled || loading}
            showHelperText
          />
        </div>

        {/* Photo Upload Section */}
        {formData.recruitId && (
          <RecruitPhotoUpload
            recruitId={formData.recruitId}
            currentPhotoUrl={formData.photoUrl}
            onUploadComplete={(photoUrl) => {
              handleFieldChange('photoUrl', photoUrl);
            }}
            onError={(error) => {
              // Errors are managed by parent component
              console.error('Photo upload error:', error);
            }}
            disabled={disabled || loading}
          />
        )}
        
        {/* Photo URL Input (Fallback for manual entry or when recruitId not available) */}
        {!formData.recruitId && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
              Profile Photo (Optional)
            </h3>

            <Input
              type="url"
              label="Photo URL"
              value={formData.photoUrl || ''}
              onChange={(e) => handleFieldChange('photoUrl', e.target.value)}
              placeholder="https://example.com/photo.jpg"
              errorText={errors.photoUrl}
              helperText="Enter photo URL manually or upload after creating the recruit"
              disabled={disabled || loading}
              fullWidth
            />
          </div>
        )}
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={disabled || loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || loading}
          loading={loading}
        >
          {mode === 'create' ? 'Create Recruit' : 'Update Recruit'}
        </Button>
      </div>
    </form>
  );
}
