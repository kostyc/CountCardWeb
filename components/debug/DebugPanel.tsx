'use client';

/**
 * Debug Panel Component
 * 
 * React component wrapper for the debug panel.
 * Can be conditionally rendered in the app layout.
 */

import { useEffect } from 'react';
import { debugLog } from '@/lib/utils/debugLogger';

interface DebugPanelProps {
  enabled?: boolean;
}

/**
 * Debug Panel Component
 * 
 * This component initializes the debug logger and provides
 * a React interface for the debug panel.
 * 
 * The actual panel is created by the debug logger itself.
 * This component just ensures it's initialized.
 */
export function DebugPanel({ enabled = true }: DebugPanelProps): null {
  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      // Initialize debug logger
      debugLog.info('Debug panel component mounted', 'DebugPanel');
      
      // Log app initialization info
      debugLog.info('Application initialized', 'App', {
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    }
  }, [enabled]);

  // This component doesn't render anything
  // The debug panel is created by the debug logger
  return null;
}

/**
 * Debug Info Hook
 * 
 * Hook to log debug information about component lifecycle
 */
export function useDebugInfo(componentName: string, props?: Record<string, unknown>) {
  useEffect(() => {
    const win = typeof window !== 'undefined' ? (window as unknown as { __DEBUG__?: boolean }) : null;
    if (win?.__DEBUG__) {
      debugLog.debug(`${componentName} mounted`, componentName, props);
      
      return () => {
        debugLog.debug(`${componentName} unmounted`, componentName);
      };
    }
  }, [componentName, props]);
}
