/**
 * Validation Module
 * 
 * Main export file for all validation schemas and utilities.
 * Provides centralized access to all Zod validation schemas.
 */

// Validation utilities
export {
  validateRequest,
  validateAndParse,
  validateOptional,
  formatValidationError,
  safeValidate,
  validateArray,
  validatePagination,
  type ValidationErrorDetail,
  type ValidationErrorResponse,
} from './utils';

// Authentication schemas
export {
  emailSchema,
  passwordSchema,
  phoneNumberSchema,
  displayNameSchema,
  loginSchema,
  signupSchema,
  passwordResetSchema,
  passwordResetConfirmSchema,
  phoneAuthSchema,
  phoneVerificationSchema,
  changePasswordSchema,
  type LoginInput,
  type SignupInput,
  type PasswordResetInput,
  type PasswordResetConfirmInput,
  type PhoneAuthInput,
  type PhoneVerificationInput,
  type ChangePasswordInput,
} from './authSchemas';

// User profile schemas
export {
  usmcRankSchema,
  userRoleSchema,
  regimentSchema,
  organizationalAssignmentSchema,
  firstNameSchema,
  lastNameSchema,
  nameSchema,
  urlSchema,
  userProfileCreateSchema,
  userProfileUpdateSchema,
  type UserProfileCreateInput,
  type UserProfileUpdateInput,
  type OrganizationalAssignmentInput,
} from './userProfileSchemas';

// Recruit schemas
export {
  recruitStatusSchema,
  recruitNameSchema,
  platoonSchema as recruitPlatoonSchema,
  battalionSchema as recruitBattalionSchema,
  companySchema as recruitCompanySchema,
  seriesSchema as recruitSeriesSchema,
  recruitIdSchema,
  photoUrlSchema,
  recruitCreateSchema,
  recruitUpdateSchema,
  recruitQuerySchema,
  type RecruitCreateInput,
  type RecruitUpdateInput,
  type RecruitQueryInput,
  type RecruitStatus,
} from './recruitSchemas';

// Count card schemas
export {
  countCardStatusSchema,
  workflowStateSchema,
  countCardIdSchema,
  locationSchema,
  timestampSchema,
  userIdSchema,
  recruitCountsSchema,
  workflowHistoryEntrySchema,
  workflowHistorySchema,
  countCardCreateSchema,
  countCardUpdateSchema,
  countCardQuerySchema,
  type CountCardCreateInput,
  type CountCardUpdateInput,
  type CountCardQueryInput,
  type CountCardStatus,
  type WorkflowState,
  type WorkflowHistoryEntry,
} from './countCardSchemas';

// MCRD grid count card schemas
export {
  countCardBackgroundColorSchema,
  trainingDayPhaseSchema,
  countCardGridRowSchema,
  mcrdCountCardCreateSchema,
  mcrdCountCardUpdateSchema,
  companyTrainingDaySchema,
  type McrdCountCardCreateInput,
  type McrdCountCardUpdateInput,
  type CompanyTrainingDayInputSchema,
} from './mcrdCountCardSchemas';

// Organizational structure schemas
export {
  battalionSchema,
  companySchema,
  seriesSchema,
  platoonSchema,
  organizationalAssignmentSchema as orgAssignmentSchema,
  organizationalQuerySchema,
  type OrganizationalAssignmentInput as OrgAssignmentInput,
  type OrganizationalQueryInput,
  type Battalion,
  type Company,
  type Series,
} from './organizationSchemas';

// Encryption schemas
export {
  recoveryCodeSchema,
  recoveryCodeWithDashesSchema,
  base64Schema,
  encryptedDataSchema,
  encryptionKeySchema,
  keyVersionSchema,
  generateKeyRequestSchema,
  getKeyRequestSchema,
  rotateKeyRequestSchema,
  generateRecoveryCodeRequestSchema,
  recoverKeyRequestSchema,
  type RecoveryCodeInput,
  type RecoveryCodeWithDashesInput,
  type EncryptedDataInput,
  type EncryptionKeyInput,
  type GenerateKeyRequestInput,
  type GetKeyRequestInput,
  type RotateKeyRequestInput,
  type GenerateRecoveryCodeRequestInput,
  type RecoverKeyRequestInput,
} from './encryptionSchemas';

// API request schemas
export {
  paginationSchema,
  sortOrderSchema,
  sortSchema,
  dateRangeSchema,
  searchQuerySchema,
  filterSchema,
  paginationSortSchema,
  paginationSortFilterSchema,
  paginationSortFilterSearchSchema,
  idParamSchema,
  idsParamSchema,
  type PaginationInput,
  type SortInput,
  type DateRangeInput,
  type SearchQueryInput,
  type FilterInput,
  type PaginationSortInput,
  type PaginationSortFilterInput,
  type PaginationSortFilterSearchInput,
  type IdParamInput,
  type IdsParamInput,
} from './apiSchemas';

// Emergency contact schemas
export {
  contactRelationshipSchema,
  contactMethodSchema,
  addressSchema,
  emergencyContactNameSchema,
  emergencyContactIdSchema,
  recruitIdSchema as emergencyContactRecruitIdSchema,
  emergencyContactInputSchema,
  emergencyContactUpdateSchema,
  emergencyContactQuerySchema,
  type ContactRelationship,
  type ContactMethod,
  type Address,
  type EmergencyContactInput,
  type EmergencyContactUpdate,
  type EmergencyContactQuery,
} from './emergencyContactSchemas';

// Logo schemas
export {
  logoIdSchema,
  logoUrlSchema,
  logoFileNameSchema,
  logoMimeTypeSchema,
  logoFileSizeSchema,
  logoDimensionsSchema,
  logoMetadataSchema,
  companyLogoInputSchema,
  companyLogoUpdateSchema,
  battalionLogoInputSchema,
  battalionLogoUpdateSchema,
  logoQuerySchema,
  type LogoMetadata,
  type CompanyLogoInput,
  type CompanyLogoUpdate,
  type BattalionLogoInput,
  type BattalionLogoUpdate,
  type LogoQuery,
} from './logoSchemas';

// Conversation schemas
export {
  messageStatusSchema,
  conversationIdSchema,
  messageIdSchema,
  userIdSchema as conversationUserIdSchema,
  messageContentSchema,
  messageAttachmentSchema,
  messageReactionSchema,
  messageInputSchema,
  messageUpdateSchema,
  conversationInputSchema,
  conversationUpdateSchema,
  conversationQuerySchema,
  messageQuerySchema,
  type MessageStatus,
  type MessageAttachment,
  type MessageReaction,
  type MessageInput,
  type MessageUpdate,
  type ConversationInput,
  type ConversationUpdate,
  type ConversationQuery,
  type MessageQuery,
} from './conversationSchemas';

// Admin log schemas
export {
  adminActionTypeSchema,
  resourceTypeSchema,
  logIdSchema,
  adminLogUserIdSchema,
  resourceIdSchema,
  actionDescriptionSchema,
  ipAddressSchema,
  userAgentSchema,
  adminLogEntryInputSchema,
  adminLogQuerySchema,
  type AdminActionType,
  type ResourceType,
  type AdminLogEntryInput,
  type AdminLogQuery,
} from './adminLogSchemas';

// Lifecycle schemas
export {
  custodyPhaseSchema,
  transferBatchStatusSchema,
  transferBatchCreateSchema,
  transferBatchRejectSchema,
  progressEventTypeSchema,
  progressEventInputSchema,
  recruitCommentCategorySchema,
  recruitCommentInputSchema,
  diLeadershipCardInputSchema,
  diRecommendationInputSchema,
  diCardAuthorRoleSchema,
  diCardTypeSchema,
  diCardWorkflowStateSchema,
  signatureRecordSchema,
  conversationTypeSchema,
  conversationOrgScopeSchema,
  fitnessScoreEventSchema,
  receivingUrinalysisSchema,
  receivingUrinalysisResultSchema,
  receivingChecklistEntrySchema,
  type CustodyPhase,
  type TransferBatchStatus,
  type ProgressEventType,
  type RecruitCommentCategory,
  type ConversationType,
} from './lifecycleSchemas';
