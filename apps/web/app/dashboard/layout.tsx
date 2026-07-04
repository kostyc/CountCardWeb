'use client';

/**
 * Dashboard layout
 * Wraps /dashboard and /dashboard/* with shared Header and navigation.
 */

import { useState } from 'react';
import Header from '@/components/layout/Header';
import UserMenu from '@/components/layout/UserMenu';
import type { NavMenuItem } from '@/components/navigation';

const NAV_ITEMS: NavMenuItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Recruits', href: '/recruits' },
  { label: 'Count Cards', href: '/count-cards' },
  { label: 'Messages', href: '/conversations' },
  { label: 'Settings', href: '/settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background-primary-light dark:bg-background-primary-dark">
      <Header
        title="CountCard"
        titleHref="/dashboard"
        navItems={NAV_ITEMS}
        userMenu={<UserMenu />}
        onMobileMenuToggle={() => setMobileMenuOpen((o) => !o)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      {children}
    </div>
  );
}
