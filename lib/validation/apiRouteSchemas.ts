/**
 * API route request/query validation schemas
 * Used by app/api routes for body and query validation.
 */

import { z } from 'zod';
import {
  usmcRankSchema,
  userRoleSchema,
  organizationalAssignmentSchema,
  firstNameSchema,
  lastNameSchema,
  emailSchema,
  phoneNumberSchema,
  urlSchema,
} from './userProfileSchemas';

/** POST /api/user/profile body */
export const apiProfilePostSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  rank: usmcRankSchema,
  email: emailSchema,
  phoneNumber: phoneNumberSchema,
  role: userRoleSchema.optional(),
  organizationalAssignment: organizationalAssignmentSchema.optional(),
  profilePictureUrl: urlSchema,
  companyLogoUrl: urlSchema,
  battalionLogoUrl: urlSchema,
});

/** GET /api/user/profile query */
export const apiProfileGetQuerySchema = z.object({
  userId: z.string().min(1).optional(),
});

/** PATCH /api/user/profile body (privacy and/or picture URLs) */
export const apiProfilePrivacyPatchSchema = z.object({
  privacy: z
    .object({
      showProfilePicture: z.boolean().optional(),
      showContactToSameCompany: z.boolean().optional(),
    })
    .optional(),
  profilePictureUrl: z.string().url().optional().nullable(),
  companyLogoUrl: z.string().url().optional().nullable(),
  battalionLogoUrl: z.string().url().optional().nullable(),
});

/** POST /api/user/accept-policies body */
export const apiAcceptPoliciesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  privacyPolicyAccepted: z.boolean(),
  privacyPolicyVersion: z.string().max(50).optional(),
  termsOfServiceAccepted: z.boolean(),
  termsOfServiceVersion: z.string().max(50).optional(),
});

/** POST /api/user/profile/completion body */
export const apiProfileCompletionSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  completionPercentage: z.number().min(0).max(100),
});

/** POST /api/user/set-custom-claims body */
export const apiSetCustomClaimsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: userRoleSchema.optional(),
  organizationalAssignment: organizationalAssignmentSchema.optional(),
});

/** POST /api/count-cards/[id]/approve body */
export const apiCountCardApproveSchema = z.object({
  notes: z.string().max(2000).optional(),
  submittedTo: z.string().min(1).optional(),
});

/** POST /api/count-cards/[id]/reject body */
export const apiCountCardRejectSchema = z.object({
  notes: z.string().min(1, 'Rejection notes are required').max(2000),
});

/** POST /api/count-cards/[id]/consolidate body */
export const apiCountCardConsolidateSchema = z.object({
  notes: z.string().max(2000).optional(),
  submittedTo: z.string().min(1).optional(),
});

/** POST /api/count-cards/[id]/final-approve body */
export const apiCountCardFinalApproveSchema = z.object({
  notes: z.string().max(2000).optional(),
});

/** POST /api/encryption/recover-key body */
export const apiRecoverKeySchema = z.object({
  recoveryCode: z.string().min(1, 'Recovery code is required'),
});

/** GET /api/admin/users query */
export const apiAdminUsersQuerySchema = z.object({
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

/** GET /api/encryption/key query */
export const apiEncryptionKeyQuerySchema = z.object({
  userId: z.string().min(1).optional(),
});

/** POST /api/encryption/wrap-dek body */
export const apiWrapDekSchema = z.object({
  conversationId: z.string().min(1).max(100),
  recipientUserId: z.string().min(1).max(100),
  dekBase64: z.string().min(1).max(256),
});

/** POST /api/logos/company body (register shared company logo after upload) */
export const apiLogosCompanyPostSchema = z.object({
  logoUrl: z.string().url('Valid logo URL is required'),
  fileName: z.string().max(256).optional(),
  fileSize: z.number().int().nonnegative().optional(),
  mimeType: z.string().max(64).optional(),
});

export type ApiProfilePostInput = z.infer<typeof apiProfilePostSchema>;
export type ApiProfileGetQueryInput = z.infer<typeof apiProfileGetQuerySchema>;
export type ApiAcceptPoliciesInput = z.infer<typeof apiAcceptPoliciesSchema>;
export type ApiProfileCompletionInput = z.infer<typeof apiProfileCompletionSchema>;
export type ApiSetCustomClaimsInput = z.infer<typeof apiSetCustomClaimsSchema>;
export type ApiCountCardApproveInput = z.infer<typeof apiCountCardApproveSchema>;
export type ApiCountCardRejectInput = z.infer<typeof apiCountCardRejectSchema>;
export type ApiCountCardConsolidateInput = z.infer<typeof apiCountCardConsolidateSchema>;
export type ApiCountCardFinalApproveInput = z.infer<typeof apiCountCardFinalApproveSchema>;
export type ApiRecoverKeyInput = z.infer<typeof apiRecoverKeySchema>;
export type ApiAdminUsersQueryInput = z.infer<typeof apiAdminUsersQuerySchema>;
export type ApiEncryptionKeyQueryInput = z.infer<typeof apiEncryptionKeyQuerySchema>;
export type ApiWrapDekInput = z.infer<typeof apiWrapDekSchema>;
export type ApiLogosCompanyPostInput = z.infer<typeof apiLogosCompanyPostSchema>;
