'use client';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error with context
    logError(error, 'ErrorBoundary', 'error', {
      componentStack: errorInfo.componentStack,
    });

    // TODO: In Sprint 14, integrate with Google Cloud Error Reporting
    // For now, errors are logged to console with PII masking
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background-primary-light dark:bg-background-primary-dark p-4">
          <div className="max-w-md w-full bg-card-light dark:bg-card-dark p-6 rounded-lg border border-border-primary-light dark:border-border-primary-dark">
            <h1 className="text-h4 text-text-heading-light dark:text-text-heading-dark mb-4">
              Something went wrong
            </h1>
            <p className="text-body text-text-secondary-light dark:text-text-secondary-dark mb-6">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-button-primary-bg-light dark:bg-button-primary-bg-dark text-button-text rounded hover:bg-button-primary-hover-light dark:hover:bg-button-primary-hover-dark transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-button-secondary-bg-light dark:bg-button-secondary-bg-dark text-button-text rounded hover:bg-button-secondary-hover-light dark:hover:bg-button-secondary-hover-dark transition-colors"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6">
                <summary className="cursor-pointer text-small text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-caption bg-background-tertiary-light dark:bg-background-tertiary-dark p-4 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
