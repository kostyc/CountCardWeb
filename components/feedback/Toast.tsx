'use client';

/**
 * Toast Component
 * 
 * A toast notification component with variants, auto-dismiss, manual dismiss,
 * icons, and action buttons. Used for temporary user feedback.
 * 
 * @example
 * ```tsx
 * <Toast
 *   variant="success"
 *   message="Operation completed successfully"
 *   onDismiss={() => {}}
 * />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/components/utils';
import type { AlertVariant } from '@/types/components';
import type { BaseComponentProps } from '@/types/components';

/**
 * Toast component props
 */
export interface ToastProps extends BaseComponentProps {
  /**
   * Toast variant
   */
  variant: AlertVariant;
  /**
   * Toast message
   */
  message: string;
  /**
   * Optional title
   */
  title?: string;
  /**
   * Callback when toast is dismissed
   */
  onDismiss: () => void;
  /**
   * Auto-dismiss duration in milliseconds (0 = no auto-dismiss)
   * @default 5000
   */
  duration?: number;
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
  /**
   * Whether toast is visible (for animations)
   */
  visible?: boolean;
}

/**
 * Toast Component
 * 
 * Displays a temporary notification toast with auto-dismiss, manual dismiss,
 * icons, and optional action buttons.
 * 
 * @param props - Toast component props
 * @returns Toast element
 */
export default function Toast({
  variant,
  message,
  title,
  onDismiss,
  duration = 5000,
  icon,
  action,
  visible = true,
  className,
  ...props
}: ToastProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(visible);
  const [isExiting, setIsExiting] = useState(false);

  // Auto-dismiss timer
  useEffect(() => {
    if (duration > 0 && isVisible) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, isVisible]);

  /**
   * Handle dismiss with animation
   */
  const handleDismiss = (): void => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 200); // Animation duration
  };

  if (!isVisible && !isExiting) {
    return null;
  }

  // Variant styles
  const variantStyles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: 'text-green-600 dark:text-green-400',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-600 dark:text-red-400',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'text-yellow-600 dark:text-yellow-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400',
    },
  };

  const styles = variantStyles[variant];

  // Default icons
  const defaultIcons = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
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
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  const displayIcon = icon || defaultIcons[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'min-w-[300px] max-w-md',
        styles.bg,
        styles.border,
        'transition-all duration-200',
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0',
        className
      )}
      role="alert"
      aria-live="polite"
      {...props}
    >
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
                'text-sm font-medium underline',
                'hover:no-underline',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:rounded',
                styles.text
              )}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        className={cn(
          'flex-shrink-0 p-1 rounded-md',
          'hover:bg-black/5 dark:hover:bg-white/5',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:rounded',
          'transition-colors duration-200',
          styles.text
        )}
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
