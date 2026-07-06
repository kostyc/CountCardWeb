'use client';

/**
 * Signup Page
 * User registration page with multi-provider support and required privacy policy/terms acceptance
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase/config';
import { logError } from '@/lib/utils/logger';
import PhoneAuth from '@/components/auth/PhoneAuth';

const PRIVACY_POLICY_VERSION = '1.0.0';
const TERMS_OF_SERVICE_VERSION = '1.0.0';

/**
 * Password validation rules
 */
const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default function SignupPage(): JSX.Element {
  const router = useRouter();
  const { signUpWithEmail, signInWithGoogle, signInWithApple, loading, error } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    setFormError(null);
    setPasswordErrors([]);

    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }

    if (!displayName.trim()) {
      setFormError('Display name is required');
      return false;
    }

    if (!password) {
      setFormError('Password is required');
      return false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setPasswordErrors(passwordValidation.errors);
      setFormError('Password does not meet requirements');
      return false;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    if (!privacyAccepted) {
      setFormError('You must accept the Privacy Policy to continue');
      return false;
    }

    if (!termsAccepted) {
      setFormError('You must accept the Terms of Service to continue');
      return false;
    }

    return true;
  };

  /**
   * Handle email/password sign up
   */
  const handleEmailSignUp = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signUpWithEmail({
        email,
        password,
        displayName,
      });

      if (result.success && result.user) {
        // Store privacy policy and terms acceptance
        await storeAcceptance(result.user.uid);
        router.push('/');
      } else {
        setFormError(result.error?.message || 'Sign up failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logError(err as Error, 'SignupPage.handleEmailSignUp');
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle Google OAuth sign in
   */
  const handleGoogleSignIn = async (): Promise<void> => {
    if (!privacyAccepted || !termsAccepted) {
      setFormError('You must accept the Privacy Policy and Terms of Service to continue');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const result = await signInWithGoogle();

      if (result.success && result.user) {
        // Store privacy policy and terms acceptance
        await storeAcceptance(result.user.uid);
        router.push('/');
      } else {
        setFormError(result.error?.message || 'Google sign in failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logError(err as Error, 'SignupPage.handleGoogleSignIn');
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle Apple OAuth sign in
   */
  const handleAppleSignIn = async (): Promise<void> => {
    if (!privacyAccepted || !termsAccepted) {
      setFormError('You must accept the Privacy Policy and Terms of Service to continue');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      const result = await signInWithApple();

      if (result.success && result.user) {
        // Store privacy policy and terms acceptance
        await storeAcceptance(result.user.uid);
        router.push('/');
      } else {
        setFormError(result.error?.message || 'Apple sign in failed. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logError(err as Error, 'SignupPage.handleAppleSignIn');
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Store privacy policy and terms acceptance in user profile
   */
  const storeAcceptance = async (userId: string): Promise<void> => {
    try {
      // Get Firebase ID token for authentication
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
      logError(err as Error, 'SignupPage.storeAcceptance');
      // Don't block authentication if storage fails - log error but continue
    }
  };

  /**
   * Handle password change and validate
   */
  const handlePasswordChange = (newPassword: string): void => {
    setPassword(newPassword);
    if (newPassword) {
      const validation = validatePassword(newPassword);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const isLoading = loading || isSubmitting;
  const displayError = formError || (error?.message || null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-heading-light dark:text-text-heading-dark mb-2">
            CountCard
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Marine Corps Drill Instructor Accountability
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-background-card-light dark:bg-background-card-dark rounded-xl shadow-xl p-8 border border-border-primary-light dark:border-border-primary-dark">
          <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-6">
            Create Account
          </h2>

          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{displayError}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSignUp} className="mb-6">
            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Your name"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Create a password"
              />
              {passwordErrors.length > 0 && (
                <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
              {password && passwordErrors.length === 0 && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">Password meets requirements</p>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                placeholder="Confirm your password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            {/* Privacy Policy and Terms Acceptance */}
            <div className="mb-6 space-y-3">
              <div className="flex items-start">
                <input
                  id="privacy-accept"
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  disabled={isLoading}
                  required
                  className="mt-1 h-4 w-4 text-marine-red border-border-primary-light dark:border-border-primary-dark rounded focus:ring-marine-red focus:ring-2"
                />
                <label htmlFor="privacy-accept" className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">
                  I accept the{' '}
                  <Link href="/privacy-policy" className="text-text-link-light dark:text-text-link-dark hover:underline">
                    Privacy Policy
                  </Link>
                  {' '}*
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="terms-accept"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={isLoading}
                  required
                  className="mt-1 h-4 w-4 text-marine-red border-border-primary-light dark:border-border-primary-dark rounded focus:ring-marine-red focus:ring-2"
                />
                <label htmlFor="terms-accept" className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">
                  I accept the{' '}
                  <Link href="/terms-of-service" className="text-text-link-light dark:text-text-link-dark hover:underline">
                    Terms of Service
                  </Link>
                  {' '}*
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !privacyAccepted || !termsAccepted || passwordErrors.length > 0 || password !== confirmPassword}
              className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-primary-light dark:border-border-primary-dark"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background-card-light dark:bg-background-card-dark text-text-secondary-light dark:text-text-secondary-dark">
                Or continue with
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || !privacyAccepted || !termsAccepted}
              className="relative w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:bg-white disabled:dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 z-10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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
              <span className="text-gray-900 dark:text-white">Sign up with Google</span>
            </button>

            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={isLoading || !privacyAccepted || !termsAccepted}
              className="relative w-full flex items-center justify-center gap-3 bg-black dark:bg-white border-2 border-black dark:border-white text-white dark:text-black font-semibold py-3 px-4 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-900 dark:hover:bg-gray-100 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:bg-black disabled:dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 z-10"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C1.79 15.25 4.96 7.79 9.38 7.79c1.15 0 2.08.88 3.08.88 1.03 0 1.78-.87 3.07-.87 3.23.03 6.01 2.4 6.87 5.87-2.31 1.01-3.77 2.9-3.77 5.18 0 1.97 1.24 3.03 2.42 3.33zm-2.03-17.3c1.09-1.32.91-3.17-.41-4.28-1.32-1.14-3.24-1.14-4.28 0-1.09 1.32-.91 3.17.41 4.28 1.32 1.14 3.24 1.14 4.28 0z" />
              </svg>
              <span>Sign up with Apple</span>
            </button>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Already have an account?{' '}
            <Link href="/login" className="text-text-link-light dark:text-text-link-dark font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
