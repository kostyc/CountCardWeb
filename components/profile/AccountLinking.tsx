'use client';

/**
 * Account Linking Component
 * Displays linked authentication providers and allows linking/unlinking accounts
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { debugLog } from '@/lib/utils/debugLogger';
import { logError, logInfo } from '@/lib/utils/logger';

/**
 * Provider information type
 */
interface ProviderInfo {
  providerId: string;
  displayName: string;
  icon: JSX.Element;
  email?: string;
}

/**
 * Get provider display information
 */
function getProviderInfo(providerId: string, email?: string): ProviderInfo {
  switch (providerId) {
    case 'password':
      return {
        providerId: 'password',
        displayName: 'Email/Password',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        ),
        email,
      };
    case 'google.com':
      return {
        providerId: 'google.com',
        displayName: 'Google',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        ),
        email,
      };
    case 'apple.com':
      return {
        providerId: 'apple.com',
        displayName: 'Apple',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 7.79 9.38 7.79c1.15 0 2.08.88 3.08.88 1.03 0 1.78-.87 3.07-.87 3.23.03 6.01 2.4 6.87 5.87-2.31 1.01-3.77 2.9-3.77 5.18 0 1.97 1.24 3.03 2.42 3.33zm-2.03-17.3c1.09-1.32.91-3.17-.41-4.28-1.32-1.14-3.24-1.14-4.28 0-1.09 1.32-.91 3.17.41 4.28 1.32 1.14 3.24 1.14 4.28 0z" />
          </svg>
        ),
        email,
      };
    case 'phone':
      return {
        providerId: 'phone',
        displayName: 'Phone Number',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        ),
        email,
      };
    default:
      return {
        providerId,
        displayName: providerId,
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        ),
        email,
      };
  }
}

/**
 * Account Linking Component
 */
export default function AccountLinking(): JSX.Element {
  const { user, linkAccount, unlinkAccount, refreshUser, loading } = useAuth();
  const [linkedProviders, setLinkedProviders] = useState<ProviderInfo[]>([]);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Update linked providers list from user data
   */
  useEffect(() => {
    if (user && user.providerData) {
      const providers = user.providerData.map((provider) =>
        getProviderInfo(provider.providerId, provider.email || undefined)
      );
      setLinkedProviders(providers);
    }
  }, [user]);

  /**
   * Clear messages after timeout
   */
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  /**
   * Handle linking a new provider
   */
  const handleLinkProvider = async (provider: 'google' | 'apple'): Promise<void> => {
    if (!user || linkingProvider) {
      return;
    }

    setLinkingProvider(provider);
    setError(null);
    setSuccess(null);

    try {
      debugLog.info(`Linking ${provider} account`, 'AccountLinking');
      const result = await linkAccount(provider);

      if (result.success) {
        // Show success message (either newly linked or already linked)
        const message = result.message || `${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`;
        setSuccess(message);
        // Refresh user to get updated provider data
        await refreshUser();
        debugLog.info(`${provider} account linked successfully`, 'AccountLinking');
      } else {
        const errorMessage = result.error?.message || `Failed to link ${provider} account`;
        setError(errorMessage);
        logError(new Error(errorMessage), 'AccountLinking.handleLinkProvider');
      }
    } catch (err: any) {
      let errorMessage = err instanceof Error ? err.message : `Failed to link ${provider} account`;
      
      // Handle popup-specific errors
      if (err.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Linking was cancelled. Please try again.';
      }
      
      setError(errorMessage);
      logError(err as Error, 'AccountLinking.handleLinkProvider');
      debugLog.error(`Failed to link ${provider} account`, 'AccountLinking', { error: err });
    } finally {
      setLinkingProvider(null);
    }
  };

  /**
   * Handle unlinking a provider
   */
  const handleUnlinkProvider = async (providerId: string): Promise<void> => {
    if (!user || unlinkingProvider) {
      return;
    }

    // Confirm before unlinking
    const confirmed = window.confirm(
      `Are you sure you want to unlink ${getProviderInfo(providerId).displayName}? You will no longer be able to sign in with this provider.`
    );

    if (!confirmed) {
      return;
    }

    setUnlinkingProvider(providerId);
    setError(null);
    setSuccess(null);

    try {
      debugLog.info(`Unlinking ${providerId} account`, 'AccountLinking');
      const result = await unlinkAccount(providerId);

      if (result.success) {
        setSuccess(`${getProviderInfo(providerId).displayName} account unlinked successfully`);
        logInfo(`Provider ${providerId} unlinked successfully`, 'AccountLinking');
        debugLog.info(`${providerId} account unlinked successfully`, 'AccountLinking');
      } else {
        const errorMessage = result.error?.message || `Failed to unlink ${getProviderInfo(providerId).displayName}`;
        setError(errorMessage);
        logError(result.error || new Error(errorMessage), 'AccountLinking.handleUnlinkProvider');
        debugLog.error(`Failed to unlink ${providerId} account`, 'AccountLinking', { error: result.error });
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : `Failed to unlink ${getProviderInfo(providerId).displayName}`;
      setError(errorMessage);
      logError(err as Error, 'AccountLinking.handleUnlinkProvider');
      debugLog.error(`Failed to unlink ${providerId} account`, 'AccountLinking', { error: err });
    } finally {
      setUnlinkingProvider(null);
    }
  };

  /**
   * Check if a provider is already linked
   */
  const isProviderLinked = (providerId: string): boolean => {
    if (!user || !user.providerData) {
      return false;
    }
    // Check both the local state and the user's providerData
    const isInLinkedProviders = linkedProviders.some((p) => p.providerId === providerId);
    const isInUserProviderData = user.providerData.some((p) => p.providerId === providerId);
    return isInLinkedProviders || isInUserProviderData;
  };

  /**
   * Get available providers to link
   */
  const getAvailableProviders = (): Array<{ id: 'google' | 'apple'; name: string; icon: JSX.Element }> => {
    const allProviders = [
      {
        id: 'google' as const,
        name: 'Google',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" width="20" height="20">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        ),
      },
      {
        id: 'apple' as const,
        name: 'Apple',
        icon: (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 7.79 9.38 7.79c1.15 0 2.08.88 3.08.88 1.03 0 1.78-.87 3.07-.87 3.23.03 6.01 2.4 6.87 5.87-2.31 1.01-3.77 2.9-3.77 5.18 0 1.97 1.24 3.03 2.42 3.33zm-2.03-17.3c1.09-1.32.91-3.17-.41-4.28-1.32-1.14-3.24-1.14-4.28 0-1.09 1.32-.91 3.17.41 4.28 1.32 1.14 3.24 1.14 4.28 0z" />
          </svg>
        ),
      },
    ];

    return allProviders.filter((p) => !isProviderLinked(p.id === 'google' ? 'google.com' : 'apple.com'));
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary-light dark:text-text-secondary-dark">Please sign in to manage linked accounts.</p>
      </div>
    );
  }

  const availableProviders = getAvailableProviders();

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg text-sm"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg text-sm"
          role="alert"
          aria-live="polite"
          aria-atomic="true"
        >
          {success}
        </div>
      )}

      {/* Linked Providers */}
      <div>
        <h3 className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark mb-4">
          Linked Providers
        </h3>
        {linkedProviders.length === 0 ? (
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            No authentication providers linked to your account.
          </p>
        ) : (
          <div className="space-y-3">
            {linkedProviders.map((provider) => (
              <div
                key={provider.providerId}
                className="flex items-center justify-between p-4 bg-background-secondary-light dark:bg-background-secondary-dark rounded-lg border border-border-secondary-light dark:border-border-secondary-dark"
              >
                <div className="flex items-center gap-3">
                  <div className="text-text-primary-light dark:text-text-primary-dark">
                    {provider.icon}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">
                      {provider.displayName}
                    </p>
                    {provider.email && (
                      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        {provider.email}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnlinkProvider(provider.providerId)}
                  disabled={unlinkingProvider === provider.providerId || loading || linkedProviders.length <= 1}
                  loading={unlinkingProvider === provider.providerId}
                  aria-label={`Unlink ${provider.displayName}`}
                >
                  {unlinkingProvider === provider.providerId ? 'Unlinking...' : 'Unlink'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Link New Providers */}
      {availableProviders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-text-heading-light dark:text-text-heading-dark mb-4">
            Link New Account
          </h3>
          <div className="space-y-3">
            {availableProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleLinkProvider(provider.id)}
                disabled={linkingProvider !== null || loading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:bg-white disabled:dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 z-10 min-h-[44px]"
                aria-label={linkingProvider === provider.id ? `Linking ${provider.name}...` : `Link ${provider.name} account`}
              >
                {linkingProvider === provider.id ? (
                  <div
                    className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-white"
                    aria-label="Loading"
                    role="status"
                  ></div>
                ) : (
                  provider.icon
                )}
                <span>
                  {linkingProvider === provider.id ? `Linking ${provider.name}...` : `Link ${provider.name}`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {availableProviders.length === 0 && linkedProviders.length > 0 && (
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          All available authentication providers are already linked to your account.
        </p>
      )}
    </div>
  );
}
