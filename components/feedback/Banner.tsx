'use client';

/**
 * Banner Component
 * 
 * A persistent banner component displayed at the top of the page for
 * important announcements or system messages.
 * 
 * @example
 * ```tsx
 * <Banner variant="info" message="System maintenance scheduled for tonight" dismissible />
 * 
 * <Banner
 *   variant="warning"
 *   title="Important Notice"
 *   message="Please review the updated policies"
 *   action={{ label: 'Learn More', onClick: () => {} }}
 * />
 * ```
 */

import React, { useState } from 'react';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Banner variant types
 */
export type BannerVariant = 'info' | 'warning' | 'error';

/**
 * Banner component props
 */
export interface BannerProps extends BaseComponentProps {
  /**
   * Banner variant
   */
  variant: BannerVariant;
  /**
   * Banner message
   */
  message: string;
  /**
   * Optional title
   */
  title?: string;
  /**
   * Whether banner is dismissible
   * @default false
   */
  dismissible?: boolean;
  /**
   * Callback when banner is dismissed
   */
  onDismiss?: () => void;
  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;
  /**
   * Optional action button
   */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Banner Component
 * 
 * Displays a persistent banner at the top of the page for important
 * announcements. Supports dismissible option and action buttons.
 * 
 * @param props - Banner component props
 * @returns Banner element
 */
export default function Banner({
  variant,
  message,
  title,
  dismissible = false,
  onDismiss,
  icon,
  action,
  className,
  ...props
}: BannerProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  /**
   * Handle dismiss
   */
  const handleDismiss = (): void => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Variant styles
  const variantStyles = {
    info: {
      bg: 'bg-blue-600 dark:bg-blue-800',
      text: 'text-white',
      icon: 'text-blue-200',
    },
    warning: {
      bg: 'bg-yellow-600 dark:bg-yellow-800',
      text: 'text-white',
      icon: 'text-yellow-200',
    },
    error: {
      bg: 'bg-red-600 dark:bg-red-800',
      text: 'text-white',
      icon: 'text-red-200',
    },
  };

  const styles = variantStyles[variant];

  // Default icons
  const defaultIcons = {
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div
      className={cn(
        'w-full px-4 py-3',
        styles.bg,
        className
      )}
      role="alert"
      aria-live="polite"
      {...props}
    >
      <div className="container mx-auto">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className={cn('flex-shrink-0', styles.icon)}>{displayIcon}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={cn('text-sm font-semibold mb-1', styles.text)}>{title}</h4>
            )}
            <p className={cn('text-sm', styles.text)}>{message}</p>
            {action && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={action.onClick}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-md',
                    'bg-white/20 hover:bg-white/30',
                    'border border-white/30',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white',
                    'transition-colors duration-200',
                    styles.text
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              className={cn(
                'flex-shrink-0 p-1 rounded-md',
                'hover:bg-white/10',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:rounded',
                'transition-colors duration-200',
                styles.text
              )}
              aria-label="Dismiss banner"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
