'use client';

/**
 * Button Group Component
 * 
 * Groups multiple buttons together with consistent spacing and alignment.
 * Supports horizontal and vertical layouts.
 * 
 * @example
 * ```tsx
 * <ButtonGroup>
 *   <Button variant="primary">Save</Button>
 *   <Button variant="secondary">Cancel</Button>
 * </ButtonGroup>
 * 
 * <ButtonGroup orientation="vertical" spacing="md">
 *   <Button variant="primary">Option 1</Button>
 *   <Button variant="primary">Option 2</Button>
 * </ButtonGroup>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { ComponentSize, BaseComponentProps } from '@/types/components';

/**
 * ButtonGroup component props
 */
export interface ButtonGroupProps extends BaseComponentProps {
  /**
   * Orientation of the button group
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Spacing between buttons
   * @default 'sm'
   */
  spacing?: ComponentSize | 'none';
  /**
   * Button group children (Button components)
   */
  children: React.ReactNode;
  /**
   * If true, all buttons will have the same size
   * @default true
   */
  equalSize?: boolean;
}

/**
 * ButtonGroup component
 * 
 * Groups buttons together with consistent spacing and alignment.
 * Ensures all buttons have the same size by default.
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  orientation = 'horizontal',
  spacing = 'sm',
  equalSize = true,
  className,
  children,
  ...props
}) => {
  // Spacing classes
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'gap-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'gap-3' : 'space-y-3',
    lg: orientation === 'horizontal' ? 'gap-4' : 'space-y-4',
    xl: orientation === 'horizontal' ? 'gap-6' : 'space-y-6',
  };

  // Base classes
  const baseClasses = cn(
    'inline-flex',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    spacingClasses[spacing],
    equalSize && '[&>*]:flex-1',
    className
  );

  return (
    <div className={baseClasses} role="group" {...props}>
      {children}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';
