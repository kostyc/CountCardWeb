/**
 * Recruit Validation Schemas
 * 
 * Zod schemas for validating recruit profile creation and updates.
 * Includes recruit name, rank, status, and platoon assignment validation.
 */

import { z } from 'zod';
import { usmcRankSchema } from './userProfileSchemas';
import { regimentSchema } from './userProfileSchemas';

/**
 * Recruit status validation
 */
export const recruitStatusSchema = z.enum([
  'active',
  'inactive',
  'transferred',
  'graduated',
  'separated',
  'medical_hold',
  'other',
]);

/**
 * Recruit name validation
 */
export const recruitNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

/**
 * Platoon validation (4-digit string format)
 */
export const platoonSchema = z
  .string()
  .regex(/^\d{4}$/, 'Platoon must be a 4-digit string')
  .min(4, 'Platoon must be exactly 4 digits')
  .max(4, 'Platoon must be exactly 4 digits');

/**
 * Battalion validation
 */
export const battalionSchema = z
  .string()
  .min(1, 'Battalion is required if provided')
  .max(50, 'Battalion must be 50 characters or less')
  .optional();

/**
 * Company validation
 */
export const companySchema = z
  .string()
  .min(1, 'Company is required if provided')
  .max(50, 'Company must be 50 characters or less')
  .optional();

/**
 * Series validation
 */
export const seriesSchema = z
  .string()
  .min(1, 'Series is required if provided')
  .max(50, 'Series must be 50 characters or less')
  .optional();

/**
 * Recruit ID validation
 */
export const recruitIdSchema = z
  .string()
  .min(1, 'Recruit ID is required')
  .max(100, 'Recruit ID must be 100 characters or less');

/**
 * URL schema for recruit photos
 */
export const photoUrlSchema = z
  .string()
  .url('Invalid URL format')
  .max(500, 'URL must be 500 characters or less')
  .optional();

/**
 * Recruit profile creation schema
 */
export const recruitCreateSchema = z.object({
  recruitId: recruitIdSchema,
  firstName: recruitNameSchema,
  lastName: recruitNameSchema,
  rank: usmcRankSchema,
  status: recruitStatusSchema,
  regiment: regimentSchema.optional(),
  battalion: battalionSchema,
  company: companySchema,
  series: seriesSchema,
  platoon: platoonSchema,
  photoUrl: photoUrlSchema,
  // Encrypted data will be validated separately
  encryptedData: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string().min(1, 'Created by user ID is required'),
});

/**
 * Recruit profile update schema
 * All fields optional except recruitId
 */
export const recruitUpdateSchema = z.object({
  recruitId: recruitIdSchema,
  firstName: recruitNameSchema.optional(),
  lastName: recruitNameSchema.optional(),
  rank: usmcRankSchema.optional(),
  status: recruitStatusSchema.optional(),
  regiment: regimentSchema.optional(),
  battalion: battalionSchema,
  company: companySchema,
  series: seriesSchema,
  platoon: platoonSchema.optional(),
  photoUrl: photoUrlSchema,
  encryptedData: z.record(z.string(), z.unknown()).optional(),
  updatedBy: z.string().min(1, 'Updated by user ID is required'),
});

/**
 * Recruit query/filter schema
 */
export const recruitQuerySchema = z.object({
  platoon: platoonSchema.optional(),
  company: z.string().optional(),
  battalion: z.string().optional(),
  regiment: regimentSchema.optional(),
  status: recruitStatusSchema.optional(),
  rank: usmcRankSchema.optional(),
  search: z.string().max(100, 'Search term must be 100 characters or less').optional(),
});

/**
 * Type exports for TypeScript inference
 */
export type RecruitCreateInput = z.infer<typeof recruitCreateSchema>;
export type RecruitUpdateInput = z.infer<typeof recruitUpdateSchema>;
export type RecruitQueryInput = z.infer<typeof recruitQuerySchema>;
export type RecruitStatus = z.infer<typeof recruitStatusSchema>;
