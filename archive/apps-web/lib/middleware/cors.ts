/**
 * CORS (Cross-Origin Resource Sharing) Middleware
 * 
 * Implements CORS for API routes to control which origins can access the API.
 * Uses ALLOWED_ORIGINS environment variable for configuration.
 * No wildcards allowed in production (security requirement).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllowedOrigins } from '@/lib/utils/env';
import { logWarning } from '@/lib/utils/logger';

/**
 * CORS configuration options
 */
export interface CorsOptions {
  /**
   * Allowed origins (defaults to ALLOWED_ORIGINS env var)
   */
  allowedOrigins?: string[];
  /**
   * Whether to allow credentials (cookies, authorization headers)
   */
  allowCredentials?: boolean;
  /**
   * Allowed HTTP methods
   */
  allowedMethods?: string[];
  /**
   * Allowed headers
   */
  allowedHeaders?: string[];
  /**
   * Exposed headers (headers that can be accessed by client)
   */
  exposedHeaders?: string[];
  /**
   * Max age for preflight requests (in seconds)
   */
  maxAge?: number;
}

/**
 * Default CORS options
 */
const DEFAULT_OPTIONS: Required<Omit<CorsOptions, 'allowedOrigins'>> & { allowedOrigins: string[] } = {
  allowedOrigins: [],
  allowCredentials: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Correlation-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-RateLimit-Window',
    'X-Correlation-ID',
  ],
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  // In production, no wildcards allowed
  if (process.env.NODE_ENV === 'production') {
    return allowedOrigins.includes(origin);
  }
  
  // In development, allow exact matches
  return allowedOrigins.includes(origin);
}

/**
 * Get origin from request
 */
function getOrigin(request: NextRequest): string | null {
  return request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || null;
}

/**
 * Handle preflight OPTIONS request
 */
function handlePreflight(request: NextRequest, options: Required<CorsOptions>): NextResponse {
  const origin = getOrigin(request);
  
  // If no origin, allow the request (same-origin)
  if (!origin) {
    return new NextResponse(null, { status: 204 });
  }
  
  // Check if origin is allowed
  if (!isOriginAllowed(origin, options.allowedOrigins)) {
    logWarning(`CORS: Blocked preflight request from origin: ${origin}`);
    return new NextResponse(
      JSON.stringify({
        error: {
          message: 'CORS policy: Origin not allowed',
          code: 'CORS_ORIGIN_NOT_ALLOWED',
        },
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  // Build response headers
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', options.allowedMethods.join(', '));
  headers.set('Access-Control-Allow-Headers', options.allowedHeaders.join(', '));
  headers.set('Access-Control-Max-Age', String(options.maxAge));
  
  if (options.exposedHeaders.length > 0) {
    headers.set('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
  }
  
  if (options.allowCredentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Apply CORS headers to response
 */
function applyCorsHeaders(
  request: NextRequest,
  response: NextResponse,
  options: Required<CorsOptions>
): NextResponse {
  const origin = getOrigin(request);
  
  // If no origin, return response as-is (same-origin request)
  if (!origin) {
    return response;
  }
  
  // Check if origin is allowed
  if (!isOriginAllowed(origin, options.allowedOrigins)) {
    logWarning(`CORS: Blocked request from origin: ${origin}`);
    return NextResponse.json(
      {
        error: {
          message: 'CORS policy: Origin not allowed',
          code: 'CORS_ORIGIN_NOT_ALLOWED',
        },
      },
      {
        status: 403,
      }
    );
  }
  
  // Apply CORS headers
  response.headers.set('Access-Control-Allow-Origin', origin);
  
  if (options.allowCredentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  if (options.exposedHeaders.length > 0) {
    response.headers.set('Access-Control-Expose-Headers', options.exposedHeaders.join(', '));
  }
  
  return response;
}

/**
 * CORS middleware wrapper for API route handlers
 * 
 * @param handler - Next.js API route handler
 * @param options - CORS configuration options
 * @returns Wrapped handler with CORS support
 */
export function withCORS<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  options: CorsOptions = {}
): (request: NextRequest) => Promise<NextResponse<T>> {
  // Merge options with defaults
  const allowedOrigins = options.allowedOrigins || getAllowedOrigins();
  const mergedOptions: Required<CorsOptions> = {
    allowedOrigins,
    allowCredentials: options.allowCredentials ?? DEFAULT_OPTIONS.allowCredentials,
    allowedMethods: options.allowedMethods ?? DEFAULT_OPTIONS.allowedMethods,
    allowedHeaders: options.allowedHeaders ?? DEFAULT_OPTIONS.allowedHeaders,
    exposedHeaders: options.exposedHeaders ?? DEFAULT_OPTIONS.exposedHeaders,
    maxAge: options.maxAge ?? DEFAULT_OPTIONS.maxAge,
  };
  
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return handlePreflight(request, mergedOptions) as NextResponse<T>;
    }
    
    // Execute handler
    const response = await handler(request);
    
    // Apply CORS headers to response
    return applyCorsHeaders(request, response, mergedOptions) as NextResponse<T>;
  };
}
