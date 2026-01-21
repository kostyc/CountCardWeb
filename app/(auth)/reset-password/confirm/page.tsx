'use client';

/**
 * Password Reset Confirmation Page
 * Handles password reset from email link and allows user to set new password
 */

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase/config';
import { confirmPasswordReset } from 'firebase/auth';
import { logError, logInfo } from '@/lib/utils/logger';

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

function ConfirmResetPasswordForm(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const [isValidCode, setIsValidCode] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  // Extract action code from URL
  const actionCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  /**
   * Validate action code on mount
   */
  useEffect(() => {
    const validateActionCode = async (): Promise<void> => {
      if (!actionCode || mode !== 'resetPassword') {
        setIsValidCode(false);
        setIsValidating(false);
        setFormError('Invalid or missing reset link. Please request a new password reset.');
        return;
      }

      // Action code is present and mode is correct
      // Firebase will validate it when we call confirmPasswordReset
      setIsValidCode(true);
      setIsValidating(false);
    };

    validateActionCode();
  }, [actionCode, mode]);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    setFormError(null);
    setPasswordErrors([]);

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

    return true;
  };

  /**
   * Handle password reset confirmation
   */
  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm() || !actionCode) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      // Confirm password reset with Firebase
      await confirmPasswordReset(auth, actionCode, password);

      logInfo('Password reset successful', 'ConfirmResetPasswordPage.handlePasswordReset');
      setResetSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?passwordReset=success');
      }, 3000);
    } catch (err) {
      const error = err as Error;
      logError(error, 'ConfirmResetPasswordPage.handlePasswordReset');
      
      // Handle specific Firebase errors
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        setFormError('This password reset link has expired or is invalid. Please request a new one.');
      } else {
        setFormError(error.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
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

  // Show loading state while validating action code
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-8 border border-border-primary-light dark:border-border-primary-dark text-center">
            <p className="text-text-primary-light dark:text-text-primary-dark">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if action code is invalid
  if (!isValidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-8 border border-border-primary-light dark:border-border-primary-dark">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-4">
                Invalid Reset Link
              </h2>
              <p className="text-text-primary-light dark:text-text-primary-dark mb-6">
                {formError || 'This password reset link is invalid or has expired. Please request a new password reset.'}
              </p>
              <Link
                href="/reset-password"
                className="inline-block bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
              >
                Request New Reset Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message if password reset was successful
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-background-card-light dark:bg-background-card-dark rounded-lg shadow-lg p-8 border border-border-primary-light dark:border-border-primary-dark">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-4">
                Password Reset Successful
              </h2>
              <p className="text-text-primary-light dark:text-text-primary-dark mb-6">
                Your password has been reset successfully. You will be redirected to the login page shortly.
              </p>
              <Link
                href="/login"
                className="inline-block bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
              >
                Go to Login
              </Link>
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
            Set New Password
          </h2>

          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Please enter your new password below.
          </p>

          {/* Error Message */}
          {formError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{formError}</p>
            </div>
          )}

          {/* Password Form */}
          <form onSubmit={handlePasswordReset} className="mb-6">
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your new password"
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

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2 bg-background-input-light dark:bg-background-input-dark border border-border-primary-light dark:border-border-primary-dark rounded-md text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Confirm your new password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || passwordErrors.length > 0 || password !== confirmPassword}
              className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
            >
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
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

export default function ConfirmResetPasswordPage(): JSX.Element {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent mb-4"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmResetPasswordForm />
    </Suspense>
  );
}
