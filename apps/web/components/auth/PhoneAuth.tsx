'use client';

/**
 * Phone Authentication Component
 * Handles phone number authentication with Firebase reCAPTCHA verifier
 */

import { useState, useEffect, useRef } from 'react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { logError } from '@/lib/utils/logger';

interface PhoneAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  requirePrivacyTerms?: boolean;
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
}

export default function PhoneAuth({
  onSuccess,
  onError,
  requirePrivacyTerms = true,
  privacyAccepted = false,
  termsAccepted = false,
}: PhoneAuthProps): JSX.Element {
  const { signInWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Initialize reCAPTCHA verifier
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && !recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            // reCAPTCHA solved, can proceed with phone auth
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
            recaptchaVerifierRef.current?.clear();
            recaptchaVerifierRef.current = null;
          },
        });
      } catch (err) {
        logError(err as Error, 'PhoneAuth.initializeRecaptcha');
        setError('Failed to initialize reCAPTCHA. Please refresh the page.');
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  /**
   * Validate phone number format
   */
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Check if it's a valid US phone number (10 digits) or international format
    return digits.length >= 10 && digits.length <= 15;
  };

  /**
   * Format phone number for display
   */
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  /**
   * Handle phone number submission
   */
  const handleSendCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (requirePrivacyTerms && (!privacyAccepted || !termsAccepted)) {
      setError('You must accept the Privacy Policy and Terms of Service to continue');
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (!recaptchaVerifierRef.current) {
      setError('reCAPTCHA not initialized. Please refresh the page.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formattedPhone = phoneNumber.replace(/\D/g, '');
      const phoneWithCountryCode = formattedPhone.startsWith('1') 
        ? `+${formattedPhone}` 
        : `+1${formattedPhone}`;

      const result = await signInWithPhone({
        phoneNumber: phoneWithCountryCode,
        recaptchaVerifier: recaptchaVerifierRef.current,
      });

      if (result.success && result.confirmationResult) {
        setConfirmationResult(result.confirmationResult);
        setStep('code');
      } else {
        setError(result.error?.message || 'Failed to send verification code');
        onError?.(result.error?.message || 'Failed to send verification code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle verification code submission
   */
  const handleVerifyCode = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (!confirmationResult) {
      setError('No verification session found. Please start over.');
      setStep('phone');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signInWithPhone({
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        verificationCode,
        confirmationResult,
      });

      if (result.success && result.user) {
        onSuccess?.();
      } else {
        setError(result.error?.message || 'Invalid verification code');
        onError?.(result.error?.message || 'Invalid verification code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle back to phone number step
   */
  const handleBack = (): void => {
    setStep('phone');
    setVerificationCode('');
    setError(null);
    if (confirmationResult) {
      setConfirmationResult(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} className="hidden" />

      {step === 'phone' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              disabled={isSubmitting}
              required
              className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              placeholder="(555) 123-4567"
            />
            <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
              We'll send you a verification code via SMS
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (requirePrivacyTerms && (!privacyAccepted || !termsAccepted))}
            className="w-full bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
          >
            {isSubmitting ? 'Sending Code...' : 'Send Verification Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
            <label htmlFor="code" className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              disabled={isSubmitting}
              required
              maxLength={6}
              className="w-full px-4 py-3 bg-background-input-light dark:bg-background-input-dark border-2 border-border-primary-light dark:border-border-primary-dark rounded-lg text-text-primary-light dark:text-text-primary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:border-marine-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center text-2xl tracking-widest"
              placeholder="000000"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1 bg-background-secondary-light dark:bg-background-secondary-dark text-text-primary-light dark:text-text-primary-dark font-semibold py-3 px-4 rounded-lg border-2 border-border-primary-light dark:border-border-primary-dark hover:bg-background-tertiary-light dark:hover:bg-background-tertiary-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting || verificationCode.length !== 6}
              className="flex-1 bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
