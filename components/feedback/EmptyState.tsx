'use client';

/**
 * EmptyState Component
 * 
 * A component for displaying empty states with illustration/icon,
 * title, description, and optional action button.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No recruits found"
 *   description="Get started by adding your first recruit"
 *   actionLabel="Add Recruit"
 *   onAction={() => navigate('/recruits/new')}
 * />
 * 
 * <EmptyState
 *   title="No data available"
 *   description="There are no items to display at this time"
 *   icon={<CustomIcon />}
 * />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';
import { Button } from '@/components/ui/Button';

/**
 * EmptyState component props
 */
export interface EmptyStateProps extends BaseComponentProps {
  /**
   * Title to display
   */
  title: string;
  /**
   * Description/subtitle to display
   */
  description?: string;
  /**
   * Optional icon or illustration to display (defaults to empty state icon)
   */
  icon?: React.ReactNode;
  /**
   * Action button label
   */
  actionLabel?: string;
  /**
   * Callback when action button is clicked
   */
  onAction?: () => void;
  /**
   * Whether to show action button
   * @default true (if onAction is provided)
   */
  showAction?: boolean;
  /**
   * Size variant
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * EmptyState Component
 * 
 * Displays an empty state with icon, title, description, and optional action button.
 * 
 * @param props - EmptyState component props
 * @returns EmptyState element
 */
export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  showAction,
  size = 'md',
  className,
  ...props
}: EmptyStateProps): JSX.Element {
  // Default empty state icon
  const defaultIcon = (
    <svg
      className={cn(
        size === 'sm' && 'w-12 h-12',
        size === 'md' && 'w-16 h-16',
        size === 'lg' && 'w-20 h-20',
        'text-text-tertiary-light dark:text-text-tertiary-dark'
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
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );

  // Size-based text classes
  const textSizeClasses = {
    sm: {
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const textClasses = textSizeClasses[size];
  const shouldShowAction = showAction !== false && onAction && actionLabel;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'p-8 rounded-xl',
        'bg-background-primary-light dark:bg-background-primary-dark',
        className
      )}
      {...props}
    >
      {/* Icon */}
      <div className="mb-4 flex-shrink-0">
        {icon || defaultIcon}
      </div>

      {/* Title */}
      <h3
        className={cn(
          textClasses.title,
          'font-semibold mb-2',
          'text-text-heading-light dark:text-text-heading-dark'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            textClasses.description,
            'max-w-md mb-6',
            'text-text-secondary-light dark:text-text-secondary-dark'
          )}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {shouldShowAction && (
        <div className="mt-2">
          <Button
            variant="primary"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
