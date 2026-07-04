/**
 * Logo Storage Utilities
 * Upload/delete company and battalion logos to Firebase Storage.
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { logError, logInfo } from '@/lib/utils/logger';
import { validateImageFile } from '@/lib/storage/imageValidation';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB for logos

export type LogoType = 'company' | 'battalion';

function pathPrefix(type: LogoType): string {
  return type === 'company' ? 'logos/company' : 'logos/battalion';
}

/**
 * Upload a company or battalion logo
 */
export async function uploadLogo(
  type: LogoType,
  userId: string,
  file: File
): Promise<string | null> {
  try {
    const validationError = await validateImageFile(file, { maxSizeBytes: MAX_SIZE });
    if (validationError) {
      throw new Error(validationError);
    }
    const prefix = pathPrefix(type);
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${prefix}/${userId}/${timestamp}-${sanitized}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
    });
    const url = await getDownloadURL(storageRef);
    logInfo(`Logo uploaded: ${type} for user ${userId}`, 'storage.uploadLogo');
    return url;
  } catch (error) {
    logError(error as Error, 'storage.uploadLogo');
    if (error instanceof Error && error.message !== '') {
      throw error;
    }
    return null;
  }
}

/**
 * Delete an image from Storage by URL (works for profile picture or logo URLs)
 */
export async function deleteLogoUrl(imageUrl: string): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    if (!pathMatch) throw new Error('Invalid image URL format');
    const storagePath = decodeURIComponent(pathMatch[1]);
    await deleteObject(ref(storage, storagePath));
    logInfo('Logo/image deleted', 'storage.deleteLogoUrl');
    return true;
  } catch (error) {
    logError(error as Error, 'storage.deleteLogoUrl');
    return false;
  }
}
