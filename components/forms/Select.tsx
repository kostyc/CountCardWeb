'use client';

/**
 * Select Component
 * 
 * A comprehensive select component with single and multi-select options,
 * searchable select, custom option rendering, and accessibility features.
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Rank"
 *   options={rankOptions}
 *   value={selectedRank}
 *   onChange={setSelectedRank}
 *   placeholder="Select a rank"
 * />
 * 
 * <Select
 *   label="Platoons"
 *   options={platoonOptions}
 *   value={selectedPlatoons}
 *   onChange={setSelectedPlatoons}
 *   multiple
 *   searchable
 * />
 * ```
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { cn, getSizeClasses } from '@/lib/components/utils';
import type { ComponentSize, InputState } from '@/types/components';

/**
 * Select option type
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select component props
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /**
   * Label text for the select
   */
  label?: string;
  /**
   * Label ID (auto-generated if not provided)
   */
  labelId?: string;
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;
  /**
   * Placeholder text (shown when no option is selected)
   */
  placeholder?: string;
  /**
   * Helper text displayed below the select
   */
  helperText?: string;
  /**
   * Error message displayed below the select
   */
  errorText?: string;
  /**
   * Select state variant
   * @default 'default'
   */
  state?: InputState;
  /**
   * Select size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Select options
   */
  options: SelectOption[];
  /**
   * Selected value (for single select)
   */
  value?: string;
  /**
   * Selected values (for multi-select)
   */
  values?: string[];
  /**
   * Whether multiple selections are allowed
   * @default false
   */
  multiple?: boolean;
  /**
   * Whether the select is searchable (future enhancement)
   * @default false
   */
  searchable?: boolean;
  /**
   * Full width select
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Select ID (auto-generated if not provided)
   */
  id?: string;
  /**
   * Select name attribute
   */
  name?: string;
  /**
   * Change handler
   */
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * Select component
 * 
 * Supports single and multi-select, validation states, and accessibility features.
 * Note: Searchable select will be enhanced in a future update with a custom dropdown.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      labelId,
      required = false,
      placeholder,
      helperText,
      errorText,
      state = 'default',
      size = 'md',
      options,
      value,
      values,
      multiple = false,
      searchable = false,
      fullWidth = false,
      disabled = false,
      id,
      name,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs if not provided
    const selectId = id || `select-${React.useId()}`;
    const generatedLabelId = labelId || `label-${selectId}`;
    const errorId = `error-${selectId}`;
    const helperId = `helper-${selectId}`;

    // Determine actual state (error takes precedence)
    const actualState: InputState = errorText ? 'error' : state;

    // Size classes
    const sizeClasses = {
      sm: 'text-sm px-3 py-1.5 min-h-[32px]',
      md: 'text-base px-4 py-2 min-h-[40px]',
      lg: 'text-lg px-5 py-2.5 min-h-[48px]',
      xl: 'text-xl px-6 py-3 min-h-[56px]',
    };

    // State classes
    const stateClasses: Record<InputState, string> = {
      default: cn(
        'border-border-primary-light dark:border-border-primary-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'text-text-primary-light dark:text-text-primary-dark',
        'focus:border-border-focus-light dark:focus:border-border-focus-dark',
        'focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-1',
        'hover:border-border-focus-light dark:hover:border-border-focus-dark'
      ),
      error: cn(
        'border-error-light dark:border-error-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'text-text-primary-light dark:text-text-primary-dark',
        'focus:border-error-light dark:focus:border-error-dark',
        'focus:ring-2 focus:ring-error-light dark:focus:ring-error-dark focus:ring-offset-1',
        'hover:border-error-light dark:hover:border-error-dark'
      ),
      success: cn(
        'border-success',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'text-text-primary-light dark:text-text-primary-dark',
        'focus:border-success',
        'focus:ring-2 focus:ring-success focus:ring-offset-1',
        'hover:border-success'
      ),
      disabled: cn(
        'border-border-primary-light dark:border-border-primary-dark',
        'bg-background-secondary-light dark:bg-background-secondary-dark',
        'text-text-secondary-light dark:text-text-secondary-dark',
        'cursor-not-allowed',
        'opacity-60'
      ),
    };

    // Base select classes
    const selectClasses = cn(
      'w-full',
      'border-2',
      'rounded-lg',
      'transition-all duration-200',
      'outline-none',
      'appearance-none',
      'bg-no-repeat',
      'bg-right',
      'pr-10',
      'cursor-pointer',
      'z-10', // Ensure select is clickable
      // Size
      sizeClasses[size],
      // State
      disabled ? stateClasses.disabled : stateClasses[actualState],
      // Full width
      fullWidth && 'w-full',
      className
    );

    // Dropdown arrow icon (CSS-based)
    const arrowIconStyle = {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5568'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
      backgroundPosition: 'right 0.75rem center',
      backgroundSize: '1.5em 1.5em',
      paddingRight: '2.5rem',
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            id={generatedLabelId}
            className={cn(
              'block text-sm font-semibold mb-1.5',
              'text-text-primary-light dark:text-text-primary-dark',
              required && "after:content-['*'] after:ml-0.5 after:text-error-light dark:after:text-error-dark",
              disabled && 'text-text-secondary-light dark:text-text-secondary-dark opacity-60'
            )}
          >
            {label}
          </label>
        )}

        {/* Select element */}
        <select
          ref={ref}
          id={selectId}
          name={name}
          multiple={multiple}
          disabled={disabled}
          required={required}
          value={multiple ? undefined : value}
          onChange={onChange}
          className={selectClasses}
          style={arrowIconStyle}
          aria-label={!label ? props['aria-label'] : undefined}
          aria-labelledby={label ? generatedLabelId : undefined}
          aria-describedby={cn(
            errorText && errorId,
            helperText && !errorText && helperId
          )}
          aria-invalid={actualState === 'error'}
          aria-required={required}
          {...props}
        >
          {/* Placeholder option (for single select) */}
          {!multiple && placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}

          {/* Options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              selected={multiple ? values?.includes(option.value) : value === option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* Helper text or error message */}
        {(helperText || errorText) && (
          <div
            id={errorText ? errorId : helperId}
            className={cn(
              'mt-1.5 text-sm',
              errorText
                ? 'text-error-light dark:text-error-dark'
                : 'text-text-secondary-light dark:text-text-secondary-dark',
              disabled && 'text-text-secondary-light dark:text-text-secondary-dark opacity-60'
            )}
            role={errorText ? 'alert' : undefined}
          >
            {errorText || helperText}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
