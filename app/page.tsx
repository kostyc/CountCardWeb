'use client';

/**
 * Home Page
 * Landing page for CountCard - Marine Corps Drill Instructor Accountability Application
 * 
 * Features:
 * - Professional Marine Corps themed design
 * - Key features showcase
 * - Authentication options (OAuth and Email/Password)
 * - Responsive design
 * - Accessibility compliant
 */

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LoginButtons } from '@/components/auth/LoginButtons';
import { EmailPasswordLogin } from '@/components/auth/EmailPasswordLogin';
import { EmailPasswordSignUp } from '@/components/auth/EmailPasswordSignUp';
import { debugLog } from '@/lib/utils/debugLogger';

type AuthMode = 'oauth' | 'signin' | 'signup';

export default function Home(): JSX.Element {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (initialized && !loading && user) {
      debugLog.info('Redirecting authenticated user to dashboard', 'HomePage', {
        userId: user?.uid,
      });
      router.replace('/dashboard');
    }
  }, [user, loading, initialized, router]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
        setAuthMode('signin');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const openModal = () => {
    setAuthMode('signin');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAuthMode('signin');
  };

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return (
      <main 
        className="flex min-h-screen flex-col items-center justify-center p-24 bg-background-primary-light dark:bg-background-primary-dark"
        role="main"
      >
        <div className="text-center" role="status" aria-live="polite">
          <div 
            className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent mb-4"
            aria-label="Loading"
            role="status"
          />
          <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
            Loading...
          </p>
        </div>
      </main>
    );
  }

  // If authenticated, show redirecting state
  if (user) {
    return (
      <main 
        className="flex min-h-screen flex-col items-center justify-center p-24 bg-background-primary-light dark:bg-background-primary-dark"
        role="main"
      >
        <div className="text-center" role="status" aria-live="polite">
          <div 
            className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-marine-red border-r-transparent mb-4"
            aria-label="Redirecting"
            role="status"
          />
          <p className="text-base text-text-secondary-light dark:text-text-secondary-dark">
            Redirecting to dashboard...
          </p>
        </div>
      </main>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <main 
      className="flex min-h-screen flex-col bg-background-primary-light dark:bg-background-primary-dark"
      role="main"
    >
      {/* Hero Section */}
      <section className="relative flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background-secondary-light via-background-primary-light to-background-secondary-light dark:from-background-secondary-dark dark:via-background-primary-dark dark:to-background-secondary-dark pointer-events-none" aria-hidden />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-[length:60px_60px]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23940000\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} aria-hidden />

        <div className="relative w-full max-w-6xl mx-auto min-w-0">
          <div className="grid grid-cols-1 gap-10 lg:gap-16 items-center">
            {/* Branding & Features */}
            <div className="text-center lg:text-left space-y-6 min-w-0">
              <header className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-heading-light dark:text-text-heading-dark tracking-tight">
                  CountCard
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl text-text-secondary-light dark:text-text-secondary-dark font-semibold leading-tight">
                  Marine Corps Drill Instructor
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl text-text-secondary-light dark:text-text-secondary-dark font-semibold leading-tight">
                  Accountability Application
                </p>
                <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto lg:mx-0 mt-6 leading-relaxed">
                  Track and manage recruits with precision. Built for Drill Instructors who demand excellence in accountability and compliance.
                </p>
              </header>

              {/* Sign In Button */}
              <div className="mt-10 flex justify-center lg:justify-start">
                <button
                  onClick={openModal}
                  className="bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px] min-w-[120px] z-10"
                >
                  Sign In
                </button>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 min-w-0">
                <div className="bg-background-card-light dark:bg-background-card-dark p-5 rounded-xl border-2 border-border-secondary-light dark:border-border-secondary-dark shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="w-10 h-10 max-w-10 max-h-10 shrink-0 rounded-lg bg-marine-red/10 dark:bg-marine-red/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-marine-red" width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5 text-text-heading-light dark:text-text-heading-dark">
                    Recruit Management
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-snug">
                    Comprehensive recruit profiles and status tracking
                  </p>
                </div>
                <div className="bg-background-card-light dark:bg-background-card-dark p-5 rounded-xl border-2 border-border-secondary-light dark:border-border-secondary-dark shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="w-10 h-10 max-w-10 max-h-10 shrink-0 rounded-lg bg-navy-blue/10 dark:bg-navy-blue-light/30 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-navy-blue dark:text-navy-blue-light" width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5 text-text-heading-light dark:text-text-heading-dark">
                    Count Cards
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-snug">
                    Real-time accountability records and workflow
                  </p>
                </div>
                <div className="bg-background-card-light dark:bg-background-card-dark p-5 rounded-xl border-2 border-border-secondary-light dark:border-border-secondary-dark shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="w-10 h-10 max-w-10 max-h-10 shrink-0 rounded-lg bg-tan/20 dark:bg-tan-light/20 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-tan-dark dark:text-tan-light" width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5 text-text-heading-light dark:text-text-heading-dark">
                    Secure & Compliant
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-snug">
                    End-to-end encryption and GDPR compliance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authentication Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[1050] flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div
            className="bg-background-card-light dark:bg-background-card-dark rounded-xl shadow-xl border border-border-primary-light dark:border-border-primary-dark p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2
                id="auth-modal-title"
                className="text-2xl sm:text-3xl font-bold text-text-heading-light dark:text-text-heading-dark"
              >
                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
              </h2>
              <button
                onClick={closeModal}
                className="text-text-secondary-light dark:text-text-secondary-dark hover:text-text-heading-light dark:hover:text-text-heading-dark transition-colors focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 rounded-lg p-1"
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
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
                        Or continue with
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <LoginButtons />
                </div>
                <div className="mt-4 text-center">
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Don't have an account?{' '}
                  </span>
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
                        Or continue with
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <LoginButtons />
                </div>
                <div className="mt-4 text-center">
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Already have an account?{' '}
                  </span>
                  <button
                    onClick={() => setAuthMode('signin')}
                    className="text-sm text-text-link-light dark:text-text-link-dark hover:underline font-semibold transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border-primary-light dark:border-border-primary-dark py-6 px-4 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Link
              href="/privacy-policy"
              className="text-text-link-light dark:text-text-link-dark hover:underline transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="text-text-link-light dark:text-text-link-dark hover:underline transition-colors"
            >
              Terms of Service
            </Link>
          </div>
          <p className="text-center sm:text-right">
            © {new Date().getFullYear()} CountCard. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
