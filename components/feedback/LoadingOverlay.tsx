'use client';

/**
 * Loading Overlay Component
 * 
 * A full-screen or container overlay that displays a loading spinner with
 * optional message. Supports backdrop blur and custom positioning.
 * 
 * @example
 * ```tsx
 * <LoadingOverlay message="Loading data..." />
 * 
 * <LoadingOverlay message="Saving..." blur />
 * 
 * <LoadingOverlay message="Processing..." size="lg" />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import Spinner from './Spinner';
import type { ComponentSize, ComponentColor } from '@/types/components';
import type { BaseComponentProps } from '@/types/components';

/**
 * Loading Overlay component props
 */
export interface LoadingOverlayProps extends BaseComponentProps {
  /**
   * Loading message to display
   */
  message?: string;
  /**
   * Whether overlay is visible
   * @default true
   */
  visible?: boolean;
  /**
   * Whether to apply backdrop blur
   * @default false
   */
  blur?: boolean;
  /**
   * Spinner size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Spinner color
   * @default 'primary'
   */
  color?: ComponentColor | 'primary' | 'secondary' | 'tertiary';
  /**
   * Whether overlay is full screen
   * @default false
   */
  fullScreen?: boolean;
  /**
   * Custom z-index
   */
  zIndex?: number;
}

/**
 * Loading Overlay Component
 * 
 * Displays a loading overlay with spinner and optional message. Can be
 * full-screen or contained within a parent element. Supports backdrop blur.
 * 
 * @param props - LoadingOverlay component props
 * @returns Loading overlay element
 */
export default function LoadingOverlay({
  message,
  visible = true,
  blur = false,
  size = 'md',
  color = 'primary',
  fullScreen = false,
  zIndex = 50,
  className,
  ...props
}: LoadingOverlayProps): JSX.Element | null {
  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'bg-background-primary-light/80 dark:bg-background-primary-dark/80',
        blur && 'backdrop-blur-sm',
        fullScreen
          ? 'fixed inset-0 z-50'
          : 'absolute inset-0 rounded-lg',
        className
      )}
      style={{ zIndex }}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
      {...props}
    >
      <div className="flex flex-col items-center gap-4 p-8">
        <Spinner size={size} color={color} />
        {message && (
          <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark text-center">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
