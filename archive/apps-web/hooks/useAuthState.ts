/**
 * Authentication State Hook
 * Provides simplified access to authentication state
 */

import { useAuth } from '@/context/AuthContext';
import { AppUser } from '@/types/auth';

/**
 * Hook to get authentication state
 * Returns user, loading, error, and initialized state
 */
export function useAuthState(): {
  user: AppUser | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
  isAuthenticated: boolean;
} {
  const { user, loading, error, initialized } = useAuth();

  return {
    user,
    loading,
    error,
    initialized,
    isAuthenticated: !!user,
  };
}
