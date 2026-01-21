'use client';

/**
 * Login Page
 * Authentication page for CountCard with multi-provider support
 * Based on AIChatModel login page structure
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LoginButtons } from '@/components/auth/LoginButtons';
import { EmailPasswordLogin } from '@/components/auth/EmailPasswordLogin';
import { EmailPasswordSignUp } from '@/components/auth/EmailPasswordSignUp';
import { debugLog } from '@/lib/utils/debugLogger';

type AuthMode = 'oauth' | 'signin' | 'signup';

export default function LoginPage(): JSX.Element {
  const [authMode, setAuthMode] = useState<AuthMode>('oauth');
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  // Redirect authenticated users
  useEffect(() => {
    if (initialized && !loading && user) {
      debugLog.info('User already authenticated, redirecting', 'LoginPage', {
        userId: user?.uid,
      });
      router.replace('/dashboard');
    }
  }, [user, loading, initialized, router]);

  // Show loading state
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show nothing (redirect will happen)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark px-4 py-8">
      <div className="bg-background-card-light dark:bg-background-card-dark rounded-2xl shadow-xl border border-border-primary-light dark:border-border-primary-dark p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-heading-light dark:text-text-heading-dark mb-2">
            CountCard
          </h1>
          <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark">
            Sign in to access your account
          </p>
        </div>

        {authMode === 'oauth' && (
          <>
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-primary-light dark:border-border-primary-dark"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background-card-light dark:bg-background-card-dark text-text-secondary-light dark:text-text-secondary-dark font-medium">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>
            <LoginButtons 
              onSuccess={() => {
                debugLog.info('OAuth login successful, redirecting', 'LoginPage');
                router.push('/dashboard');
              }}
            />
            <div className="mt-6 text-center space-y-2">
              <button
                onClick={() => setAuthMode('signin')}
                className="text-sm text-text-link-light dark:text-text-link-dark hover:underline font-semibold block w-full transition-colors"
              >
                Sign in with email
              </button>
              <button
                onClick={() => setAuthMode('signup')}
                className="text-sm text-text-link-light dark:text-text-link-dark hover:underline font-semibold block w-full transition-colors"
              >
                Create account
              </button>
            </div>
          </>
        )}

        {authMode === 'signin' && (
          <>
            <EmailPasswordLogin
              onSwitchToSignUp={() => setAuthMode('signup')}
            />
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-primary-light dark:border-border-primary-dark"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background-card-light dark:bg-background-card-dark text-text-secondary-light dark:text-text-secondary-dark font-medium">
                    Or
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <LoginButtons 
                onSuccess={() => {
                  debugLog.info('OAuth login successful, redirecting', 'LoginPage');
                  router.push('/dashboard');
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode('signup')}
                className="text-sm text-text-link-light dark:text-text-link-dark hover:underline font-semibold transition-colors"
              >
                Create account
              </button>
            </div>
          </>
        )}

        {authMode === 'signup' && (
          <>
            <EmailPasswordSignUp onSwitchToSignIn={() => setAuthMode('signin')} />
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-primary-light dark:border-border-primary-dark"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background-card-light dark:bg-background-card-dark text-text-secondary-light dark:text-text-secondary-dark font-medium">
                    Or
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <LoginButtons 
                onSuccess={() => {
                  debugLog.info('OAuth signup successful, redirecting', 'LoginPage');
                  router.push('/dashboard');
                }}
              />
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setAuthMode('signin')}
                className="text-sm text-text-link-light dark:text-text-link-dark hover:underline font-semibold transition-colors"
              >
                Already have an account? Sign in
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
