/**
 * API route middleware composition
 * Applies CORS then rate limiting to API handlers.
 * Supports Next.js App Router route context (params) for dynamic segments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCORS } from './cors';
import { withRateLimit } from './rateLimiter';

/**
 * Context passed to dynamic route handlers (e.g. { params: Promise<{ id: string }> })
 */
export type ApiRouteContext = { params?: Promise<Record<string, string>> };

/**
 * API route handler type with optional context
 */
export type ApiRouteHandler<C = ApiRouteContext> = (
  request: NextRequest,
  context?: C
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with CORS and rate limiting.
 * Use for all app/api route handlers.
 *
 * @param handler - Async handler (request, context?) => NextResponse
 * @returns Wrapped handler with same signature
 */
export function withApiMiddleware<C = ApiRouteContext>(
  handler: ApiRouteHandler<C>
): ApiRouteHandler<C> {
  return async (request: NextRequest, context?: C): Promise<NextResponse> => {
    const rateLimitedHandler = withRateLimit((r: NextRequest) => handler(r, context));
    const response = await rateLimitedHandler(request);
    const corsWrapper = withCORS(async () => response);
    return corsWrapper(request);
  };
}
