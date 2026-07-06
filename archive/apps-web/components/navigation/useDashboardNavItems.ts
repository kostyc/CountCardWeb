'use client';

/**
 * Dashboard navigation items — includes Import roster when the user can create recruits.
 */

import { useMemo } from 'react';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import type { NavMenuItem } from '@/components/navigation';

const BASE_NAV_ITEMS: NavMenuItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recruits', href: '/recruits' },
  { label: 'Receiving', href: '/receiving/transfers' },
  { label: 'Incoming', href: '/company/incoming-recruits' },
  { label: 'Count Cards', href: '/count-cards' },
  { label: 'DI Cards', href: '/di-leadership-cards' },
  { label: 'Messages', href: '/conversations' },
  { label: 'Settings', href: '/settings' },
];

export function useDashboardNavItems(): NavMenuItem[] {
  const { canCreateAny } = useRecruitPermissions();

  return useMemo(() => {
    if (!canCreateAny) {
      return BASE_NAV_ITEMS;
    }

    return BASE_NAV_ITEMS.flatMap((item) => {
      if (item.label !== 'Recruits') {
        return [item];
      }

      return [
        item,
        { label: 'Import roster', href: '/recruits/import' },
      ];
    });
  }, [canCreateAny]);
}
