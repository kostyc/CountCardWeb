'use client';

/**
 * Password Reset Component
 * Handles password reset email sending
 */

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface PasswordResetProps {
  onSwitchToSignIn?: () => void;
}

export const PasswordReset: React.FC<PasswordResetProps> = ({ onSwitchToSignIn }) => {
  const { resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      
      if (!trimmedEmail) {
        setError('Email is required.');
        setIsSubmitting(false);
        return;
      }
      
      const result = await resetPassword({ email: trimmedEmail });
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error?.message || 'Failed to send password reset email. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;

  if (success) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded text-sm">
          <p className="font-medium mb-1">Password reset email sent!</p>
          <p className="text-xs">
            Check your email for instructions to reset your password. The link will expire in 1 hour.
          </p>
        </div>
        {onSwitchToSignIn && (
          <button
            onClick={onSwitchToSignIn}
            className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px]"
          >
            Back to Sign In
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-text-heading-light dark:text-text-heading-dark mb-2">Reset Password</h2>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="reset-email" className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
          Email
        </label>
        <input
          id="reset-email"
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

      <button
        type="submit"
        disabled={isLoading || !email}
        className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px]"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Sending...</span>
          </div>
        ) : (
          'Send Reset Link'
        )}
      </button>

      {onSwitchToSignIn && (
        <div className="text-center text-sm">
          <span className="text-text-secondary-light dark:text-text-secondary-dark">Remember your password? </span>
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
