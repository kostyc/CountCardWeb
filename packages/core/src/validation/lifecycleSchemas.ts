/**
 * Lifecycle validation schemas: custody, transfer batches, progress, DI cards
 */

import { z } from 'zod';
import { regimentSchema } from './userProfileSchemas';
import {
  battalionSchema,
  companySchema,
  seriesSchema,
  platoonSchema,
} from './organizationSchemas';

export const custodyPhaseSchema = z.enum([
  'receiving',
  'receiving_ready',
  'transfer_pending',
  'in_transit',
  'training',
]);

export const receivingChecklistItemSchema = z.enum([
  'immunizations',
  'vision',
  'dental',
  'drug_test',
  'other',
]);

export const receivingChecklistEntrySchema = z.object({
  item: receivingChecklistItemSchema,
  completed: z.boolean(),
  completedAt: z.coerce.date().optional(),
  completedBy: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const fitnessScoreEventSchema = z.object({
  pullUps: z.number().int().min(0).optional(),
  crunches: z.number().int().min(0).optional(),
  plankSeconds: z.number().int().min(0).optional(),
  runMinutes: z.number().min(0).optional(),
  runSeconds: z.number().int().min(0).max(59).optional(),
  totalScore: z.number().int().min(0).optional(),
  pass: z.boolean().optional(),
  recordedAt: z.coerce.date().optional(),
});

export const receivingUrinalysisResultSchema = z.enum(['pass', 'fail', 'pending']);

export const receivingUrinalysisSchema = z.object({
  result: receivingUrinalysisResultSchema,
  notes: z.string().max(500).optional(),
  recordedAt: z.coerce.date().optional(),
});

export const organizationalAssignmentPartialSchema = z.object({
  regiment: regimentSchema.optional(),
  battalion: battalionSchema.optional(),
  company: companySchema.optional(),
  series: seriesSchema.optional(),
  platoon: platoonSchema.optional(),
});

export const heightInchesSchema = z
  .number()
  .int()
  .min(48, 'Height must be at least 48 inches')
  .max(96, 'Height must be at most 96 inches')
  .optional();

export const weightPoundsSchema = z
  .number()
  .int()
  .min(80, 'Weight must be at least 80 lbs')
  .max(400, 'Weight must be at most 400 lbs')
  .optional();

export const transferBatchStatusSchema = z.enum([
  'draft',
  'published',
  'in_transit',
  'first_sgt_review',
  'cdi_review',
  'sdi_accept',
  'completed',
  'cancelled',
  'rejected',
]);

export const transferBatchCreateSchema = z.object({
  pickupWeek: z.string().min(1).max(50),
  regiment: regimentSchema,
  destinationAssignment: organizationalAssignmentPartialSchema.extend({
    battalion: battalionSchema,
    company: companySchema,
    platoon: platoonSchema,
  }),
  recruitIds: z.array(z.string().min(1)).min(1),
  notes: z.string().max(1000).optional(),
});

export const transferBatchRejectSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const progressEventTypeSchema = z.enum([
  'initial_pft',
  'initial_cft',
  'initial_drill',
  'final_pft',
  'final_cft',
  'final_drill',
  'initial_inspection',
  'final_inspection',
  'bn_co_inspection',
  'hike',
  'general_comment',
]);

export const weightEntryInputSchema = z.object({
  weightPounds: z.number().int().min(80, 'Weight must be at least 80 lbs').max(400, 'Weight must be at most 400 lbs'),
  notes: z.string().max(500).optional(),
});

export const progressEventInputSchema = z.object({
  type: progressEventTypeSchema,
  scores: z.record(z.string(), z.unknown()).optional(),
  passFail: z.boolean().optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const recruitCommentCategorySchema = z.enum([
  'general',
  'performance',
  'medical',
  'disciplinary',
]);

export const recruitCommentInputSchema = z.object({
  body: z.string().min(1).max(2000),
  category: recruitCommentCategorySchema.default('general'),
});

export const diCardAuthorRoleSchema = z.enum(['sdi', 'chief_di', 'first_sgt']);

export const diCardTypeSchema = z.enum(['three_by_five_import', 'digital_form']);

export const diCardWorkflowStateSchema = z.enum([
  'draft',
  'pending_senior_sign',
  'completed',
]);

export const signatureRecordSchema = z.object({
  userId: z.string().min(1),
  signedAt: z.coerce.date(),
  signatureImageUrl: z.string().url().optional(),
  attestationHash: z.string().optional(),
});

export const diLeadershipCardInputSchema = z.object({
  subjectUserId: z.string().min(1),
  authorRole: diCardAuthorRoleSchema,
  cardType: diCardTypeSchema,
  importImageUrl: z.string().url().optional(),
  summary: z.string().max(2000).optional(),
});

export const diRecommendationInputSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const conversationTypeSchema = z.enum([
  'direct',
  'platoon_channel',
  'company_channel',
  'battalion_broadcast',
]);

export const conversationOrgScopeSchema = z.object({
  regiment: regimentSchema,
  battalion: battalionSchema.optional(),
  company: companySchema.optional(),
  series: seriesSchema.optional(),
  platoon: platoonSchema.optional(),
});

export type CustodyPhase = z.infer<typeof custodyPhaseSchema>;
export type TransferBatchStatus = z.infer<typeof transferBatchStatusSchema>;
export type ProgressEventType = z.infer<typeof progressEventTypeSchema>;
export type RecruitCommentCategory = z.infer<typeof recruitCommentCategorySchema>;
export type ConversationType = z.infer<typeof conversationTypeSchema>;
