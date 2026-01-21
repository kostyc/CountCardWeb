/**
 * API Logging Middleware
 * 
 * Provides automatic request/response logging for API routes with PII masking.
 * Logs request method, path, status code, duration, and sanitized request/response data.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  log,
  logStructured,
  logError,
  logPerformance,
  generateCorrelationId,
  sanitizeObject,
  type LogContext,
  type LogLevel,
} from '../utils/logger';

/**
 * Request logging options
 */
export interface ApiLoggerOptions {
  /**
   * Log level for successful requests (default: 'info')
   */
  successLogLevel?: LogLevel;
  /**
   * Log level for error responses (default: 'error')
   */
  errorLogLevel?: LogLevel;
  /**
   * Whether to log request body (default: true)
   */
  logRequestBody?: boolean;
  /**
   * Whether to log response body (default: false for security)
   */
  logResponseBody?: boolean;
  /**
   * Paths to exclude from logging
   */
  excludePaths?: string[];
  /**
   * Methods to exclude from logging
   */
  excludeMethods?: string[];
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<ApiLoggerOptions> = {
  successLogLevel: 'info',
  errorLogLevel: 'error',
  logRequestBody: true,
  logResponseBody: false,
  excludePaths: [],
  excludeMethods: [],
};

/**
 * Extract user ID from request (from auth token or headers)
 */
function extractUserId(request: NextRequest): string | undefined {
  // Try to get user ID from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  // In a real implementation, you would decode the JWT token here
  // For now, we'll just return undefined and let the API route handle it
  return undefined;
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Check various headers for IP (considering proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback (will be undefined in serverless)
  return 'unknown';
}

/**
 * Create logging context from request
 */
function createLogContext(request: NextRequest, correlationId: string): LogContext {
  const userId = extractUserId(request);
  const clientIp = getClientIp(request);
  
  return {
    requestId: correlationId,
    correlationId,
    userId,
    clientIp: clientIp !== 'unknown' ? clientIp : undefined,
    method: request.method,
    path: request.nextUrl.pathname,
  };
}

/**
 * Log API request
 */
function logRequest(
  request: NextRequest,
  context: LogContext,
  options: Required<ApiLoggerOptions>
): void {
  const requestData: Record<string, unknown> = {
    method: request.method,
    path: request.nextUrl.pathname,
    query: Object.fromEntries(request.nextUrl.searchParams),
    headers: {
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
      'content-length': request.headers.get('content-length'),
    },
  };

  // Log request body if enabled (will be sanitized)
  if (options.logRequestBody && request.method !== 'GET' && request.method !== 'HEAD') {
    // Note: Request body can only be read once, so this is a placeholder
    // In actual implementation, you'd need to clone the request or read body before handler
    requestData.body = '[Request body will be logged if available]';
  }

  logStructured(options.successLogLevel, {
    message: `API Request: ${request.method} ${request.nextUrl.pathname}`,
    level: options.successLogLevel,
    timestamp: new Date().toISOString(),
    context,
    data: sanitizeObject(requestData),
  });
}

/**
 * Log API response
 */
function logResponse(
  request: NextRequest,
  response: NextResponse,
  context: LogContext,
  duration: number,
  options: Required<ApiLoggerOptions>
): void {
  const statusCode = response.status;
  const isError = statusCode >= 400;
  const logLevel = isError ? options.errorLogLevel : options.successLogLevel;

  const responseData: Record<string, unknown> = {
    statusCode,
    duration: `${duration}ms`,
    headers: {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
    },
  };

  // Log response body if enabled (will be sanitized)
  if (options.logResponseBody) {
    // Note: Response body would need to be intercepted/cloned to log
    // This is a placeholder for the concept
    responseData.body = '[Response body logged if enabled]';
  }

  logStructured(logLevel, {
    message: `API Response: ${request.method} ${request.nextUrl.pathname} - ${statusCode}`,
    level: logLevel,
    timestamp: new Date().toISOString(),
    context,
    performance: {
      operation: `${request.method} ${request.nextUrl.pathname}`,
      duration,
      unit: 'ms',
    },
    data: sanitizeObject(responseData),
  });
}

/**
 * Check if request should be logged
 */
function shouldLogRequest(
  request: NextRequest,
  options: Required<ApiLoggerOptions>
): boolean {
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Check excluded paths
  if (options.excludePaths.some((excludedPath) => path.startsWith(excludedPath))) {
    return false;
  }

  // Check excluded methods
  if (options.excludeMethods.includes(method)) {
    return false;
  }

  return true;
}

/**
 * API route handler wrapper with automatic logging
 * 
 * @param handler - Next.js API route handler
 * @param options - Logging options
 * @returns Wrapped handler with logging
 */
export function withApiLogger<T = unknown>(
  handler: (request: NextRequest, context?: { correlationId: string }) => Promise<NextResponse<T>>,
  options: ApiLoggerOptions = {}
): (request: NextRequest) => Promise<NextResponse<T>> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  return async (request: NextRequest): Promise<NextResponse<T>> => {
    // Check if request should be logged
    if (!shouldLogRequest(request, mergedOptions)) {
      return handler(request);
    }

    const correlationId = generateCorrelationId();
    const context = createLogContext(request, correlationId);
    const startTime = Date.now();

    // Log request
    logRequest(request, context, mergedOptions);

    try {
      // Execute handler
      const response = await handler(request, { correlationId });
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Log response
      logResponse(request, response, context, duration, mergedOptions);
      
      // Add correlation ID to response headers
      response.headers.set('X-Correlation-ID', correlationId);
      
      return response;
    } catch (error) {
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Log error
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logError(errorObj, context, 'error', {
        method: request.method,
        path: request.nextUrl.pathname,
        duration: `${duration}ms`,
      });

      // Return error response
      return NextResponse.json(
        {
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            statusCode: 500,
            timestamp: new Date().toISOString(),
            correlationId,
          },
        },
        {
          status: 500,
          headers: {
            'X-Correlation-ID': correlationId,
          },
        }
      ) as unknown as NextResponse<T>;
    }
  };
}
