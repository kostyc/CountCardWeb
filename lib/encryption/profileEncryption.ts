/**
 * Profile/recruit encryption helpers
 *
 * Encrypts and decrypts sensitive recruit profile fields (medical notes,
 * dietary restrictions, extended notes) using the user's encryption key from
 * the API. Used client-side only.
 */

import { encrypt, decrypt, type EncryptionKey } from '@/lib/encryption/encryptionService';
import { decodeBase64 } from '@/lib/encryption/utils';
import type { RecruitProfile } from '@/types/models';
import type { EncryptedData } from '@/types/models';

export interface RecruitSensitivePayload {
  medicalNotes?: string;
  dietaryRestrictions?: string;
  extendedNotes?: string;
}

const SENSITIVE_KEYS = ['medicalNotes', 'dietaryRestrictions', 'extendedNotes'] as const;
type SensitiveKey = (typeof SENSITIVE_KEYS)[number];

function pickSensitiveStrings(
  recruit: Partial<RecruitProfile> & { recruitId: string }
): Partial<Record<SensitiveKey, string | undefined>> {
  return {
    medicalNotes: recruit.medicalNotes,
    dietaryRestrictions: recruit.dietaryRestrictions,
    extendedNotes: recruit.extendedNotes,
  };
}

function hasAnySensitiveFieldDefined(
  picked: Partial<Record<SensitiveKey, string | undefined>>
): boolean {
  return SENSITIVE_KEYS.some((k) => picked[k] !== undefined);
}

function plaintextReturnForNoKey(
  picked: Partial<Record<SensitiveKey, string | undefined>>
): Partial<Record<SensitiveKey, string | undefined>> {
  const out: Partial<Record<SensitiveKey, string | undefined>> = {};
  for (const k of SENSITIVE_KEYS) {
    if (picked[k] !== undefined) {
      out[k] = picked[k];
    }
  }
  return out;
}

/**
 * Fetch the current user's encryption key from the API (client-side).
 * Returns null if the user has no key or the request fails.
 */
export async function fetchClientEncryptionKey(
  getIdToken: () => Promise<string | null>
): Promise<EncryptionKey | null> {
  try {
    const token = await getIdToken();
    if (!token) return null;
    const res = await fetch('/api/encryption/key', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.key) return null;
    return decodeBase64(data.key) as EncryptionKey;
  } catch {
    return null;
  }
}

/**
 * Check if a recruit document has encrypted sensitive data (ciphertext + nonce).
 */
function hasEncryptedData(encryptedData?: EncryptedData | Record<string, unknown> | null): boolean {
  if (!encryptedData || typeof encryptedData !== 'object') return false;
  const e = encryptedData as Record<string, unknown>;
  return typeof e.ciphertext === 'string' && typeof e.nonce === 'string';
}

/**
 * Decrypt recruit encryptedData and merge sensitive fields into the recruit object.
 * Returns the recruit with medicalNotes (and any other decrypted fields) merged.
 * If no key or no encryptedData, returns the recruit unchanged.
 */
export async function decryptRecruitEncryptedData(
  recruit: RecruitProfile,
  key: EncryptionKey | null
): Promise<RecruitProfile> {
  if (!key || !hasEncryptedData(recruit.encryptedData)) return recruit;
  try {
    const enc = recruit.encryptedData as { ciphertext: string; nonce: string };
    const plain = await decrypt(
      { ciphertext: enc.ciphertext, nonce: enc.nonce },
      key
    );
    const payload = JSON.parse(plain) as RecruitSensitivePayload;
    return {
      ...recruit,
      medicalNotes: payload.medicalNotes ?? recruit.medicalNotes,
      dietaryRestrictions: payload.dietaryRestrictions ?? recruit.dietaryRestrictions,
      extendedNotes: payload.extendedNotes ?? recruit.extendedNotes,
    };
  } catch {
    return recruit;
  }
}

/**
 * Prepare recruit for save: encrypt sensitive fields into encryptedData and remove plaintext sensitive fields.
 * If key is null, does not add encryptedData and leaves plaintext fields (backwards compat).
 */
export async function prepareRecruitSensitiveForSave(
  recruit: Partial<RecruitProfile> & { recruitId: string },
  key: EncryptionKey | null
): Promise<{
  encryptedData?: { ciphertext: string; nonce: string };
  medicalNotes?: string;
  dietaryRestrictions?: string;
  extendedNotes?: string;
}> {
  const picked = pickSensitiveStrings(recruit);
  if (!key) {
    return plaintextReturnForNoKey(picked);
  }
  if (!hasAnySensitiveFieldDefined(picked)) {
    return {};
  }
  try {
    const payload: RecruitSensitivePayload = {};
    if (picked.medicalNotes !== undefined) payload.medicalNotes = picked.medicalNotes;
    if (picked.dietaryRestrictions !== undefined) {
      payload.dietaryRestrictions = picked.dietaryRestrictions;
    }
    if (picked.extendedNotes !== undefined) payload.extendedNotes = picked.extendedNotes;
    const plain = JSON.stringify(payload);
    const enc = await encrypt(plain, key);
    return {
      encryptedData: { ciphertext: enc.ciphertext, nonce: enc.nonce },
      medicalNotes: undefined,
      dietaryRestrictions: undefined,
      extendedNotes: undefined,
    };
  } catch {
    return plaintextReturnForNoKey(picked);
  }
}
