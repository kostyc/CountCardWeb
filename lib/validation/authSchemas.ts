/**
 * Authentication Validation Schemas
 * 
 * Zod schemas for validating authentication-related inputs:
 * - Login
 * - Signup
 * - Password reset
 * - Phone number authentication
 */

import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .max(255, 'Email must be 255 characters or less')
  .toLowerCase()
  .trim();

/**
 * Password validation schema
 * Requirements: 12+ characters, uppercase, lowercase, numbers, special characters
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or less')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Phone number validation schema
 * Supports US phone number formats
 */
export const phoneNumberSchema = z
  .string()
  .regex(
    /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    'Invalid phone number format. Use format: (XXX) XXX-XXXX or XXX-XXX-XXXX'
  )
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number must be 20 characters or less');

/**
 * Display name validation schema
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be 100 characters or less')
  .trim();

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Signup request schema
 */
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema.optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z.object({
  oobCode: z.string().min(1, 'Reset code is required'),
  newPassword: passwordSchema,
});

/**
 * Phone number authentication schema
 */
export const phoneAuthSchema = z.object({
  phoneNumber: phoneNumberSchema,
});

/**
 * Phone number verification schema
 */
export const phoneVerificationSchema = z.object({
  phoneNumber: phoneNumberSchema,
  verificationCode: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

/**
 * Type exports for TypeScript inference
 */
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type PhoneAuthInput = z.infer<typeof phoneAuthSchema>;
export type PhoneVerificationInput = z.infer<typeof phoneVerificationSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
