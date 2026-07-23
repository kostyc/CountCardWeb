/**
 * Zod schemas for Sprint 28 incident / emergency alerts
 */

import { z } from 'zod';
import { organizationalAssignmentSchema } from './userProfileSchemas';

export const incidentTypeSchema = z.enum([
  'medical_injury',
  'heat_casualty',
  'missing_recruit',
  'security',
  'other',
]);

export const incidentSubjectTypeSchema = z.enum(['recruit', 'di', 'civilian', 'unknown']);

export const incidentEscalationLevelSchema = z.enum(['platoon', 'company', 'battalion']);

export const alertWorkflowStateSchema = z.enum(['active', 'escalated', 'resolved', 'cancelled']);

export const incidentTaskStatusSchema = z.enum(['open', 'claimed', 'done', 'skipped']);

export const incidentAlertCreateSchema = z.object({
  incidentType: incidentTypeSchema.default('medical_injury'),
  description: z.string().min(1).max(2000),
  location: z.string().max(500).optional(),
  subjectType: incidentSubjectTypeSchema.default('unknown'),
  relatedRecruitIds: z.array(z.string().min(1)).max(20).optional(),
  severity: z.number().int().min(1).max(5).default(5),
  organizationalScope: organizationalAssignmentSchema,
});

export const incidentTaskReassignSchema = z.object({
  alertId: z.string().min(1),
  taskId: z.string().min(1),
  assigneeUserId: z.string().min(1),
});

export type IncidentAlertCreateInput = z.infer<typeof incidentAlertCreateSchema>;
export type IncidentTaskReassignInput = z.infer<typeof incidentTaskReassignSchema>;
