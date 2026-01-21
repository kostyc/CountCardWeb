'use client';

/**
 * FormField Component
 * 
 * A wrapper component that provides consistent spacing, label, error message,
 * and required field indicator integration for form inputs.
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Email Address"
 *   required
 *   errorText={errors.email}
 *   helperText="Enter your email address"
 * >
 *   <Input
 *     type="email"
 *     value={email}
 *     onChange={(e) => setEmail(e.target.value)}
 *   />
 * </FormField>
 * 
 * <FormField
 *   label="Description"
 *   errorText={errors.description}
 * >
 *   <Textarea
 *     value={description}
 *     onChange={(e) => setDescription(e.target.value)}
 *   />
 * </FormField>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';

/**
 * FormField component props
 */
export interface FormFieldProps {
  /**
   * Label text for the field
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
   * Helper text displayed below the field
   */
  helperText?: string;
  /**
   * Error message displayed below the field
   */
  errorText?: string;
  /**
   * Field ID (auto-generated if not provided)
   */
  id?: string;
  /**
   * Additional class names for the wrapper
   */
  className?: string;
  /**
   * Form input component (Input, Textarea, Select, etc.)
   */
  children: React.ReactNode;
  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;
}

/**
 * FormField component
 * 
 * Provides consistent spacing, label, error message, and required field indicator
 * for form inputs. The child component should handle its own styling and states.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  labelId,
  required = false,
  helperText,
  errorText,
  id,
  className,
  children,
  disabled = false,
}) => {
  // Generate unique IDs if not provided
  const fieldId = id || `field-${React.useId()}`;
  const generatedLabelId = labelId || `label-${fieldId}`;
  const errorId = `error-${fieldId}`;
  const helperId = `helper-${fieldId}`;

  // Clone children to inject props if needed
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        id: child.props.id || fieldId,
        labelId: child.props.labelId || generatedLabelId,
        label: child.props.label !== undefined ? child.props.label : label,
        required: child.props.required !== undefined ? child.props.required : required,
        helperText: child.props.helperText !== undefined ? child.props.helperText : helperText,
        errorText: child.props.errorText !== undefined ? child.props.errorText : errorText,
        disabled: child.props.disabled !== undefined ? child.props.disabled : disabled,
        // Preserve existing props
        ...child.props,
      } as any);
    }
    return child;
  });

  return (
    <div className={cn('relative w-full', className)}>
      {childrenWithProps}
    </div>
  );
};

FormField.displayName = 'FormField';
