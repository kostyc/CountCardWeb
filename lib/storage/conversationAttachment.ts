/**
 * Conversation attachment upload to Firebase Storage.
 * Path: conversations/{conversationId}/{messageId}/{attachmentId}
 * Allowed: images (JPEG, PNG, WebP), PDF. Max 10MB.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Timestamp } from 'firebase/firestore';
import { storage } from '@/lib/firebase/config';
import { validateImageFile } from '@/lib/storage/imageValidation';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'] as const;

export interface ConversationAttachmentResult {
  attachmentId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: Date | Timestamp;
}

/**
 * Validate file for conversation attachment: type and size.
 * Returns error message or null if valid.
 */
export function validateConversationAttachment(file: File): string | null {
  if (file.size === 0) return 'File is empty';
  if (file.size > MAX_SIZE_BYTES) {
    return `File must be less than ${MAX_SIZE_BYTES / (1024 * 1024)}MB`;
  }
  if (!ALLOWED_MIMES.includes(file.type as (typeof ALLOWED_MIMES)[number])) {
    return 'File must be an image (JPG, PNG, WebP) or PDF';
  }
  return null;
}

/**
 * Upload a file to conversation attachments path and return metadata for the message.
 */
export async function uploadConversationAttachment(
  conversationId: string,
  messageId: string,
  file: File
): Promise<ConversationAttachmentResult> {
  const err = validateConversationAttachment(file);
  if (err) throw new Error(err);

  if (file.type.startsWith('image/')) {
    const imageErr = await validateImageFile(file, { maxSizeBytes: MAX_SIZE_BYTES });
    if (imageErr) throw new Error(imageErr);
  }

  const attachmentId = crypto.randomUUID();
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  const storagePath = `conversations/${conversationId}/${messageId}/${attachmentId}/${sanitized}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: 'private, max-age=31536000',
  });

  const fileUrl = await getDownloadURL(storageRef);
  const now = Timestamp.now();

  return {
    attachmentId,
    fileName: file.name,
    fileUrl,
    mimeType: file.type,
    fileSize: file.size,
    uploadedAt: now,
  };
}
