/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting for API endpoints to prevent abuse and DDoS attacks.
 * Admins are exempt from rate limiting.
 * Uses Firestore for rate limit storage (serverless-friendly).
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken, isAdmin } from '@/lib/permissions/server';
import { RateLimitError } from '@/lib/utils/errorHandler';
import { logWarning } from '@/lib/utils/logger';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum requests per minute
   */
  perMinute: number;
  /**
   * Maximum requests per hour
   */
  perHour: number;
  /**
   * Maximum requests per day
   */
  perDay: number;
}

/**
 * Default rate limits: 20/min, 100/hour, 500/day
 */
export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  perMinute: 20,
  perHour: 100,
  perDay: 500,
};

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;
  /**
   * Remaining requests for the current window
   */
  remaining: number;
  /**
   * Total limit for the current window
   */
  limit: number;
  /**
   * Reset timestamp (Unix timestamp in seconds)
   */
  reset: number;
  /**
   * Which limit was checked (minute, hour, or day)
   */
  window: 'minute' | 'hour' | 'day';
}

/**
 * Rate limit entry in Firestore
 */
interface RateLimitEntry {
  /**
   * User ID or IP address
   */
  identifier: string;
  /**
   * Window type (minute, hour, day)
   */
  window: 'minute' | 'hour' | 'day';
  /**
   * Window start timestamp (Unix timestamp in seconds)
   */
  windowStart: number;
  /**
   * Request count in this window
   */
  count: number;
  /**
   * Last updated timestamp
   */
  updatedAt: number;
}

/**
 * Get identifier for rate limiting (user ID or IP address)
 */
function getRateLimitIdentifier(request: NextRequest, userId: string | null): string {
  // Use user ID if authenticated, otherwise use IP address
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP address from request
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Get Firestore document ID for rate limit entry
 */
function getRateLimitDocId(identifier: string, window: 'minute' | 'hour' | 'day', windowStart: number): string {
  return `${identifier}:${window}:${windowStart}`;
}

/**
 * Get current window start timestamp
 */
function getWindowStart(window: 'minute' | 'hour' | 'day'): number {
  const now = Math.floor(Date.now() / 1000);
  
  switch (window) {
    case 'minute':
      return Math.floor(now / 60) * 60;
    case 'hour':
      return Math.floor(now / 3600) * 3600;
    case 'day':
      return Math.floor(now / 86400) * 86400;
  }
}

/**
 * Get window duration in seconds
 */
function getWindowDuration(window: 'minute' | 'hour' | 'day'): number {
  switch (window) {
    case 'minute':
      return 60;
    case 'hour':
      return 3600;
    case 'day':
      return 86400;
  }
}

/**
 * Check rate limit for a specific window
 */
async function checkWindowLimit(
  identifier: string,
  window: 'minute' | 'hour' | 'day',
  limit: number
): Promise<RateLimitResult> {
  const windowStart = getWindowStart(window);
  const windowDuration = getWindowDuration(window);
  const docId = getRateLimitDocId(identifier, window, windowStart);
  const docRef = adminDb.collection('rateLimits').doc(docId);
  
  try {
    const doc = await docRef.get();
    const now = Math.floor(Date.now() / 1000);
    
    if (!doc.exists) {
      // First request in this window - create entry
      const entry: RateLimitEntry = {
        identifier,
        window,
        windowStart,
        count: 1,
        updatedAt: now,
      };
      
      await docRef.set(entry);
      
      return {
        allowed: true,
        remaining: limit - 1,
        limit,
        reset: windowStart + windowDuration,
        window,
      };
    }
    
    const data = doc.data() as RateLimitEntry;
    
    // Check if we're still in the same window
    if (data.windowStart === windowStart) {
      // Same window - increment count
      const newCount = data.count + 1;
      const allowed = newCount <= limit;
      
      await docRef.update({
        count: newCount,
        updatedAt: now,
      });
      
      return {
        allowed,
        remaining: Math.max(0, limit - newCount),
        limit,
        reset: windowStart + windowDuration,
        window,
      };
    } else {
      // New window - reset count
      const entry: RateLimitEntry = {
        identifier,
        window,
        windowStart,
        count: 1,
        updatedAt: now,
      };
      
      await docRef.set(entry);
      
      return {
        allowed: true,
        remaining: limit - 1,
        limit,
        reset: windowStart + windowDuration,
        window,
      };
    }
  } catch (error) {
    // On error, allow the request but log the error
    logWarning('Rate limit check failed', 'rateLimiter', {
      identifier: identifier.replace(/^(user|ip):/, '***'),
      window,
      error: error instanceof Error ? error.message : String(error),
    });
    
    // Fail open - allow request if rate limit check fails
    return {
      allowed: true,
      remaining: limit,
      limit,
      reset: windowStart + windowDuration,
      window,
    };
  }
}

/**
 * Check rate limits for all windows
 * Returns the most restrictive limit result
 */
async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Check all windows in parallel
  const [minuteResult, hourResult, dayResult] = await Promise.all([
    checkWindowLimit(identifier, 'minute', config.perMinute),
    checkWindowLimit(identifier, 'hour', config.perHour),
    checkWindowLimit(identifier, 'day', config.perDay),
  ]);
  
  // Return the most restrictive (first one that's not allowed)
  if (!minuteResult.allowed) {
    return minuteResult;
  }
  if (!hourResult.allowed) {
    return hourResult;
  }
  if (!dayResult.allowed) {
    return dayResult;
  }
  
  // All allowed - return the most restrictive remaining count
  const results = [minuteResult, hourResult, dayResult];
  const mostRestrictive = results.reduce((prev, curr) => 
    curr.remaining < prev.remaining ? curr : prev
  );
  
  return mostRestrictive;
}

/**
 * Check if user is admin and should be exempt from rate limiting
 */
async function shouldExemptFromRateLimit(userId: string | null): Promise<boolean> {
  if (!userId) {
    return false;
  }
  
  try {
    return await isAdmin(userId);
  } catch (error) {
    logWarning('Failed to check admin status for rate limit exemption', 'rateLimiter', {
      userId: userId ? userId.substring(0, 8) + '***' : 'null',
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  /**
   * Custom rate limit configuration (defaults to DEFAULT_RATE_LIMITS)
   */
  config?: RateLimitConfig;
  /**
   * Whether to enable rate limiting (default: true)
   */
  enabled?: boolean;
}

/**
 * Check rate limit for a request
 */
export async function checkRequestRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { config = DEFAULT_RATE_LIMITS, enabled = true } = options;
  
  // If rate limiting is disabled, allow all requests
  if (!enabled) {
    return {
      allowed: true,
      remaining: config.perMinute,
      limit: config.perMinute,
      reset: Math.floor(Date.now() / 1000) + 60,
      window: 'minute',
    };
  }
  
  // Verify authentication token
  const token = await verifyAuthToken(request);
  const userId = token?.uid || null;
  
  // Check if user is admin (exempt from rate limiting)
  if (userId && await shouldExemptFromRateLimit(userId)) {
    return {
      allowed: true,
      remaining: config.perMinute,
      limit: config.perMinute,
      reset: Math.floor(Date.now() / 1000) + 60,
      window: 'minute',
    };
  }
  
  // Get identifier for rate limiting
  const identifier = getRateLimitIdentifier(request, userId);
  
  // Check rate limits
  return await checkRateLimit(identifier, config);
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  response.headers.set('X-RateLimit-Window', result.window);
  
  return response;
}

/**
 * API route handler type
 */
type RouteHandler = (
  request: NextRequest
) => Promise<NextResponse>;

/**
 * Wrapper for API route handlers with rate limiting
 */
export function withRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions = {}
): RouteHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResult = await checkRequestRateLimit(request, options);
    
    // Add rate limit headers to response (will be added even if rate limited)
    let response: NextResponse;
    
    if (!rateLimitResult.allowed) {
      // Rate limit exceeded
      const errorResponse = NextResponse.json(
        {
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_ERROR',
            statusCode: 429,
            timestamp: new Date().toISOString(),
            retryAfter: rateLimitResult.reset - Math.floor(Date.now() / 1000),
          },
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      addRateLimitHeaders(errorResponse, rateLimitResult);
      
      // Log rate limit violation (without PII)
      logWarning('Rate limit exceeded', 'rateLimiter', {
        path: request.nextUrl.pathname,
        method: request.method,
        window: rateLimitResult.window,
        limit: rateLimitResult.limit,
        identifier: rateLimitResult.window === 'minute' ? '***' : '***', // Mask identifier
      });
      
      return errorResponse;
    }
    
    // Execute handler
    response = await handler(request);
    
    // Add rate limit headers to successful response
    addRateLimitHeaders(response, rateLimitResult);
    
    return response;
  };
}
