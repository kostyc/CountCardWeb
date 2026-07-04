/**
 * Conversation message body encryption (client + server-assisted wraps).
 *
 * Message text is encrypted with a random per-message DEK. Each participant
 * receives a wrap of that DEK encrypted with their own user key so anyone
 * in the thread can decrypt locally. Plaintext `content` is still written as
 * a placeholder when ciphertext is used (list/search compatibility).
 */

import {
  encrypt,
  decrypt,
  generateKey,
  encodeBase64,
  decodeBase64,
  type EncryptionKey,
  type EncryptionResult,
} from './encryptionService';
import type { Message } from '@countcard/core/types/models';

export const MESSAGE_ENCRYPTED_CONTENT_PLACEHOLDER = ' ';

export const LAST_MESSAGE_ENCRYPTED_PREVIEW = 'Encrypted message';

export type MessageKeyWrap = EncryptionResult;

export function isE2EMessage(m: Pick<Message, 'encryptedPayload' | 'keyWraps'>): boolean {
  return Boolean(
    m.encryptedPayload &&
      typeof m.encryptedPayload.ciphertext === 'string' &&
      typeof m.encryptedPayload.nonce === 'string' &&
      m.keyWraps &&
      typeof m.keyWraps === 'object'
  );
}

/**
 * Plaintext shown in the thread for encrypted rows when decryption is not possible.
 */
export const MESSAGE_UNREADABLE_PLACEHOLDER = 'Unable to decrypt this message.';

interface BuildEncryptedMessageParams {
  conversationId: string;
  senderId: string;
  participantIds: string[];
  textBody: string;
  senderKey: EncryptionKey;
  getIdToken: () => Promise<string | null>;
}

/**
 * Build Firestore message fields for an E2E-encrypted body. Returns null if
 * any required wrap fails (caller should fall back to plaintext storage).
 */
export async function buildEncryptedMessageFields(
  params: BuildEncryptedMessageParams
): Promise<{
  content: string;
  encryptedPayload: EncryptionResult;
  keyWraps: Record<string, EncryptionResult>;
  conversationLastMessageContent: string;
} | null> {
  const { conversationId, senderId, participantIds, textBody, senderKey, getIdToken } = params;
  if (participantIds.length === 0) return null;

  const dek = await generateKey();
  const payloadJson = JSON.stringify({ text: textBody });
  const encryptedPayload = await encrypt(payloadJson, dek);
  const dekBase64 = encodeBase64(dek);

  const keyWraps: Record<string, EncryptionResult> = {};
  const token = await getIdToken();
  if (!token) return null;

  for (const userId of participantIds) {
    if (userId === senderId) {
      keyWraps[userId] = await encrypt(dekBase64, senderKey);
      continue;
    }
    const wrap = await fetchPeerDekWrap({
      idToken: token,
      conversationId,
      recipientUserId: userId,
      dekBase64,
    });
    if (!wrap) return null;
    keyWraps[userId] = wrap;
  }

  return {
    content: MESSAGE_ENCRYPTED_CONTENT_PLACEHOLDER,
    encryptedPayload,
    keyWraps,
    conversationLastMessageContent: LAST_MESSAGE_ENCRYPTED_PREVIEW,
  };
}

async function fetchPeerDekWrap(args: {
  idToken: string;
  conversationId: string;
  recipientUserId: string;
  dekBase64: string;
}): Promise<EncryptionResult | null> {
  try {
    const res = await fetch('/api/encryption/wrap-dek', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: args.conversationId,
        recipientUserId: args.recipientUserId,
        dekBase64: args.dekBase64,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { wrap?: EncryptionResult };
    if (!data?.wrap?.ciphertext || !data?.wrap?.nonce) return null;
    return data.wrap;
  } catch {
    return null;
  }
}

/**
 * Resolve user-visible message text (decrypt when E2E fields are present).
 */
export async function decryptMessageDisplayContent(
  message: Message,
  userId: string,
  key: EncryptionKey | null
): Promise<string> {
  if (!isE2EMessage(message)) {
    return message.content;
  }
  if (!key || !message.keyWraps) {
    return MESSAGE_UNREADABLE_PLACEHOLDER;
  }
  const wrap = message.keyWraps[userId];
  if (!wrap) {
    return MESSAGE_UNREADABLE_PLACEHOLDER;
  }
  try {
    const dekB64 = await decrypt(wrap, key);
    const dek = decodeBase64(dekB64) as EncryptionKey;
    if (dek.length !== 32) {
      return MESSAGE_UNREADABLE_PLACEHOLDER;
    }
    const plainJson = await decrypt(message.encryptedPayload!, dek);
    const parsed = JSON.parse(plainJson) as { text?: string };
    return typeof parsed.text === 'string' ? parsed.text : MESSAGE_UNREADABLE_PLACEHOLDER;
  } catch {
    return MESSAGE_UNREADABLE_PLACEHOLDER;
  }
}
