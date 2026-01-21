'use client';

/**
 * Checkbox Component
 * 
 * A comprehensive checkbox component with checked, unchecked, and indeterminate states,
 * label support, error states, and accessibility features.
 * 
 * @example
 * ```tsx
 * <Checkbox
 *   label="Accept terms and conditions"
 *   checked={isChecked}
 *   onChange={setIsChecked}
 * />
 * 
 * <Checkbox
 *   label="Subscribe to newsletter"
 *   indeterminate={true}
 *   errorText="This field is required"
 *   state="error"
 * />
 * ```
 */

import React, { forwardRef } from 'react';
import { cn, getSizeClasses } from '@/lib/components/utils';
import type { ComponentSize, InputState } from '@/types/components';

/**
 * Checkbox component props
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /**
   * Label text for the checkbox
   */
  label?: string;
  /**
   * Label ID (auto-generated if not provided)
   */
  labelId?: string;
  /**
   * Whether the checkbox is checked
   */
  checked?: boolean;
  /**
   * Whether the checkbox is in indeterminate state
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;
  /**
   * Helper text displayed below the checkbox
   */
  helperText?: string;
  /**
   * Error message displayed below the checkbox
   */
  errorText?: string;
  /**
   * Checkbox state variant
   * @default 'default'
   */
  state?: InputState;
  /**
   * Checkbox size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Checkbox ID (auto-generated if not provided)
   */
  id?: string;
  /**
   * Checkbox name attribute
   */
  name?: string;
  /**
   * Change handler
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Checkbox component
 * 
 * Supports checked, unchecked, indeterminate states, validation, and accessibility features.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      labelId,
      checked = false,
      indeterminate = false,
      required = false,
      helperText,
      errorText,
      state = 'default',
      size = 'md',
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
    const checkboxId = id || `checkbox-${React.useId()}`;
    const generatedLabelId = labelId || `label-${checkboxId}`;
    const errorId = `error-${checkboxId}`;
    const helperId = `helper-${checkboxId}`;

    // Determine actual state (error takes precedence)
    const actualState: InputState = errorText ? 'error' : state;

    // Size classes for checkbox
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7',
    };

    // Size classes for label text
    const labelSizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    };

    // State classes
    const stateClasses: Record<InputState, string> = {
      default: cn(
        'border-border-primary-light dark:border-border-primary-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'checked:bg-button-primary-bg-light dark:checked:bg-button-primary-bg-dark',
        'checked:border-button-primary-bg-light dark:checked:border-button-primary-bg-dark',
        'focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-1',
        'hover:border-border-focus-light dark:hover:border-border-focus-dark',
        'transition-all duration-200'
      ),
      error: cn(
        'border-error-light dark:border-error-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'checked:bg-button-primary-bg-light dark:checked:bg-button-primary-bg-dark',
        'checked:border-button-primary-bg-light dark:checked:border-button-primary-bg-dark',
        'focus:ring-2 focus:ring-error-light dark:focus:ring-error-dark focus:ring-offset-1',
        'hover:border-error-light dark:hover:border-error-dark',
        'transition-all duration-200'
      ),
      success: cn(
        'border-success',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'checked:bg-button-primary-bg-light dark:checked:bg-button-primary-bg-dark',
        'checked:border-button-primary-bg-light dark:checked:border-button-primary-bg-dark',
        'focus:ring-2 focus:ring-success focus:ring-offset-1',
        'hover:border-success',
        'transition-all duration-200'
      ),
      disabled: cn(
        'border-border-primary-light dark:border-border-primary-dark',
        'bg-background-secondary-light dark:bg-background-secondary-dark',
        'opacity-60',
        'cursor-not-allowed'
      ),
    };

    // Base checkbox classes
    const checkboxClasses = cn(
      'rounded',
      'border-2',
      'cursor-pointer',
      'outline-none',
      'appearance-none',
      'flex items-center justify-center',
      'z-10', // Ensure checkbox is clickable
      // Size
      sizeClasses[size],
      // State
      disabled ? stateClasses.disabled : stateClasses[actualState],
      className
    );

    // Checkmark icon (for checked state)
    const CheckmarkIcon = () => (
      <svg
        className="w-full h-full text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );

    // Indeterminate icon (dash)
    const IndeterminateIcon = () => (
      <svg
        className="w-full h-full text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
      </svg>
    );

    return (
      <div className="relative">
        <div className="flex items-start gap-3">
          {/* Checkbox input (hidden, using custom styling) */}
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              name={name}
              checked={checked}
              disabled={disabled}
              required={required}
              onChange={onChange}
              className={checkboxClasses}
              aria-label={!label ? props['aria-label'] : undefined}
              aria-labelledby={label ? generatedLabelId : undefined}
              aria-describedby={cn(
                errorText && errorId,
                helperText && !errorText && helperId
              )}
              aria-invalid={actualState === 'error'}
              aria-required={required}
              {...props}
            />
            {/* Custom checkmark/indeterminate indicator */}
            {(checked || indeterminate) && !disabled && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {indeterminate ? <IndeterminateIcon /> : <CheckmarkIcon />}
              </div>
            )}
          </div>

          {/* Label */}
          {label && (
            <label
              htmlFor={checkboxId}
              id={generatedLabelId}
              className={cn(
                'flex-1 cursor-pointer select-none',
                labelSizeClasses[size],
                'text-text-primary-light dark:text-text-primary-dark',
                required && "after:content-['*'] after:ml-0.5 after:text-error-light dark:after:text-error-dark",
                disabled && 'text-text-secondary-light dark:text-text-secondary-dark opacity-60 cursor-not-allowed',
                actualState === 'error' && 'text-error-light dark:text-error-dark'
              )}
            >
              {label}
            </label>
          )}
        </div>

        {/* Helper text or error message */}
        {(helperText || errorText) && (
          <div
            id={errorText ? errorId : helperId}
            className={cn(
              'mt-1.5 ml-8 text-sm',
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

Checkbox.displayName = 'Checkbox';
