'use client';

/**
 * Progress Bar Component
 * 
 * A progress indicator component supporting both determinate (with percentage)
 * and indeterminate progress states. Includes size and color variants.
 * 
 * @example
 * ```tsx
 * <ProgressBar value={75} max={100} />
 * 
 * <ProgressBar indeterminate color="primary" />
 * 
 * <ProgressBar value={50} showLabel size="lg" />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { ComponentSize, ComponentColor } from '@/types/components';
import type { BaseComponentProps } from '@/types/components';

/**
 * Progress Bar component props
 */
export interface ProgressBarProps extends BaseComponentProps {
  /**
   * Current progress value (for determinate progress)
   */
  value?: number;
  /**
   * Maximum value (for determinate progress)
   * @default 100
   */
  max?: number;
  /**
   * Whether progress is indeterminate
   * @default false
   */
  indeterminate?: boolean;
  /**
   * Progress bar color variant
   * @default 'primary'
   */
  color?: ComponentColor | 'primary' | 'secondary' | 'tertiary';
  /**
   * Progress bar size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Whether to show percentage label
   * @default false
   */
  showLabel?: boolean;
  /**
   * Custom label text
   */
  label?: string;
  /**
   * Whether to show animated stripes (for indeterminate)
   * @default true
   */
  striped?: boolean;
}

/**
 * Progress Bar Component
 * 
 * Displays a progress indicator that can show determinate progress (with
 * percentage) or indeterminate progress (animated). Supports multiple
 * sizes and colors.
 * 
 * @param props - ProgressBar component props
 * @returns Progress bar element
 */
export default function ProgressBar({
  value,
  max = 100,
  indeterminate = false,
  color = 'primary',
  size = 'md',
  showLabel = false,
  label,
  striped = true,
  className,
  ...props
}: ProgressBarProps): JSX.Element {
  // Calculate percentage
  const percentage = indeterminate
    ? undefined
    : Math.min(Math.max(((value || 0) / max) * 100, 0), 100);

  // Size classes
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  };

  // Color classes for progress bar fill
  const colorClasses = {
    primary: 'bg-marine-red',
    secondary: 'bg-navy-blue',
    tertiary: 'bg-tan-khaki',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    ghost: 'bg-text-secondary-light dark:bg-text-secondary-dark',
    destructive: 'bg-red-600',
  };

  // Label text
  const labelText =
    label ||
    (indeterminate
      ? 'Loading...'
      : showLabel
        ? `${Math.round(percentage || 0)}%`
        : undefined);

  return (
    <div className={cn('w-full', className)} {...props}>
      {/* Label */}
      {labelText && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {labelText}
          </span>
          {!indeterminate && showLabel && (
            <span className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
              {Math.round(percentage || 0)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div
        className={cn(
          'w-full overflow-hidden rounded-full',
          'bg-background-secondary-light dark:bg-background-secondary-dark',
          sizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={labelText || 'Progress'}
      >
        {/* Progress Bar Fill */}
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            colorClasses[color],
            indeterminate && 'animate-pulse',
            striped && indeterminate && 'bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-shimmer'
          )}
          style={
            indeterminate
              ? {
                  width: '100%',
                }
              : {
                  width: `${percentage}%`,
                }
          }
        />
      </div>
    </div>
  );
}
