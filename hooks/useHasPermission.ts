'use client';

/**
 * useHasPermission Hook
 * Hook to check if user has a specific permission
 */

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Permission } from '@/lib/permissions/types';
import { checkPermission } from '@/lib/permissions/utils';

/**
 * Hook to check if user has a specific permission
 * Returns boolean indicating if user has the permission
 */
export function useHasPermission(permission: Permission): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    const result = checkPermission(user, permission);
    return result.allowed;
  }, [user, permission]);
}
