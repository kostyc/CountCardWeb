'use client';

/**
 * Dashboard Page
 * Authenticated user dashboard - shows "You're logged in" message
 * Accessible at /dashboard
 */

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { debugLog } from '@/lib/utils/debugLogger';
import Header from '@/components/layout/Header';
import UserMenu from '@/components/layout/UserMenu';

export default function DashboardPage(): JSX.Element {
  const { user, loading, initialized, signOut } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  /**
   * Handle sign out
   */
  const handleSignOut = async (): Promise<void> => {
    try {
      setIsSigningOut(true);
      debugLog.info('User signing out', 'DashboardPage');
      await signOut();
      debugLog.info('User signed out successfully, redirecting to login', 'DashboardPage');
      router.push('/login');
    } catch (error) {
      debugLog.error('Error signing out', 'DashboardPage', { error });
      setIsSigningOut(false);
      // Still redirect to login even if signOut fails
      router.push('/login');
    }
  };

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
    <div className="min-h-screen bg-background-primary-light dark:bg-background-primary-dark">
      <Header
        title="CountCard"
        titleHref="/dashboard"
        userMenu={<UserMenu />}
      />
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-marine-red mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-heading-light dark:text-text-heading-dark">
            You're Logged In
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary-light dark:text-text-secondary-dark">
            Welcome to CountCard, {user.displayName || user.email || 'User'}
          </p>
          <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
            Your authentication was successful. Dashboard features coming soon.
          </p>
          <div className="mt-8">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="px-6 py-3 bg-marine-red hover:bg-marine-red-dark text-white font-semibold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px]"
              aria-label={isSigningOut ? 'Signing out...' : 'Sign out'}
            >
              {isSigningOut ? (
                <div className="flex items-center justify-center gap-2">
                  <div 
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
                    aria-label="Loading"
                    role="status"
                  ></div>
                  <span>Signing out...</span>
                </div>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
