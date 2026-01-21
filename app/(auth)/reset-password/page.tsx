'use client';

/**
 * Password Reset Request Page
 * Allows users to request a password reset email
 */

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { logError } from '@/lib/utils/logger';

export default function ResetPasswordPage(): JSX.Element {
  const router = useRouter();
  const { resetPassword, loading, error } = useAuth();
  
  const [email, setEmail] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setFormError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setFormError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  /**
   * Handle password reset request
   */
  const handleResetRequest = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await resetPassword({ email });

      if (result.success) {
        setEmailSent(true);
      } else {
        setFormError(result.error?.message || 'Failed to send password reset email. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      logError(err as Error, 'ResetPasswordPage.handleResetRequest');
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;
  const displayError = formError || (error?.message || null);

  // Show success message if email was sent
  if (emailSent) {
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

          {/* Success Card */}
          <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-8 border border-border-primary-light dark:border-border-primary-dark">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-4">
                Check Your Email
              </h2>
              <p className="text-text-primary-light dark:text-text-primary-dark mb-6">
                We've sent a password reset link to <strong>{email}</strong>. Please check your email and click the link to reset your password.
              </p>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                If you don't see the email, please check your spam folder or try again.
              </p>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                    setFormError(null);
                  }}
                  className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
                >
                  Send Another Email
                </button>
                <Link
                  href="/login"
                  className="block w-full text-center bg-background-secondary-light dark:bg-background-secondary-dark hover:bg-background-tertiary-light dark:hover:bg-background-tertiary-dark text-text-primary-light dark:text-text-primary-dark font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Reset Password Card */}
        <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-8 border border-border-primary-light dark:border-border-primary-dark">
          <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-6">
            Reset Password
          </h2>

          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {/* Error Message */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{displayError}</p>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleResetRequest} className="mb-6">
            <div className="mb-6">
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
                className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="your.email@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-text-link-light dark:text-text-link-dark hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
