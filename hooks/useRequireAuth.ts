'use client';

/**
 * Require Authentication Hook
 * Redirects to login if user is not authenticated
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from './useAuthState';

/**
 * Hook to require authentication
 * Redirects to login page if user is not authenticated
 * @param redirectTo - Optional redirect path after login (default: current path)
 */
export function useRequireAuth(redirectTo?: string): {
  user: NonNullable<ReturnType<typeof useAuthState>['user']>;
  loading: boolean;
} {
  const { user, loading, initialized } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && !user) {
      // User is not authenticated, redirect to login
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      const redirectPath = redirectTo || currentPath;
      router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
  }, [user, loading, initialized, router, redirectTo]);

  if (!user) {
    // Return loading state while redirecting
    return { user: null as any, loading: true };
  }

  return { user, loading };
}
