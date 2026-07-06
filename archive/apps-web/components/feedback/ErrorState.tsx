'use client';

/**
 * ErrorState Component
 * 
 * A component for displaying error states with error message, icon,
 * retry button, and customizable error messages.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   message="Failed to load data"
 *   onRetry={() => refetch()}
 * />
 * 
 * <ErrorState
 *   title="Network Error"
 *   message="Unable to connect to the server"
 *   onRetry={() => window.location.reload()}
 *   customMessage="Please check your internet connection and try again."
 * />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';
import { Button } from '@/components/ui/Button';

/**
 * ErrorState component props
 */
export interface ErrorStateProps extends BaseComponentProps {
  /**
   * Error message to display
   */
  message: string;
  /**
   * Optional title
   */
  title?: string;
  /**
   * Optional custom message/additional details
   */
  customMessage?: string;
  /**
   * Callback when retry button is clicked
   */
  onRetry?: () => void;
  /**
   * Custom retry button label
   * @default "Try Again"
   */
  retryLabel?: string;
  /**
   * Optional secondary action (e.g. Import roster while list failed to load)
   */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /**
   * Whether to show retry button
   * @default true
   */
  showRetry?: boolean;
  /**
   * Optional icon to display (defaults to error icon)
   */
  icon?: React.ReactNode;
  /**
   * Size variant
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ErrorState Component
 * 
 * Displays an error state with message, icon, and optional retry button.
 * 
 * @param props - ErrorState component props
 * @returns ErrorState element
 */
export default function ErrorState({
  message,
  title,
  customMessage,
  onRetry,
  retryLabel = 'Try Again',
  secondaryActionLabel,
  onSecondaryAction,
  showRetry = true,
  icon,
  size = 'md',
  className,
  ...props
}: ErrorStateProps): JSX.Element {
  // Default error icon
  const defaultIcon = (
    <svg
      className={cn(
        size === 'sm' && 'w-12 h-12',
        size === 'md' && 'w-16 h-16',
        size === 'lg' && 'w-20 h-20',
        'text-red-500 dark:text-red-400'
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
      width={size === 'sm' ? 48 : size === 'lg' ? 80 : 64}
      height={size === 'sm' ? 48 : size === 'lg' ? 80 : 64}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );

  // Size-based text classes
  const textSizeClasses = {
    sm: {
      title: 'text-lg',
      message: 'text-sm',
      custom: 'text-xs',
    },
    md: {
      title: 'text-xl',
      message: 'text-base',
      custom: 'text-sm',
    },
    lg: {
      title: 'text-2xl',
      message: 'text-lg',
      custom: 'text-base',
    },
  };

  const textClasses = textSizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'p-8 rounded-xl',
        'bg-background-primary-light dark:bg-background-primary-dark',
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      {/* Icon */}
      <div className="mb-4 flex-shrink-0">
        {icon || defaultIcon}
      </div>

      {/* Title */}
      {title && (
        <h3
          className={cn(
            textClasses.title,
            'font-semibold mb-2',
            'text-text-heading-light dark:text-text-heading-dark'
          )}
        >
          {title}
        </h3>
      )}

      {/* Error Message */}
      <p
        className={cn(
          textClasses.message,
          'mb-2',
          'text-text-secondary-light dark:text-text-secondary-dark'
        )}
      >
        {message}
      </p>

      {/* Custom Message */}
      {customMessage && (
        <p
          className={cn(
            textClasses.custom,
            'mt-2 max-w-md',
            'text-text-tertiary-light dark:text-text-tertiary-dark'
          )}
        >
          {customMessage}
        </p>
      )}

      {/* Actions */}
      {(showRetry && onRetry) || (onSecondaryAction && secondaryActionLabel) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {onSecondaryAction && secondaryActionLabel && (
            <Button
              variant="secondary"
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </Button>
          )}
          {showRetry && onRetry && (
            <Button
              variant="primary"
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
