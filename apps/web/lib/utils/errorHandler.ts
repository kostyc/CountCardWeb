/**
 * Error Handling Utilities
 * 
 * Provides centralized error handling, formatting, and logging utilities.
 * All errors are sanitized to prevent PII exposure.
 */

import { sanitizeForLogging } from './logger';

/**
 * Custom error types for the application
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

export class EncryptionError extends AppError {
  constructor(message: string = 'Encryption operation failed') {
    super(message, 500, 'ENCRYPTION_ERROR');
  }
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path?: string;
  };
}

/**
 * Format error for API response
 * Sanitizes error to prevent PII exposure
 */
export function formatErrorResponse(
  error: Error | AppError,
  path?: string
): ErrorResponse {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const code = isAppError ? error.code : 'INTERNAL_ERROR';
  
  // Use sanitized message for user-facing errors
  const message = isAppError && error.isOperational
    ? error.message
    : 'An internal error occurred';

  return {
    error: {
      message: sanitizeForLogging(message),
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: path ? sanitizeForLogging(path) : undefined,
    },
  };
}

/**
 * Check if error is an operational error (expected, handled)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Handle and log error appropriately
 */
export function handleError(error: Error, context?: string): void {
  // Import logger here to avoid circular dependencies
  const { logError } = require('./logger');
  
  if (isOperationalError(error)) {
    // Operational errors are expected and logged at info level
    logError(error, context, 'info');
  } else {
    // Programming errors are unexpected and logged at error level
    logError(error, context, 'error');
  }
}

/**
 * Firebase Auth Error interface
 */
interface FirebaseAuthError extends Error {
  code?: string;
}

/**
 * Translate Firebase authentication errors to user-friendly messages
 * Follows security best practices by not revealing whether an email exists
 */
export function translateFirebaseAuthError(error: Error | FirebaseAuthError): string {
  const firebaseError = error as FirebaseAuthError;
  const errorCode = firebaseError.code || '';

  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      // Security: Don't reveal if email exists or which credential is wrong
      return 'Invalid email or password. Please check your credentials and try again.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support for assistance.';
    
    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Please try again later or reset your password.';
    
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    
    case 'auth/requires-recent-login':
      return 'This operation requires recent authentication. Please sign in again.';
    
    case 'auth/credential-already-in-use':
      return 'This account is already linked to another user. Please sign in with that account instead.';
    
    case 'auth/provider-already-linked':
      return 'This provider is already linked to your account.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    
    case 'auth/cancelled-popup-request':
      return 'Only one popup request is allowed at a time. Please try again.';
    
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups and try again.';
    
    case 'auth/invalid-verification-code':
      return 'Invalid verification code. Please check the code and try again.';
    
    case 'auth/invalid-verification-id':
      return 'Invalid verification. Please request a new code.';
    
    case 'auth/missing-verification-code':
      return 'Verification code is required. Please enter the code.';
    
    case 'auth/missing-verification-id':
      return 'Verification session expired. Please try again.';
    
    case 'auth/quota-exceeded':
      return 'Service quota exceeded. Please try again later.';
    
    case 'auth/app-not-authorized':
      return 'This app is not authorized. Please contact support.';
    
    default:
      // For unknown errors, provide a generic message
      // Check if it's a Firebase error by message content
      if (error.message.includes('Firebase') || error.message.includes('auth/')) {
        return 'Authentication failed. Please try again or contact support if the problem persists.';
      }
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}
