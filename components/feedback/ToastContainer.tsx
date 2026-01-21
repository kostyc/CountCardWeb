'use client';

/**
 * Toast Container Component
 * 
 * Container component for managing toast notifications with positioning,
 * stacking, and enter/exit animations.
 * 
 * @example
 * ```tsx
 * <ToastContainer
 *   toasts={toasts}
 *   position="top-right"
 *   onDismiss={(id) => {}}
 * />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import Toast, { type ToastProps } from './Toast';
import type { BaseComponentProps } from '@/types/components';

/**
 * Toast item with ID
 */
export interface ToastItem extends Omit<ToastProps, 'onDismiss'> {
  /**
   * Unique toast ID
   */
  id: string;
}

/**
 * Toast Container component props
 */
export interface ToastContainerProps extends BaseComponentProps {
  /**
   * Array of toast items
   */
  toasts: ToastItem[];
  /**
   * Toast position
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /**
   * Callback when a toast is dismissed
   */
  onDismiss: (id: string) => void;
  /**
   * Maximum number of toasts to display
   * @default 5
   */
  maxToasts?: number;
}

/**
 * Toast Container Component
 * 
 * Manages and displays multiple toast notifications with positioning,
 * stacking, and smooth animations.
 * 
 * @param props - ToastContainer component props
 * @returns Toast container element
 */
export default function ToastContainer({
  toasts,
  position = 'top-right',
  onDismiss,
  maxToasts = 5,
  className,
  ...props
}: ToastContainerProps): JSX.Element | null {
  if (toasts.length === 0) {
    return null;
  }

  // Limit number of toasts
  const displayToasts = toasts.slice(0, maxToasts);

  // Position classes
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={cn(
        'fixed z-[1080]',
        'pointer-events-none',
        positionClasses[position],
        className
      )}
      aria-live="polite"
      aria-label="Notifications"
      {...props}
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {displayToasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={() => onDismiss(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
