/**
 * Profile Completion Utilities
 * 
 * Calculates profile completion percentage based on required and optional fields
 */

import type { UserProfileDocument } from './types/models';

/**
 * Profile completion field weights
 * Required fields have higher weight than optional fields
 */
const FIELD_WEIGHTS = {
  // Required fields (total: 50 points)
  firstName: 10,
  lastName: 10,
  rank: 10,
  email: 10,
  phoneNumber: 10,
  
  // Optional but important fields (total: 30 points)
  role: 10,
  organizationalAssignment: 10,
  profilePictureUrl: 10,
  
  // Additional optional fields (total: 20 points)
  preferences: 5,
  privacyPolicyAccepted: 5,
  termsOfServiceAccepted: 5,
  encryptedData: 5,
} as const;

/**
 * Calculate profile completion percentage
 * 
 * @param profile - User profile document
 * @returns Completion percentage (0-100)
 */
export function calculateProfileCompletion(
  profile: Partial<UserProfileDocument>
): number {
  let totalScore = 0;
  let maxScore = 0;

  // Check required fields
  if (profile.firstName) totalScore += FIELD_WEIGHTS.firstName;
  maxScore += FIELD_WEIGHTS.firstName;

  if (profile.lastName) totalScore += FIELD_WEIGHTS.lastName;
  maxScore += FIELD_WEIGHTS.lastName;

  if (profile.rank) totalScore += FIELD_WEIGHTS.rank;
  maxScore += FIELD_WEIGHTS.rank;

  if (profile.email) totalScore += FIELD_WEIGHTS.email;
  maxScore += FIELD_WEIGHTS.email;

  if (profile.phoneNumber) totalScore += FIELD_WEIGHTS.phoneNumber;
  maxScore += FIELD_WEIGHTS.phoneNumber;

  // Check optional but important fields
  if (profile.role) totalScore += FIELD_WEIGHTS.role;
  maxScore += FIELD_WEIGHTS.role;

  if (profile.organizationalAssignment) {
    const org = profile.organizationalAssignment;
    // Count organizational fields
    let orgFields = 0;
    if (org.regiment) orgFields++;
    if (org.battalion) orgFields++;
    if (org.company) orgFields++;
    if (org.series) orgFields++;
    if (org.platoon) orgFields++;
    
    // Award points based on how many org fields are filled (up to 5 fields = 10 points)
    if (orgFields > 0) {
      totalScore += (orgFields / 5) * FIELD_WEIGHTS.organizationalAssignment;
    }
  }
  maxScore += FIELD_WEIGHTS.organizationalAssignment;

  if (profile.profilePictureUrl) totalScore += FIELD_WEIGHTS.profilePictureUrl;
  maxScore += FIELD_WEIGHTS.profilePictureUrl;

  // Check additional optional fields
  if (profile.preferences) totalScore += FIELD_WEIGHTS.preferences;
  maxScore += FIELD_WEIGHTS.preferences;

  if (profile.privacyPolicyAccepted) totalScore += FIELD_WEIGHTS.privacyPolicyAccepted;
  maxScore += FIELD_WEIGHTS.privacyPolicyAccepted;

  if (profile.termsOfServiceAccepted) totalScore += FIELD_WEIGHTS.termsOfServiceAccepted;
  maxScore += FIELD_WEIGHTS.termsOfServiceAccepted;

  if (profile.encryptedData) totalScore += FIELD_WEIGHTS.encryptedData;
  maxScore += FIELD_WEIGHTS.encryptedData;

  // Calculate percentage
  if (maxScore === 0) return 0;
  return Math.round((totalScore / maxScore) * 100);
}

/**
 * Get missing required fields
 * 
 * @param profile - User profile document
 * @returns Array of missing required field names
 */
export function getMissingRequiredFields(
  profile: Partial<UserProfileDocument>
): string[] {
  const missing: string[] = [];

  if (!profile.firstName) missing.push('firstName');
  if (!profile.lastName) missing.push('lastName');
  if (!profile.rank) missing.push('rank');
  if (!profile.email) missing.push('email');
  if (!profile.phoneNumber) missing.push('phoneNumber');

  return missing;
}

/**
 * Check if profile has minimum required fields
 * 
 * @param profile - User profile document
 * @returns true if all required fields are present
 */
export function hasMinimumRequiredFields(
  profile: Partial<UserProfileDocument>
): boolean {
  return getMissingRequiredFields(profile).length === 0;
}
