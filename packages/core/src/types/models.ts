/**
 * Data Model Type Definitions
 * 
 * Comprehensive TypeScript type definitions for all core data models in the CountCard application.
 * These types align with Firestore collection structures and Zod validation schemas.
 */

import type { Timestamp } from 'firebase/firestore';
import type { USMCRank, UserRole, Regiment } from './auth';
import type { RecruitRank } from '../constants/recruitRanks';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import type { RecruitStatus } from '@countcard/core/validation/recruitSchemas';
import type { CountCardStatus, WorkflowState } from '@countcard/core/validation/countCardSchemas';

/**
 * Base entity interface for all Firestore documents
 * Provides common fields for tracking creation, updates, and audit trails
 */
export interface BaseEntity {
  /** Document ID (Firestore document ID) */
  id: string;
  /** Timestamp when document was created */
  createdAt: Date | Timestamp;
  /** Timestamp when document was last updated */
  updatedAt: Date | Timestamp;
  /** User ID of the user who created the document */
  createdBy: string;
  /** User ID of the user who last updated the document */
  updatedBy?: string;
}

/**
 * Firestore timestamp type (can be Date or Firestore Timestamp)
 */
export type FirestoreTimestamp = Date | Timestamp;

/**
 * Encrypted data field type
 * Used for storing encrypted sensitive data
 */
export type EncryptedData = Record<string, unknown>;

/**
 * Photo/Image URL type
 */
export type PhotoUrl = string;

/**
 * ============================================================================
 * RECRUIT PROFILE TYPES
 * ============================================================================
 */

/**
 * Recruit Profile
 * Represents a recruit's profile information and organizational assignment
 */
export interface RecruitProfile extends BaseEntity {
  /** Unique recruit identifier */
  recruitId: string;
  /** DoD EDIPI (10-digit identifier shown to users) */
  edipi?: string;
  /** Issued weapons serial number */
  weaponsSerialNumber?: string;
  /** RCO (optics) serial number */
  rcoSerialNumber?: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Recruit pay grade (E-1, E-2, or E-3) */
  rank: RecruitRank;
  /** Recruit status */
  status: RecruitStatus;
  /** Recruit Training Regiment (West/East) */
  regiment?: Regiment;
  /** Battalion assignment */
  battalion?: string;
  /** Company assignment */
  company?: string;
  /** Series assignment (Lead Series, Follow Series) */
  series?: string;
  /** Platoon assignment (4-digit string format, e.g., "2001") */
  platoon: string;
  /** Profile photo URL */
  photoUrl?: PhotoUrl;
  /** Encrypted sensitive data */
  encryptedData?: EncryptedData;
  /** Reference to emergency contacts (document IDs) */
  emergencyContactIds?: string[];
  /** Status change history */
  statusHistory?: Array<{
    fromStatus: RecruitStatus;
    toStatus: RecruitStatus;
    timestamp: Date | Timestamp;
    changedBy: string;
    reason?: string;
  }>;
  /** Organizational transfer history */
  transferHistory?: Array<{
    fromAssignment: {
      regiment?: Regiment;
      battalion?: string;
      company?: string;
      series?: string;
      platoon?: string;
    };
    toAssignment: {
      regiment?: Regiment;
      battalion?: string;
      company?: string;
      series?: string;
      platoon?: string;
    };
    timestamp: Date | Timestamp;
    transferredBy: string;
    reason?: string;
  }>;
  /** Extended profile: medical notes (sensitive – consider storing in encryptedData) */
  medicalNotes?: string;
  /** Extended profile: dietary restrictions */
  dietaryRestrictions?: string;
  /** Extended profile: preferred contact method */
  preferredContactMethod?: 'phone' | 'email';
  /** Extended profile: general notes */
  extendedNotes?: string;
  /** Privacy: who can see full profile (default: same org as per existing permissions) */
  privacy?: RecruitProfilePrivacy;
}

/**
 * Recruit profile privacy settings
 */
export interface RecruitProfilePrivacy {
  /** Who can see full profile including extended info */
  fullProfileVisibleTo?: 'same_platoon' | 'same_company' | 'same_battalion' | 'admins_only';
}

/**
 * Recruit Profile Input (for creation)
 * Excludes auto-generated fields like id, createdAt, updatedAt
 */
export type RecruitProfileInput = Omit<RecruitProfile, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & {
  createdBy: string;
  updatedBy?: string;
};

/**
 * Recruit Profile Update (for updates)
 * All fields optional except recruitId
 */
export type RecruitProfileUpdate = Partial<Omit<RecruitProfile, 'id' | 'recruitId' | 'createdAt' | 'createdBy'>> & {
  recruitId: string;
  updatedBy: string;
  updatedAt?: Date | Timestamp;
};

/**
 * ============================================================================
 * COUNT CARD TYPES
 * ============================================================================
 */

/**
 * Workflow history entry
 * Tracks state changes in the count card workflow
 */
export interface WorkflowHistoryEntry {
  /** Workflow state at this point */
  state: WorkflowState;
  /** Timestamp of state change */
  timestamp: Date | Timestamp;
  /** User ID who made the change */
  userId: string;
  /** Optional notes about the change */
  notes?: string;
}

/**
 * Recruit counts map
 * Map of recruit status to count
 */
export type RecruitCounts = Record<string, number>;

/**
 * Count Card
 * Represents an accountability record for a platoon/unit
 */
export interface CountCard extends BaseEntity {
  /** Unique count card identifier */
  countCardId: string;
  /** Recruit Training Regiment (West/East) */
  regiment?: Regiment;
  /** Battalion assignment */
  battalion?: string;
  /** Company assignment */
  company?: string;
  /** Series assignment */
  series?: string;
  /** Platoon assignment (4-digit string format) */
  platoon: string;
  /** Count card status */
  status: CountCardStatus;
  /** Workflow state */
  workflowState: WorkflowState;
  /** User ID who submitted the count card */
  submittedBy: string;
  /** User ID who the count card is submitted to */
  submittedTo?: string;
  /** User ID who approved the count card */
  approvedBy?: string;
  /** User ID who rejected the count card */
  rejectedBy?: string;
  /** Location where count was taken */
  location: string;
  /** Timestamp when count was taken */
  timestamp: Date | Timestamp;
  /** Recruit counts by status */
  recruitCounts?: RecruitCounts;
  /** Workflow history */
  workflowHistory?: WorkflowHistoryEntry[];
  /** Encrypted sensitive data */
  encryptedData?: EncryptedData;
}

/**
 * Count Card Input (for creation)
 */
export type CountCardInput = Omit<CountCard, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & {
  createdBy: string;
  updatedBy?: string;
};

/**
 * Count Card Update (for updates)
 */
export type CountCardUpdate = Partial<Omit<CountCard, 'id' | 'countCardId' | 'createdAt' | 'createdBy'>> & {
  countCardId: string;
  updatedBy: string;
  updatedAt?: Date | Timestamp;
};

/**
 * ============================================================================
 * ORGANIZATIONAL STRUCTURE TYPES
 * ============================================================================
 */

/**
 * Regiment document (Firestore)
 */
export interface RegimentDocument extends BaseEntity {
  /** Regiment name (West | East) */
  name: Regiment;
}

/**
 * Battalion document (Firestore)
 */
export interface BattalionDocument extends BaseEntity {
  /** Battalion name (1st | 2nd | 3rd | Support) */
  name: Battalion;
  /** Parent regiment document ID */
  regimentId: string;
}

/**
 * Company document (Firestore)
 */
export interface CompanyDocument extends BaseEntity {
  /** Company name (Alpha, Bravo, etc.) */
  name: Company;
  /** Parent battalion document ID */
  battalionId: string;
}

/**
 * Series document (Firestore)
 */
export interface SeriesDocument extends BaseEntity {
  /** Series name (Lead | Follow) */
  name: Series;
  /** Parent company document ID */
  companyId: string;
}

/**
 * Organizational Assignment
 * Represents a user's or recruit's organizational assignment
 */
export interface OrganizationalAssignment {
  /** Recruit Training Regiment (West/East) */
  regiment?: Regiment;
  /** Battalion (1st, 2nd, 3rd, Support) */
  battalion?: Battalion;
  /** Company (varies by battalion) */
  company?: Company;
  /** Series (Lead Series, Follow Series) */
  series?: Series;
  /** Platoon (4-digit string format) */
  platoon?: string;
}

/**
 * Platoon Document
 * Represents a platoon in the organizational structure
 */
export interface Platoon extends BaseEntity {
  /** Platoon identifier (4-digit string) */
  platoonId: string;
  /** Parent series document ID */
  seriesId: string;
  /** Recruit Training Regiment (denormalized for queries) */
  regiment: Regiment;
  /** Battalion (denormalized) */
  battalion: Battalion;
  /** Company (denormalized) */
  company: Company;
  /** Series (denormalized) */
  series?: Series;
  /** Platoon number (4-digit string) */
  platoon: string;
  /** Optional parent IDs for hierarchy queries */
  regimentId?: string;
  battalionId?: string;
  companyId?: string;
  /** Drill instructor user IDs */
  drillInstructors?: string[];
  /** Current recruit count (cached) */
  recruitCount?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * ============================================================================
 * USER PROFILE TYPES
 * ============================================================================
 */

/**
 * User Preferences
 * User-specific application preferences
 */
export interface UserPreferences {
  /** Theme preference (light, dark, system) */
  theme?: 'light' | 'dark' | 'system';
  /** Language preference */
  language?: string;
  /** Notification preferences */
  notifications?: NotificationPreferences;
  /** Other preferences */
  [key: string]: unknown;
}

/**
 * Notification Preferences
 * User's notification preferences
 */
export interface NotificationPreferences {
  /** Email notifications enabled */
  email?: boolean;
  /** Push notifications enabled */
  push?: boolean;
  /** SMS notifications enabled */
  sms?: boolean;
  /** Notification types */
  types?: {
    countCardUpdates?: boolean;
    incidentAlerts?: boolean;
    messages?: boolean;
    systemUpdates?: boolean;
  };
}

/**
 * User Profile
 * Extended user profile information (extends BaseEntity for Firestore compatibility)
 * Note: This is a Firestore document type, not the same as types/auth.UserProfile
 */
export interface UserProfileDocument extends BaseEntity {
  /** Firebase Auth UID (used as document ID) */
  userId: string;
  /** Email address */
  email: string;
  /** Phone number */
  phoneNumber: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** USMC rank */
  rank: USMCRank;
  /** Display name (Format: [Rank] [Last Name]) */
  displayName: string;
  /** Profile picture URL */
  profilePictureUrl?: PhotoUrl;
  /** Company logo URL */
  companyLogoUrl?: PhotoUrl;
  /** Battalion logo URL */
  battalionLogoUrl?: PhotoUrl;
  /** User role */
  role?: UserRole;
  /** Organizational assignment */
  organizationalAssignment?: OrganizationalAssignment;
  /** Profile completion percentage (0-100) */
  profileCompletion?: number;
  /** User preferences */
  preferences?: UserPreferences;
  /** Privacy policy acceptance */
  privacyPolicyAccepted?: boolean;
  /** Privacy policy version */
  privacyPolicyVersion?: string;
  /** Privacy policy accepted timestamp */
  privacyPolicyAcceptedAt?: Date | Timestamp;
  /** Terms of service acceptance */
  termsOfServiceAccepted?: boolean;
  /** Terms of service version */
  termsOfServiceVersion?: string;
  /** Terms of service accepted timestamp */
  termsOfServiceAcceptedAt?: Date | Timestamp;
  /** id.me verification status (future) */
  idmeVerified?: boolean;
  /** id.me user UUID (future) */
  idmeUuid?: string;
  /** Encrypted sensitive data */
  encryptedData?: EncryptedData;
  /** Privacy settings */
  privacy?: {
    showProfilePicture?: boolean;
    showContactToSameCompany?: boolean;
  };
}

/**
 * ============================================================================
 * EMERGENCY CONTACT TYPES
 * ============================================================================
 */

/**
 * Contact relationship type
 */
export type ContactRelationship =
  | 'spouse'
  | 'parent'
  | 'guardian'
  | 'sibling'
  | 'other'
  | 'emergency_contact';

/**
 * Contact method type
 */
export type ContactMethod = 'phone' | 'email';

/**
 * Emergency Contact
 * Represents an emergency contact for a recruit
 */
export interface EmergencyContact extends BaseEntity {
  /** Unique emergency contact identifier */
  emergencyContactId: string;
  /** Reference to recruit ID */
  recruitId: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Relationship to recruit */
  relationship: ContactRelationship;
  /** Primary phone number */
  phoneNumber: string;
  /** Secondary phone number (optional) */
  secondaryPhoneNumber?: string;
  /** Email address (optional) */
  email?: string;
  /** Preferred contact method */
  preferredContactMethod?: ContactMethod;
  /** Address (optional) */
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  /** Additional notes */
  notes?: string;
  /** Encrypted sensitive data */
  encryptedData?: EncryptedData;
}

/**
 * Emergency Contact Input (for creation)
 */
export type EmergencyContactInput = Omit<EmergencyContact, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> & {
  createdBy: string;
  updatedBy?: string;
};

/**
 * Emergency Contact Update (for updates)
 */
export type EmergencyContactUpdate = Partial<Omit<EmergencyContact, 'id' | 'emergencyContactId' | 'recruitId' | 'createdAt' | 'createdBy'>> & {
  emergencyContactId: string;
  recruitId: string;
  updatedBy: string;
  updatedAt?: Date | Timestamp;
};

/**
 * ============================================================================
 * LOGO MANAGEMENT TYPES
 * ============================================================================
 */

/**
 * Logo Metadata
 * Metadata for company or battalion logos
 */
export interface LogoMetadata {
  /** Logo file name */
  fileName: string;
  /** Logo file size in bytes */
  fileSize: number;
  /** Logo MIME type */
  mimeType: string;
  /** Logo width in pixels */
  width?: number;
  /** Logo height in pixels */
  height?: number;
  /** Upload timestamp */
  uploadedAt: Date | Timestamp;
  /** User ID who uploaded the logo */
  uploadedBy: string;
}

/**
 * Company Logo
 * Represents a company logo
 */
export interface CompanyLogo {
  /** Logo identifier */
  logoId: string;
  /** Company name */
  company: Company;
  /** Battalion */
  battalion: Battalion;
  /** Regiment */
  regiment: Regiment;
  /** Logo URL */
  logoUrl: PhotoUrl;
  /** Logo metadata */
  metadata: LogoMetadata;
  /** Created timestamp */
  createdAt: Date | Timestamp;
  /** Updated timestamp */
  updatedAt: Date | Timestamp;
}

/**
 * Battalion Logo
 * Represents a battalion logo
 */
export interface BattalionLogo {
  /** Logo identifier */
  logoId: string;
  /** Battalion */
  battalion: Battalion;
  /** Regiment */
  regiment: Regiment;
  /** Logo URL */
  logoUrl: PhotoUrl;
  /** Logo metadata */
  metadata: LogoMetadata;
  /** Created timestamp */
  createdAt: Date | Timestamp;
  /** Updated timestamp */
  updatedAt: Date | Timestamp;
}

/**
 * ============================================================================
 * CONVERSATION TYPES (Adapted from AIChatModel)
 * ============================================================================
 */

/**
 * Message status
 */
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

/**
 * Message
 * Represents a message in a conversation
 */
export interface Message {
  /** Message ID */
  messageId: string;
  /** Conversation ID */
  conversationId: string;
  /** Sender user ID */
  senderId: string;
  /** Message content */
  content: string;
  /**
   * E2E ciphertext for the message body (JSON). When set with `keyWraps`,
   * `content` may be a placeholder for previews/back-compat.
   */
  encryptedPayload?: { ciphertext: string; nonce: string };
  /** Per-user wraps of the message DEK (base64), each encrypted with that user's key */
  keyWraps?: Record<string, { ciphertext: string; nonce: string }>;
  /** Message status */
  status: MessageStatus;
  /** Timestamp when message was sent */
  sentAt: Date | Timestamp;
  /** Timestamp when message was delivered */
  deliveredAt?: Date | Timestamp;
  /** Timestamp when message was read */
  readAt?: Date | Timestamp;
  /** Message attachments */
  attachments?: MessageAttachment[];
  /** Message reactions */
  reactions?: MessageReaction[];
  /** Reply to message ID (for threading) */
  replyToMessageId?: string;
}

/**
 * Message Attachment
 * Represents an attachment in a message
 */
export interface MessageAttachment {
  /** Attachment ID */
  attachmentId: string;
  /** File name */
  fileName: string;
  /** File URL */
  fileUrl: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Upload timestamp */
  uploadedAt: Date | Timestamp;
}

/**
 * Message Reaction
 * Represents a reaction to a message
 */
export interface MessageReaction {
  /** User ID who reacted */
  userId: string;
  /** Reaction emoji or type */
  reaction: string;
  /** Timestamp when reaction was added */
  reactedAt: Date | Timestamp;
}

/**
 * Conversation
 * Represents a conversation between users
 */
export interface Conversation extends BaseEntity {
  /** Unique conversation identifier */
  conversationId: string;
  /** Participant user IDs */
  participants: string[];
  /** Last message timestamp */
  lastMessageAt?: Date | Timestamp;
  /** Last message content (for preview) */
  lastMessageContent?: string;
  /** Last message sender ID */
  lastMessageSenderId?: string;
  /** Conversation metadata */
  metadata?: Record<string, unknown>;
}

/**
 * ============================================================================
 * ADMIN LOG TYPES
 * ============================================================================
 */

/**
 * Admin action type
 */
export type AdminActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'unassign'
  | 'export'
  | 'import'
  | 'other';

/**
 * Resource type
 */
export type ResourceType =
  | 'recruit'
  | 'countCard'
  | 'userProfile'
  | 'emergencyContact'
  | 'conversation'
  | 'platoon'
  | 'logo'
  | 'other';

/**
 * Admin Log Entry
 * Represents an administrative action log entry (immutable)
 */
export interface AdminLogEntry {
  /** Log entry ID */
  logId: string;
  /** User ID who performed the action */
  userId: string;
  /** Action type */
  action: AdminActionType;
  /** Resource type */
  resourceType: ResourceType;
  /** Resource ID */
  resourceId: string;
  /** Action description */
  description: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Timestamp when action was performed */
  timestamp: Date | Timestamp;
  /** IP address (if available) */
  ipAddress?: string;
  /** User agent (if available) */
  userAgent?: string;
}

/**
 * ============================================================================
 * INCIDENT ALERT TYPES (For Sprint 18)
 * ============================================================================
 */

/**
 * Alert workflow state
 */
export type AlertWorkflowState =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'resolved'
  | 'cancelled';

/**
 * Alert notification type
 */
export type AlertNotificationType = 'push' | 'email' | 'sms';

/**
 * Alert notification status
 */
export type AlertNotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'read';

/**
 * Alert notification
 * Represents a notification sent for an incident alert
 */
export interface AlertNotification {
  /** Notification ID */
  notificationId: string;
  /** Alert ID */
  alertId: string;
  /** Recipient user ID */
  recipientUserId: string;
  /** Notification type */
  notificationType: AlertNotificationType;
  /** Notification status */
  status: AlertNotificationStatus;
  /** Sent timestamp */
  sentAt: Date | Timestamp;
  /** Delivered timestamp */
  deliveredAt?: Date | Timestamp;
  /** Read timestamp */
  readAt?: Date | Timestamp;
  /** Acknowledged timestamp */
  acknowledgedAt?: Date | Timestamp;
  /** Error message (if failed) */
  errorMessage?: string;
}

/**
 * Alert message
 * Represents a message in an alert thread
 */
export interface AlertMessage {
  /** Message ID */
  messageId: string;
  /** Alert ID */
  alertId: string;
  /** Sender user ID */
  senderId: string;
  /** Message content */
  content: string;
  /** Sent timestamp */
  sentAt: Date | Timestamp;
  /** Message attachments */
  attachments?: MessageAttachment[];
  /** Reply to message ID (for threading) */
  replyToMessageId?: string;
  /** Read receipts */
  readReceipts?: Array<{
    userId: string;
    readAt: Date | Timestamp;
  }>;
}

/**
 * Incident Alert
 * Represents a mass incident alert
 */
export interface IncidentAlert extends BaseEntity {
  /** Unique alert identifier */
  alertId: string;
  /** Alert title */
  title: string;
  /** Alert description */
  description: string;
  /** Alert workflow state */
  workflowState: AlertWorkflowState;
  /** Organizational scope */
  organizationalScope: OrganizationalAssignment;
  /** Priority level (1-5, 5 being highest) */
  priority: number;
  /** Created by user ID */
  createdBy: string;
  /** Submitted by user ID */
  submittedBy?: string;
  /** Approved by user ID */
  approvedBy?: string;
  /** Rejected by user ID */
  rejectedBy?: string;
  /** Rejection reason */
  rejectionReason?: string;
  /** Active timestamp */
  activeAt?: Date | Timestamp;
  /** Resolved timestamp */
  resolvedAt?: Date | Timestamp;
  /** Cancelled timestamp */
  cancelledAt?: Date | Timestamp;
  /** Encrypted sensitive data */
  encryptedData?: EncryptedData;
}

/**
 * ============================================================================
 * ENCRYPTION TYPES
 * ============================================================================
 */

/**
 * Encryption Key
 * Represents a user's encryption key
 */
export interface EncryptionKey {
  /** Key identifier */
  keyId: string;
  /** User ID (owner of the key) */
  userId: string;
  /** Encrypted key data */
  encryptedKey: string;
  /** Key version */
  keyVersion: number;
  /** Created timestamp */
  createdAt: Date | Timestamp;
  /** Last rotated timestamp */
  lastRotatedAt?: Date | Timestamp;
  /** Key metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Encryption Configuration
 * Represents a user's encryption configuration
 */
export interface EncryptionConfig {
  /** Configuration ID */
  configId: string;
  /** User ID */
  userId: string;
  /** Encryption algorithm */
  algorithm: string;
  /** Key derivation function */
  keyDerivationFunction?: string;
  /** Configuration metadata */
  metadata?: Record<string, unknown>;
  /** Created timestamp */
  createdAt: Date | Timestamp;
  /** Updated timestamp */
  updatedAt: Date | Timestamp;
}

/**
 * ============================================================================
 * FUTURE BUILD TYPES (Placeholder - xAI implementation)
 * ============================================================================
 */

/**
 * Weapons Accountability Record (Future Build)
 * Placeholder type for future implementation
 */
export interface WeaponsAccountabilityRecord {
  /** Record ID */
  recordId: string;
  /** Additional fields to be defined by xAI */
  [key: string]: unknown;
}

/**
 * RCO Accountability Record (Future Build)
 * Placeholder type for future implementation
 */
export interface RCOAccountabilityRecord {
  /** Record ID */
  recordId: string;
  /** Additional fields to be defined by xAI */
  [key: string]: unknown;
}

/**
 * Audit Log Record (Future Build)
 * Placeholder type for future implementation
 */
export interface AuditLogRecord {
  /** Log ID */
  logId: string;
  /** Additional fields to be defined by xAI */
  [key: string]: unknown;
}

/**
 * Investigator Assignment (Future Build)
 * Placeholder type for future implementation
 */
export interface InvestigatorAssignment {
  /** Assignment ID */
  assignmentId: string;
  /** Additional fields to be defined by xAI */
  [key: string]: unknown;
}
