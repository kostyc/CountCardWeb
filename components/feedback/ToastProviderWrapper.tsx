'use client';

/**
 * Toast Provider Wrapper Component
 * 
 * Wraps the ToastProvider and ToastContainer together for easy integration.
 * This component should be added to the root layout.
 * 
 * @example
 * ```tsx
 * <ToastProviderWrapper position="top-right" />
 * ```
 */

import React from 'react';
import { ToastProvider, useToast } from '@/context/ToastContext';
import ToastContainer from './ToastContainer';

/**
 * Toast Provider Wrapper component props
 */
export interface ToastProviderWrapperProps {
  /**
   * Toast position
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /**
   * Maximum number of toasts
   * @default 5
   */
  maxToasts?: number;
}

/**
 * Internal component that uses the toast context
 */
function ToastContainerWrapper({
  position = 'top-right',
  maxToasts = 5,
}: ToastProviderWrapperProps): JSX.Element | null {
  const { toasts, dismissToast } = useToast();

  return (
    <ToastContainer
      toasts={toasts}
      position={position}
      onDismiss={dismissToast}
      maxToasts={maxToasts}
    />
  );
}

/**
 * Toast Provider Wrapper Component
 * 
 * Provides toast context and renders the toast container. Should be added
 * to the root layout of the application.
 * 
 * @param props - ToastProviderWrapper component props
 * @returns Toast provider and container
 */
export default function ToastProviderWrapper(
  props: ToastProviderWrapperProps
): JSX.Element {
  return (
    <ToastProvider>
      <ToastContainerWrapper {...props} />
    </ToastProvider>
  );
}
