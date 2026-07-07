/**
 * MCRD grid count card validation (Depot Order 1513.6)
 */

import { z } from 'zod';
import {
  countCardIdSchema,
  countCardStatusSchema,
  userIdSchema,
  workflowHistorySchema,
  workflowStateSchema,
} from './countCardSchemas';
import { companySchema, seriesSchema } from './organizationSchemas';
import { regimentSchema } from './userProfileSchemas';
import { computeRowTotal, computeAccountedStrength } from '../utils/countCardGrid';

export const countCardBackgroundColorSchema = z.enum(['White', 'Yellow', 'Blue', 'Red']);

export const trainingDayPhaseSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

const gridNumeric = z.number().int().min(0).nullable();

const dispositionAssignmentsSchema = z
  .object({
    bedRest: z.array(z.string().min(1).max(128)).optional(),
    lightDuty: z.array(z.string().min(1).max(128)).optional(),
    sickBay: z.array(z.string().min(1).max(128)).optional(),
    dental: z.array(z.string().min(1).max(128)).optional(),
    gearGuard: z.array(z.string().min(1).max(128)).optional(),
    other: z.array(z.string().min(1).max(128)).optional(),
  })
  .optional();

export const countCardGridRowSchema = z
  .object({
    platoon: z.string().min(1).max(20),
    totalStrength: gridNumeric,
    totalPresent: gridNumeric,
    weapons: gridNumeric,
    bedRest: gridNumeric,
    lightDuty: gridNumeric,
    sickBay: gridNumeric,
    dental: gridNumeric,
    gearGuard: gridNumeric,
    other: gridNumeric,
    total: gridNumeric,
    otherComments: z.string().max(500).optional(),
    dispositionAssignments: dispositionAssignmentsSchema,
  })
  .superRefine((row, ctx) => {
    const ts = row.totalStrength ?? 0;
    const accounted = computeAccountedStrength(row);
    if (ts !== accounted) {
      ctx.addIssue({
        code: 'custom',
        message: 'T/P+BR+LD+SB+DENT+GG+OTH must total T/S',
        path: ['totalStrength'],
      });
    }
    const computed = computeRowTotal(row);
    if (row.total != null && row.total !== computed) {
      ctx.addIssue({
        code: 'custom',
        message: 'TOTAL must equal BR+LD+SB+DENT+GG+OTH',
        path: ['total'],
      });
    }
    if ((row.other ?? 0) > 0 && !row.otherComments?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'OTH comment required when OTH > 0',
        path: ['otherComments'],
      });
    }
  });

export const mcrdCountCardCreateSchema = z.object({
  countCardId: countCardIdSchema,
  regiment: regimentSchema.optional(),
  battalion: z.string().min(1).max(50).optional(),
  company: companySchema,
  series: seriesSchema,
  event: z.string().max(200).optional(),
  countDate: z.union([z.string().datetime(), z.date()]),
  trainingDayCode: z.string().min(1).max(20),
  trainingDayPhase: trainingDayPhaseSchema,
  f1Friday: z.union([z.string().datetime(), z.date()]),
  backgroundColor: countCardBackgroundColorSchema,
  rows: z.array(countCardGridRowSchema).min(1).max(6),
  notes: z.string().max(2000).optional(),
  status: countCardStatusSchema,
  workflowState: workflowStateSchema,
  submittedBy: userIdSchema,
  submittedTo: userIdSchema.optional(),
  location: z.string().max(200).optional(),
  workflowHistory: workflowHistorySchema.optional(),
});

export const mcrdCountCardUpdateSchema = mcrdCountCardCreateSchema
  .partial()
  .extend({
    countCardId: countCardIdSchema,
    updatedBy: userIdSchema,
  });

export const companyTrainingDaySchema = z.object({
  companyKey: z.string().min(1).max(100),
  regiment: regimentSchema,
  battalion: z.string().min(1).max(50),
  company: companySchema,
  f1Friday: z.union([z.string().datetime(), z.date()]),
  currentTrainingDayCode: z.string().min(1).max(20),
  currentTrainingDayPhase: trainingDayPhaseSchema,
  effectiveDate: z.union([z.string().datetime(), z.date()]),
  setBy: userIdSchema,
  setByRole: z.string().max(50).optional(),
  setAt: z.union([z.string().datetime(), z.date()]),
  manualOverride: z.boolean().optional(),
});

export type McrdCountCardCreateInput = z.infer<typeof mcrdCountCardCreateSchema>;
export type McrdCountCardUpdateInput = z.infer<typeof mcrdCountCardUpdateSchema>;
export type CompanyTrainingDayInputSchema = z.infer<typeof companyTrainingDaySchema>;
