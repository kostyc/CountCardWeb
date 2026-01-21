'use client';

/**
 * Login Buttons Component
 * OAuth provider buttons for Google and Apple sign-in
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LoginButtonsProps {
  requirePrivacyTerms?: boolean;
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
  onSuccess?: () => void;
}

export const LoginButtons: React.FC<LoginButtonsProps> = ({
  requirePrivacyTerms = false,
  privacyAccepted = false,
  termsAccepted = false,
  onSuccess,
}) => {
  const { signInWithGoogle, signInWithApple, loading } = useAuth();
  const [buttonLoading, setButtonLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (provider: 'google' | 'apple', signInFn: () => Promise<{ success: boolean; user?: any; error?: Error }>) => {
    if (buttonLoading !== null || loading) {
      return;
    }

    if (requirePrivacyTerms && (!privacyAccepted || !termsAccepted)) {
      setError('You must accept the Privacy Policy and Terms of Service to continue');
      return;
    }

    setButtonLoading(provider);
    setError(null);
    
    try {
      const result = await signInFn();
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error?.message || `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign in failed. Please try again.`);
      }
    } catch (err: any) {
      let errorMessage = 'Failed to sign in. Please try again.';
      
      if (err.code) {
        switch (err.code) {
          case 'auth/popup-blocked':
            errorMessage = 'Popup was blocked. Please allow popups for this site and try again.';
            break;
          case 'auth/popup-closed-by-user':
            errorMessage = 'Sign-in was cancelled. Please try again.';
            break;
          case 'auth/unauthorized-domain':
            errorMessage = 'This domain is not authorized. Please contact support.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is not enabled. Please contact support.`;
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          default:
            errorMessage = err.message || `Sign-in failed: ${err.code}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setButtonLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {error && (
        <div 
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded text-sm"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          {error}
        </div>
      )}
      
      <button
        onClick={() => handleSignIn('google', signInWithGoogle)}
        disabled={buttonLoading !== null || loading || (requirePrivacyTerms && (!privacyAccepted || !termsAccepted))}
        className="relative w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:bg-white disabled:dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 z-10"
        aria-label={buttonLoading === 'google' ? 'Signing in with Google...' : 'Sign in with Google'}
      >
        {buttonLoading === 'google' ? (
          <div 
            className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 dark:border-white"
            aria-label="Loading"
            role="status"
          ></div>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" width="20" height="20">
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
        )}
        <span className="text-gray-900 dark:text-white">Sign in with Google</span>
      </button>

      <button
        onClick={() => handleSignIn('apple', signInWithApple)}
        disabled={buttonLoading !== null || loading || (requirePrivacyTerms && (!privacyAccepted || !termsAccepted))}
        className="relative w-full flex items-center justify-center gap-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-900 dark:hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:bg-black disabled:dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 z-10"
        aria-label={buttonLoading === 'apple' ? 'Signing in with Apple...' : 'Sign in with Apple'}
      >
        {buttonLoading === 'apple' ? (
          <div 
            className="animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black"
            aria-label="Loading"
            role="status"
          ></div>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 7.79 9.38 7.79c1.15 0 2.08.88 3.08.88 1.03 0 1.78-.87 3.07-.87 3.23.03 6.01 2.4 6.87 5.87-2.31 1.01-3.77 2.9-3.77 5.18 0 1.97 1.24 3.03 2.42 3.33zm-2.03-17.3c1.09-1.32.91-3.17-.41-4.28-1.32-1.14-3.24-1.14-4.28 0-1.09 1.32-.91 3.17.41 4.28 1.32 1.14 3.24 1.14 4.28 0z" />
          </svg>
        )}
        <span>Sign in with Apple</span>
      </button>
    </div>
  );
};
