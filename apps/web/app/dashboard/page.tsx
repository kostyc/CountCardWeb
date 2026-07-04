'use client';

/**
 * Dashboard Page
 * Authenticated user dashboard - hub with navigation to main sections
 * Accessible at /dashboard
 */

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { debugLog } from '@/lib/utils/debugLogger';

const QUICK_LINKS = [
  {
    title: 'Recruits',
    href: '/recruits',
    description: 'View and manage recruit profiles, status, and assignments.',
    icon: (
      <svg className="w-8 h-8 shrink-0" width={32} height={32} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Count Cards',
    href: '/count-cards',
    description: 'Create and manage accountability count cards.',
    icon: (
      <svg className="w-8 h-8 shrink-0" width={32} height={32} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Settings',
    href: '/settings',
    description: 'Profile, security, and application preferences.',
    icon: (
      <svg className="w-8 h-8 shrink-0" width={32} height={32} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 2.31.826 1.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 2.31-2.37 1.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-2.31-.826-1.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-2.31 2.37-1.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function DashboardPage(): JSX.Element {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    debugLog.info('Dashboard page mounted', 'DashboardPage', {
      hasUser: !!user,
      loading,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
      timestamp: new Date().toISOString(),
    });
  }, [user, loading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !loading && !user) {
      debugLog.warn('Dashboard: User not authenticated, redirecting to login', 'DashboardPage');
      router.push('/login');
    }
  }, [user, loading, initialized, router]);

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent"></div>
          <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent"></div>
          <p className="mt-4 text-text-secondary-light dark:text-text-secondary-dark">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-heading-light dark:text-text-heading-dark">
            Welcome, {user.displayName || user.email || 'User'}
          </h1>
          <p className="mt-1 text-base text-text-secondary-light dark:text-text-secondary-dark">
            Choose a section to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col p-6 rounded-xl bg-background-card-light dark:bg-background-card-dark border-2 border-border-secondary-light dark:border-border-secondary-dark shadow-sm hover:shadow-lg hover:border-marine-red/30 dark:hover:border-marine-red/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px]"
            >
              <span className="flex shrink-0 items-center justify-center w-14 h-14 max-w-14 max-h-14 rounded-xl bg-marine-red/10 dark:bg-marine-red/20 text-marine-red mb-4 group-hover:bg-marine-red/20 dark:group-hover:bg-marine-red/30 transition-colors">
                {link.icon}
              </span>
              <h2 className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark">
                {link.title}
              </h2>
              <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark flex-1">
                {link.description}
              </p>
              <span className="mt-4 text-sm font-medium text-marine-red group-hover:underline">
                Go to {link.title} →
              </span>
            </Link>
          ))}
        </div>
    </div>
  );
}