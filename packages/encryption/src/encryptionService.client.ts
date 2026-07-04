/**
 * Client encryption (browser + React Native) via libsodium-wrappers only.
 * Avoids sodium-plus so Metro does not bundle Node-only sodium-native.
 */

import { logError, logInfo } from '@countcard/core/logger';
import { verifyEncryptionSupport } from './browserCompatibility';

try {
  require('react-native-get-random-values');
} catch {
  // Web and Node provide getRandomValues without this polyfill.
}

type LibsodiumClient = {
  ready: Promise<void>;
  crypto_secretbox_keygen: () => Uint8Array;
  randombytes_buf: (size: number) => Uint8Array;
  crypto_secretbox_easy: (message: Uint8Array, nonce: Uint8Array, key: Uint8Array) => Uint8Array;
  crypto_secretbox_open_easy: (
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array
  ) => Uint8Array;
  from_string: (value: string) => Uint8Array;
  to_string: (bytes: Uint8Array) => string;
  crypto_pwhash: (
    keyLength: number,
    password: string,
    salt: Uint8Array,
    opsLimit: number,
    memLimit: number,
    algorithm: number
  ) => Uint8Array;
  crypto_pwhash_OPSLIMIT_MODERATE: number;
  crypto_pwhash_MEMLIMIT_MODERATE: number;
  crypto_pwhash_ALG_ARGON2ID13: number;
};

let clientLibsodium: LibsodiumClient | null = null;

async function getClientLibsodium(): Promise<LibsodiumClient> {
  if (!clientLibsodium) {
    if (typeof window !== 'undefined') {
      await verifyEncryptionSupport();
    }
    const sodium = require('libsodium-wrappers') as LibsodiumClient;
    await sodium.ready;
    clientLibsodium = sodium;
  }
  return clientLibsodium;
}

export type EncryptionKey = Uint8Array;
export type EncryptedData = string;

export interface EncryptionResult {
  ciphertext: EncryptedData;
  nonce: string;
}

const KEY_SIZE = 32;
const NONCE_SIZE = 24;
const SALT_SIZE = 16;

function encodeBase64(data: Uint8Array): string {
  const binary = Array.from(data)
    .map((byte) => String.fromCharCode(byte))
    .join('');

  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(binary);
  }
  return Buffer.from(data).toString('base64');
}

function decodeBase64(data: string): Uint8Array {
  const binary =
    typeof window !== 'undefined' && window.atob
      ? window.atob(data)
      : Buffer.from(data, 'base64').toString('binary');

  return new Uint8Array(Array.from(binary, (char) => char.charCodeAt(0)));
}

export async function generateKey(): Promise<EncryptionKey> {
  try {
    const sodium = await getClientLibsodium();
    const key = sodium.crypto_secretbox_keygen();
    if (key.length !== KEY_SIZE) {
      throw new Error(`Generated key has incorrect size: ${key.length} bytes (expected ${KEY_SIZE})`);
    }
    logInfo('Encryption key generated successfully', 'encryptionService.generateKey');
    return key;
  } catch (error) {
    logError(error as Error, 'encryptionService.generateKey');
    throw new Error('Failed to generate encryption key');
  }
}

export async function generateNonce(): Promise<Uint8Array> {
  try {
    const sodium = await getClientLibsodium();
    const nonce = sodium.randombytes_buf(NONCE_SIZE);
    if (nonce.length !== NONCE_SIZE) {
      throw new Error(`Generated nonce has incorrect size: ${nonce.length} bytes (expected ${NONCE_SIZE})`);
    }
    return nonce;
  } catch (error) {
    logError(error as Error, 'encryptionService.generateNonce');
    throw new Error('Failed to generate nonce');
  }
}

export async function generateSalt(): Promise<Uint8Array> {
  try {
    const sodium = await getClientLibsodium();
    const salt = sodium.randombytes_buf(SALT_SIZE);
    if (salt.length !== SALT_SIZE) {
      throw new Error(`Generated salt has incorrect size: ${salt.length} bytes (expected ${SALT_SIZE})`);
    }
    return salt;
  } catch (error) {
    logError(error as Error, 'encryptionService.generateSalt');
    throw new Error('Failed to generate salt');
  }
}

export async function encrypt(plaintext: string, key: EncryptionKey): Promise<EncryptionResult> {
  try {
    if (!plaintext) throw new Error('Plaintext cannot be empty');
    if (!key || key.length !== KEY_SIZE) {
      throw new Error(`Invalid encryption key: expected ${KEY_SIZE} bytes, got ${key?.length || 0}`);
    }

    const sodium = await getClientLibsodium();
    const nonce = sodium.randombytes_buf(NONCE_SIZE);
    const ciphertext = sodium.crypto_secretbox_easy(sodium.from_string(plaintext), nonce, key);
    const encryptedData: EncryptionResult = {
      ciphertext: encodeBase64(ciphertext),
      nonce: encodeBase64(nonce),
    };
    logInfo('Data encrypted successfully', 'encryptionService.encrypt');
    return encryptedData;
  } catch (error) {
    logError(error as Error, 'encryptionService.encrypt');
    throw new Error('Failed to encrypt data');
  }
}

export async function decrypt(encryptedData: EncryptionResult, key: EncryptionKey): Promise<string> {
  try {
    if (!encryptedData.ciphertext || !encryptedData.nonce) {
      throw new Error('Encrypted data must contain both ciphertext and nonce');
    }
    if (!key || key.length !== KEY_SIZE) {
      throw new Error(`Invalid encryption key: expected ${KEY_SIZE} bytes, got ${key?.length || 0}`);
    }

    const ciphertext = decodeBase64(encryptedData.ciphertext);
    const nonce = decodeBase64(encryptedData.nonce);
    if (nonce.length !== NONCE_SIZE) {
      throw new Error(`Invalid nonce size: ${nonce.length} bytes (expected ${NONCE_SIZE})`);
    }

    const sodium = await getClientLibsodium();
    const plaintextBytes = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key);
    const plaintext = sodium.to_string(plaintextBytes);
    logInfo('Data decrypted successfully', 'encryptionService.decrypt');
    return plaintext;
  } catch (error) {
    logError(error as Error, 'encryptionService.decrypt');
    throw new Error('Failed to decrypt data');
  }
}

export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<EncryptionKey> {
  try {
    if (!password) throw new Error('Password cannot be empty');
    if (!salt || salt.length !== SALT_SIZE) {
      throw new Error(`Invalid salt: expected ${SALT_SIZE} bytes, got ${salt?.length || 0}`);
    }

    const sodium = await getClientLibsodium();
    const derivedKey = sodium.crypto_pwhash(
      KEY_SIZE,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_MODERATE,
      sodium.crypto_pwhash_MEMLIMIT_MODERATE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );
    if (derivedKey.length !== KEY_SIZE) {
      throw new Error(`Derived key has incorrect size: ${derivedKey.length} bytes (expected ${KEY_SIZE})`);
    }
    logInfo('Key derived from password successfully', 'encryptionService.deriveKeyFromPassword');
    return derivedKey;
  } catch (error) {
    logError(error as Error, 'encryptionService.deriveKeyFromPassword');
    throw new Error('Failed to derive key from password');
  }
}

export async function generateRecoveryCode(): Promise<string> {
  try {
    const randomBytes = (await getClientLibsodium()).randombytes_buf(24);
    const base64Code = encodeBase64(new Uint8Array(randomBytes));
    const cleanCode = base64Code.replace(/[=]/g, '').replace(/[+/]/g, (char) => (char === '+' ? '-' : '_'));
    return cleanCode.match(/.{1,4}/g)?.join('-') || cleanCode;
  } catch (error) {
    logError(error as Error, 'encryptionService.generateRecoveryCode');
    throw new Error('Failed to generate recovery code');
  }
}
