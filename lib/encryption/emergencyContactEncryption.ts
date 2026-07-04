/**
 * Emergency contact encryption (client-side)
 *
 * Sensitive PII is stored in `encryptedData`; Firestore holds redacted
 * placeholders for ordering and backwards-compatible shapes.
 */

import { encrypt, decrypt, type EncryptionKey } from '@/lib/encryption/encryptionService';
import type {
  ContactRelationship,
  EmergencyContact,
  EmergencyContactInput,
  EmergencyContactUpdate,
  EncryptedData,
} from '@/types/models';

export interface EmergencyContactSensitivePayload {
  firstName: string;
  lastName: string;
  relationship: ContactRelationship;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  email?: string;
  preferredContactMethod?: EmergencyContact['preferredContactMethod'];
  address?: EmergencyContact['address'];
  notes?: string;
}

function hasEncryptedData(
  encryptedData?: EncryptedData | Record<string, unknown> | null
): boolean {
  if (!encryptedData || typeof encryptedData !== 'object') return false;
  const e = encryptedData as Record<string, unknown>;
  return typeof e.ciphertext === 'string' && typeof e.nonce === 'string';
}

/** Placeholders stored in Firestore when ciphertext is used (valid phone/name shapes). */
const REDACTED_FIELDS = {
  firstName: 'Encrypted',
  lastName: 'Contact',
  relationship: 'emergency_contact' as ContactRelationship,
  phoneNumber: '(555) 555-5555',
} as const;

function toSensitivePayload(
  input: Pick<
    EmergencyContactInput,
    | 'firstName'
    | 'lastName'
    | 'relationship'
    | 'phoneNumber'
    | 'secondaryPhoneNumber'
    | 'email'
    | 'preferredContactMethod'
    | 'address'
    | 'notes'
  >
): EmergencyContactSensitivePayload {
  const payload: EmergencyContactSensitivePayload = {
    firstName: input.firstName,
    lastName: input.lastName,
    relationship: input.relationship,
    phoneNumber: input.phoneNumber,
  };
  if (input.secondaryPhoneNumber !== undefined) {
    payload.secondaryPhoneNumber = input.secondaryPhoneNumber;
  }
  if (input.email !== undefined) {
    payload.email = input.email;
  }
  if (input.preferredContactMethod !== undefined) {
    payload.preferredContactMethod = input.preferredContactMethod;
  }
  if (input.address !== undefined) {
    payload.address = input.address;
  }
  if (input.notes !== undefined) {
    payload.notes = input.notes;
  }
  return payload;
}

/**
 * Decrypt emergency contact `encryptedData` and merge sensitive fields for display/edit.
 */
export async function decryptEmergencyContactEncryptedData(
  contact: EmergencyContact,
  key: EncryptionKey | null
): Promise<EmergencyContact> {
  if (!key || !hasEncryptedData(contact.encryptedData)) return contact;
  try {
    const enc = contact.encryptedData as { ciphertext: string; nonce: string };
    const plain = await decrypt({ ciphertext: enc.ciphertext, nonce: enc.nonce }, key);
    const payload = JSON.parse(plain) as EmergencyContactSensitivePayload;
    return {
      ...contact,
      firstName: payload.firstName,
      lastName: payload.lastName,
      relationship: payload.relationship,
      phoneNumber: payload.phoneNumber,
      secondaryPhoneNumber: payload.secondaryPhoneNumber,
      email: payload.email,
      preferredContactMethod: payload.preferredContactMethod,
      address: payload.address,
      notes: payload.notes,
    };
  } catch {
    return contact;
  }
}

/**
 * Prepare create payload: encrypt sensitive block or pass through when no key.
 */
export async function prepareEmergencyContactInputForPersistence(
  input: EmergencyContactInput,
  key: EncryptionKey | null
): Promise<EmergencyContactInput> {
  if (!key) {
    return input;
  }
  try {
    const payload = toSensitivePayload(input);
    const enc = await encrypt(JSON.stringify(payload), key);
    return {
      emergencyContactId: input.emergencyContactId,
      recruitId: input.recruitId,
      createdBy: input.createdBy,
      updatedBy: input.updatedBy,
      ...REDACTED_FIELDS,
      encryptedData: { ciphertext: enc.ciphertext, nonce: enc.nonce },
    };
  } catch {
    return input;
  }
}

/**
 * Prepare update payload: encrypt sensitive block or pass through when no key.
 */
export async function prepareEmergencyContactUpdateForPersistence(
  data: EmergencyContactUpdate,
  key: EncryptionKey | null
): Promise<EmergencyContactUpdate> {
  if (!key) {
    return data;
  }
  const firstName = data.firstName;
  const lastName = data.lastName;
  const relationship = data.relationship;
  const phoneNumber = data.phoneNumber;
  if (
    firstName === undefined ||
    lastName === undefined ||
    relationship === undefined ||
    phoneNumber === undefined
  ) {
    return data;
  }
  try {
    const payload = toSensitivePayload({
      firstName,
      lastName,
      relationship,
      phoneNumber,
      secondaryPhoneNumber: data.secondaryPhoneNumber,
      email: data.email,
      preferredContactMethod: data.preferredContactMethod,
      address: data.address,
      notes: data.notes,
    });
    const enc = await encrypt(JSON.stringify(payload), key);
    return {
      emergencyContactId: data.emergencyContactId,
      recruitId: data.recruitId,
      updatedBy: data.updatedBy,
      ...REDACTED_FIELDS,
      encryptedData: { ciphertext: enc.ciphertext, nonce: enc.nonce },
    };
  } catch {
    return data;
  }
}
