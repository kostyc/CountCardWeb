"use strict";
/**
 * User Profile Validation Schemas
 *
 * Zod schemas for validating user profile creation and updates.
 * Includes rank validation, organizational assignment validation, and role validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.userProfileUpdateSchema = exports.userProfileCreateSchema = exports.urlSchema = exports.displayNameSchema = exports.emailSchema = exports.phoneNumberSchema = exports.lastNameSchema = exports.firstNameSchema = exports.nameSchema = exports.organizationalAssignmentSchema = exports.regimentSchema = exports.userRoleSchema = exports.usmcRankSchema = void 0;
const zod_1 = require("zod");
/**
 * USMC Rank validation
 * Enlisted: E-5 through E-9
 * Officer: O-1 through O-6
 */
exports.usmcRankSchema = zod_1.z.enum([
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
]);
/**
 * User role validation
 */
exports.userRoleSchema = zod_1.z.enum([
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
]);
/**
 * Regiment validation (West/East)
 */
exports.regimentSchema = zod_1.z.enum(['West', 'East']);
/**
 * Organizational assignment schema
 */
exports.organizationalAssignmentSchema = zod_1.z.object({
    regiment: exports.regimentSchema.optional(),
    battalion: zod_1.z
        .string()
        .min(1, 'Battalion is required if provided')
        .max(50, 'Battalion must be 50 characters or less')
        .optional(),
    company: zod_1.z
        .string()
        .min(1, 'Company is required if provided')
        .max(50, 'Company must be 50 characters or less')
        .optional(),
    series: zod_1.z
        .string()
        .min(1, 'Series is required if provided')
        .max(50, 'Series must be 50 characters or less')
        .optional(),
    platoon: zod_1.z
        .string()
        .regex(/^\d{4}$/, 'Platoon must be a 4-digit string')
        .optional(),
});
/**
 * Name validation schema
 */
exports.nameSchema = zod_1.z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim();
/**
 * First name schema
 */
exports.firstNameSchema = exports.nameSchema;
/**
 * Last name schema
 */
exports.lastNameSchema = exports.nameSchema;
/**
 * Phone number schema (re-exported from authSchemas for consistency)
 */
exports.phoneNumberSchema = zod_1.z
    .string()
    .regex(/^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/, 'Invalid phone number format. Use format: (XXX) XXX-XXXX or XXX-XXX-XXXX')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be 20 characters or less');
/**
 * Email schema (re-exported from authSchemas for consistency)
 */
exports.emailSchema = zod_1.z
    .string()
    .email('Invalid email address')
    .min(1, 'Email is required')
    .max(255, 'Email must be 255 characters or less')
    .toLowerCase()
    .trim();
/**
 * Display name schema
 */
exports.displayNameSchema = zod_1.z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be 100 characters or less')
    .trim();
/**
 * URL schema for profile pictures and logos
 */
exports.urlSchema = zod_1.z
    .string()
    .url('Invalid URL format')
    .max(500, 'URL must be 500 characters or less')
    .optional();
/**
 * User profile creation schema
 */
exports.userProfileCreateSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    firstName: exports.firstNameSchema,
    lastName: exports.lastNameSchema,
    rank: exports.usmcRankSchema,
    email: exports.emailSchema,
    phoneNumber: exports.phoneNumberSchema,
    displayName: exports.displayNameSchema,
    photoURL: exports.urlSchema,
    profilePictureUrl: exports.urlSchema,
    companyLogoUrl: exports.urlSchema,
    battalionLogoUrl: exports.urlSchema,
    role: exports.userRoleSchema.optional(),
    organizationalAssignment: exports.organizationalAssignmentSchema.optional(),
    privacyPolicyAccepted: zod_1.z.boolean().optional(),
    privacyPolicyVersion: zod_1.z.string().optional(),
    privacyPolicyAcceptedAt: zod_1.z.date().or(zod_1.z.string().datetime()).optional(),
    termsOfServiceAccepted: zod_1.z.boolean().optional(),
    termsOfServiceVersion: zod_1.z.string().optional(),
    termsOfServiceAcceptedAt: zod_1.z.date().or(zod_1.z.string().datetime()).optional(),
});
/**
 * User profile update schema
 * All fields optional except userId
 */
exports.userProfileUpdateSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'User ID is required'),
    firstName: exports.firstNameSchema.optional(),
    lastName: exports.lastNameSchema.optional(),
    rank: exports.usmcRankSchema.optional(),
    email: exports.emailSchema.optional(),
    phoneNumber: exports.phoneNumberSchema.optional(),
    displayName: exports.displayNameSchema.optional(),
    photoURL: exports.urlSchema,
    profilePictureUrl: exports.urlSchema,
    companyLogoUrl: exports.urlSchema,
    battalionLogoUrl: exports.urlSchema,
    role: exports.userRoleSchema.optional(),
    organizationalAssignment: exports.organizationalAssignmentSchema.optional(),
    privacyPolicyAccepted: zod_1.z.boolean().optional(),
    privacyPolicyVersion: zod_1.z.string().optional(),
    privacyPolicyAcceptedAt: zod_1.z.date().or(zod_1.z.string().datetime()).optional(),
    termsOfServiceAccepted: zod_1.z.boolean().optional(),
    termsOfServiceVersion: zod_1.z.string().optional(),
    termsOfServiceAcceptedAt: zod_1.z.date().or(zod_1.z.string().datetime()).optional(),
});
//# sourceMappingURL=userProfileSchemas.js.map