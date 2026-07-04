/**
 * Validation Utilities
 * 
 * Provides utility functions for validating and parsing data with Zod schemas.
 * Includes error formatting for user-friendly API responses.
 */

import { z, ZodError, ZodSchema, ZodTypeAny } from 'zod';
import { logError } from '@countcard/core/logger';

/**
 * Validation error details
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code: string;
}

/**
 * Formatted validation error response
 */
export interface ValidationErrorResponse {
  success: false;
  error: 'Validation Error';
  details: ValidationErrorDetail[];
  message: string;
}

/**
 * Validate request data and return typed data
 * Throws ZodError if validation fails
 * 
 * @param data - Data to validate
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ZodError if validation fails
 */
export function validateRequest<T>(
  data: unknown,
  schema: ZodSchema<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      logError(
        new Error(`Validation failed: ${error.message}`),
        'validation.validateRequest',
        'warn',
        { errors: error.issues }
      );
      throw error;
    }
    throw error;
  }
}

/**
 * Validate and parse data, returning typed data
 * Same as validateRequest but with clearer naming
 * 
 * @param data - Data to validate
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data
 * @throws ZodError if validation fails
 */
export function validateAndParse<T>(
  data: unknown,
  schema: ZodSchema<T>
): T {
  return validateRequest(data, schema);
}

/**
 * Validate optional data
 * Returns undefined if data is null/undefined, otherwise validates
 * 
 * @param data - Data to validate (may be undefined)
 * @param schema - Zod schema to validate against
 * @returns Validated and typed data, or undefined
 * @throws ZodError if validation fails (when data is provided)
 */
export function validateOptional<T>(
  data: unknown,
  schema: ZodSchema<T>
): T | undefined {
  if (data === null || data === undefined) {
    return undefined;
  }
  return validateRequest(data, schema);
}

/**
 * Format Zod error for API response
 * Creates user-friendly error messages
 * 
 * @param error - ZodError instance
 * @returns Formatted validation error response
 */
export function formatValidationError(
  error: ZodError
): ValidationErrorResponse {
  const details: ValidationErrorDetail[] = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  const message = `Validation failed: ${details.map((d) => d.message).join('; ')}`;

  return {
    success: false,
    error: 'Validation Error',
    details,
    message,
  };
}

/**
 * Safe validation - returns result instead of throwing
 * Useful for form validation where you want to handle errors gracefully
 * 
 * @param data - Data to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result with success flag
 */
export function safeValidate<T>(
  data: unknown,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; error: ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Validate array of items
 * 
 * @param data - Array data to validate
 * @param itemSchema - Schema for each array item
 * @returns Validated array
 * @throws ZodError if validation fails
 */
export function validateArray<T extends ZodTypeAny>(
  data: unknown,
  itemSchema: T
): z.infer<T>[] {
  const schema = z.array(itemSchema);
  return validateRequest(data, schema);
}

/**
 * Validate pagination parameters
 * 
 * @param page - Page number (1-based)
 * @param limit - Items per page
 * @param maxLimit - Maximum allowed limit
 * @returns Validated pagination params
 */
export function validatePagination(
  page: unknown,
  limit: unknown,
  maxLimit: number = 100
): { page: number; limit: number } {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : typeof page === 'number' ? page : 1;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : typeof limit === 'number' ? limit : 20;
  
  const validated = z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(maxLimit).default(20),
  }).parse({
    page: isNaN(pageNum) ? 1 : pageNum,
    limit: isNaN(limitNum) ? 20 : Math.min(limitNum, maxLimit),
  });
  
  return validated;
}
