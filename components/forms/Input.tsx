'use client';

/**
 * Input Component
 * 
 * A comprehensive input component with multiple input types, states, validation,
 * and accessibility features. Supports icons, clear buttons, and error/success states.
 * 
 * @example
 * ```tsx
 * <Input
 *   type="text"
 *   label="Name"
 *   placeholder="Enter your name"
 *   required
 *   helperText="This is required"
 * />
 * 
 * <Input
 *   type="email"
 *   label="Email"
 *   errorText="Invalid email address"
 *   state="error"
 *   icon={<MailIcon />}
 *   iconPosition="left"
 * />
 * 
 * <Input
 *   type="password"
 *   label="Password"
 *   showClearButton
 *   state="success"
 * />
 * ```
 */

import React, { forwardRef, useState } from 'react';
import { cn, getSizeClasses } from '@/lib/components/utils';
import type { ComponentSize, InputState } from '@/types/components';

/**
 * Input component props
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input type
   * @default 'text'
   */
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time' | 'datetime-local' | 'url' | 'search';
  /**
   * Label text for the input
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
   * Helper text displayed below the input
   */
  helperText?: string;
  /**
   * Error message displayed below the input
   */
  errorText?: string;
  /**
   * Input state variant
   * @default 'default'
   */
  state?: InputState;
  /**
   * Input size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Icon element to display
   */
  icon?: React.ReactNode;
  /**
   * Position of the icon relative to input
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
  /**
   * Show clear button for text inputs (when value is not empty)
   * @default false
   */
  showClearButton?: boolean;
  /**
   * Full width input
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Input ID (auto-generated if not provided)
   */
  id?: string;
  /**
   * Input name attribute
   */
  name?: string;
  /**
   * Input value (controlled)
   */
  value?: string;
  /**
   * Default value (uncontrolled)
   */
  defaultValue?: string;
  /**
   * Change handler
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Clear button click handler
   */
  onClear?: () => void;
}

/**
 * Clear button icon component
 */
const ClearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
    width="24"
    height="24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

/**
 * Input component
 * 
 * Supports multiple input types, states, validation, icons, and accessibility features.
 * All interactive states (hover, active, focus, disabled) are properly styled.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      labelId,
      required = false,
      placeholder,
      helperText,
      errorText,
      state = 'default',
      size = 'md',
      icon,
      iconPosition = 'left',
      showClearButton = false,
      fullWidth = false,
      disabled = false,
      id,
      name,
      value,
      defaultValue,
      onChange,
      onClear,
      className,
      ...props
    },
    ref
  ) => {
    // Generate unique IDs if not provided
    const inputId = id || `input-${React.useId()}`;
    const generatedLabelId = labelId || `label-${inputId}`;
    const errorId = `error-${inputId}`;
    const helperId = `helper-${inputId}`;

    // Determine actual state (error takes precedence)
    const actualState: InputState = errorText ? 'error' : state;

    // Internal state for clear button visibility
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const showClear = showClearButton && currentValue && !disabled && type !== 'password';

    // Handle value changes
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(event.target.value);
      }
      onChange?.(event);
    };

    // Handle clear button click
    const handleClear = () => {
      if (!isControlled) {
        setInternalValue('');
      }
      onClear?.();
      // Trigger onChange with empty value
      const syntheticEvent = {
        target: { value: '', name: name || '' },
        currentTarget: { value: '', name: name || '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    };

    // Size classes (mobile: 44px min touch target)
    const sizeClasses = {
      sm: 'text-sm px-3 py-2.5 min-h-[44px]',
      md: 'text-base px-4 py-2 min-h-[44px] md:min-h-[40px]',
      lg: 'text-lg px-5 py-2.5 min-h-[48px]',
      xl: 'text-xl px-6 py-3 min-h-[56px]',
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

    // Base input classes
    const inputClasses = cn(
      'w-full',
      'border-2',
      'rounded-lg',
      'transition-all duration-200',
      'outline-none',
      'z-10', // Ensure input is clickable
      // Size
      sizeClasses[size],
      // State
      disabled ? stateClasses.disabled : stateClasses[actualState],
      // Icon padding adjustments
      icon && iconPosition === 'left' && 'pl-10',
      icon && iconPosition === 'right' && !showClear && 'pr-10',
      icon && iconPosition === 'right' && showClear && 'pr-20',
      !icon && showClear && 'pr-10',
      // Full width
      fullWidth && 'w-full',
      className
    );

    // Icon wrapper classes
    const iconWrapperClasses = cn(
      'absolute top-1/2 -translate-y-1/2',
      'pointer-events-none',
      'z-20',
      iconPosition === 'left' ? 'left-3' : 'right-3',
      'text-text-secondary-light dark:text-text-secondary-dark',
      actualState === 'error' && 'text-error-light dark:text-error-dark',
      actualState === 'success' && 'text-success',
      disabled && 'text-text-disabled-light dark:text-text-disabled-dark'
    );

    // Clear button classes (44px tap target on mobile)
    const clearButtonClasses = cn(
      'absolute top-1/2 -translate-y-1/2 right-3',
      'flex items-center justify-center',
      'min-w-[44px] min-h-[44px] w-10 h-10',
      'rounded-full',
      'bg-background-secondary-light dark:bg-background-secondary-dark',
      'text-text-secondary-light dark:text-text-secondary-dark',
      'hover:bg-background-tertiary-light dark:hover:bg-background-tertiary-dark',
      'cursor-pointer',
      'transition-colors duration-200',
      'z-20',
      'focus:outline-none focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-1'
    );

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
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

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {icon && iconPosition === 'left' && (
            <div className={iconWrapperClasses} aria-hidden="true">
              {icon}
            </div>
          )}

          {/* Input element */}
          <input
            ref={ref}
            type={type}
            id={inputId}
            name={name}
            value={isControlled ? value : undefined}
            defaultValue={!isControlled ? defaultValue : undefined}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            onChange={handleChange}
            className={inputClasses}
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

          {/* Right icon or clear button */}
          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className={clearButtonClasses}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <ClearIcon className="w-4 h-4" />
            </button>
          )}
          {icon && iconPosition === 'right' && !showClear && (
            <div className={iconWrapperClasses} aria-hidden="true">
              {icon}
            </div>
          )}
        </div>

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

Input.displayName = 'Input';
