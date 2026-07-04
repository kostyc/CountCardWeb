"use strict";
/**
 * Count Card Validation Schemas
 *
 * Zod schemas for validating count card creation and updates.
 * Includes timestamp, location, status, and workflow state validation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.countCardQuerySchema = exports.countCardUpdateSchema = exports.countCardCreateSchema = exports.workflowHistorySchema = exports.workflowHistoryEntrySchema = exports.recruitCountsSchema = exports.userIdSchema = exports.timestampSchema = exports.locationSchema = exports.countCardIdSchema = exports.workflowStateSchema = exports.countCardStatusSchema = void 0;
const zod_1 = require("zod");
const recruitSchemas_1 = require("./recruitSchemas");
const userProfileSchemas_1 = require("./userProfileSchemas");
/**
 * Count card status validation
 */
exports.countCardStatusSchema = zod_1.z.enum([
    'pending',
    'approved',
    'rejected',
    'consolidated',
]);
/**
 * Workflow state validation
 *
 * Workflow states for count card approval process:
 * - draft: Count card is being created/edited by Drill Instructor
 * - submitted: Submitted to Duty Senior Drill Instructor
 * - under_review: Being reviewed by Senior Drill Instructor
 * - approved: Approved by Senior Drill Instructor, forwarded to Company 1stSgt/Series Commander
 * - rejected: Rejected by Senior Drill Instructor, returned to Drill Instructor
 * - consolidated: Consolidated by Company 1stSgt/Series Commander, forwarded to Company XO/Commander/Battalion SgtMaj
 * - final_approval: Final approval by Company XO/Commander/Battalion SgtMaj
 */
exports.workflowStateSchema = zod_1.z.enum([
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
exports.countCardIdSchema = zod_1.z
    .string()
    .min(1, 'Count card ID is required')
    .max(100, 'Count card ID must be 100 characters or less');
/**
 * Location validation
 */
exports.locationSchema = zod_1.z
    .string()
    .min(1, 'Location is required')
    .max(200, 'Location must be 200 characters or less')
    .trim();
/**
 * Timestamp validation (ISO 8601 date string or Date object)
 */
exports.timestampSchema = zod_1.z.union([
    zod_1.z.string().datetime('Invalid timestamp format'),
    zod_1.z.date(),
]);
/**
 * User ID validation (Firebase UID format: 28 characters alphanumeric)
 */
exports.userIdSchema = zod_1.z
    .string()
    .regex(/^[a-zA-Z0-9]{28}$/, 'Invalid user ID format (must be 28 alphanumeric characters)')
    .min(28, 'User ID must be 28 characters')
    .max(28, 'User ID must be 28 characters');
/**
 * Recruit status counts validation
 * Map of recruit status to count
 */
exports.recruitCountsSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.number().int().min(0, 'Count must be non-negative'));
/**
 * Workflow history entry schema
 */
exports.workflowHistoryEntrySchema = zod_1.z.object({
    state: exports.workflowStateSchema,
    timestamp: exports.timestampSchema,
    userId: exports.userIdSchema,
    notes: zod_1.z.string().max(500, 'Notes must be 500 characters or less').optional(),
});
/**
 * Workflow history schema
 */
exports.workflowHistorySchema = zod_1.z.array(exports.workflowHistoryEntrySchema);
/**
 * Count card creation schema
 */
exports.countCardCreateSchema = zod_1.z.object({
    countCardId: exports.countCardIdSchema,
    platoon: recruitSchemas_1.platoonSchema,
    company: recruitSchemas_1.companySchema,
    battalion: recruitSchemas_1.battalionSchema,
    regiment: userProfileSchemas_1.regimentSchema.optional(),
    status: exports.countCardStatusSchema,
    workflowState: exports.workflowStateSchema,
    submittedBy: exports.userIdSchema,
    submittedTo: exports.userIdSchema.optional(),
    location: exports.locationSchema,
    timestamp: exports.timestampSchema,
    recruitCounts: exports.recruitCountsSchema.optional(),
    workflowHistory: exports.workflowHistorySchema.optional(),
    encryptedData: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
/**
 * Count card update schema
 */
exports.countCardUpdateSchema = zod_1.z.object({
    countCardId: exports.countCardIdSchema,
    platoon: recruitSchemas_1.platoonSchema.optional(),
    company: recruitSchemas_1.companySchema,
    battalion: recruitSchemas_1.battalionSchema,
    regiment: userProfileSchemas_1.regimentSchema.optional(),
    status: exports.countCardStatusSchema.optional(),
    workflowState: exports.workflowStateSchema.optional(),
    submittedTo: exports.userIdSchema.optional(),
    approvedBy: exports.userIdSchema.optional(),
    rejectedBy: exports.userIdSchema.optional(),
    location: exports.locationSchema.optional(),
    timestamp: exports.timestampSchema.optional(),
    recruitCounts: exports.recruitCountsSchema.optional(),
    workflowHistory: exports.workflowHistorySchema.optional(),
    encryptedData: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
/**
 * Count card query/filter schema
 */
exports.countCardQuerySchema = zod_1.z.object({
    platoon: recruitSchemas_1.platoonSchema.optional(),
    company: zod_1.z.string().optional(),
    battalion: zod_1.z.string().optional(),
    regiment: userProfileSchemas_1.regimentSchema.optional(),
    status: exports.countCardStatusSchema.optional(),
    workflowState: exports.workflowStateSchema.optional(),
    submittedBy: exports.userIdSchema.optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=countCardSchemas.js.map