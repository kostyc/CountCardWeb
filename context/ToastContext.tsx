'use client';

/**
 * Toast Context
 * Provides global toast notification management throughout the application
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AlertVariant } from '@/types/components';
import type { ToastItem } from '@/components/feedback/ToastContainer';

/**
 * Toast context value
 */
interface ToastContextValue {
  /**
   * Show a toast notification
   */
  showToast: (options: {
    variant: AlertVariant;
    message: string;
    title?: string;
    duration?: number;
    icon?: React.ReactNode;
    action?: {
      label: string;
      onClick: () => void;
    };
  }) => void;
  /**
   * Dismiss a toast by ID
   */
  dismissToast: (id: string) => void;
  /**
   * Dismiss all toasts
   */
  dismissAllToasts: () => void;
  /**
   * Get all active toasts
   */
  toasts: ToastItem[];
}

/**
 * Create toast context
 */
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Toast Provider Component
 */
export function ToastProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  /**
   * Show a toast notification
   */
  const showToast = useCallback(
    (options: {
      variant: AlertVariant;
      message: string;
      title?: string;
      duration?: number;
      icon?: React.ReactNode;
      action?: {
        label: string;
        onClick: () => void;
      };
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = {
        id,
        ...options,
      };

      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  /**
   * Dismiss a toast by ID
   */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Dismiss all toasts
   */
  const dismissAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        dismissToast,
        dismissAllToasts,
        toasts,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}

/**
 * Hook to use toast context
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
