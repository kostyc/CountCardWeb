'use client';

/**
 * Profile Page
 * User profile page displaying user information and account linking options
 */

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import UserMenu from '@/components/layout/UserMenu';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AccountLinking from '@/components/profile/AccountLinking';
import { debugLog } from '@/lib/utils/debugLogger';

export default function ProfilePage(): JSX.Element {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    debugLog.info('Profile page mounted', 'ProfilePage', {
      hasUser: !!user,
      loading,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server',
      timestamp: new Date().toISOString(),
    });
  }, [user, loading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (initialized && !loading && !user) {
      debugLog.warn('Profile: User not authenticated, redirecting to login', 'ProfilePage');
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

  /**
   * Get user display name
   */
  const getDisplayName = (): string => {
    if (user.profile?.displayName) {
      return user.profile.displayName;
    }
    if (user.displayName) {
      return user.displayName;
    }
    if (user.email) {
      return user.email;
    }
    return 'User';
  };

  /**
   * Get user photo URL
   */
  const getPhotoUrl = (): string | null => {
    return user.profile?.profilePictureUrl || user.profile?.photoURL || user.photoURL || null;
  };

  /**
   * Get user avatar/initials
   */
  const getAvatarContent = (): string => {
    if (user.profile?.displayName) {
      const parts = user.profile.displayName.split(' ');
      if (parts.length >= 2) {
        return parts[parts.length - 1].charAt(0).toUpperCase();
      }
    }
    if (user.profile?.firstName && user.profile?.lastName) {
      return user.profile.lastName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="min-h-screen bg-background-primary-light dark:bg-background-primary-dark">
      <Header
        title="CountCard"
        titleHref="/dashboard"
        userMenu={<UserMenu />}
      />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-text-heading-light dark:text-text-heading-dark">
              Profile
            </h1>
            <p className="mt-2 text-text-secondary-light dark:text-text-secondary-dark">
              Manage your account information and linked authentication providers
            </p>
          </div>

          {/* Profile Information Card */}
          <Card elevation="base" padding="lg">
            <Card.Header>
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Profile Information
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {getPhotoUrl() ? (
                    <img
                      src={getPhotoUrl()!}
                      alt={getDisplayName()}
                      className="w-24 h-24 rounded-full object-cover border-4 border-border-primary-light dark:border-border-primary-dark"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-marine-red text-white flex items-center justify-center font-bold text-3xl border-4 border-border-primary-light dark:border-border-primary-dark">
                      {getAvatarContent()}
                    </div>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                      Display Name
                    </label>
                    <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                      {getDisplayName()}
                    </p>
                  </div>

                  {user.profile?.firstName && user.profile?.lastName && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Full Name
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.firstName} {user.profile.lastName}
                      </p>
                    </div>
                  )}

                  {user.profile?.rank && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Rank
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.rank}
                      </p>
                    </div>
                  )}

                  {user.email && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Email
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.email}
                      </p>
                      {user.emailVerified && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  )}

                  {user.profile?.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Phone Number
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.phoneNumber}
                      </p>
                    </div>
                  )}

                  {user.profile?.role && (
                    <div>
                      <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        Role
                      </label>
                      <p className="text-base text-text-primary-light dark:text-text-primary-dark">
                        {user.profile.role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
            <Card.Footer>
              <Button
                variant="secondary"
                onClick={() => router.push('/settings')}
              >
                Edit Profile
              </Button>
            </Card.Footer>
          </Card>

          {/* Account Linking Card */}
          <Card elevation="base" padding="lg">
            <Card.Header>
              <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark">
                Linked Accounts
              </h2>
              <p className="mt-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Link multiple authentication providers to your account for easier access
              </p>
            </Card.Header>
            <Card.Body>
              <AccountLinking />
            </Card.Body>
          </Card>
        </div>
      </main>
    </div>
  );
}
