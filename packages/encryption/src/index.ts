/**
 * Encryption Module
 * 
 * Main export file for encryption functionality
 */

// Core encryption service
export {
  generateKey,
  generateNonce,
  generateSalt,
  encrypt,
  decrypt,
  deriveKeyFromPassword,
  generateRecoveryCode,
  type EncryptionKey,
  type EncryptedData,
  type EncryptionResult,
} from './encryptionService';
export { verifyCrossPlatformCompatibility, runEncryptionRoundTrip } from './testVectors';

// Utility functions
export {
  encodeBase64,
  decodeBase64,
  encodeHex,
  decodeHex,
  validateEncryptedData,
  validateKey,
  validateRecoveryCode,
  formatRecoveryCode,
  encryptObject,
  decryptObject,
  encryptString,
  decryptString,
} from './utils';

// Types
export type {
  EncryptionKeyWithMetadata,
  StoredEncryptedData,
  KeyPair,
  RecoveryCodeInfo,
  EncryptionConfig,
} from './types';

// Browser compatibility
export {
  checkEncryptionCompatibility,
  verifyEncryptionSupport,
  canInitializeSodiumPlus,
  getCompatibilityMessage,
  checkAndLogEncryptionCompatibility,
  type EncryptionCompatibilityResult,
} from './browserCompatibility';

// Key management
export {
  generateUserKey,
  generateKeyPair,
  prepareEncryptionKeyForStorage,
  decryptStoredEncryptionKey,
  rotateUserKey,
  reEncryptData,
  generateRecoveryCodeForKey,
  recoverKeyFromCode,
  getEncryptionConfig,
  updateEncryptionConfig,
  type StoredEncryptionKey,
} from './keyManager';
