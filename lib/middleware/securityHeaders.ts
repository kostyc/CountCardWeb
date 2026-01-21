/**
 * Security Headers Middleware
 * 
 * Implements security headers for all API routes and pages to enhance application security.
 * Includes CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and HSTS.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { CorsOptions } from './cors';

/**
 * Security headers configuration
 */
export interface SecurityHeadersOptions {
  /**
   * Content Security Policy
   * Default allows Firebase, Google APIs, and self
   */
  contentSecurityPolicy?: string;
  /**
   * X-Frame-Options value
   * Default: DENY
   */
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  /**
   * X-Content-Type-Options value
   * Default: nosniff
   */
  contentTypeOptions?: 'nosniff' | 'none';
  /**
   * Referrer-Policy value
   * Default: strict-origin-when-cross-origin
   */
  referrerPolicy?: string;
  /**
   * Permissions-Policy value
   * Default restricts most features
   */
  permissionsPolicy?: string;
  /**
   * Strict-Transport-Security (HSTS) value
   * Only set in production with HTTPS
   */
  strictTransportSecurity?: string;
}

/**
 * Default Content Security Policy
 * Allows Firebase, Google APIs, and self
 */
const DEFAULT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com https://*.googleapis.com https://www.gstatic.com https://www.google.com https://www.gstatic.com/recaptcha",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  "connect-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://*.google.com https://www.google.com https://www.gstatic.com wss://*.firebaseio.com",
  "frame-src 'self' https://*.firebaseapp.com https://www.google.com https://www.gstatic.com/recaptcha",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

/**
 * Default Permissions-Policy
 * Restricts most browser features for security
 */
const DEFAULT_PERMISSIONS_POLICY = [
  'accelerometer=()',
  'ambient-light-sensor=()',
  'autoplay=()',
  'battery=()',
  'camera=()',
  'cross-origin-isolated=()',
  'display-capture=()',
  'document-domain=()',
  'encrypted-media=()',
  'execution-while-not-rendered=()',
  'execution-while-out-of-viewport=()',
  'fullscreen=(self)',
  'geolocation=()',
  'gyroscope=()',
  'keyboard-map=()',
  'magnetometer=()',
  'microphone=()',
  'midi=()',
  'navigation-override=()',
  'payment=()',
  'picture-in-picture=()',
  'publickey-credentials-get=()',
  'screen-wake-lock=()',
  'sync-xhr=()',
  'usb=()',
  'web-share=()',
  'xr-spatial-tracking=()',
].join(', ');

/**
 * Default security headers options
 */
const DEFAULT_OPTIONS: Required<Omit<SecurityHeadersOptions, 'strictTransportSecurity'>> & {
  strictTransportSecurity?: string;
} = {
  contentSecurityPolicy: DEFAULT_CSP,
  frameOptions: 'DENY',
  contentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: DEFAULT_PERMISSIONS_POLICY,
  strictTransportSecurity: undefined, // Only set in production with HTTPS
};

/**
 * Get HSTS header value
 * Only set in production with HTTPS
 */
function getHSTSHeader(): string | undefined {
  // Only set HSTS in production
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }
  
  // Check if we're using HTTPS (via environment variable or request)
  // For now, we'll set it if in production (assumes HTTPS in production)
  // In a real deployment, you might want to check the request protocol
  return 'max-age=31536000; includeSubDomains; preload';
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(
  response: NextResponse,
  options: SecurityHeadersOptions
): NextResponse {
  // Content-Security-Policy
  if (options.contentSecurityPolicy !== undefined) {
    response.headers.set('Content-Security-Policy', options.contentSecurityPolicy);
  }
  
  // X-Frame-Options
  if (options.frameOptions) {
    response.headers.set('X-Frame-Options', options.frameOptions);
  }
  
  // X-Content-Type-Options
  if (options.contentTypeOptions === 'nosniff') {
    response.headers.set('X-Content-Type-Options', 'nosniff');
  }
  
  // Referrer-Policy
  if (options.referrerPolicy !== undefined) {
    response.headers.set('Referrer-Policy', options.referrerPolicy);
  }
  
  // Permissions-Policy
  if (options.permissionsPolicy !== undefined) {
    response.headers.set('Permissions-Policy', options.permissionsPolicy);
  }
  
  // Strict-Transport-Security (HSTS)
  const hsts = options.strictTransportSecurity ?? getHSTSHeader();
  if (hsts) {
    response.headers.set('Strict-Transport-Security', hsts);
  }
  
  return response;
}

/**
 * Security headers middleware wrapper for API route handlers
 * 
 * @param handler - Next.js API route handler
 * @param options - Security headers configuration options
 * @returns Wrapped handler with security headers
 */
export function withSecurityHeaders<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: SecurityHeadersOptions = {}
): (request: NextRequest) => Promise<NextResponse<T>> {
  // Merge options with defaults
  const mergedOptions: SecurityHeadersOptions = {
    contentSecurityPolicy: options.contentSecurityPolicy ?? DEFAULT_OPTIONS.contentSecurityPolicy,
    frameOptions: options.frameOptions ?? DEFAULT_OPTIONS.frameOptions,
    contentTypeOptions: options.contentTypeOptions ?? DEFAULT_OPTIONS.contentTypeOptions,
    referrerPolicy: options.referrerPolicy ?? DEFAULT_OPTIONS.referrerPolicy,
    permissionsPolicy: options.permissionsPolicy ?? DEFAULT_OPTIONS.permissionsPolicy,
    strictTransportSecurity: options.strictTransportSecurity ?? DEFAULT_OPTIONS.strictTransportSecurity,
  };
  
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    // Execute handler
    const response = await handler(request);
    
    // Apply security headers to response
    return applySecurityHeaders(response, mergedOptions) as NextResponse<T>;
  };
}

/**
 * Combined middleware wrapper with both CORS and security headers
 * 
 * @param handler - Next.js API route handler
 * @param corsOptions - CORS configuration options
 * @param securityOptions - Security headers configuration options
 * @returns Wrapped handler with CORS and security headers
 */
export function withCORSAndSecurityHeaders<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  corsOptions?: CorsOptions,
  securityOptions?: SecurityHeadersOptions
): (request: NextRequest) => Promise<NextResponse<T>> {
  // Lazy import to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withCORS } = require('./cors');
  const handlerWithSecurity = withSecurityHeaders(handler, securityOptions);
  return withCORS(handlerWithSecurity, corsOptions);
}
