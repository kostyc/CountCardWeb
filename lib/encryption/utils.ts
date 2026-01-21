/**
 * Encryption Utilities
 * 
 * Utility functions for common encryption operations, data encoding, and validation
 */

import { EncryptionKey, EncryptedData, EncryptionResult } from './encryptionService';

/**
 * Encode binary data to base64 string
 */
export function encodeBase64(data: Uint8Array): string {
  // Convert Uint8Array to binary string
  const binary = Array.from(data)
    .map((byte) => String.fromCharCode(byte))
    .join('');
  
  // Encode to base64
  if (typeof window !== 'undefined' && window.btoa) {
    // Browser environment
    return window.btoa(binary);
  } else {
    // Node.js environment
    return Buffer.from(data).toString('base64');
  }
}

/**
 * Decode base64 string to binary data
 */
export function decodeBase64(data: string): Uint8Array {
  let binary: string;
  
  if (typeof window !== 'undefined' && window.atob) {
    // Browser environment
    binary = window.atob(data);
  } else {
    // Node.js environment
    binary = Buffer.from(data, 'base64').toString('binary');
  }
  
  // Convert binary string to Uint8Array
  return new Uint8Array(
    Array.from(binary, (char) => char.charCodeAt(0))
  );
}

/**
 * Encode binary data to hex string
 */
export function encodeHex(data: Uint8Array): string {
  return Array.from(data)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decode hex string to binary data
 */
export function decodeHex(data: string): Uint8Array {
  const bytes: number[] = [];
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
export function validateEncryptedData(data: unknown): data is EncryptionResult {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  const encrypted = data as Record<string, unknown>;
  
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
export function validateKey(key: unknown): key is EncryptionKey {
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
export function validateRecoveryCode(code: string): boolean {
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
export function formatRecoveryCode(code: string): string {
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
export async function encryptObject<T>(
  obj: T,
  key: EncryptionKey
): Promise<EncryptionResult> {
  const { encrypt } = await import('./encryptionService');
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
export async function decryptObject<T>(
  encrypted: EncryptionResult,
  key: EncryptionKey
): Promise<T> {
  const { decrypt } = await import('./encryptionService');
  const plaintext = await decrypt(encrypted, key);
  return JSON.parse(plaintext) as T;
}

/**
 * Encrypt a string
 * 
 * @param str - String to encrypt
 * @param key - Encryption key
 * @returns Promise resolving to encrypted data
 */
export async function encryptString(
  str: string,
  key: EncryptionKey
): Promise<EncryptionResult> {
  const { encrypt } = await import('./encryptionService');
  return encrypt(str, key);
}

/**
 * Decrypt a string
 * 
 * @param encrypted - Encrypted data
 * @param key - Encryption key
 * @returns Promise resolving to decrypted string
 */
export async function decryptString(
  encrypted: EncryptionResult,
  key: EncryptionKey
): Promise<string> {
  const { decrypt } = await import('./encryptionService');
  return decrypt(encrypted, key);
}
