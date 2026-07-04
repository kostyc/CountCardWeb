/**
 * Profile Picture Storage Utilities
 * 
 * Handles uploading profile pictures to Firebase Storage with validation
 * (MIME allowlist, size, magic-byte signature).
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { logError, logInfo } from '@/lib/utils/logger';
import { validateImageFile } from '@/lib/storage/imageValidation';

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Upload profile picture to Firebase Storage
 * 
 * @param userId - User ID (used for file path)
 * @param file - Image file to upload
 * @returns Download URL of uploaded image
 * @throws Error with user-facing message if validation or upload fails
 */
export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<string> {
  const validationError = await validateImageFile(file, { maxSizeBytes: MAX_SIZE_BYTES });
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `profile-pictures/${userId}/${timestamp}-${sanitizedFileName}`;
    const storageRef = ref(storage, storagePath);

    logInfo(`Uploading profile picture for user ${userId}`, 'storage.uploadProfilePicture');

    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // 1 year cache
    });

    const downloadURL = await getDownloadURL(snapshot.ref);
    logInfo(`Profile picture uploaded successfully for user ${userId}`, 'storage.uploadProfilePicture');
    return downloadURL;
  } catch (error) {
    logError(error as Error, 'storage.uploadProfilePicture');
    if (error instanceof Error && error.message !== '') {
      throw error;
    }
    throw new Error('Upload failed. Please try again.');
  }
}

/**
 * Delete profile picture from Firebase Storage
 * 
 * @param userId - User ID
 * @param imageUrl - Full URL of the image to delete (Firebase Storage URL only)
 * @returns true if deletion successful or URL was not a Storage URL (nothing to delete); false on error
 */
export async function deleteProfilePicture(
  userId: string,
  imageUrl: string
): Promise<boolean> {
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    if (!pathMatch) {
      // Not a Firebase Storage URL (e.g. OAuth provider photo); nothing to delete
      return true;
    }

    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);

    logInfo(`Profile picture deleted for user ${userId}`, 'storage.deleteProfilePicture');
    return true;
  } catch (error) {
    logError(error as Error, 'storage.deleteProfilePicture');
    return false;
  }
}
