/**
 * Encryption Validation Schemas
 * 
 * Zod schemas for validating encryption-related inputs:
 * - Recovery codes
 * - Encrypted data
 * - Key management requests
 */

import { z } from 'zod';

/**
 * Recovery code validation
 * Format: XXXX-XXXX-XXXX-XXXX (16 characters, 4 groups of 4)
 */
export const recoveryCodeSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    'Recovery code must be in format: XXXX-XXXX-XXXX-XXXX'
  )
  .min(19, 'Recovery code must be 19 characters (with dashes)')
  .max(19, 'Recovery code must be 19 characters (with dashes)')
  .transform((val) => val.replace(/-/g, '')) // Remove dashes for storage
  .pipe(
    z.string().length(16, 'Recovery code must be 16 characters')
  );

/**
 * Recovery code with dashes (for display/input)
 */
export const recoveryCodeWithDashesSchema = z
  .string()
  .regex(
    /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    'Recovery code must be in format: XXXX-XXXX-XXXX-XXXX'
  );

/**
 * Base64-encoded data validation
 */
export const base64Schema = z
  .string()
  .regex(/^[A-Za-z0-9+/=]+$/, 'Invalid base64 format')
  .min(1, 'Base64 data is required');

/**
 * Encrypted data structure validation
 * Matches EncryptionResult type from encryption service
 */
export const encryptedDataSchema = z.object({
  encrypted: base64Schema,
  nonce: base64Schema,
});

/**
 * Encryption key validation (base64-encoded 32-byte key)
 */
export const encryptionKeySchema = base64Schema
  .refine(
    (val) => {
      try {
        const decoded = Buffer.from(val, 'base64');
        return decoded.length === 32;
      } catch {
        return false;
      }
    },
    {
      message: 'Encryption key must be a base64-encoded 32-byte key',
    }
  );

/**
 * Key version validation
 */
export const keyVersionSchema = z
  .number()
  .int()
  .min(1, 'Key version must be at least 1');

/**
 * Generate key request schema
 */
export const generateKeyRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Get key request schema
 */
export const getKeyRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Rotate key request schema
 */
export const rotateKeyRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Generate recovery code request schema
 */
export const generateRecoveryCodeRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Recover key request schema
 */
export const recoverKeyRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  recoveryCode: recoveryCodeWithDashesSchema,
});

/**
 * Type exports for TypeScript inference
 */
export type RecoveryCodeInput = z.infer<typeof recoveryCodeSchema>;
export type RecoveryCodeWithDashesInput = z.infer<typeof recoveryCodeWithDashesSchema>;
export type EncryptedDataInput = z.infer<typeof encryptedDataSchema>;
export type EncryptionKeyInput = z.infer<typeof encryptionKeySchema>;
export type GenerateKeyRequestInput = z.infer<typeof generateKeyRequestSchema>;
export type GetKeyRequestInput = z.infer<typeof getKeyRequestSchema>;
export type RotateKeyRequestInput = z.infer<typeof rotateKeyRequestSchema>;
export type GenerateRecoveryCodeRequestInput = z.infer<typeof generateRecoveryCodeRequestSchema>;
export type RecoverKeyRequestInput = z.infer<typeof recoverKeyRequestSchema>;
