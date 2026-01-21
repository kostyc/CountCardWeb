/**
 * Profile Picture Storage Utilities
 * 
 * Handles uploading profile pictures to Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { logError, logInfo } from '@/lib/utils/logger';

/**
 * Upload profile picture to Firebase Storage
 * 
 * @param userId - User ID (used for file path)
 * @param file - Image file to upload
 * @returns Download URL of uploaded image, or null if upload fails
 */
export async function uploadProfilePicture(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    // Create storage reference: profile-pictures/{userId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `profile-pictures/${userId}/${timestamp}-${sanitizedFileName}`;
    const storageRef = ref(storage, storagePath);

    logInfo(`Uploading profile picture for user ${userId}`, 'storage.uploadProfilePicture');

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000', // 1 year cache
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    logInfo(`Profile picture uploaded successfully for user ${userId}`, 'storage.uploadProfilePicture');

    return downloadURL;
  } catch (error) {
    logError(error as Error, 'storage.uploadProfilePicture');
    return null;
  }
}

/**
 * Delete profile picture from Firebase Storage
 * 
 * @param userId - User ID
 * @param imageUrl - Full URL of the image to delete
 * @returns true if deletion successful, false otherwise
 */
export async function deleteProfilePicture(
  userId: string,
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

    logInfo(`Profile picture deleted for user ${userId}`, 'storage.deleteProfilePicture');

    return true;
  } catch (error) {
    logError(error as Error, 'storage.deleteProfilePicture');
    return false;
  }
}
