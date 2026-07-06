'use client';

/**
 * useRequireRole Hook
 * Hook to require a specific role for access
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { checkRole } from '@/lib/permissions/utils';

/**
 * Hook to require a specific role
 * Redirects to unauthorized page if user doesn't have the required role
 */
export function useRequireRole(requiredRole: UserRole, redirectTo: string = '/unauthorized'): void {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const result = checkRole(user, requiredRole);
    if (!result.allowed) {
      router.push(redirectTo);
    }
  }, [user, loading, requiredRole, redirectTo, router]);
}
