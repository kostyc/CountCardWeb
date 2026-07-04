'use client';

/**
 * Organizational Assignment Component
 * 
 * Provides a hierarchical interface for assigning recruits to organizational units:
 * Regiment → Battalion → Company → Series → Platoon
 * 
 * Features:
 * - Dynamic company filtering based on selected battalion
 * - Platoon format validation (4-digit string)
 * - Organizational hierarchy validation
 * - Clear error messages
 * 
 * @example
 * ```tsx
 * <OrganizationalAssignment
 *   value={assignment}
 *   onChange={setAssignment}
 *   errors={errors}
 * />
 * ```
 */

import React, { useMemo } from 'react';
import { Select } from '@/components/forms/Select';
import type { SelectOption } from '@/components/forms/Select';
import { getCompaniesByBattalion, getBattalionsByRegiment } from '@/lib/services/firestore/organizations';
import { validateCompanyBattalion, isValidPlatoonFormat } from '@/lib/constants/organizations';
import type { Regiment } from '@/types/auth';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';

/**
 * Organizational assignment value type
 */
export interface OrganizationalAssignmentValue {
  regiment?: Regiment;
  battalion?: Battalion | string;
  company?: Company | string;
  series?: Series | string;
  platoon?: string;
}

/**
 * Organizational assignment errors type
 */
export interface OrganizationalAssignmentErrors {
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon?: string;
}

/**
 * Organizational assignment component props
 */
export interface OrganizationalAssignmentProps {
  /**
   * Current organizational assignment value
   */
  value: OrganizationalAssignmentValue;
  /**
   * Change handler
   */
  onChange: (value: OrganizationalAssignmentValue) => void;
  /**
   * Validation errors
   */
  errors?: OrganizationalAssignmentErrors;
  /**
   * Whether all fields are required
   * @default false
   */
  required?: boolean;
  /**
   * Whether the component is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Show helper text
   * @default true
   */
  showHelperText?: boolean;
}

/**
 * Organizational Assignment Component
 */
export function OrganizationalAssignment({
  value,
  onChange,
  errors = {},
  required = false,
  disabled = false,
  showHelperText = true,
}: OrganizationalAssignmentProps): JSX.Element {
  // Regiment options
  const regimentOptions: SelectOption[] = useMemo(
    () => [
      { value: 'West', label: 'West' },
      { value: 'East', label: 'East' },
    ],
    []
  );

  // Battalion options (all battalions available for both regiments)
  const battalionOptions: SelectOption[] = useMemo(
    () => [
      { value: '1st', label: '1st Battalion' },
      { value: '2nd', label: '2nd Battalion' },
      { value: '3rd', label: '3rd Battalion' },
      { value: 'Support', label: 'Support Battalion' },
    ],
    []
  );

  // Company options (filtered by selected battalion)
  const companyOptions: SelectOption[] = useMemo(() => {
    if (!value.battalion) {
      return [];
    }
    const battalion = value.battalion as Battalion;
    const companies = getCompaniesByBattalion(battalion);
    return companies.map((company) => ({
      value: company,
      label: company,
    }));
  }, [value.battalion]);

  // Series options
  const seriesOptions: SelectOption[] = useMemo(
    () => [
      { value: 'Lead', label: 'Lead Series' },
      { value: 'Follow', label: 'Follow Series' },
    ],
    []
  );

  /**
   * Handle regiment change
   */
  const handleRegimentChange = (regiment: string) => {
    onChange({
      ...value,
      regiment: regiment as Regiment,
      // Reset dependent fields when regiment changes
      battalion: undefined,
      company: undefined,
      series: undefined,
      platoon: undefined,
    });
  };

  /**
   * Handle battalion change
   */
  const handleBattalionChange = (battalion: string) => {
    onChange({
      ...value,
      battalion: battalion as Battalion,
      // Reset dependent fields when battalion changes
      company: undefined,
      series: undefined,
      platoon: undefined,
    });
  };

  /**
   * Handle company change
   */
  const handleCompanyChange = (company: string) => {
    onChange({
      ...value,
      company: company as Company,
      // Reset dependent fields when company changes
      series: undefined,
      platoon: undefined,
    });
  };

  /**
   * Handle series change
   */
  const handleSeriesChange = (series: string) => {
    onChange({
      ...value,
      series: series as Series,
      // Reset platoon when series changes
      platoon: undefined,
    });
  };

  /**
   * Handle platoon change
   */
  const handlePlatoonChange = (platoon: string) => {
    // Validate platoon format (4-digit string)
    const platoonValue = platoon.trim();
    if (platoonValue === '' || isValidPlatoonFormat(platoonValue)) {
      onChange({
        ...value,
        platoon: platoonValue || undefined,
      });
    }
  };

  /**
   * Validate organizational hierarchy
   * Checks that company belongs to selected battalion
   */
  const hierarchyError = useMemo(() => {
    if (value.battalion && value.company) {
      const battalion = value.battalion as Battalion;
      const company = value.company as Company;
      if (!validateCompanyBattalion(company, battalion)) {
        return `Company ${company} does not belong to ${battalion} Battalion`;
      }
    }
    return undefined;
  }, [value.battalion, value.company]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
        Organizational Assignment
      </h3>

      {/* Regiment Selection */}
      <Select
        label="Regiment"
        required={required}
        options={regimentOptions}
        value={value.regiment || ''}
        onChange={(e) => handleRegimentChange(e.target.value)}
        placeholder="Select Regiment"
        errorText={errors.regiment}
        helperText={showHelperText ? 'Recruit Training Regiment (West or East)' : undefined}
        disabled={disabled}
        fullWidth
      />

      {/* Battalion Selection */}
      <Select
        label="Battalion"
        required={required}
        options={battalionOptions}
        value={value.battalion || ''}
        onChange={(e) => handleBattalionChange(e.target.value)}
        placeholder="Select Battalion"
        errorText={errors.battalion}
        helperText={showHelperText ? 'Battalion assignment (1st, 2nd, 3rd, or Support)' : undefined}
        disabled={disabled || !value.regiment}
        fullWidth
      />

      {/* Company Selection */}
      <Select
        label="Company"
        required={required}
        options={companyOptions}
        value={value.company || ''}
        onChange={(e) => handleCompanyChange(e.target.value)}
        placeholder="Select Company"
        errorText={errors.company || hierarchyError}
        helperText={
          showHelperText
            ? value.battalion
              ? `Companies in ${value.battalion} Battalion`
              : 'Select a battalion first'
            : undefined
        }
        disabled={disabled || !value.battalion}
        fullWidth
      />

      {/* Series Selection */}
      <Select
        label="Series"
        required={false}
        options={seriesOptions}
        value={value.series || ''}
        onChange={(e) => handleSeriesChange(e.target.value)}
        placeholder="Select Series (Optional)"
        errorText={errors.series}
        helperText={showHelperText ? 'Series assignment (Lead or Follow Series)' : undefined}
        disabled={disabled || !value.company}
        fullWidth
      />

      {/* Platoon Input */}
      <div>
        <label
          htmlFor="platoon-input"
          className={`
            block text-sm font-semibold mb-1.5
            text-text-primary-light dark:text-text-primary-dark
            ${required && "after:content-['*'] after:ml-0.5 after:text-error-light dark:after:text-error-dark"}
            ${disabled && 'text-text-secondary-light dark:text-text-secondary-dark opacity-60'}
          `}
        >
          Platoon
        </label>
        <input
          id="platoon-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          value={value.platoon || ''}
          onChange={(e) => handlePlatoonChange(e.target.value)}
          placeholder="0000"
          disabled={disabled || !value.company}
          required={required}
          className={`
            w-full
            border-2 rounded-lg
            px-4 py-2 min-h-[44px]
            text-base
            transition-all duration-200
            outline-none
            ${
              errors.platoon
                ? 'border-error-light dark:border-error-dark focus:ring-2 focus:ring-error-light dark:focus:ring-error-dark focus:ring-offset-1'
                : 'border-border-primary-light dark:border-border-primary-dark focus:border-border-focus-light dark:focus:border-border-focus-dark focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-1'
            }
            ${
              disabled
                ? 'bg-background-secondary-light dark:bg-background-secondary-dark text-text-secondary-light dark:text-text-secondary-dark cursor-not-allowed opacity-60'
                : 'bg-background-primary-light dark:bg-background-primary-dark text-text-primary-light dark:text-text-primary-dark'
            }
          `}
          aria-label="Platoon (4-digit format)"
          aria-describedby={errors.platoon ? 'platoon-error' : showHelperText ? 'platoon-helper' : undefined}
          aria-invalid={!!errors.platoon}
          aria-required={required}
        />
        {showHelperText && (
          <p
            id="platoon-helper"
            className={`
              mt-1.5 text-sm
              text-text-secondary-light dark:text-text-secondary-dark
              ${disabled && 'opacity-60'}
            `}
          >
            Platoon must be a 4-digit string (e.g., 2001)
          </p>
        )}
        {errors.platoon && (
          <p
            id="platoon-error"
            className="mt-1.5 text-sm text-error-light dark:text-error-dark"
            role="alert"
          >
            {errors.platoon}
          </p>
        )}
      </div>
    </div>
  );
}
