'use client';

/**
 * Email Password Sign Up Component
 * Handles user registration with email/password and privacy/terms acceptance
 */

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/logger';

const PRIVACY_POLICY_VERSION = '1.0.0';
const TERMS_OF_SERVICE_VERSION = '1.0.0';

interface EmailPasswordSignUpProps {
  onSwitchToSignIn?: () => void;
}

interface PasswordRequirements {
  minLength: boolean;
  maxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export const EmailPasswordSignUp: React.FC<EmailPasswordSignUpProps> = ({
  onSwitchToSignIn,
}) => {
  const router = useRouter();
  const { signUpWithEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate password against Firebase policy
  const passwordRequirements: PasswordRequirements = useMemo(() => {
    return {
      minLength: password.length >= 12,
      maxLength: password.length <= 4096,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return Object.values(passwordRequirements).every((req) => req === true);
  }, [passwordRequirements]);

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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
      logError(err as Error, 'EmailPasswordSignUp.storeAcceptance');
      // Don't block authentication if storage fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    if (!privacyAccepted || !termsAccepted) {
      setError('You must accept the Privacy Policy and Terms of Service to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        setError('Email and password are required.');
        setIsSubmitting(false);
        return;
      }

      const result = await signUpWithEmail({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (result.success && result.user) {
        await storeAcceptance(result.user.uid);
        router.push('/dashboard');
      } else {
        setError(result.error?.message || 'Failed to create account. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logError(err as Error, 'EmailPasswordSignUp.handleSubmit');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="signup-email" className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Email
        </label>
        <input
          id="signup-email"
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
        <label htmlFor="signup-password" className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Password
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Create a password"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-marine-red focus:border-marine-red outline-none text-text-primary-light dark:text-text-primary-dark bg-background-input-light dark:bg-background-input-dark pr-12 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              password.length > 0 && !isPasswordValid
                ? 'border-red-500'
                : 'border-border-primary-light dark:border-border-primary-dark'
            }`}
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Requirements */}
        {password.length > 0 && (
          <div className="mt-2 p-3 bg-background-secondary-light dark:bg-background-secondary-dark rounded-lg border border-border-primary-light dark:border-border-primary-dark">
            <p className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Password Requirements:</p>
            <ul className="space-y-1 text-xs">
              <li className={`flex items-center gap-2 ${passwordRequirements.minLength ? 'text-green-600 dark:text-green-400' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                <span>{passwordRequirements.minLength ? '✓' : '○'}</span>
                <span>At least 12 characters</span>
              </li>
              <li className={`flex items-center gap-2 ${passwordRequirements.maxLength ? 'text-green-600 dark:text-green-400' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                <span>{passwordRequirements.maxLength ? '✓' : '○'}</span>
                <span>Maximum 4096 characters</span>
              </li>
              <li className={`flex items-center gap-2 ${passwordRequirements.hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                <span>{passwordRequirements.hasUppercase ? '✓' : '○'}</span>
                <span>At least one uppercase letter</span>
              </li>
              <li className={`flex items-center gap-2 ${passwordRequirements.hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                <span>{passwordRequirements.hasLowercase ? '✓' : '○'}</span>
                <span>At least one lowercase letter</span>
              </li>
              <li className={`flex items-center gap-2 ${passwordRequirements.hasNumber ? 'text-green-600 dark:text-green-400' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                <span>{passwordRequirements.hasNumber ? '✓' : '○'}</span>
                <span>At least one number</span>
              </li>
              <li className={`flex items-center gap-2 ${passwordRequirements.hasSpecial ? 'text-green-600 dark:text-green-400' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                <span>{passwordRequirements.hasSpecial ? '✓' : '○'}</span>
                <span>At least one special character</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm-password" className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="Confirm your password"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-marine-red focus:border-marine-red outline-none text-text-primary-light dark:text-text-primary-dark bg-background-input-light dark:bg-background-input-dark pr-12 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              confirmPassword.length > 0 && !passwordsMatch
                ? 'border-red-500'
                : 'border-border-primary-light dark:border-border-primary-dark'
            }`}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark focus:outline-none p-1"
            disabled={isLoading}
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
            className="mt-1 h-4 w-4 text-marine-red border-border-primary-light dark:border-border-primary-dark rounded focus:ring-marine-red focus:ring-2"
            disabled={isLoading}
          />
          <label htmlFor="terms" className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">
            I accept the{' '}
            <Link href="/terms-of-service" className="text-text-link-light dark:text-text-link-dark hover:underline font-semibold transition-colors">
              Terms of Service
            </Link>
            {' '}*
          </label>
        </div>
        <div className="flex items-start">
          <input
            id="privacy"
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            required
            className="mt-1 h-4 w-4 text-marine-red border-border-primary-light dark:border-border-primary-dark rounded focus:ring-marine-red focus:ring-2"
            disabled={isLoading}
          />
          <label htmlFor="privacy" className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">
            I accept the{' '}
            <Link href="/privacy-policy" className="text-text-link-light dark:text-text-link-dark hover:underline font-semibold transition-colors">
              Privacy Policy
            </Link>
            {' '}*
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !email || !isPasswordValid || !passwordsMatch || !privacyAccepted || !termsAccepted}
        className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Creating account...</span>
          </div>
        ) : (
          'Sign Up'
        )}
      </button>

      {onSwitchToSignIn && (
        <div className="text-center text-sm">
          <span className="text-text-secondary-light dark:text-text-secondary-dark">Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="text-text-link-light dark:text-text-link-dark hover:underline font-semibold transition-colors"
            disabled={isLoading}
          >
            Sign in
          </button>
        </div>
      )}
    </form>
  );
};
