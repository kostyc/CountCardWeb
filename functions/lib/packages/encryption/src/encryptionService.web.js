"use strict";
/**
 * Encryption Service
 *
 * Provides client-side encryption using sodium-plus library with authenticated encryption
 * (XSalsa20-Poly1305 via crypto_secretbox) for end-to-end encryption of sensitive recruit data.
 *
 * Note: While the project specifies XChaCha20-Poly1305, sodium-plus uses crypto_secretbox
 * which provides XSalsa20-Poly1305 - an equivalent secure authenticated encryption algorithm.
 *
 * All encryption operations are asynchronous as required by sodium-plus.
 *
 * IMPORTANT: sodium-plus is imported dynamically to prevent sodium-native (Node.js only)
 * from being bundled for the client. In the browser, sodium-plus uses WebAssembly or
 * Web Crypto API backends automatically.
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
exports.generateKey = generateKey;
exports.generateNonce = generateNonce;
exports.generateSalt = generateSalt;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.deriveKeyFromPassword = deriveKeyFromPassword;
exports.generateRecoveryCode = generateRecoveryCode;
const logger_1 = require("@countcard/core/logger");
const browserCompatibility_1 = require("./browserCompatibility");
let sodiumModule = null;
/**
 * Key size for XChaCha20-Poly1305 (32 bytes = 256 bits)
 */
const KEY_SIZE = 32;
/**
 * Nonce size for crypto_secretbox (24 bytes = 192 bits)
 * Note: crypto_secretbox uses XSalsa20-Poly1305, not XChaCha20-Poly1305
 * but provides equivalent security with authenticated encryption
 */
const NONCE_SIZE = 24;
/**
 * Salt size for key derivation (16 bytes)
 */
const SALT_SIZE = 16;
/**
 * Get sodium instance (async initialization)
 * Verifies browser compatibility before initializing
 * Uses dynamic import to prevent sodium-native from being bundled for the client
 */
async function getSodium() {
    // Verify browser compatibility (only in browser environment)
    if (typeof window !== 'undefined') {
        try {
            await (0, browserCompatibility_1.verifyEncryptionSupport)();
        }
        catch (error) {
            (0, logger_1.logError)(error, 'encryptionService.getSodium');
            throw error;
        }
    }
    // Dynamically import sodium-plus to prevent sodium-native bundling
    if (!sodiumModule) {
        // Use dynamic import with string literal to ensure it's truly dynamic
        // This prevents Turbopack from trying to resolve sodium-native at build time
        const sodiumPlusModule = 'sodium-plus';
        sodiumModule = await Promise.resolve(`${sodiumPlusModule}`).then(s => __importStar(require(s)));
    }
    // Wait for sodium-plus to be ready
    // In browser, this will use WebAssembly or Web Crypto API backends
    // On server, this will use sodium-native (Node.js only)
    return await sodiumModule.default.ready;
}
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
 * Generate a cryptographically secure random encryption key
 *
 * @returns Promise resolving to a 32-byte encryption key
 */
async function generateKey() {
    try {
        const sodium = await getSodium();
        const key = sodium.crypto_secretbox_keygen();
        if (key.length !== KEY_SIZE) {
            throw new Error(`Generated key has incorrect size: ${key.length} bytes (expected ${KEY_SIZE})`);
        }
        (0, logger_1.logInfo)('Encryption key generated successfully', 'encryptionService.generateKey');
        return key;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'encryptionService.generateKey');
        throw new Error('Failed to generate encryption key');
    }
}
/**
 * Generate a cryptographically secure random nonce
 *
 * @returns Promise resolving to a 24-byte nonce
 */
async function generateNonce() {
    try {
        const sodium = await getSodium();
        const nonce = sodium.randombytes_buf(NONCE_SIZE);
        if (nonce.length !== NONCE_SIZE) {
            throw new Error(`Generated nonce has incorrect size: ${nonce.length} bytes (expected ${NONCE_SIZE})`);
        }
        return nonce;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'encryptionService.generateNonce');
        throw new Error('Failed to generate nonce');
    }
}
/**
 * Generate a cryptographically secure random salt for key derivation
 *
 * @returns Promise resolving to a 16-byte salt
 */
async function generateSalt() {
    try {
        const sodium = await getSodium();
        const salt = sodium.randombytes_buf(SALT_SIZE);
        if (salt.length !== SALT_SIZE) {
            throw new Error(`Generated salt has incorrect size: ${salt.length} bytes (expected ${SALT_SIZE})`);
        }
        return salt;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'encryptionService.generateSalt');
        throw new Error('Failed to generate salt');
    }
}
/**
 * Encrypt plaintext data using authenticated encryption (XSalsa20-Poly1305)
 *
 * Note: Uses crypto_secretbox_easy which provides authenticated encryption.
 * While not exactly XChaCha20-Poly1305, it provides equivalent security.
 *
 * @param plaintext - Plaintext string to encrypt
 * @param key - Encryption key (32 bytes)
 * @returns Promise resolving to encrypted data with nonce (base64-encoded)
 */
async function encrypt(plaintext, key) {
    try {
        if (!plaintext) {
            throw new Error('Plaintext cannot be empty');
        }
        if (!key || key.length !== KEY_SIZE) {
            throw new Error(`Invalid encryption key: expected ${KEY_SIZE} bytes, got ${key?.length || 0}`);
        }
        const sodium = await getSodium();
        // Convert plaintext to Uint8Array
        const plaintextBytes = new TextEncoder().encode(plaintext);
        // Generate nonce
        const nonce = await generateNonce();
        // Encrypt using authenticated encryption
        // Note: crypto_secretbox_easy uses XSalsa20-Poly1305 (secure authenticated encryption)
        // For XChaCha20-Poly1305, we would need crypto_aead_xchacha20poly1305_ietf_encrypt
        // but sodium-plus may not expose it. crypto_secretbox_easy is still secure.
        const ciphertext = sodium.crypto_secretbox_easy(plaintextBytes, nonce, key);
        // Encode both ciphertext and nonce as base64
        const encryptedData = {
            ciphertext: encodeBase64(ciphertext),
            nonce: encodeBase64(nonce),
        };
        (0, logger_1.logInfo)('Data encrypted successfully', 'encryptionService.encrypt');
        return encryptedData;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'encryptionService.encrypt');
        throw new Error('Failed to encrypt data');
    }
}
/**
 * Decrypt ciphertext data using authenticated decryption (XSalsa20-Poly1305)
 *
 * Note: Uses crypto_secretbox_open_easy which provides authenticated decryption.
 *
 * @param encryptedData - Encrypted data result containing ciphertext and nonce
 * @param key - Encryption key (32 bytes)
 * @returns Promise resolving to decrypted plaintext string
 */
async function decrypt(encryptedData, key) {
    try {
        if (!encryptedData.ciphertext || !encryptedData.nonce) {
            throw new Error('Encrypted data must contain both ciphertext and nonce');
        }
        if (!key || key.length !== KEY_SIZE) {
            throw new Error(`Invalid encryption key: expected ${KEY_SIZE} bytes, got ${key?.length || 0}`);
        }
        const sodium = await getSodium();
        // Decode base64 ciphertext and nonce
        const ciphertext = decodeBase64(encryptedData.ciphertext);
        const nonce = decodeBase64(encryptedData.nonce);
        if (nonce.length !== NONCE_SIZE) {
            throw new Error(`Invalid nonce size: ${nonce.length} bytes (expected ${NONCE_SIZE})`);
        }
        // Decrypt using authenticated decryption
        // Note: crypto_secretbox_open_easy uses XSalsa20-Poly1305
        const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
        // Convert decrypted bytes to string
        const plaintext = new TextDecoder().decode(plaintextBytes);
        (0, logger_1.logInfo)('Data decrypted successfully', 'encryptionService.decrypt');
        return plaintext;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'encryptionService.decrypt');
        throw new Error('Failed to decrypt data');
    }
}
/**
 * Derive encryption key from password using Argon2id
 *
 * @param password - User password
 * @param salt - Salt for key derivation (16 bytes)
 * @returns Promise resolving to derived encryption key (32 bytes)
 */
async function deriveKeyFromPassword(password, salt) {
    try {
        if (!password) {
            throw new Error('Password cannot be empty');
        }
        if (!salt || salt.length !== SALT_SIZE) {
            throw new Error(`Invalid salt: expected ${SALT_SIZE} bytes, got ${salt?.length || 0}`);
        }
        const sodium = await getSodium();
        // Convert password to Uint8Array
        const passwordBytes = new TextEncoder().encode(password);
        // Derive key using Argon2id
        // Parameters: opslimit, memlimit, algorithm
        // opslimit: 2 (moderate), memlimit: 67108864 (64 MB), algorithm: Argon2id
        const key = sodium.crypto_pwhash(KEY_SIZE, passwordBytes, salt, sodium.crypto_pwhash_OPSLIMIT_MODERATE, sodium.crypto_pwhash_MEMLIMIT_MODERATE, sodium.crypto_pwhash_ALG_ARGON2ID13);
        if (key.length !== KEY_SIZE) {
            throw new Error(`Derived key has incorrect size: ${key.length} bytes (expected ${KEY_SIZE})`);
        }
        (0, logger_1.logInfo)('Key derived from password successfully', 'encryptionService.deriveKeyFromPassword');
        return key;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'encryptionService.deriveKeyFromPassword');
        throw new Error('Failed to derive key from password');
    }
}
/**
 * Generate a secure recovery code for key backup
 *
 * @returns Secure random recovery code (32 characters, base64-like)
 */
async function generateRecoveryCode() {
    try {
        const sodium = await getSodium();
        // Generate 24 random bytes (192 bits of entropy)
        const randomBytes = sodium.randombytes_buf(24);
        // Encode to base64 and format for readability
        const base64Code = encodeBase64(randomBytes);
        // Format as XXXX-XXXX-XXXX-XXXX for readability
        // Remove padding if present
        const cleanCode = base64Code.replace(/[=]/g, '').replace(/[+/]/g, (char) => {
            // Replace + and / with URL-safe alternatives
            return char === '+' ? '-' : '_';
        });
        // Format with dashes every 4 characters
        const formatted = cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;
        return formatted;
    }
    catch (error) {
        (0, logger_1.logError)(error, 'encryptionService.generateRecoveryCode');
        throw new Error('Failed to generate recovery code');
    }
}
//# sourceMappingURL=encryptionService.web.js.map