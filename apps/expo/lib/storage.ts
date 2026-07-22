import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { requireApp } from '@/lib/firebase';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  IMAGE_UPLOAD_MAX_BYTES,
  resolveImageByteSize,
  type PickedImage,
} from '@/lib/imageValidation';

async function assertUploadable(uri: string, mimeType?: string): Promise<{ blob: Blob; contentType: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const contentType = mimeType ?? blob.type ?? 'image/jpeg';

  if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    throw new Error('Image must be in JPG, PNG, or WebP format.');
  }
  if (blob.size === 0) {
    throw new Error('The selected file is empty.');
  }
  if (blob.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }

  return { blob, contentType };
}

export async function uploadProfilePictureFromUri(
  userId: string,
  uri: string,
  fileName = 'profile.jpg',
  mimeType?: string
): Promise<string> {
  const { blob, contentType } = await assertUploadable(uri, mimeType);
  const storage = getStorage(requireApp());
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `profile-pictures/${userId}/${timestamp}-${sanitized}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, blob, {
    contentType,
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(snapshot.ref);
}

export async function uploadProfilePicture(image: PickedImage, userId: string): Promise<string> {
  const ext = image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/webp' ? 'webp' : 'jpg';
  return uploadProfilePictureFromUri(userId, image.uri, `profile.${ext}`, image.mimeType);
}

export async function uploadRecruitPhotoFromUri(
  recruitId: string,
  uri: string,
  fileName = 'photo.jpg',
  mimeType?: string
): Promise<string> {
  const { blob, contentType } = await assertUploadable(uri, mimeType);
  const storage = getStorage(requireApp());
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `recruit-photos/${recruitId}/${timestamp}-${sanitized}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, blob, {
    contentType,
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(snapshot.ref);
}

export async function uploadRecruitPhoto(image: PickedImage, recruitId: string): Promise<string> {
  const ext = image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/webp' ? 'webp' : 'jpg';
  return uploadRecruitPhotoFromUri(recruitId, image.uri, `photo.${ext}`, image.mimeType);
}

export async function uploadDILeadershipCardImageFromUri(
  userId: string,
  uri: string,
  fileName = 'di-card.jpg',
  mimeType?: string
): Promise<string> {
  const { blob, contentType } = await assertUploadable(uri, mimeType);
  const storage = getStorage(requireApp());
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `di-leadership-cards/${userId}/${timestamp}-${sanitized}`;
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, blob, {
    contentType,
    cacheControl: 'public, max-age=31536000',
  });
  return getDownloadURL(snapshot.ref);
}

export async function uploadDILeadershipCardImage(image: PickedImage, userId: string): Promise<string> {
  const ext = image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/webp' ? 'webp' : 'jpg';
  return uploadDILeadershipCardImageFromUri(userId, image.uri, `di-card.${ext}`, image.mimeType);
}

/** Pre-upload size check when only URI is known. */
export async function ensureImageWithinLimit(uri: string): Promise<void> {
  const size = await resolveImageByteSize(uri);
  if (size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error('Image must be 5MB or smaller.');
  }
}
