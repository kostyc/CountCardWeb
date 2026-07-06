/**
 * API Route: Rotate Encryption Key
 * Rotates the user's encryption key and optionally re-encrypts existing data
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import {
  generateUserKey,
  prepareEncryptionKeyForStorage,
  decryptStoredEncryptionKey,
  rotateUserKey,
  type StoredEncryptionKey,
} from '@/lib/encryption/keyManager';

/**
 * Verify Firebase ID token from Authorization header
 */
async function verifyAuthToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    logError(error as Error, 'API.encryption.rotate-key.verifyAuthToken');
    return null;
  }
}

/**
 * POST /api/encryption/rotate-key
 * Rotate user's encryption key
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authenticatedUserId = await verifyAuthToken(request);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    // Get existing encryption key
    const keyRef = adminDb.collection('encryptionKeys').doc(authenticatedUserId);
    const existingKeySnap = await keyRef.get();

    if (!existingKeySnap.exists) {
      return NextResponse.json(
        { error: 'Encryption key not found. Generate a key first.' },
        { status: 404 }
      );
    }

    const existingStoredKey = existingKeySnap.data() as StoredEncryptionKey;

    // Decrypt existing key
    const oldKey = await decryptStoredEncryptionKey(existingStoredKey);

    // Generate new key
    const newKey = await rotateUserKey(authenticatedUserId, oldKey);

    // Prepare new key document
    const newKeyVersion = existingStoredKey.keyVersion + 1;
    const newKeyDoc = await prepareEncryptionKeyForStorage(authenticatedUserId, newKey, newKeyVersion);

    // Update key in Firestore
    await keyRef.set({
      ...newKeyDoc,
      lastRotatedAt: new Date(),
    }, { merge: true });

    // Update encryption config
    const configRef = adminDb.collection('encryptionConfig').doc(authenticatedUserId);
    await configRef.set({
      keyVersion: newKeyVersion,
      lastKeyRotation: new Date(),
      updatedAt: new Date(),
    }, { merge: true });

    logInfo(`Encryption key rotated for user ${authenticatedUserId} (version ${newKeyVersion})`, 'API.encryption.rotate-key');

    // Note: Re-encryption of existing data should be handled separately
    // This endpoint only rotates the key - data re-encryption is a separate process

    return NextResponse.json({
      success: true,
      message: 'Encryption key rotated successfully',
      keyVersion: newKeyVersion,
      note: 'Existing encrypted data should be re-encrypted with the new key',
    });
  } catch (error) {
    logError(error as Error, 'API.encryption.rotate-key');
    return NextResponse.json(
      { error: 'Failed to rotate encryption key' },
      { status: 500 }
    );
  }
}
