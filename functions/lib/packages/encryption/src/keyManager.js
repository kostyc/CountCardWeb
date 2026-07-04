"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUserKey = generateUserKey;
exports.generateKeyPair = generateKeyPair;
exports.prepareEncryptionKeyForStorage = prepareEncryptionKeyForStorage;
exports.decryptStoredEncryptionKey = decryptStoredEncryptionKey;
exports.rotateUserKey = rotateUserKey;
exports.reEncryptData = reEncryptData;
exports.generateRecoveryCodeForKey = generateRecoveryCodeForKey;
exports.recoverKeyFromCode = recoverKeyFromCode;
exports.getEncryptionConfig = getEncryptionConfig;
exports.updateEncryptionConfig = updateEncryptionConfig;
const encryptionService_1 = require("./encryptionService");
const encryptionService_2 = require("./encryptionService");
const utils_1 = require("./utils");
const logger_1 = require("@countcard/core/logger");
/**
 * Get master encryption key from environment variable
 * This key is used to encrypt user encryption keys before storage
 *
 * @returns Master encryption key (32 bytes)
 */
async function getMasterKey() {
    const masterKeyBase64 = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyBase64) {
        throw new Error('ENCRYPTION_MASTER_KEY environment variable is not set');
    }
    try {
        const masterKey = (0, utils_1.decodeBase64)(masterKeyBase64);
        if (masterKey.length !== 32) {
            throw new Error(`Master key has incorrect size: ${masterKey.length} bytes (expected 32)`);
        }
        return masterKey;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.getMasterKey');
        throw new Error('Failed to load master encryption key');
    }
}
/**
 * Generate a new user encryption key
 *
 * @returns Promise resolving to new encryption key
 */
async function generateUserKey() {
    try {
        const key = await (0, encryptionService_1.generateKey)();
        (0, logger_1.logInfo)('User encryption key generated', 'keyManager.generateUserKey');
        return key;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.generateUserKey');
        throw new Error('Failed to generate user encryption key');
    }
}
/**
 * Generate a key pair for asymmetric encryption (if needed in future)
 *
 * @returns Promise resolving to key pair
 */
async function generateKeyPair() {
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
async function encryptUserKeyForStorage(userKey) {
    try {
        const masterKey = await getMasterKey();
        // Convert key to base64 string for encryption
        const keyString = (0, utils_1.encodeBase64)(userKey);
        // Encrypt the key string with master key
        const encrypted = await (0, encryptionService_2.encrypt)(keyString, masterKey);
        return encrypted;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.encryptUserKeyForStorage');
        throw new Error('Failed to encrypt user key for storage');
    }
}
/**
 * Decrypt user encryption key from storage
 *
 * @param encryptedKey - Encrypted key data from Firestore
 * @returns Promise resolving to decrypted user encryption key
 */
async function decryptUserKeyFromStorage(encryptedKey) {
    try {
        const masterKey = await getMasterKey();
        // Decrypt the key string
        const keyString = await (0, encryptionService_2.decrypt)(encryptedKey, masterKey);
        // Convert base64 string back to Uint8Array
        const userKey = (0, utils_1.decodeBase64)(keyString);
        if (userKey.length !== 32) {
            throw new Error(`Decrypted key has incorrect size: ${userKey.length} bytes (expected 32)`);
        }
        return userKey;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.decryptUserKeyFromStorage');
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
async function prepareEncryptionKeyForStorage(userId, key, keyVersion = 1) {
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
        const keyDoc = {
            userId,
            encryptedKey,
            keyVersion,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        (0, logger_1.logInfo)(`Encryption key prepared for storage (userId: ${userId}, version: ${keyVersion})`, 'keyManager.prepareEncryptionKeyForStorage');
        return keyDoc;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.prepareEncryptionKeyForStorage');
        throw new Error('Failed to prepare encryption key for storage');
    }
}
/**
 * Retrieve and decrypt user encryption key from stored data
 *
 * @param storedKey - Stored encryption key document from Firestore
 * @returns Promise resolving to decrypted user encryption key
 */
async function decryptStoredEncryptionKey(storedKey) {
    try {
        if (!storedKey.encryptedKey) {
            throw new Error('Stored key document missing encrypted key data');
        }
        const userKey = await decryptUserKeyFromStorage(storedKey.encryptedKey);
        (0, logger_1.logInfo)(`Encryption key retrieved and decrypted (userId: ${storedKey.userId}, version: ${storedKey.keyVersion})`, 'keyManager.decryptStoredEncryptionKey');
        return userKey;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.decryptStoredEncryptionKey');
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
async function rotateUserKey(userId, oldKey) {
    try {
        if (!userId) {
            throw new Error('User ID is required');
        }
        if (!oldKey || oldKey.length !== 32) {
            throw new Error('Invalid old encryption key');
        }
        // Generate new key
        const newKey = await generateUserKey();
        (0, logger_1.logInfo)(`Encryption key rotated (userId: ${userId})`, 'keyManager.rotateUserKey');
        // Note: Re-encryption of existing data should be handled separately
        // This function only generates the new key
        return newKey;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.rotateUserKey');
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
async function reEncryptData(oldKey, newKey, encryptedData) {
    try {
        // Decrypt with old key
        const plaintext = await (0, encryptionService_2.decrypt)(encryptedData, oldKey);
        // Encrypt with new key
        const reEncrypted = await (0, encryptionService_2.encrypt)(plaintext, newKey);
        (0, logger_1.logInfo)('Data re-encrypted with new key', 'keyManager.reEncryptData');
        return reEncrypted;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.reEncryptData');
        throw new Error('Failed to re-encrypt data');
    }
}
/**
 * Generate recovery code for key backup
 *
 * @param key - Encryption key to generate recovery code for
 * @returns Promise resolving to recovery code string
 */
async function generateRecoveryCodeForKey(key) {
    try {
        // Generate secure recovery code
        const recoveryCode = await (0, encryptionService_1.generateRecoveryCode)();
        (0, logger_1.logInfo)('Recovery code generated for encryption key', 'keyManager.generateRecoveryCodeForKey');
        // Note: The recovery code should be stored securely (encrypted) in Firestore
        // This function only generates the code
        return recoveryCode;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'keyManager.generateRecoveryCodeForKey');
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
async function recoverKeyFromCode(recoveryCode) {
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
async function getEncryptionConfig(userId) {
    // Note: This should fetch from Firestore `encryptionConfig` collection
    // For now, return default configuration
    const defaultConfig = {
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
async function updateEncryptionConfig(userId, config) {
    // Note: This should update Firestore `encryptionConfig` collection
    // This is a placeholder for future implementation
    (0, logger_1.logInfo)(`Encryption config update requested (userId: ${userId})`, 'keyManager.updateEncryptionConfig');
    // Implementation will be added when encryptionConfig collection is set up
}
//# sourceMappingURL=keyManager.js.map