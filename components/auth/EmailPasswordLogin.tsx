'use client';

/**
 * Email Password Login Component
 * Handles email/password authentication with privacy/terms acceptance
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/logger';

const PRIVACY_POLICY_VERSION = '1.0.0';
const TERMS_OF_SERVICE_VERSION = '1.0.0';

interface EmailPasswordLoginProps {
  onSwitchToSignUp?: () => void;
  onSwitchToReset?: () => void;
}

export const EmailPasswordLogin: React.FC<EmailPasswordLoginProps> = ({
  onSwitchToSignUp,
  onSwitchToReset,
}) => {
  const router = useRouter();
  const { signInWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Store privacy policy and terms acceptance in user profile
   */
  const storeAcceptance = async (userId: string): Promise<void> => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/user/accept-policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          userId,
          privacyPolicyAccepted: true,
          privacyPolicyVersion: PRIVACY_POLICY_VERSION,
          termsOfServiceAccepted: true,
          termsOfServiceVersion: TERMS_OF_SERVICE_VERSION,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store policy acceptance');
      }
    } catch (err) {
      logError(err as Error, 'EmailPasswordLogin.storeAcceptance');
      // Don't block authentication if storage fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signInWithEmail({ email: trimmedEmail, password: trimmedPassword });

      if (result.success && result.user) {
        // Check if user has already accepted privacy/terms
        const hasAccepted = result.user.profile?.privacyPolicyAccepted && result.user.profile?.termsOfServiceAccepted;
        
        // Only store acceptance if not already accepted (for users who signed up before this requirement)
        if (!hasAccepted) {
          await storeAcceptance(result.user.uid);
        }
        
        router.push('/dashboard');
      } else {
        setError(result.error?.message || 'Sign in failed. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logError(err as Error, 'EmailPasswordLogin.handleSubmit');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
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

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="your.email@example.com"
          className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors pr-12"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus:outline-none p-1"
            disabled={isLoading}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>


      {onSwitchToReset && (
        <button
          type="button"
          onClick={onSwitchToReset}
          className="text-sm text-text-link-light dark:text-text-link-dark hover:underline font-semibold text-left self-start transition-colors"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      )}

      <button
        type="submit"
        disabled={isLoading || !email || !password}
        className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div 
              className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
              aria-label="Loading"
              role="status"
            ></div>
            <span>Signing in...</span>
          </div>
        ) : (
          'Sign In'
        )}
      </button>

      {onSwitchToSignUp && (
        <div className="text-center text-sm">
          <span className="text-text-secondary-light dark:text-text-secondary-dark">Don't have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-text-link-light dark:text-text-link-dark hover:underline font-semibold transition-colors"
            disabled={isLoading}
          >
            Sign up
          </button>
        </div>
      )}
    </form>
  );
};
