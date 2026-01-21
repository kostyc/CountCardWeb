/**
 * Admin Log Validation Schemas
 * 
 * Zod schemas for validating admin log entry creation.
 * Admin logs are immutable and cannot be updated or deleted.
 */

import { z } from 'zod';

/**
 * Admin action type validation
 */
export const adminActionTypeSchema = z.enum([
  'create',
  'update',
  'delete',
  'approve',
  'reject',
  'assign',
  'unassign',
  'export',
  'import',
  'other',
]);

/**
 * Resource type validation
 */
export const resourceTypeSchema = z.enum([
  'recruit',
  'countCard',
  'userProfile',
  'emergencyContact',
  'conversation',
  'platoon',
  'logo',
  'other',
]);

/**
 * Log ID validation
 */
export const logIdSchema = z
  .string()
  .min(1, 'Log ID is required')
  .max(100, 'Log ID must be 100 characters or less');

/**
 * User ID validation
 */
export const adminLogUserIdSchema = z
  .string()
  .min(1, 'User ID is required')
  .max(100, 'User ID must be 100 characters or less');

/**
 * Resource ID validation
 */
export const resourceIdSchema = z
  .string()
  .min(1, 'Resource ID is required')
  .max(100, 'Resource ID must be 100 characters or less');

/**
 * Action description validation
 */
export const actionDescriptionSchema = z
  .string()
  .min(1, 'Action description is required')
  .max(1000, 'Action description must be 1000 characters or less')
  .trim();

/**
 * IP address validation
 */
export const ipAddressSchema = z
  .string()
  .regex(
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
    'IP address must be a valid IPv4 or IPv6 address'
  )
  .optional();

/**
 * User agent validation
 */
export const userAgentSchema = z
  .string()
  .max(500, 'User agent must be 500 characters or less')
  .optional();

/**
 * Admin Log Entry Input Schema (for creation)
 * Admin logs are immutable - no update schema needed
 */
export const adminLogEntryInputSchema = z.object({
  logId: logIdSchema,
  userId: adminLogUserIdSchema,
  action: adminActionTypeSchema,
  resourceType: resourceTypeSchema,
  resourceId: resourceIdSchema,
  description: actionDescriptionSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.union([z.date(), z.string()]),
  ipAddress: ipAddressSchema,
  userAgent: userAgentSchema,
});

/**
 * Admin Log Query Schema (for filtering)
 */
export const adminLogQuerySchema = z.object({
  userId: adminLogUserIdSchema.optional(),
  action: adminActionTypeSchema.optional(),
  resourceType: resourceTypeSchema.optional(),
  resourceId: resourceIdSchema.optional(),
  startDate: z.union([z.date(), z.string()]).optional(),
  endDate: z.union([z.date(), z.string()]).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

/**
 * Type exports
 */
export type AdminActionType = z.infer<typeof adminActionTypeSchema>;
export type ResourceType = z.infer<typeof resourceTypeSchema>;
export type AdminLogEntryInput = z.infer<typeof adminLogEntryInputSchema>;
export type AdminLogQuery = z.infer<typeof adminLogQuerySchema>;
