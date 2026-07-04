'use client';

/**
 * Radio Component
 * 
 * A comprehensive radio button component with radio group support,
 * label support, error states, and accessibility features.
 * 
 * @example
 * ```tsx
 * <RadioGroup name="rank" value={selectedRank} onChange={setSelectedRank}>
 *   <Radio value="Sgt" label="Sergeant" />
 *   <Radio value="SSgt" label="Staff Sergeant" />
 * </RadioGroup>
 * 
 * <Radio
 *   name="option"
 *   value="option1"
 *   label="Option 1"
 *   errorText="This field is required"
 *   state="error"
 * />
 * ```
 */

import React, { forwardRef, createContext, useContext } from 'react';
import { cn, getSizeClasses } from '@/lib/components/utils';
import type { ComponentSize, InputState } from '@/types/components';

/**
 * Radio group context
 */
interface RadioGroupContextValue {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  size?: ComponentSize;
  state?: InputState;
  errorText?: string;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

/**
 * Radio group component props
 */
export interface RadioGroupProps {
  /**
   * Group name (required for radio groups)
   */
  name: string;
  /**
   * Selected value
   */
  value?: string;
  /**
   * Change handler
   */
  onChange?: (value: string) => void;
  /**
   * Radio size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Radio state variant
   * @default 'default'
   */
  state?: InputState;
  /**
   * Error message for the group
   */
  errorText?: string;
  /**
   * Whether the group is disabled
   * @default false
   */
  disabled?: boolean;
  /**
   * Group label
   */
  label?: string;
  /**
   * Helper text for the group
   */
  helperText?: string;
  /**
   * Whether the group is required
   * @default false
   */
  required?: boolean;
  /**
   * Children (Radio components)
   */
  children: React.ReactNode;
  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Radio group component
 * 
 * Provides context for radio buttons in a group.
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  size = 'md',
  state = 'default',
  errorText,
  disabled = false,
  label,
  helperText,
  required = false,
  children,
  className,
}) => {
  const groupId = `radio-group-${React.useId()}`;
  const errorId = `error-${groupId}`;
  const helperId = `helper-${groupId}`;

  const contextValue: RadioGroupContextValue = {
    name,
    value,
    onChange,
    size,
    state: errorText ? 'error' : state,
    errorText,
    disabled,
  };

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={cn('relative', className)}>
        {/* Group label */}
        {label && (
          <label
            className={cn(
              'block text-sm font-semibold mb-2',
              'text-text-primary-light dark:text-text-primary-dark',
              required && "after:content-['*'] after:ml-0.5 after:text-error-light dark:after:text-error-dark",
              disabled && 'text-text-disabled-light dark:text-text-disabled-dark'
            )}
          >
            {label}
          </label>
        )}

        {/* Radio buttons */}
        <div className="space-y-2" role="radiogroup" aria-labelledby={label ? `label-${groupId}` : undefined}>
          {children}
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
              disabled && 'text-text-disabled-light dark:text-text-disabled-dark'
            )}
            role={errorText ? 'alert' : undefined}
          >
            {errorText || helperText}
          </div>
        )}
      </div>
    </RadioGroupContext.Provider>
  );
};

/**
 * Radio component props
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /**
   * Radio value
   */
  value: string;
  /**
   * Label text for the radio button
   */
  label?: string;
  /**
   * Label ID (auto-generated if not provided)
   */
  labelId?: string;
  /**
   * Radio name (required, or provided by RadioGroup)
   */
  name?: string;
  /**
   * Whether this radio is checked
   */
  checked?: boolean;
  /**
   * Radio size (inherited from RadioGroup if not provided)
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Radio state variant (inherited from RadioGroup if not provided)
   * @default 'default'
   */
  state?: InputState;
  /**
   * Radio ID (auto-generated if not provided)
   */
  id?: string;
  /**
   * Change handler (inherited from RadioGroup if not provided)
   */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Radio component
 * 
 * Supports radio group context, validation states, and accessibility features.
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      value,
      label,
      labelId,
      name,
      checked,
      size,
      state,
      disabled,
      id,
      onChange,
      className,
      ...props
    },
    ref
  ) => {
    // Get context from RadioGroup if available
    const groupContext = useContext(RadioGroupContext);

    // Use context values or props (props take precedence)
    const finalName = name || groupContext?.name || '';
    const finalSize = size || groupContext?.size || 'md';
    const finalState = state || groupContext?.state || 'default';
    const finalDisabled = disabled !== undefined ? disabled : (groupContext?.disabled || false);
    const isChecked = checked !== undefined ? checked : (groupContext?.value === value);

    // Generate unique IDs if not provided
    const radioId = id || `radio-${React.useId()}`;
    const generatedLabelId = labelId || `label-${radioId}`;

    // Size classes for radio button
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
        'border-2 border-border-primary-light dark:border-border-primary-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'checked:border-button-primary-bg-light dark:checked:border-button-primary-bg-dark',
        'checked:bg-button-primary-bg-light dark:checked:bg-button-primary-bg-dark',
        'focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-1',
        'hover:border-border-focus-light dark:hover:border-border-focus-dark',
        'transition-all duration-200'
      ),
      error: cn(
        'border-2 border-error-light dark:border-error-dark',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'checked:border-button-primary-bg-light dark:checked:border-button-primary-bg-dark',
        'checked:bg-button-primary-bg-light dark:checked:bg-button-primary-bg-dark',
        'focus:ring-2 focus:ring-error-light dark:focus:ring-error-dark focus:ring-offset-1',
        'hover:border-error-light dark:hover:border-error-dark',
        'transition-all duration-200'
      ),
      success: cn(
        'border-2 border-success',
        'bg-background-primary-light dark:bg-background-primary-dark',
        'checked:border-button-primary-bg-light dark:checked:border-button-primary-bg-dark',
        'checked:bg-button-primary-bg-light dark:checked:bg-button-primary-bg-dark',
        'focus:ring-2 focus:ring-success focus:ring-offset-1',
        'hover:border-success',
        'transition-all duration-200'
      ),
      disabled: cn(
        'border-2 border-border-primary-light dark:border-border-primary-dark',
        'bg-background-secondary-light dark:bg-background-secondary-dark',
        'opacity-60',
        'cursor-not-allowed'
      ),
    };

    // Handle change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (groupContext?.onChange) {
        groupContext.onChange(value);
      }
      onChange?.(event);
    };

    // Base radio classes
    const radioClasses = cn(
      'rounded-full',
      'cursor-pointer',
      'outline-none',
      'appearance-none',
      'z-10', // Ensure radio is clickable
      // Size
      sizeClasses[finalSize],
      // State
      finalDisabled ? stateClasses.disabled : stateClasses[finalState],
      className
    );

    return (
      <div className="flex items-center min-h-[44px] md:min-h-0 md:items-start gap-3">
        {/* Radio input (hidden, using custom styling) */}
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            name={finalName}
            value={value}
            checked={isChecked}
            disabled={finalDisabled}
            onChange={handleChange}
            className={radioClasses}
            aria-label={!label ? props['aria-label'] : undefined}
            aria-labelledby={label ? generatedLabelId : undefined}
            aria-invalid={finalState === 'error'}
            {...props}
          />
          {/* Custom radio indicator (inner circle when checked) */}
          {isChecked && !finalDisabled && (
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center pointer-events-none',
                'after:content-[""] after:w-2 after:h-2 after:rounded-full',
                'after:bg-white'
              )}
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          )}
        </div>

        {/* Label */}
        {label && (
          <label
            htmlFor={radioId}
            id={generatedLabelId}
            className={cn(
              'flex-1 cursor-pointer select-none',
              labelSizeClasses[finalSize],
              'text-text-primary-light dark:text-text-primary-dark',
              finalDisabled && 'text-text-secondary-light dark:text-text-secondary-dark opacity-60 cursor-not-allowed',
              finalState === 'error' && 'text-error-light dark:text-error-dark'
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
