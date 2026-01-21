/**
 * Recruit Photo Storage Utilities
 * 
 * Handles uploading recruit photos to Firebase Storage with validation,
 * resizing, and optimization.
 */

import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { logError, logInfo } from '@/lib/utils/logger';

/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Maximum file size (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Validate image file
 * 
 * @param file - File to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Image must be in JPG, PNG, or WebP format';
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return 'Image size must be less than 5MB';
  }

  return null;
}

/**
 * Resize image to maximum dimensions (optional optimization)
 * 
 * Note: This is a placeholder for future image resizing functionality.
 * For now, images are uploaded as-is. Future enhancement could use
 * a library like browser-image-compression or canvas API.
 * 
 * @param file - Image file to resize
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @returns Resized file or original file
 */
export async function resizeImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<File> {
  // TODO: Implement image resizing using canvas API or browser-image-compression
  // For now, return original file
  return file;
}

/**
 * Upload recruit photo to Firebase Storage
 * 
 * @param recruitId - Recruit ID (used for file path)
 * @param file - Image file to upload
 * @param options - Upload options
 * @returns Download URL of uploaded image, or null if upload fails
 */
export async function uploadRecruitPhoto(
  recruitId: string,
  file: File,
  options?: {
    onProgress?: (progress: number) => void;
    resize?: boolean;
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<string | null> {
  try {
    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Resize image if requested
    let fileToUpload = file;
    if (options?.resize) {
      fileToUpload = await resizeImage(
        file,
        options.maxWidth || 800,
        options.maxHeight || 800
      );
    }

    // Create storage reference: recruit-photos/{recruitId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `recruit-photos/${recruitId}/${timestamp}-${sanitizedFileName}`;
    const storageRef = ref(storage, storagePath);

    logInfo(`Uploading recruit photo for recruit ${recruitId}`, 'storage.uploadRecruitPhoto');

    // Upload file with progress tracking if callback provided
    let snapshot;
    if (options?.onProgress) {
      // Use resumable upload for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload, {
        contentType: fileToUpload.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      });

      // Track upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          options.onProgress?.(Math.round(progress));
        },
        (error) => {
          throw error;
        }
      );

      // Wait for upload to complete
      snapshot = await uploadTask;
    } else {
      // Use simple upload if no progress tracking needed
      snapshot = await uploadBytes(storageRef, fileToUpload, {
        contentType: fileToUpload.type,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      });
    }

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    logInfo(`Recruit photo uploaded successfully for recruit ${recruitId}`, 'storage.uploadRecruitPhoto');

    return downloadURL;
  } catch (error) {
    logError(error as Error, 'storage.uploadRecruitPhoto');
    return null;
  }
}

/**
 * Delete recruit photo from Firebase Storage
 * 
 * @param recruitId - Recruit ID
 * @param imageUrl - Full URL of the image to delete
 * @returns true if deletion successful, false otherwise
 */
export async function deleteRecruitPhoto(
  recruitId: string,
  imageUrl: string
): Promise<boolean> {
  try {
    // Extract path from URL
    // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      throw new Error('Invalid image URL format');
    }

    // Decode the path (Firebase Storage URLs are URL-encoded)
    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);

    // Delete the file
    await deleteObject(storageRef);

    logInfo(`Recruit photo deleted for recruit ${recruitId}`, 'storage.deleteRecruitPhoto');

    return true;
  } catch (error) {
    logError(error as Error, 'storage.deleteRecruitPhoto');
    return false;
  }
}

/**
 * Delete old recruit photo when updating
 * 
 * This function should be called when updating a recruit's photo to delete
 * the old photo from storage.
 * 
 * @param recruitId - Recruit ID
 * @param oldPhotoUrl - URL of the old photo to delete
 * @param newPhotoUrl - URL of the new photo (to verify it's different)
 * @returns true if old photo was deleted, false otherwise
 */
export async function replaceRecruitPhoto(
  recruitId: string,
  oldPhotoUrl: string | undefined,
  newPhotoUrl: string
): Promise<boolean> {
  // If no old photo, nothing to delete
  if (!oldPhotoUrl) {
    return true;
  }

  // If URLs are the same, nothing to delete
  if (oldPhotoUrl === newPhotoUrl) {
    return true;
  }

  // Delete old photo
  return await deleteRecruitPhoto(recruitId, oldPhotoUrl);
}
