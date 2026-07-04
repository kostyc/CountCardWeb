"use strict";
/**
 * Encryption Utilities
 *
 * Utility functions for common encryption operations, data encoding, and validation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeBase64 = encodeBase64;
exports.decodeBase64 = decodeBase64;
exports.encodeHex = encodeHex;
exports.decodeHex = decodeHex;
exports.validateEncryptedData = validateEncryptedData;
exports.validateKey = validateKey;
exports.validateRecoveryCode = validateRecoveryCode;
exports.formatRecoveryCode = formatRecoveryCode;
exports.encryptObject = encryptObject;
exports.decryptObject = decryptObject;
exports.encryptString = encryptString;
exports.decryptString = decryptString;
/**
 * Encode binary data to base64 string
 */
function encodeBase64(data) {
    // Convert Uint8Array to binary string
    const binary = Array.from(data)
        .map((byte) => String.fromCharCode(byte))
        .join('');
    // Encode to base64
    if (typeof window !== 'undefined' && window.btoa) {
        // Browser environment
        return window.btoa(binary);
    }
    else {
        // Node.js environment
        return Buffer.from(data).toString('base64');
    }
}
/**
 * Decode base64 string to binary data
 */
function decodeBase64(data) {
    let binary;
    if (typeof window !== 'undefined' && window.atob) {
        // Browser environment
        binary = window.atob(data);
    }
    else {
        // Node.js environment
        binary = Buffer.from(data, 'base64').toString('binary');
    }
    // Convert binary string to Uint8Array
    return new Uint8Array(Array.from(binary, (char) => char.charCodeAt(0)));
}
/**
 * Encode binary data to hex string
 */
function encodeHex(data) {
    return Array.from(data)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Decode hex string to binary data
 */
function decodeHex(data) {
    const bytes = [];
    for (let i = 0; i < data.length; i += 2) {
        bytes.push(parseInt(data.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
}
/**
 * Validate encrypted data format
 *
 * @param data - Data to validate
 * @returns True if data appears to be valid encrypted data
 */
function validateEncryptedData(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    const encrypted = data;
    // Check for required fields
    if (typeof encrypted.ciphertext !== 'string' || typeof encrypted.nonce !== 'string') {
        return false;
    }
    // Validate base64 format (basic check)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(encrypted.ciphertext) || !base64Regex.test(encrypted.nonce)) {
        return false;
    }
    // Check minimum length (encrypted data should have some content)
    if (encrypted.ciphertext.length < 16 || encrypted.nonce.length < 16) {
        return false;
    }
    return true;
}
/**
 * Validate encryption key format
 *
 * @param key - Key to validate
 * @returns True if key is valid (32 bytes)
 */
function validateKey(key) {
    if (!(key instanceof Uint8Array)) {
        return false;
    }
    // XChaCha20-Poly1305 requires 32-byte keys
    return key.length === 32;
}
/**
 * Validate recovery code format
 *
 * @param code - Recovery code to validate
 * @returns True if code format is valid
 */
function validateRecoveryCode(code) {
    if (!code || typeof code !== 'string') {
        return false;
    }
    // Remove dashes and spaces for validation
    const cleanCode = code.replace(/[- ]/g, '');
    // Should be alphanumeric with possible URL-safe base64 characters
    // Format: XXXX-XXXX-XXXX-XXXX (approximately 16-32 characters)
    const recoveryCodeRegex = /^[A-Za-z0-9_-]{16,32}$/;
    return recoveryCodeRegex.test(cleanCode);
}
/**
 * Format recovery code for display
 *
 * @param code - Recovery code to format
 * @returns Formatted code with spaces/dashes
 */
function formatRecoveryCode(code) {
    // Remove existing formatting
    const cleanCode = code.replace(/[- ]/g, '');
    // Format as XXXX-XXXX-XXXX-XXXX
    return cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;
}
/**
 * Encrypt a JSON object
 *
 * @param obj - Object to encrypt
 * @param key - Encryption key
 * @returns Promise resolving to encrypted data
 */
async function encryptObject(obj, key) {
    const { encrypt } = await Promise.resolve().then(() => __importStar(require('./encryptionService')));
    const jsonString = JSON.stringify(obj);
    return encrypt(jsonString, key);
}
/**
 * Decrypt to JSON object
 *
 * @param encrypted - Encrypted data
 * @param key - Encryption key
 * @returns Promise resolving to decrypted object
 */
async function decryptObject(encrypted, key) {
    const { decrypt } = await Promise.resolve().then(() => __importStar(require('./encryptionService')));
    const plaintext = await decrypt(encrypted, key);
    return JSON.parse(plaintext);
}
/**
 * Encrypt a string
 *
 * @param str - String to encrypt
 * @param key - Encryption key
 * @returns Promise resolving to encrypted data
 */
async function encryptString(str, key) {
    const { encrypt } = await Promise.resolve().then(() => __importStar(require('./encryptionService')));
    return encrypt(str, key);
}
/**
 * Decrypt a string
 *
 * @param encrypted - Encrypted data
 * @param key - Encryption key
 * @returns Promise resolving to decrypted string
 */
async function decryptString(encrypted, key) {
    const { decrypt } = await Promise.resolve().then(() => __importStar(require('./encryptionService')));
    return decrypt(encrypted, key);
}
//# sourceMappingURL=utils.js.map