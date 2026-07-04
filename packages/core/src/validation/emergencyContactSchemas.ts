/**
 * Emergency Contact Validation Schemas
 * 
 * Zod schemas for validating emergency contact creation and updates.
 * Includes contact information, relationship, and contact method validation.
 */

import { z } from 'zod';
import { emailSchema, phoneNumberSchema } from './userProfileSchemas';

/**
 * Contact relationship validation
 */
export const contactRelationshipSchema = z.enum([
  'spouse',
  'parent',
  'guardian',
  'sibling',
  'other',
  'emergency_contact',
]);

/**
 * Contact method validation
 */
export const contactMethodSchema = z.enum(['phone', 'email']);

/**
 * Address validation schema
 */
export const addressSchema = z.object({
  street: z.string().max(200, 'Street address must be 200 characters or less').optional(),
  city: z.string().max(100, 'City must be 100 characters or less').optional(),
  state: z.string().max(50, 'State must be 50 characters or less').optional(),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'ZIP code must be in format 12345 or 12345-6789')
    .optional(),
  country: z.string().max(100, 'Country must be 100 characters or less').optional(),
});

/**
 * Emergency contact name validation
 */
export const emergencyContactNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .trim();

/**
 * Emergency contact ID validation
 */
export const emergencyContactIdSchema = z
  .string()
  .min(1, 'Emergency contact ID is required')
  .max(100, 'Emergency contact ID must be 100 characters or less');

/**
 * Recruit ID validation (for emergency contact reference)
 */
export const recruitIdSchema = z
  .string()
  .min(1, 'Recruit ID is required')
  .max(100, 'Recruit ID must be 100 characters or less');

/**
 * Emergency Contact Input Schema (for creation)
 */
export const emergencyContactInputSchema = z.object({
  emergencyContactId: emergencyContactIdSchema,
  recruitId: recruitIdSchema,
  firstName: emergencyContactNameSchema,
  lastName: emergencyContactNameSchema,
  relationship: contactRelationshipSchema,
  phoneNumber: phoneNumberSchema,
  secondaryPhoneNumber: phoneNumberSchema.optional(),
  email: emailSchema.optional(),
  preferredContactMethod: contactMethodSchema.optional(),
  address: addressSchema.optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  encryptedData: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string().min(1, 'Created by user ID is required'),
  updatedBy: z.string().min(1, 'Updated by user ID is required').optional(),
});

/**
 * Emergency Contact Update Schema (for updates)
 */
export const emergencyContactUpdateSchema = z.object({
  emergencyContactId: emergencyContactIdSchema,
  recruitId: recruitIdSchema,
  firstName: emergencyContactNameSchema.optional(),
  lastName: emergencyContactNameSchema.optional(),
  relationship: contactRelationshipSchema.optional(),
  phoneNumber: phoneNumberSchema.optional(),
  secondaryPhoneNumber: phoneNumberSchema.optional(),
  email: emailSchema.optional(),
  preferredContactMethod: contactMethodSchema.optional(),
  address: addressSchema.optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional(),
  encryptedData: z.record(z.string(), z.unknown()).optional(),
  updatedBy: z.string().min(1, 'Updated by user ID is required'),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Emergency Contact Query Schema (for filtering)
 */
export const emergencyContactQuerySchema = z.object({
  recruitId: recruitIdSchema.optional(),
  relationship: contactRelationshipSchema.optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

/**
 * Type exports
 */
export type ContactRelationship = z.infer<typeof contactRelationshipSchema>;
export type ContactMethod = z.infer<typeof contactMethodSchema>;
export type Address = z.infer<typeof addressSchema>;
export type EmergencyContactInput = z.infer<typeof emergencyContactInputSchema>;
export type EmergencyContactUpdate = z.infer<typeof emergencyContactUpdateSchema>;
export type EmergencyContactQuery = z.infer<typeof emergencyContactQuerySchema>;
