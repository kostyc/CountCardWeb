/**
 * Logo Validation Schemas
 * 
 * Zod schemas for validating company and battalion logo creation and updates.
 * Includes logo metadata, file validation, and organizational assignment validation.
 */

import { z } from 'zod';
import { regimentSchema } from './userProfileSchemas';
import { battalionSchema, companySchema } from './organizationSchemas';

/**
 * Logo ID validation
 */
export const logoIdSchema = z
  .string()
  .min(1, 'Logo ID is required')
  .max(100, 'Logo ID must be 100 characters or less');

/**
 * Logo URL validation
 */
export const logoUrlSchema = z
  .string()
  .url('Logo URL must be a valid URL')
  .min(1, 'Logo URL is required')
  .max(500, 'Logo URL must be 500 characters or less');

/**
 * Logo file name validation
 */
export const logoFileNameSchema = z
  .string()
  .min(1, 'File name is required')
  .max(255, 'File name must be 255 characters or less')
  .regex(/^[a-zA-Z0-9._-]+$/, 'File name can only contain letters, numbers, dots, hyphens, and underscores');

/**
 * Logo MIME type validation
 * Allowed types: image/png, image/jpeg, image/jpg, image/webp (no SVG/GIF for security)
 */
export const logoMimeTypeSchema = z.enum([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
], {
  message: 'Logo must be a valid image file (PNG, JPEG, or WebP)',
});

/**
 * Logo file size validation (max 2MB to match storage rules)
 */
export const logoFileSizeSchema = z
  .number()
  .int()
  .min(1, 'File size must be at least 1 byte')
  .max(2 * 1024 * 1024, 'File size must be 2MB or less');

/**
 * Logo dimensions validation
 */
export const logoDimensionsSchema = z
  .number()
  .int()
  .positive('Width and height must be positive numbers')
  .optional();

/**
 * Logo Metadata Schema
 */
export const logoMetadataSchema = z.object({
  fileName: logoFileNameSchema,
  fileSize: logoFileSizeSchema,
  mimeType: logoMimeTypeSchema,
  width: logoDimensionsSchema,
  height: logoDimensionsSchema,
  uploadedAt: z.union([z.date(), z.string()]),
  uploadedBy: z.string().min(1, 'Uploaded by user ID is required'),
});

/**
 * Company Logo Input Schema (for creation)
 */
export const companyLogoInputSchema = z.object({
  logoId: logoIdSchema,
  company: companySchema,
  battalion: battalionSchema,
  regiment: regimentSchema,
  logoUrl: logoUrlSchema,
  metadata: logoMetadataSchema,
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Company Logo Update Schema (for updates)
 */
export const companyLogoUpdateSchema = z.object({
  logoId: logoIdSchema,
  company: companySchema.optional(),
  battalion: battalionSchema.optional(),
  regiment: regimentSchema.optional(),
  logoUrl: logoUrlSchema.optional(),
  metadata: logoMetadataSchema.optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Battalion Logo Input Schema (for creation)
 */
export const battalionLogoInputSchema = z.object({
  logoId: logoIdSchema,
  battalion: battalionSchema,
  regiment: regimentSchema,
  logoUrl: logoUrlSchema,
  metadata: logoMetadataSchema,
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Battalion Logo Update Schema (for updates)
 */
export const battalionLogoUpdateSchema = z.object({
  logoId: logoIdSchema,
  battalion: battalionSchema.optional(),
  regiment: regimentSchema.optional(),
  logoUrl: logoUrlSchema.optional(),
  metadata: logoMetadataSchema.optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Logo Query Schema (for filtering)
 */
export const logoQuerySchema = z.object({
  battalion: battalionSchema.optional(),
  regiment: regimentSchema.optional(),
  company: companySchema.optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

/**
 * Type exports
 */
export type LogoMetadata = z.infer<typeof logoMetadataSchema>;
export type CompanyLogoInput = z.infer<typeof companyLogoInputSchema>;
export type CompanyLogoUpdate = z.infer<typeof companyLogoUpdateSchema>;
export type BattalionLogoInput = z.infer<typeof battalionLogoInputSchema>;
export type BattalionLogoUpdate = z.infer<typeof battalionLogoUpdateSchema>;
export type LogoQuery = z.infer<typeof logoQuerySchema>;
