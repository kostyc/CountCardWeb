'use client';

/**
 * Dashboard layout
 * Wraps /dashboard and /dashboard/* with shared Header and navigation.
 */

import { useState } from 'react';
import Header from '@/components/layout/Header';
import UserMenu from '@/components/layout/UserMenu';
import { useDashboardNavItems } from '@/components/navigation/useDashboardNavItems';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = useDashboardNavItems();

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background-primary-light dark:bg-background-primary-dark">
      <Header
        title="CountCard"
        titleHref="/dashboard"
        navItems={navItems}
        userMenu={<UserMenu />}
        onMobileMenuToggle={() => setMobileMenuOpen((o) => !o)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      {children}
    </div>
  );
}
