/**
 * Count Card Validation Schemas
 * 
 * Zod schemas for validating count card creation and updates.
 * Includes timestamp, location, status, and workflow state validation.
 */

import { z } from 'zod';
import { platoonSchema, battalionSchema, companySchema } from './recruitSchemas';
import { regimentSchema } from './userProfileSchemas';

/**
 * Count card status validation
 */
export const countCardStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'consolidated',
]);

/**
 * Workflow state validation
 *
 * MCRD count card chain (Depot Order 1513.6):
 * - draft: DI/SDI editing
 * - submitted: Platoon card submitted to Senior Drill Instructor
 * - under_review: SDI consolidated; awaiting Chief Drill Instructor
 * - approved: CDI validated; awaiting Company 1stSgt / Series Commander
 * - rejected: Returned to originator
 * - consolidated: 1stSgt or Series Commander forwarded; awaiting BSM / Company leadership
 * - final_approval: Battalion SgtMaj / Company XO / Commander signed off
 */
export const workflowStateSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'consolidated',
  'final_approval',
]);

/**
 * Count card ID validation
 */
export const countCardIdSchema = z
  .string()
  .min(1, 'Count card ID is required')
  .max(100, 'Count card ID must be 100 characters or less');

/**
 * Location validation
 */
export const locationSchema = z
  .string()
  .min(1, 'Location is required')
  .max(200, 'Location must be 200 characters or less')
  .trim();

/**
 * Timestamp validation (ISO 8601 date string or Date object)
 */
export const timestampSchema = z.union([
  z.string().datetime('Invalid timestamp format'),
  z.date(),
]);

/**
 * User ID validation (Firebase UID format: 28 characters alphanumeric)
 */
export const userIdSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]{28}$/, 'Invalid user ID format (must be 28 alphanumeric characters)')
  .min(28, 'User ID must be 28 characters')
  .max(28, 'User ID must be 28 characters');

/**
 * Recruit status counts validation
 * Map of recruit status to count
 */
export const recruitCountsSchema = z.record(
  z.string(),
  z.number().int().min(0, 'Count must be non-negative')
);

/**
 * Workflow history entry schema
 */
export const workflowHistoryEntrySchema = z.object({
  state: workflowStateSchema,
  timestamp: timestampSchema,
  userId: userIdSchema,
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

/**
 * Workflow history schema
 */
export const workflowHistorySchema = z.array(workflowHistoryEntrySchema);

/**
 * Count card creation schema
 */
export const countCardCreateSchema = z.object({
  countCardId: countCardIdSchema,
  platoon: platoonSchema,
  company: companySchema,
  battalion: battalionSchema,
  regiment: regimentSchema.optional(),
  status: countCardStatusSchema,
  workflowState: workflowStateSchema,
  submittedBy: userIdSchema,
  submittedTo: userIdSchema.optional(),
  location: locationSchema,
  timestamp: timestampSchema,
  recruitCounts: recruitCountsSchema.optional(),
  workflowHistory: workflowHistorySchema.optional(),
  encryptedData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Count card update schema
 */
export const countCardUpdateSchema = z.object({
  countCardId: countCardIdSchema,
  platoon: platoonSchema.optional(),
  company: companySchema,
  battalion: battalionSchema,
  regiment: regimentSchema.optional(),
  status: countCardStatusSchema.optional(),
  workflowState: workflowStateSchema.optional(),
  submittedTo: userIdSchema.optional(),
  approvedBy: userIdSchema.optional(),
  rejectedBy: userIdSchema.optional(),
  location: locationSchema.optional(),
  timestamp: timestampSchema.optional(),
  recruitCounts: recruitCountsSchema.optional(),
  workflowHistory: workflowHistorySchema.optional(),
  encryptedData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Count card query/filter schema
 */
export const countCardQuerySchema = z.object({
  platoon: platoonSchema.optional(),
  company: z.string().optional(),
  battalion: z.string().optional(),
  regiment: regimentSchema.optional(),
  status: countCardStatusSchema.optional(),
  workflowState: workflowStateSchema.optional(),
  submittedBy: userIdSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Type exports for TypeScript inference
 */
export type CountCardCreateInput = z.infer<typeof countCardCreateSchema>;
export type CountCardUpdateInput = z.infer<typeof countCardUpdateSchema>;
export type CountCardQueryInput = z.infer<typeof countCardQuerySchema>;
export type CountCardStatus = z.infer<typeof countCardStatusSchema>;
export type WorkflowState = z.infer<typeof workflowStateSchema>;
export type WorkflowHistoryEntry = z.infer<typeof workflowHistoryEntrySchema>;
