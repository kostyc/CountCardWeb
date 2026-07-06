'use client';

/**
 * Spinner Component
 * 
 * A loading spinner component with size variants, color variants, and centered option.
 * Used to indicate loading states throughout the application.
 * 
 * @example
 * ```tsx
 * <Spinner size="md" color="primary" />
 * 
 * <Spinner size="lg" centered />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { ComponentSize, ComponentColor } from '@/types/components';
import type { BaseComponentProps } from '@/types/components';

/**
 * Spinner component props
 */
export interface SpinnerProps extends BaseComponentProps {
  /**
   * Spinner size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Spinner color variant
   * @default 'primary'
   */
  color?: ComponentColor | 'primary' | 'secondary' | 'tertiary';
  /**
   * Whether to center the spinner
   * @default false
   */
  centered?: boolean;
  /**
   * Optional label for screen readers
   * @default 'Loading'
   */
  label?: string;
}

/**
 * Spinner Component
 * 
 * Displays a rotating spinner to indicate loading state. Supports multiple
 * sizes, colors, and can be centered within its container.
 * 
 * @param props - Spinner component props
 * @returns Spinner element
 */
export default function Spinner({
  size = 'md',
  color = 'primary',
  centered = false,
  label = 'Loading',
  className,
  ...props
}: SpinnerProps): JSX.Element {
  // Size classes
  const sizeClasses = {
    sm: 'w-3 h-3 border-2',
    md: 'w-4 h-4 border-2',
    lg: 'w-6 h-6 border-3',
    xl: 'w-8 h-8 border-4',
  };

  // Color classes
  const colorClasses = {
    primary: 'border-marine-red',
    secondary: 'border-navy-blue',
    tertiary: 'border-tan-khaki',
    success: 'border-green-500',
    warning: 'border-yellow-500',
    error: 'border-red-500',
    info: 'border-blue-500',
    ghost: 'border-text-secondary-light dark:border-text-secondary-dark',
    destructive: 'border-red-600',
  };

  return (
    <div
      className={cn(
        'inline-block',
        centered && 'flex items-center justify-center',
        className
      )}
      role="status"
      aria-label={label}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-solid border-current border-t-transparent',
          sizeClasses[size],
          colorClasses[color]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
