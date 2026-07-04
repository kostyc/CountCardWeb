"use strict";
/**
 * Recruit Validation Schemas
 *
 * Zod schemas for validating recruit profile creation and updates.
 * Includes recruit name, rank, status, and platoon assignment validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recruitQuerySchema = exports.recruitUpdateSchema = exports.recruitCreateSchema = exports.photoUrlSchema = exports.recruitIdSchema = exports.seriesSchema = exports.companySchema = exports.battalionSchema = exports.platoonSchema = exports.recruitNameSchema = exports.recruitStatusSchema = void 0;
const zod_1 = require("zod");
const userProfileSchemas_1 = require("./userProfileSchemas");
const userProfileSchemas_2 = require("./userProfileSchemas");
/**
 * Recruit status validation
 */
exports.recruitStatusSchema = zod_1.z.enum([
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
exports.recruitNameSchema = zod_1.z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim();
/**
 * Platoon validation (4-digit string format)
 */
exports.platoonSchema = zod_1.z
    .string()
    .regex(/^\d{4}$/, 'Platoon must be a 4-digit string')
    .min(4, 'Platoon must be exactly 4 digits')
    .max(4, 'Platoon must be exactly 4 digits');
/**
 * Battalion validation
 */
exports.battalionSchema = zod_1.z
    .string()
    .min(1, 'Battalion is required if provided')
    .max(50, 'Battalion must be 50 characters or less')
    .optional();
/**
 * Company validation
 */
exports.companySchema = zod_1.z
    .string()
    .min(1, 'Company is required if provided')
    .max(50, 'Company must be 50 characters or less')
    .optional();
/**
 * Series validation
 */
exports.seriesSchema = zod_1.z
    .string()
    .min(1, 'Series is required if provided')
    .max(50, 'Series must be 50 characters or less')
    .optional();
/**
 * Recruit ID validation
 */
exports.recruitIdSchema = zod_1.z
    .string()
    .min(1, 'Recruit ID is required')
    .max(100, 'Recruit ID must be 100 characters or less');
/**
 * URL schema for recruit photos
 */
exports.photoUrlSchema = zod_1.z
    .string()
    .url('Invalid URL format')
    .max(500, 'URL must be 500 characters or less')
    .optional();
/**
 * Recruit profile creation schema
 */
const extendedNotesSchema = zod_1.z
    .string()
    .max(2000, 'Notes must be 2000 characters or less')
    .optional();
const medicalNotesSchema = zod_1.z
    .string()
    .max(2000, 'Medical notes must be 2000 characters or less')
    .optional();
const dietaryRestrictionsSchema = zod_1.z
    .string()
    .max(500, 'Dietary restrictions must be 500 characters or less')
    .optional();
const preferredContactMethodSchema = zod_1.z.enum(['phone', 'email']).optional();
const recruitPrivacySchema = zod_1.z
    .object({
    fullProfileVisibleTo: zod_1.z
        .enum(['same_platoon', 'same_company', 'same_battalion', 'admins_only'])
        .optional(),
})
    .optional();
exports.recruitCreateSchema = zod_1.z.object({
    recruitId: exports.recruitIdSchema,
    firstName: exports.recruitNameSchema,
    lastName: exports.recruitNameSchema,
    rank: userProfileSchemas_1.usmcRankSchema,
    status: exports.recruitStatusSchema,
    regiment: userProfileSchemas_2.regimentSchema.optional(),
    battalion: exports.battalionSchema,
    company: exports.companySchema,
    series: exports.seriesSchema,
    platoon: exports.platoonSchema,
    photoUrl: exports.photoUrlSchema,
    // Encrypted data will be validated separately
    encryptedData: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    createdBy: zod_1.z.string().min(1, 'Created by user ID is required'),
    medicalNotes: medicalNotesSchema,
    dietaryRestrictions: dietaryRestrictionsSchema,
    preferredContactMethod: preferredContactMethodSchema,
    extendedNotes: extendedNotesSchema,
    privacy: recruitPrivacySchema,
});
/**
 * Recruit profile update schema
 * All fields optional except recruitId
 */
exports.recruitUpdateSchema = zod_1.z.object({
    recruitId: exports.recruitIdSchema,
    firstName: exports.recruitNameSchema.optional(),
    lastName: exports.recruitNameSchema.optional(),
    rank: userProfileSchemas_1.usmcRankSchema.optional(),
    status: exports.recruitStatusSchema.optional(),
    regiment: userProfileSchemas_2.regimentSchema.optional(),
    battalion: exports.battalionSchema,
    company: exports.companySchema,
    series: exports.seriesSchema,
    platoon: exports.platoonSchema.optional(),
    photoUrl: exports.photoUrlSchema,
    encryptedData: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    updatedBy: zod_1.z.string().min(1, 'Updated by user ID is required'),
    medicalNotes: medicalNotesSchema.optional(),
    dietaryRestrictions: dietaryRestrictionsSchema.optional(),
    preferredContactMethod: preferredContactMethodSchema,
    extendedNotes: extendedNotesSchema,
    privacy: recruitPrivacySchema,
});
/**
 * Recruit query/filter schema
 */
exports.recruitQuerySchema = zod_1.z.object({
    platoon: exports.platoonSchema.optional(),
    company: zod_1.z.string().optional(),
    battalion: zod_1.z.string().optional(),
    regiment: userProfileSchemas_2.regimentSchema.optional(),
    status: exports.recruitStatusSchema.optional(),
    rank: userProfileSchemas_1.usmcRankSchema.optional(),
    search: zod_1.z.string().max(100, 'Search term must be 100 characters or less').optional(),
});
//# sourceMappingURL=recruitSchemas.js.map