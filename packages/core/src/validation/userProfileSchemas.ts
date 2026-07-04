/**
 * User Profile Validation Schemas
 * 
 * Zod schemas for validating user profile creation and updates.
 * Includes rank validation, organizational assignment validation, and role validation.
 */

import { z } from 'zod';
import type { USMCRank, UserRole, Regiment } from '@countcard/core/types/auth';

/**
 * USMC Rank validation
 * Enlisted: E-5 through E-9
 * Officer: O-1 through O-6
 */
export const usmcRankSchema = z.enum([
  // Enlisted Ranks (E-5 through E-9)
  'Sgt', // E-5: Sergeant
  'SSgt', // E-6: Staff Sergeant
  'GySgt', // E-7: Gunnery Sergeant
  'MSgt', // E-8: Master Sergeant
  '1stSgt', // E-8: First Sergeant
  'MGySgt', // E-9: Master Gunnery Sergeant
  'SgtMaj', // E-9: Sergeant Major
  'SgtMajMC', // E-9: Sergeant Major of the Marine Corps
  // Officer Ranks (O-1 through O-6)
  '2ndLt', // O-1: Second Lieutenant
  '1stLt', // O-2: First Lieutenant
  'Capt', // O-3: Captain
  'Maj', // O-4: Major
  'LtCol', // O-5: Lieutenant Colonel
  'Col', // O-6: Colonel
]) as z.ZodType<USMCRank>;

/**
 * User role validation
 */
export const userRoleSchema = z.enum([
  'drill_instructor',
  'senior_drill_instructor',
  'chief_drill_instructor',
  'company_first_sgt',
  'series_commander',
  'company_xo',
  'company_commander',
  'battalion_sgt_maj',
  'battalion_xo',
  'battalion_commander',
]) as z.ZodType<UserRole>;

/**
 * Regiment validation (West/East)
 */
export const regimentSchema = z.enum(['West', 'East']) as z.ZodType<Regiment>;

/**
 * Organizational assignment schema
 */
export const organizationalAssignmentSchema = z.object({
  regiment: regimentSchema.optional(),
  battalion: z
    .string()
    .min(1, 'Battalion is required if provided')
    .max(50, 'Battalion must be 50 characters or less')
    .optional(),
  company: z
    .string()
    .min(1, 'Company is required if provided')
    .max(50, 'Company must be 50 characters or less')
    .optional(),
  series: z
    .string()
    .min(1, 'Series is required if provided')
    .max(50, 'Series must be 50 characters or less')
    .optional(),
  platoon: z
    .string()
    .regex(/^\d{4}$/, 'Platoon must be a 4-digit string')
    .optional(),
});

/**
 * Name validation schema
 */
export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

/**
 * First name schema
 */
export const firstNameSchema = nameSchema;

/**
 * Last name schema
 */
export const lastNameSchema = nameSchema;

/**
 * Phone number schema (re-exported from authSchemas for consistency)
 */
export const phoneNumberSchema = z
  .string()
  .regex(
    /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    'Invalid phone number format. Use format: (XXX) XXX-XXXX or XXX-XXX-XXXX'
  )
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be 20 characters or less');

/**
 * Email schema (re-exported from authSchemas for consistency)
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .max(255, 'Email must be 255 characters or less')
  .toLowerCase()
  .trim();

/**
 * Display name schema
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .trim();

/**
 * URL schema for profile pictures and logos
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .max(500, 'URL must be 500 characters or less')
  .optional();

/**
 * User profile creation schema
 */
export const userProfileCreateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  rank: usmcRankSchema,
  email: emailSchema,
  phoneNumber: phoneNumberSchema,
  displayName: displayNameSchema,
  photoURL: urlSchema,
  profilePictureUrl: urlSchema,
  companyLogoUrl: urlSchema,
  battalionLogoUrl: urlSchema,
  role: userRoleSchema.optional(),
  organizationalAssignment: organizationalAssignmentSchema.optional(),
  privacyPolicyAccepted: z.boolean().optional(),
  privacyPolicyVersion: z.string().optional(),
  privacyPolicyAcceptedAt: z.date().or(z.string().datetime()).optional(),
  termsOfServiceAccepted: z.boolean().optional(),
  termsOfServiceVersion: z.string().optional(),
  termsOfServiceAcceptedAt: z.date().or(z.string().datetime()).optional(),
});

/**
 * User profile update schema
 * All fields optional except userId
 */
export const userProfileUpdateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firstName: firstNameSchema.optional(),
  lastName: lastNameSchema.optional(),
  rank: usmcRankSchema.optional(),
  email: emailSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  displayName: displayNameSchema.optional(),
  photoURL: urlSchema,
  profilePictureUrl: urlSchema,
  companyLogoUrl: urlSchema,
  battalionLogoUrl: urlSchema,
  role: userRoleSchema.optional(),
  organizationalAssignment: organizationalAssignmentSchema.optional(),
  privacyPolicyAccepted: z.boolean().optional(),
  privacyPolicyVersion: z.string().optional(),
  privacyPolicyAcceptedAt: z.date().or(z.string().datetime()).optional(),
  termsOfServiceAccepted: z.boolean().optional(),
  termsOfServiceVersion: z.string().optional(),
  termsOfServiceAcceptedAt: z.date().or(z.string().datetime()).optional(),
});

/**
 * Type exports for TypeScript inference
 */
export type UserProfileCreateInput = z.infer<typeof userProfileCreateSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type OrganizationalAssignmentInput = z.infer<typeof organizationalAssignmentSchema>;
