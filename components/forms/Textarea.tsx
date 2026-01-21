'use client';

/**
 * Textarea Component
 * 
 * A comprehensive textarea component with resizable option, character count,
 * validation states, and accessibility features.
 * 
 * @example
 * ```tsx
 * <Textarea
 *   label="Description"
 *   placeholder="Enter description"
 *   rows={4}
 *   resizable
 *   maxLength={500}
 *   showCharacterCount
 * />
 * 
 * <Textarea
 *   label="Comments"
 *   errorText="This field is required"
 *   state="error"
 *   required
 * />
 * ```
 */

import React, { forwardRef, useState, useMemo } from 'react';
import { cn, getSizeClasses } from '@/lib/components/utils';
import type { ComponentSize, InputState } from '@/types/components';

/**
 * Textarea component props
 */
export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /**
   * Label text for the textarea
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
   * Placeholder text
   */
  placeholder?: string;
  /**
   * Helper text displayed below the textarea
   */
  helperText?: string;
  /**
   * Error message displayed below the textarea
   */
  errorText?: string;
  /**
   * Textarea state variant
   * @default 'default'
   */
  state?: InputState;
  /**
   * Textarea size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Number of visible rows
   * @default 4
   */
  rows?: number;
  /**
   * Whether the textarea is resizable
   * @default false
   */
  resizable?: boolean;
  /**
   * Maximum character count
   */
  maxLength?: number;
  /**
   * Show character count
   * @default false
   */
  showCharacterCount?: boolean;
  /**
   * Full width textarea
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Textarea ID (auto-generated if not provided)
   */
  id?: string;
  /**
   * Textarea name attribute
   */
  name?: string;
  /**
   * Textarea value (controlled)
   */
  value?: string;
  /**
   * Default value (uncontrolled)
   */
  defaultValue?: string;
  /**
   * Change handler
   */
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * Textarea component
 * 
 * Supports resizable option, character count, validation states, and accessibility features.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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
      rows = 4,
      resizable = false,
      maxLength,
      showCharacterCount = false,
      fullWidth = false,
      disabled = false,
      id,
      name,
      value,
      defaultValue,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs if not provided
    const textareaId = id || `textarea-${React.useId()}`;
    const generatedLabelId = labelId || `label-${textareaId}`;
    const errorId = `error-${textareaId}`;
    const helperId = `helper-${textareaId}`;

    // Determine actual state (error takes precedence)
    const actualState: InputState = errorText ? 'error' : state;

    // Internal state for character count
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const characterCount = currentValue.length;
    const isAtLimit = maxLength ? characterCount >= maxLength : false;

    // Handle value changes
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;
      
      // Enforce maxLength if provided
      if (maxLength && newValue.length > maxLength) {
        return;
      }
      
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(event);
    };

    // Size classes
    const sizeClasses = {
      sm: 'text-sm px-3 py-1.5',
      md: 'text-base px-4 py-2',
      lg: 'text-lg px-5 py-2.5',
      xl: 'text-xl px-6 py-3',
    };

    // State classes
    const stateClasses: Record<InputState, string> = {
      default: cn(
        'border-border-primary-light dark:border-border-primary-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'text-text-primary-light dark:text-text-primary-dark',
        'placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark',
        'focus:border-border-focus-light dark:focus:border-border-focus-dark',
        'focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-1',
        'hover:border-border-focus-light dark:hover:border-border-focus-dark'
      ),
      error: cn(
        'border-error-light dark:border-error-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'text-text-primary-light dark:text-text-primary-dark',
        'placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark',
        'focus:border-error-light dark:focus:border-error-dark',
        'focus:ring-2 focus:ring-error-light dark:focus:ring-error-dark focus:ring-offset-1',
        'hover:border-error-light dark:hover:border-error-dark'
      ),
      success: cn(
        'border-success',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'text-text-primary-light dark:text-text-primary-dark',
        'placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark',
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

    // Base textarea classes
    const textareaClasses = cn(
      'w-full',
      'border-2',
      'rounded-lg',
      'transition-all duration-200',
      'outline-none',
      'resize-none', // Default to non-resizable
      'z-10', // Ensure textarea is clickable
      // Size
      sizeClasses[size],
      // State
      disabled ? stateClasses.disabled : stateClasses[actualState],
      // Resizable
      resizable && 'resize-y',
      // Full width
      fullWidth && 'w-full',
      className
    );

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
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

        {/* Textarea element */}
        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          value={isControlled ? value : undefined}
          defaultValue={!isControlled ? defaultValue : undefined}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          onChange={handleChange}
          className={textareaClasses}
          aria-label={!label ? props['aria-label'] : undefined}
          aria-labelledby={label ? generatedLabelId : undefined}
          aria-describedby={cn(
            errorText && errorId,
            helperText && !errorText && helperId,
            showCharacterCount && maxLength && `character-count-${textareaId}`
          )}
          aria-invalid={actualState === 'error'}
          aria-required={required}
          {...props}
        />

        {/* Character count */}
        {showCharacterCount && maxLength && (
          <div
            id={`character-count-${textareaId}`}
            className={cn(
              'mt-1.5 text-xs text-right',
              isAtLimit
                ? 'text-error-light dark:text-error-dark'
                : 'text-text-secondary-light dark:text-text-secondary-dark',
              disabled && 'text-text-secondary-light dark:text-text-secondary-dark opacity-60'
            )}
            aria-live="polite"
          >
            {characterCount} / {maxLength}
          </div>
        )}

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

Textarea.displayName = 'Textarea';
