/**
 * API Error Handler
 * 
 * Provides error handling utilities for API routes.
 * Ensures consistent error responses and proper logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { formatErrorResponse, handleError, AppError, isOperationalError } from './errorHandler';
import { logError } from './logger';

/**
 * Handle errors in API routes
 */
export function handleApiError(
  error: Error | AppError,
  request: NextRequest
): NextResponse {
  const path = request.nextUrl.pathname;
  
  // Log the error
  handleError(error, `API:${path}`);
  
  // Format error response
  const errorResponse = formatErrorResponse(error, path);
  
  // Determine status code
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  
  return NextResponse.json(errorResponse, { status: statusCode });
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error as Error, request);
    }
  };
}

/**
 * Validate request and handle validation errors
 */
export function validateRequest<T>(
  data: unknown,
  validator: (data: unknown) => data is T
): T {
  if (!validator(data)) {
    throw new AppError('Invalid request data', 400, 'VALIDATION_ERROR');
  }
  return data;
}
