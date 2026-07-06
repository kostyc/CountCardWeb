'use client';

/**
 * Rank Select Component
 * 
 * Enhanced rank selection component with visual badges and grouped options.
 * Provides better UX than standard select for rank selection.
 * 
 * @example
 * ```tsx
 * <RankSelect
 *   value={rank}
 *   onChange={handleRankChange}
 *   label="Rank"
 *   required
 * />
 * ```
 */

import React from 'react';
import { Select, type SelectOption } from '@/components/forms/Select';
import { getRankOptionsGrouped, getRankMetadata } from '@/lib/utils/ranks';
import type { USMCRank } from '@/types/auth';

/**
 * Rank select props
 */
export interface RankSelectProps {
  /**
   * Selected rank value
   */
  value: USMCRank | '';
  /**
   * Change handler
   */
  onChange: (value: USMCRank) => void;
  /**
   * Field label
   */
  label?: string;
  /**
   * Whether field is required
   * @default false
   */
  required?: boolean;
  /**
   * Error message
   */
  errorText?: string;
  /**
   * Helper text
   */
  helperText?: string;
  /**
   * Whether field is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether to show full width
   * @default true
   */
  fullWidth?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Rank Select Component
 * 
 * Uses grouped select options with enlisted and officer ranks separated.
 * The visual badges are shown in the option labels via the Select component's
 * option rendering, but for now we'll use text labels that include rank info.
 */
export function RankSelect({
  value,
  onChange,
  label = 'Rank',
  required = false,
  errorText,
  helperText,
  disabled = false,
  fullWidth = true,
  className,
}: RankSelectProps): JSX.Element {
  // Get grouped rank options
  const groupedOptions = getRankOptionsGrouped();

  // Flatten grouped options for the Select component
  // The Select component supports grouped options, but we'll use flat for now
  const flatOptions: SelectOption[] = [];
  
  groupedOptions.forEach((group) => {
    group.options.forEach((option) => {
      flatOptions.push({
        ...option,
        // Add group label as prefix for better organization
        label: `${option.label} (${group.label})`,
      });
    });
  });

  /**
   * Handle select change
   */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value as USMCRank;
    if (selectedValue) {
      onChange(selectedValue);
    }
  };

  return (
    <Select
      label={label}
      required={required}
      options={flatOptions}
      value={value}
      onChange={handleChange}
      errorText={errorText}
      helperText={helperText || 'USMC rank (E-5 through E-9 for Enlisted, O-1 through O-6 for Officers)'}
      disabled={disabled}
      fullWidth={fullWidth}
      className={className}
    />
  );
}
