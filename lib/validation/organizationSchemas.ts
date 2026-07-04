/**
 * Organizational Structure Validation Schemas
 * 
 * Zod schemas for validating organizational structure assignments:
 * - Regiment (West/East)
 * - Battalion (1st, 2nd, 3rd, Support)
 * - Company (by battalion)
 * - Series (Lead/Follow)
 * - Platoon (4-digit string)
 */

import { z } from 'zod';
import { regimentSchema } from './userProfileSchemas';

/**
 * Battalion validation
 * Battalions: 1st, 2nd, 3rd, Support
 */
export const battalionSchema = z.enum([
  '1st',
  '2nd',
  '3rd',
  'Support',
]);

/**
 * Company validation
 * Companies vary by battalion:
 * - Alpha-Delta (1st Battalion)
 * - Echo-Hotel (2nd Battalion)
 * - India-Mike (3rd Battalion)
 * - STC/MRP/BMP (Support Battalion)
 */
export const companySchema = z.enum([
  // 1st Battalion
  'Alpha',
  'Bravo',
  'Charlie',
  'Delta',
  // 2nd Battalion
  'Echo',
  'Foxtrot',
  'Golf',
  'Hotel',
  // 3rd Battalion
  'India',
  'Juliet',
  'Kilo',
  'Mike',
  // Support Battalion
  'STC',
  'MRP',
  'BMP',
]);

/**
 * Series validation
 * Series: Lead Series, Follow Series
 */
export const seriesSchema = z.enum([
  'Lead',
  'Follow',
]);

/**
 * Platoon validation (4-digit string format)
 */
export const platoonSchema = z
  .string()
  .regex(/^\d{4}$/, 'Platoon must be a 4-digit string')
  .min(4, 'Platoon must be exactly 4 digits')
  .max(4, 'Platoon must be exactly 4 digits');

/**
 * Organizational assignment schema
 * Validates the complete organizational structure
 */
export const organizationalAssignmentSchema = z.object({
  regiment: regimentSchema,
  battalion: battalionSchema,
  company: companySchema,
  series: seriesSchema.optional(),
  platoon: platoonSchema.optional(),
}).refine(
  (data) => {
    // Validate company belongs to correct battalion
    const firstBattalionCompanies = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
    const secondBattalionCompanies = ['Echo', 'Foxtrot', 'Golf', 'Hotel'];
    const thirdBattalionCompanies = ['India', 'Juliet', 'Kilo', 'Mike'];
    const supportBattalionCompanies = ['STC', 'MRP', 'BMP'];
    
    if (data.battalion === '1st' && !firstBattalionCompanies.includes(data.company)) {
      return false;
    }
    if (data.battalion === '2nd' && !secondBattalionCompanies.includes(data.company)) {
      return false;
    }
    if (data.battalion === '3rd' && !thirdBattalionCompanies.includes(data.company)) {
      return false;
    }
    if (data.battalion === 'Support' && !supportBattalionCompanies.includes(data.company)) {
      return false;
    }
    
    return true;
  },
  {
    message: 'Company does not belong to the specified battalion',
  }
);

/**
 * Organizational query schema
 * For filtering by organizational structure
 */
export const organizationalQuerySchema = z.object({
  regiment: regimentSchema.optional(),
  battalion: z.union([battalionSchema, z.string()]).optional(),
  company: z.union([companySchema, z.string()]).optional(),
  series: z.union([seriesSchema, z.string()]).optional(),
  platoon: platoonSchema.optional(),
});

/**
 * Type exports for TypeScript inference
 */
export type OrganizationalAssignmentInput = z.infer<typeof organizationalAssignmentSchema>;
export type OrganizationalQueryInput = z.infer<typeof organizationalQuerySchema>;
export type Battalion = z.infer<typeof battalionSchema>;
export type Company = z.infer<typeof companySchema>;
export type Series = z.infer<typeof seriesSchema>;

/**
 * Create/update schemas for Firestore org entities
 */
export const createRegimentSchema = z.object({
  name: regimentSchema,
});

export const updateRegimentSchema = z.object({
  name: regimentSchema.optional(),
});

export const createBattalionSchema = z.object({
  name: battalionSchema,
  regimentId: z.string().min(1),
});

export const updateBattalionSchema = z.object({
  name: battalionSchema.optional(),
  regimentId: z.string().min(1).optional(),
});

export const createCompanySchema = z.object({
  name: companySchema,
  battalionId: z.string().min(1),
});

export const updateCompanySchema = z.object({
  name: companySchema.optional(),
  battalionId: z.string().min(1).optional(),
});

export const createSeriesSchema = z.object({
  name: seriesSchema,
  companyId: z.string().min(1),
});

export const updateSeriesSchema = z.object({
  name: seriesSchema.optional(),
  companyId: z.string().min(1).optional(),
});

export const createPlatoonSchema = z.object({
  platoonId: platoonSchema,
  seriesId: z.string().min(1),
  regiment: regimentSchema,
  battalion: battalionSchema,
  company: companySchema,
  series: seriesSchema.optional(),
  drillInstructors: z.array(z.string()).optional(),
  recruitCount: z.number().int().min(0).optional(),
});

export const updatePlatoonSchema = z.object({
  seriesId: z.string().min(1).optional(),
  regiment: regimentSchema.optional(),
  battalion: battalionSchema.optional(),
  company: companySchema.optional(),
  series: seriesSchema.optional(),
  drillInstructors: z.array(z.string()).optional(),
  recruitCount: z.number().int().min(0).optional(),
});
