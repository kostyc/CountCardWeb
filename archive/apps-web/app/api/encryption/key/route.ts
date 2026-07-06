/**
 * API Route: Get Encryption Key
 * Retrieves the user's encryption key (decrypted)
 * 
 * Note: The key is returned in base64 format for client-side use.
 * The key should be kept secure and never logged or exposed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import { decryptStoredEncryptionKey, encodeBase64, type StoredEncryptionKey } from '@/lib/encryption';

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
    logError(error as Error, 'API.encryption.key.verifyAuthToken');
    return null;
  }
}

/**
 * GET /api/encryption/key
 * Get user's encryption key
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const authenticatedUserId = await verifyAuthToken(request);
    if (!authenticatedUserId) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    // Get userId from query params or use authenticated user
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId') || authenticatedUserId;

    // Users can only retrieve their own encryption key
    if (requestedUserId !== authenticatedUserId) {
      return NextResponse.json(
        { error: 'Forbidden - you can only retrieve your own encryption key' },
        { status: 403 }
      );
    }

    // Get encryption key from Firestore
    const keyRef = adminDb.collection('encryptionKeys').doc(requestedUserId);
    const keySnap = await keyRef.get();

    if (!keySnap.exists) {
      return NextResponse.json(
        { error: 'Encryption key not found. Generate a key first.' },
        { status: 404 }
      );
    }

    const storedKey = keySnap.data() as StoredEncryptionKey;

    // Decrypt the key
    const userKey = await decryptStoredEncryptionKey(storedKey);

    // Encode key as base64 for client-side use
    const keyBase64 = encodeBase64(userKey);

    logInfo(`Encryption key retrieved for user ${requestedUserId}`, 'API.encryption.key');

    return NextResponse.json({
      success: true,
      key: keyBase64, // Base64-encoded key for client-side use
      keyVersion: storedKey.keyVersion,
    });
  } catch (error) {
    logError(error as Error, 'API.encryption.key');
    return NextResponse.json(
      { error: 'Failed to retrieve encryption key' },
      { status: 500 }
    );
  }
}
