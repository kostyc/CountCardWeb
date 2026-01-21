/**
 * Encryption Types
 * 
 * TypeScript type definitions for encryption-related data structures
 */

import { EncryptionKey, EncryptedData, EncryptionResult } from './encryptionService';

/**
 * Encryption key with metadata
 */
export interface EncryptionKeyWithMetadata {
  key: EncryptionKey;
  createdAt: Date;
  version: number;
  userId: string;
}

/**
 * Encrypted data stored in Firestore
 */
export interface StoredEncryptedData {
  ciphertext: EncryptedData;
  nonce: string;
  keyVersion?: number;
  encryptedAt: Date;
}

/**
 * Key pair for asymmetric encryption (if needed in future)
 */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Recovery code information
 */
export interface RecoveryCodeInfo {
  code: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  userId: string;
}

/**
 * Encryption configuration per user
 */
export interface EncryptionConfig {
  userId: string;
  keyVersion: number;
  algorithm: 'XChaCha20-Poly1305';
  keyRotationEnabled: boolean;
  lastKeyRotation?: Date;
  recoveryCodesEnabled: boolean;
}

/**
 * Re-export types from encryptionService
 */
export type { EncryptionKey, EncryptedData, EncryptionResult };
