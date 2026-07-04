'use client';

/**
 * useRequireOrganization Hook
 * Hook to require access to a specific organization
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { OrganizationalAssignment } from '@/types/auth';
import { checkOrganizationAccess } from '@/lib/permissions/utils';

/**
 * Hook to require access to a specific organization
 * Redirects to unauthorized page if user doesn't have access
 */
export function useRequireOrganization(
  targetOrg: OrganizationalAssignment,
  redirectTo: string = '/unauthorized'
): void {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    const result = checkOrganizationAccess(user, targetOrg);
    if (!result.allowed) {
      router.push(redirectTo);
    }
  }, [user, loading, targetOrg, redirectTo, router]);
}
