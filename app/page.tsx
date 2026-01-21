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
      <section className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-24">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Column - Branding & Features */}
            <div className="text-center lg:text-left space-y-6">
              <header className="space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-text-heading-light dark:text-text-heading-dark">
                  CountCard
                </h1>
                <p className="text-xl sm:text-2xl md:text-3xl text-text-secondary-light dark:text-text-secondary-dark font-semibold">
                  Marine Corps Drill Instructor
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl text-text-secondary-light dark:text-text-secondary-dark font-semibold">
                  Accountability Application
                </p>
                <p className="text-base sm:text-lg text-text-secondary-light dark:text-text-secondary-dark max-w-2xl mx-auto lg:mx-0 mt-4">
                  Track and manage recruits with precision. Built for Drill Instructors who demand excellence in accountability and compliance.
                </p>
              </header>

              {/* Sign In Button */}
              <div className="mt-8 flex justify-center lg:justify-start">
                <button
                  onClick={openModal}
                  className="bg-marine-red hover:bg-marine-red-dark text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 min-h-[44px] z-10"
                >
                  Sign In
                </button>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                <div className="bg-background-card-light dark:bg-background-card-dark p-4 rounded-lg border border-border-primary-light dark:border-border-primary-dark">
                  <h3 className="text-sm font-semibold mb-2 text-text-heading-light dark:text-text-heading-dark">
                    Recruit Management
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Comprehensive recruit profiles and status tracking
                  </p>
                </div>
                <div className="bg-background-card-light dark:bg-background-card-dark p-4 rounded-lg border border-border-primary-light dark:border-border-primary-dark">
                  <h3 className="text-sm font-semibold mb-2 text-text-heading-light dark:text-text-heading-dark">
                    Count Cards
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                    Real-time accountability records and workflow
                  </p>
                </div>
                <div className="bg-background-card-light dark:bg-background-card-dark p-4 rounded-lg border border-border-primary-light dark:border-border-primary-dark">
                  <h3 className="text-sm font-semibold mb-2 text-text-heading-light dark:text-text-heading-dark">
                    Secure & Compliant
                  </h3>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
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
