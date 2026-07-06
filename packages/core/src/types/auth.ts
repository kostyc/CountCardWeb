/**
 * Authentication Types
 * Type definitions for authentication system
 */

import { User as FirebaseUser, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';

/**
 * User roles in the system
 */
export type UserRole =
  | 'drill_instructor'
  | 'senior_drill_instructor'
  | 'chief_drill_instructor'
  | 'company_first_sgt'
  | 'series_commander'
  | 'company_xo'
  | 'company_commander'
  | 'battalion_sgt_maj'
  | 'battalion_xo'
  | 'battalion_commander';

/**
 * Recruit Training Regiment
 */
export type Regiment = 'West' | 'East';

/**
 * USMC Rank abbreviations
 * Enlisted: E-5 through E-9
 * Officer: O-1 through O-6
 */
export type USMCRank =
  // Enlisted Ranks (E-5 through E-9)
  | 'Sgt' // E-5: Sergeant
  | 'SSgt' // E-6: Staff Sergeant
  | 'GySgt' // E-7: Gunnery Sergeant
  | 'MSgt' // E-8: Master Sergeant
  | '1stSgt' // E-8: First Sergeant
  | 'MGySgt' // E-9: Master Gunnery Sergeant
  | 'SgtMaj' // E-9: Sergeant Major
  | 'SgtMajMC' // E-9: Sergeant Major of the Marine Corps
  // Officer Ranks (O-1 through O-6)
  | '2ndLt' // O-1: Second Lieutenant
  | '1stLt' // O-2: First Lieutenant
  | 'Capt' // O-3: Captain
  | 'Maj' // O-4: Major
  | 'LtCol' // O-5: Lieutenant Colonel
  | 'Col'; // O-6: Colonel

/**
 * Organizational structure for user assignments
 * Uses enum types for type safety, matching the definition in types/models.ts
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
 * User profile data stored in Firestore
 */
export interface UserProfile {
  userId: string;
  // Required fields (minimum for account creation)
  firstName: string;
  lastName: string;
  rank: USMCRank;
  email: string;
  phoneNumber: string;
  displayName: string; // Format: [Rank] [Last Name]
  // Optional fields
  photoURL?: string;
  profilePictureUrl?: string; // Firebase Storage URL
  companyLogoUrl?: string;
  battalionLogoUrl?: string;
  // Role and organizational assignment
  role?: UserRole;
  organizationalAssignment?: OrganizationalAssignment;
  // Policy acceptance
  privacyPolicyAccepted?: boolean;
  privacyPolicyVersion?: string;
  privacyPolicyAcceptedAt?: Date;
  termsOfServiceAccepted?: boolean;
  termsOfServiceVersion?: string;
  termsOfServiceAcceptedAt?: Date;
  // Future: id.me verification
  idmeVerified?: boolean;
  idmeUuid?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Privacy
  privacy?: UserProfilePrivacy;
}

/**
 * User profile privacy settings
 */
export interface UserProfilePrivacy {
  showProfilePicture?: boolean;
  showContactToSameCompany?: boolean;
}

/**
 * Extended user object combining Firebase User and UserProfile
 */
export interface AppUser extends FirebaseUser {
  profile?: UserProfile;
  customClaims?: {
    role?: UserRole;
    organizationalAssignment?: OrganizationalAssignment;
    admin?: boolean;
  };
}

/**
 * Authentication state
 */
export interface AuthState {
  user: AppUser | null;
  loading: boolean;
  error: Error | null;
  initialized: boolean;
}

/**
 * Authentication methods return type
 */
export interface AuthResult {
  success: boolean;
  error?: Error;
  user?: AppUser;
  confirmationResult?: ConfirmationResult;
  message?: string;
}

/**
 * Email/Password sign up parameters
 */
export interface EmailPasswordSignUpParams {
  email: string;
  password: string;
  displayName?: string;
}

/**
 * Email/Password sign in parameters
 */
export interface EmailPasswordSignInParams {
  email: string;
  password: string;
}

/**
 * Phone number authentication parameters
 */
export interface PhoneAuthParams {
  phoneNumber: string;
  recaptchaVerifier?: RecaptchaVerifier;
  verificationCode?: string;
  confirmationResult?: ConfirmationResult;
}

/**
 * Password reset parameters
 */
export interface PasswordResetParams {
  email: string;
}

/**
 * Account linking parameters
 */
export interface AccountLinkParams {
  provider: 'google' | 'apple' | 'phone';
  credential?: unknown;
}
