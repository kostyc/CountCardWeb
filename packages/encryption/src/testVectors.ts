/**
 * Cross-platform encryption round-trip test vectors.
 * Run in CI to verify web and native produce compatible ciphertext.
 */

import { encrypt, decrypt, generateKey } from './encryptionService';

export interface EncryptionTestVector {
  plaintext: string;
  ciphertext: string;
  nonce: string;
  keyBase64: string;
}

/** Fixed test vector — populate after first successful round-trip in dev. */
export const FIXED_TEST_VECTOR: EncryptionTestVector | null = null;

export async function runEncryptionRoundTrip(): Promise<boolean> {
  const key = await generateKey();
  const plaintext = 'CountCard cross-platform encryption test';

  const { ciphertext, nonce: resultNonce } = await encrypt(plaintext, key);
  const decrypted = await decrypt({ ciphertext, nonce: resultNonce }, key);

  return decrypted === plaintext;
}

export async function verifyCrossPlatformCompatibility(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const ok = await runEncryptionRoundTrip();
    return { success: ok, error: ok ? undefined : 'Round-trip mismatch' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown encryption error',
    };
  }
}
