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
import { getRecruitRankOptions } from '@/lib/utils/ranks';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';
import { debugLog } from '@/lib/utils/debugLogger';
import type { RecruitStatus } from '@/lib/validation/recruitSchemas';
import type { RecruitProfile } from '@/types/models';
import { deriveRecruitDocumentId, formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';

/**
 * Recruit form data type
 */
export interface RecruitFormData {
  edipi: string;
  recruitId: string;
  firstName: string;
  lastName: string;
  rank: RecruitRank | '';
  status: RecruitStatus | '';
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon: string;
  weaponsSerialNumber?: string;
  rcoSerialNumber?: string;
  photoUrl?: string;
  medicalNotes?: string;
  dietaryRestrictions?: string;
  preferredContactMethod?: 'phone' | 'email' | '';
  extendedNotes?: string;
  /** Privacy: who can see full profile */
  fullProfileVisibleTo?: '' | 'same_platoon' | 'same_company' | 'same_battalion' | 'admins_only';
}

/**
 * Recruit form errors type
 */
export interface RecruitFormErrors {
  edipi?: string;
  recruitId?: string;
  firstName?: string;
  lastName?: string;
  rank?: string;
  status?: string;
  platoon?: string;
  weaponsSerialNumber?: string;
  rcoSerialNumber?: string;
  photoUrl?: string;
  medicalNotes?: string;
  dietaryRestrictions?: string;
  preferredContactMethod?: string;
  extendedNotes?: string;
  fullProfileVisibleTo?: string;
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
    edipi: initialData ? formatEdipiForDisplay(initialData) : '',
    recruitId: initialData?.recruitId || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    rank: initialData?.rank || (mode === 'create' ? DEFAULT_RECRUIT_RANK : ''),
    status: initialData?.status || '',
    regiment: initialData?.regiment,
    battalion: initialData?.battalion,
    company: initialData?.company,
    series: initialData?.series,
    platoon: initialData?.platoon || '',
    weaponsSerialNumber: initialData?.weaponsSerialNumber,
    rcoSerialNumber: initialData?.rcoSerialNumber,
    photoUrl: initialData?.photoUrl,
    medicalNotes: initialData?.medicalNotes,
    dietaryRestrictions: initialData?.dietaryRestrictions,
    preferredContactMethod: initialData?.preferredContactMethod || '',
    extendedNotes: initialData?.extendedNotes,
    fullProfileVisibleTo: initialData?.privacy?.fullProfileVisibleTo ?? '',
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
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'edipi' && mode === 'create') {
        next.recruitId = deriveRecruitDocumentId(value);
      }
      return next;
    });
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  // Rank options
  const rankOptions = getRecruitRankOptions();
  const storageRecruitId = formData.recruitId || deriveRecruitDocumentId(formData.edipi);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">
          {mode === 'create' ? 'Add Recruit Profile' : 'Modify Recruit Profile'}
        </h2>

        {/* Personal Information Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Personal Information
          </h3>

          {/* EDIPI */}
          <Input
            type="text"
            label="EDIPI"
            required
            value={formData.edipi}
            onChange={(e) => handleFieldChange('edipi', e.target.value)}
            placeholder="Enter 10-digit EDIPI"
            errorText={errors.edipi ?? errors.recruitId}
            helperText="Department of Defense electronic identifier for the recruit"
            disabled={disabled || loading || mode === 'edit'}
            fullWidth
            inputMode="numeric"
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

        {/* Equipment Section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
            Equipment
          </h3>
          <Input
            type="text"
            label="Weapons serial number"
            value={formData.weaponsSerialNumber || ''}
            onChange={(e) => handleFieldChange('weaponsSerialNumber', e.target.value)}
            placeholder="Enter weapons serial number"
            errorText={errors.weaponsSerialNumber}
            disabled={disabled || loading}
            fullWidth
          />
          <Input
            type="text"
            label="RCO serial number"
            value={formData.rcoSerialNumber || ''}
            onChange={(e) => handleFieldChange('rcoSerialNumber', e.target.value)}
            placeholder="Enter RCO serial number"
            errorText={errors.rcoSerialNumber}
            disabled={disabled || loading}
            fullWidth
          />
        </div>

        {/* Photo Upload Section */}
        {storageRecruitId && formData.edipi && (
          <RecruitPhotoUpload
            recruitId={storageRecruitId}
            currentPhotoUrl={formData.photoUrl}
            onUploadComplete={(photoUrl) => {
              handleFieldChange('photoUrl', photoUrl);
            }}
            onError={(error) => {
              debugLog.error('Photo upload error', 'RecruitForm', { error: error instanceof Error ? error.message : String(error) });
            }}
            disabled={disabled || loading}
          />
        )}
        
        {/* Photo URL Input (Fallback for manual entry or when recruitId not available) */}
        {!formData.edipi && (
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

      {/* Extended Information Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">
          Extended Information (Optional)
        </h3>
        <div className="space-y-4">
          <Input
            type="text"
            label="Medical notes"
            value={formData.medicalNotes || ''}
            onChange={(e) => handleFieldChange('medicalNotes', e.target.value)}
            placeholder="Medical notes"
            errorText={errors.medicalNotes}
            helperText="Sensitive – stored securely"
            disabled={disabled || loading}
            fullWidth
          />
          <Input
            type="text"
            label="Dietary restrictions"
            value={formData.dietaryRestrictions || ''}
            onChange={(e) => handleFieldChange('dietaryRestrictions', e.target.value)}
            placeholder="Dietary restrictions"
            errorText={errors.dietaryRestrictions}
            disabled={disabled || loading}
            fullWidth
          />
          <Select
            label="Preferred contact method"
            options={[
              { value: '', label: '—' },
              { value: 'phone', label: 'Phone' },
              { value: 'email', label: 'Email' },
            ]}
            value={formData.preferredContactMethod || ''}
            onChange={(e) => handleFieldChange('preferredContactMethod', e.target.value)}
            errorText={errors.preferredContactMethod}
            disabled={disabled || loading}
            fullWidth
          />
          <Input
            type="text"
            label="Notes"
            value={formData.extendedNotes || ''}
            onChange={(e) => handleFieldChange('extendedNotes', e.target.value)}
            placeholder="General notes"
            errorText={errors.extendedNotes}
            disabled={disabled || loading}
            fullWidth
          />
          <Select
            label="Who can see full profile (including extended info)"
            options={[
              { value: '', label: 'Same as view access (default)' },
              { value: 'same_platoon', label: 'Same platoon only' },
              { value: 'same_company', label: 'Same company' },
              { value: 'same_battalion', label: 'Same battalion' },
              { value: 'admins_only', label: 'Admins only' },
            ]}
            value={formData.fullProfileVisibleTo ?? ''}
            onChange={(e) => handleFieldChange('fullProfileVisibleTo', e.target.value)}
            disabled={disabled || loading}
            fullWidth
          />
        </div>
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
          {mode === 'create' ? 'Add Recruit' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
