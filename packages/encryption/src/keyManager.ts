/**
 * Key Management Service
 * 
 * Provides comprehensive key management for user encryption keys, including:
 * - Key generation
 * - Key storage (encrypted in Firestore)
 * - Key retrieval
 * - Key rotation
 * - Key recovery
 * 
 * All keys are encrypted before storage using a master encryption key.
 * Keys are stored in the `encryptionKeys` Firestore collection.
 */

import { generateKey, generateRecoveryCode, type EncryptionKey, type EncryptionResult } from './encryptionService';
import { encrypt, decrypt } from './encryptionService';
import { encodeBase64, decodeBase64 } from './utils';
import { logError, logInfo } from '@countcard/core/logger';
import type { EncryptionConfig, RecoveryCodeInfo } from './types';

/**
 * Stored encryption key document structure in Firestore
 */
export interface StoredEncryptionKey {
  userId: string;
  encryptedKey: EncryptionResult; // Key encrypted with master key
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
  lastRotatedAt?: Date;
  recoveryCodes?: RecoveryCodeInfo[];
}

/**
 * Key pair for asymmetric operations (if needed in future)
 */
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Get master encryption key from environment variable
 * This key is used to encrypt user encryption keys before storage
 * 
 * @returns Master encryption key (32 bytes)
 */
async function getMasterKey(): Promise<EncryptionKey> {
  const masterKeyBase64 = process.env.ENCRYPTION_MASTER_KEY;
  
  if (!masterKeyBase64) {
    throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set');
  }
  
  try {
    const masterKey = decodeBase64(masterKeyBase64);
    
    if (masterKey.length !== 32) {
      throw new Error(`Master key has incorrect size: ${masterKey.length} bytes (expected 32)`);
    }
    
    return masterKey;
  } catch (error) {
    logError(error as Error, 'keyManager.getMasterKey');
    throw new Error('Failed to load master encryption key');
  }
}

/**
 * Generate a new user encryption key
 * 
 * @returns Promise resolving to new encryption key
 */
export async function generateUserKey(): Promise<EncryptionKey> {
  try {
    const key = await generateKey();
    logInfo('User encryption key generated', 'keyManager.generateUserKey');
    return key;
  } catch (error) {
    logError(error as Error, 'keyManager.generateUserKey');
    throw new Error('Failed to generate user encryption key');
  }
}

/**
 * Generate a key pair for asymmetric encryption (if needed in future)
 * 
 * @returns Promise resolving to key pair
 */
export async function generateKeyPair(): Promise<KeyPair> {
  // Note: This is a placeholder for future asymmetric encryption support
  // sodium-plus supports key pair generation, but not needed for current symmetric encryption
  throw new Error('Key pair generation not yet implemented - using symmetric encryption only');
}

/**
 * Encrypt user encryption key with master key for storage
 * 
 * @param userKey - User's encryption key to encrypt
 * @returns Promise resolving to encrypted key data
 */
async function encryptUserKeyForStorage(userKey: EncryptionKey): Promise<EncryptionResult> {
  try {
    const masterKey = await getMasterKey();
    
    // Convert key to base64 string for encryption
    const keyString = encodeBase64(userKey);
    
    // Encrypt the key string with master key
    const encrypted = await encrypt(keyString, masterKey);
    
    return encrypted;
  } catch (error) {
    logError(error as Error, 'keyManager.encryptUserKeyForStorage');
    throw new Error('Failed to encrypt user key for storage');
  }
}

/**
 * Decrypt user encryption key from storage
 * 
 * @param encryptedKey - Encrypted key data from Firestore
 * @returns Promise resolving to decrypted user encryption key
 */
async function decryptUserKeyFromStorage(encryptedKey: EncryptionResult): Promise<EncryptionKey> {
  try {
    const masterKey = await getMasterKey();
    
    // Decrypt the key string
    const keyString = await decrypt(encryptedKey, masterKey);
    
    // Convert base64 string back to Uint8Array
    const userKey = decodeBase64(keyString);
    
    if (userKey.length !== 32) {
      throw new Error(`Decrypted key has incorrect size: ${userKey.length} bytes (expected 32)`);
    }
    
    return userKey;
  } catch (error) {
    logError(error as Error, 'keyManager.decryptUserKeyFromStorage');
    throw new Error('Failed to decrypt user key from storage');
  }
}

/**
 * Prepare encryption key document for Firestore storage
 * 
 * @param userId - User ID
 * @param key - User's encryption key
 * @param keyVersion - Key version number (default: 1)
 * @returns Promise resolving to prepared key document
 */
export async function prepareEncryptionKeyForStorage(
  userId: string,
  key: EncryptionKey,
  keyVersion: number = 1
): Promise<StoredEncryptionKey> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!key || key.length !== 32) {
      throw new Error('Invalid encryption key');
    }
    
    // Encrypt key for storage
    const encryptedKey = await encryptUserKeyForStorage(key);
    
    // Prepare key document
    const keyDoc: StoredEncryptionKey = {
      userId,
      encryptedKey,
      keyVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    logInfo(`Encryption key prepared for storage (userId: ${userId}, version: ${keyVersion})`, 'keyManager.prepareEncryptionKeyForStorage');
    
    return keyDoc;
  } catch (error) {
    logError(error as Error, 'keyManager.prepareEncryptionKeyForStorage');
    throw new Error('Failed to prepare encryption key for storage');
  }
}


/**
 * Retrieve and decrypt user encryption key from stored data
 * 
 * @param storedKey - Stored encryption key document from Firestore
 * @returns Promise resolving to decrypted user encryption key
 */
export async function decryptStoredEncryptionKey(storedKey: StoredEncryptionKey): Promise<EncryptionKey> {
  try {
    if (!storedKey.encryptedKey) {
      throw new Error('Stored key document missing encrypted key data');
    }
    
    const userKey = await decryptUserKeyFromStorage(storedKey.encryptedKey);
    
    logInfo(`Encryption key retrieved and decrypted (userId: ${storedKey.userId}, version: ${storedKey.keyVersion})`, 'keyManager.decryptStoredEncryptionKey');
    
    return userKey;
  } catch (error) {
    logError(error as Error, 'keyManager.decryptStoredEncryptionKey');
    throw new Error('Failed to decrypt stored encryption key');
  }
}

/**
 * Rotate user's encryption key
 * 
 * @param userId - User ID
 * @param oldKey - Current encryption key
 * @returns Promise resolving to new encryption key
 */
export async function rotateUserKey(
  userId: string,
  oldKey: EncryptionKey
): Promise<EncryptionKey> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!oldKey || oldKey.length !== 32) {
      throw new Error('Invalid old encryption key');
    }
    
    // Generate new key
    const newKey = await generateUserKey();
    
    logInfo(`Encryption key rotated (userId: ${userId})`, 'keyManager.rotateUserKey');
    
    // Note: Re-encryption of existing data should be handled separately
    // This function only generates the new key
    
    return newKey;
  } catch (error) {
    logError(error as Error, 'keyManager.rotateUserKey');
    throw new Error('Failed to rotate encryption key');
  }
}

/**
 * Re-encrypt data with a new key
 * 
 * @param oldKey - Old encryption key
 * @param newKey - New encryption key
 * @param encryptedData - Data encrypted with old key
 * @returns Promise resolving to data encrypted with new key
 */
export async function reEncryptData(
  oldKey: EncryptionKey,
  newKey: EncryptionKey,
  encryptedData: EncryptionResult
): Promise<EncryptionResult> {
  try {
    // Decrypt with old key
    const plaintext = await decrypt(encryptedData, oldKey);
    
    // Encrypt with new key
    const reEncrypted = await encrypt(plaintext, newKey);
    
    logInfo('Data re-encrypted with new key', 'keyManager.reEncryptData');
    
    return reEncrypted;
  } catch (error) {
    logError(error as Error, 'keyManager.reEncryptData');
    throw new Error('Failed to re-encrypt data');
  }
}

/**
 * Generate recovery code for key backup
 * 
 * @param key - Encryption key to generate recovery code for
 * @returns Promise resolving to recovery code string
 */
export async function generateRecoveryCodeForKey(key: EncryptionKey): Promise<string> {
  try {
    // Generate secure recovery code
    const recoveryCode = await generateRecoveryCode();
    
    logInfo('Recovery code generated for encryption key', 'keyManager.generateRecoveryCodeForKey');
    
    // Note: The recovery code should be stored securely (encrypted) in Firestore
    // This function only generates the code
    
    return recoveryCode;
  } catch (error) {
    logError(error as Error, 'keyManager.generateRecoveryCodeForKey');
    throw new Error('Failed to generate recovery code');
  }
}

/**
 * Recover encryption key from recovery code
 * 
 * Note: This is a placeholder - actual recovery implementation depends on
 * how recovery codes are stored and validated.
 * 
 * @param recoveryCode - Recovery code
 * @returns Promise resolving to recovered encryption key
 */
export async function recoverKeyFromCode(recoveryCode: string): Promise<EncryptionKey> {
  // Note: Recovery code implementation requires:
  // 1. Recovery codes stored encrypted in Firestore
  // 2. Code validation and expiration checking
  // 3. One-time use or time-limited codes
  // This is a placeholder for future implementation
  
  throw new Error('Key recovery from code not yet implemented - requires recovery code storage system');
}

/**
 * Get encryption configuration for user
 * 
 * @param userId - User ID
 * @returns Promise resolving to encryption configuration
 */
export async function getEncryptionConfig(userId: string): Promise<EncryptionConfig> {
  // Note: This should fetch from Firestore `encryptionConfig` collection
  // For now, return default configuration
  
  const defaultConfig: EncryptionConfig = {
    userId,
    keyVersion: 1,
    algorithm: 'XChaCha20-Poly1305',
    keyRotationEnabled: true,
    recoveryCodesEnabled: true,
  };
  
  return defaultConfig;
}

/**
 * Update encryption configuration for user
 * 
 * @param userId - User ID
 * @param config - Updated encryption configuration
 * @returns Promise resolving when configuration is updated
 */
export async function updateEncryptionConfig(
  userId: string,
  config: Partial<EncryptionConfig>
): Promise<void> {
  // Note: This should update Firestore `encryptionConfig` collection
  // This is a placeholder for future implementation
  
  logInfo(`Encryption config update requested (userId: ${userId})`, 'keyManager.updateEncryptionConfig');
  
  // Implementation will be added when encryptionConfig collection is set up
}
