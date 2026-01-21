/**
 * API Route: Generate Encryption Key
 * Generates a new encryption key for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import { generateUserKey, prepareEncryptionKeyForStorage, type StoredEncryptionKey } from '@/lib/encryption/keyManager';

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
    logError(error as Error, 'API.encryption.generate-key.verifyAuthToken');
    return null;
  }
}

/**
 * POST /api/encryption/generate-key
 * Generate a new encryption key for the authenticated user
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

    // Check if user already has an encryption key
    const keyRef = adminDb.collection('encryptionKeys').doc(authenticatedUserId);
    const existingKey = await keyRef.get();

    if (existingKey.exists) {
      return NextResponse.json(
        { error: 'Encryption key already exists. Use rotate-key endpoint to rotate the key.' },
        { status: 409 }
      );
    }

    // Generate new encryption key
    const userKey = await generateUserKey();

    // Prepare key document for storage
    const keyDoc = await prepareEncryptionKeyForStorage(authenticatedUserId, userKey, 1);

    // Store key in Firestore
    await keyRef.set(keyDoc);

    // Create encryption config
    const configRef = adminDb.collection('encryptionConfig').doc(authenticatedUserId);
    await configRef.set({
      userId: authenticatedUserId,
      keyVersion: 1,
      algorithm: 'XChaCha20-Poly1305',
      keyRotationEnabled: true,
      recoveryCodesEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logInfo(`Encryption key generated and stored for user ${authenticatedUserId}`, 'API.encryption.generate-key');

    // Return success (do not return the key - it should be retrieved separately if needed)
    return NextResponse.json({
      success: true,
      message: 'Encryption key generated and stored successfully',
      keyVersion: keyDoc.keyVersion,
    });
  } catch (error) {
    logError(error as Error, 'API.encryption.generate-key');
    return NextResponse.json(
      { error: 'Failed to generate encryption key' },
      { status: 500 }
    );
  }
}
