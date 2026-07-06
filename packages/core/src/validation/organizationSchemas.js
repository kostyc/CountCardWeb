"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlatoonSchema = exports.createPlatoonSchema = exports.updateSeriesSchema = exports.createSeriesSchema = exports.updateCompanySchema = exports.createCompanySchema = exports.updateBattalionSchema = exports.createBattalionSchema = exports.updateRegimentSchema = exports.createRegimentSchema = exports.organizationalQuerySchema = exports.organizationalAssignmentSchema = exports.platoonSchema = exports.seriesSchema = exports.companySchema = exports.battalionSchema = void 0;
const zod_1 = require("zod");
const userProfileSchemas_1 = require("./userProfileSchemas");
/**
 * Battalion validation
 * Battalions: 1st, 2nd, 3rd, Support
 */
exports.battalionSchema = zod_1.z.enum([
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
exports.companySchema = zod_1.z.enum([
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
  'Kilo',
  'Lima',
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
exports.seriesSchema = zod_1.z.enum([
    'Lead',
    'Follow',
]);
/**
 * Platoon validation (4-digit string format)
 */
exports.platoonSchema = zod_1.z
    .string()
    .regex(/^\d{4}$/, 'Platoon must be a 4-digit string')
    .min(4, 'Platoon must be exactly 4 digits')
    .max(4, 'Platoon must be exactly 4 digits');
/**
 * Organizational assignment schema
 * Validates the complete organizational structure
 */
exports.organizationalAssignmentSchema = zod_1.z.object({
    regiment: userProfileSchemas_1.regimentSchema,
    battalion: exports.battalionSchema,
    company: exports.companySchema,
    series: exports.seriesSchema.optional(),
    platoon: exports.platoonSchema.optional(),
}).refine((data) => {
    // Validate company belongs to correct battalion
    const firstBattalionCompanies = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
    const secondBattalionCompanies = ['Echo', 'Foxtrot', 'Golf', 'Hotel'];
    const thirdBattalionCompanies = ['India', 'Kilo', 'Lima', 'Mike'];
    const supportBattalionCompanies = ['STC', 'MRP', 'BMP', 'Receiving'];
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
}, {
    message: 'Company does not belong to the specified battalion',
});
/**
 * Organizational query schema
 * For filtering by organizational structure
 */
exports.organizationalQuerySchema = zod_1.z.object({
    regiment: userProfileSchemas_1.regimentSchema.optional(),
    battalion: zod_1.z.union([exports.battalionSchema, zod_1.z.string()]).optional(),
    company: zod_1.z.union([exports.companySchema, zod_1.z.string()]).optional(),
    series: zod_1.z.union([exports.seriesSchema, zod_1.z.string()]).optional(),
    platoon: exports.platoonSchema.optional(),
});
/**
 * Create/update schemas for Firestore org entities
 */
exports.createRegimentSchema = zod_1.z.object({
    name: userProfileSchemas_1.regimentSchema,
});
exports.updateRegimentSchema = zod_1.z.object({
    name: userProfileSchemas_1.regimentSchema.optional(),
});
exports.createBattalionSchema = zod_1.z.object({
    name: exports.battalionSchema,
    regimentId: zod_1.z.string().min(1),
});
exports.updateBattalionSchema = zod_1.z.object({
    name: exports.battalionSchema.optional(),
    regimentId: zod_1.z.string().min(1).optional(),
});
exports.createCompanySchema = zod_1.z.object({
    name: exports.companySchema,
    battalionId: zod_1.z.string().min(1),
});
exports.updateCompanySchema = zod_1.z.object({
    name: exports.companySchema.optional(),
    battalionId: zod_1.z.string().min(1).optional(),
});
exports.createSeriesSchema = zod_1.z.object({
    name: exports.seriesSchema,
    companyId: zod_1.z.string().min(1),
});
exports.updateSeriesSchema = zod_1.z.object({
    name: exports.seriesSchema.optional(),
    companyId: zod_1.z.string().min(1).optional(),
});
exports.createPlatoonSchema = zod_1.z.object({
    platoonId: exports.platoonSchema,
    seriesId: zod_1.z.string().min(1),
    regiment: userProfileSchemas_1.regimentSchema,
    battalion: exports.battalionSchema,
    company: exports.companySchema,
    series: exports.seriesSchema.optional(),
    drillInstructors: zod_1.z.array(zod_1.z.string()).optional(),
    recruitCount: zod_1.z.number().int().min(0).optional(),
});
exports.updatePlatoonSchema = zod_1.z.object({
    seriesId: zod_1.z.string().min(1).optional(),
    regiment: userProfileSchemas_1.regimentSchema.optional(),
    battalion: exports.battalionSchema.optional(),
    company: exports.companySchema.optional(),
    series: exports.seriesSchema.optional(),
    drillInstructors: zod_1.z.array(zod_1.z.string()).optional(),
    recruitCount: zod_1.z.number().int().min(0).optional(),
});
//# sourceMappingURL=organizationSchemas.js.map