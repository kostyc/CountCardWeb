/**
 * API Route: Recover Encryption Key
 * Recovers encryption key from a recovery code
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import { decryptStoredEncryptionKey, encodeBase64, type StoredEncryptionKey } from '@/lib/encryption';
import type { RecoveryCodeInfo } from '@/lib/encryption/types';

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
    logError(error as Error, 'API.encryption.recover-key.verifyAuthToken');
    return null;
  }
}

/**
 * POST /api/encryption/recover-key
 * Recover encryption key from recovery code
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

    const body = await request.json();
    const { recoveryCode } = body;

    if (!recoveryCode || typeof recoveryCode !== 'string') {
      return NextResponse.json(
        { error: 'Recovery code is required' },
        { status: 400 }
      );
    }

    // Get encryption key document
    const keyRef = adminDb.collection('encryptionKeys').doc(authenticatedUserId);
    const keySnap = await keyRef.get();

    if (!keySnap.exists) {
      return NextResponse.json(
        { error: 'Encryption key not found' },
        { status: 404 }
      );
    }

    const storedKey = keySnap.data() as StoredEncryptionKey;
    const recoveryCodes = storedKey.recoveryCodes || [];

    // Find matching recovery code
    const matchingCode = recoveryCodes.find(
      (code: RecoveryCodeInfo) => code.code === recoveryCode && code.userId === authenticatedUserId
    );

    if (!matchingCode) {
      return NextResponse.json(
        { error: 'Invalid recovery code' },
        { status: 400 }
      );
    }

    // Check if code has been used
    if (matchingCode.used) {
      return NextResponse.json(
        { error: 'Recovery code has already been used' },
        { status: 400 }
      );
    }

    // Check if code has expired
    const now = new Date();
    if (new Date(matchingCode.expiresAt) < now) {
      return NextResponse.json(
        { error: 'Recovery code has expired' },
        { status: 400 }
      );
    }

    // Decrypt the key
    const userKey = await decryptStoredEncryptionKey(storedKey);

    // Mark recovery code as used
    const updatedRecoveryCodes = recoveryCodes.map((code: RecoveryCodeInfo) =>
      code.code === recoveryCode ? { ...code, used: true } : code
    );

    await keyRef.set({
      recoveryCodes: updatedRecoveryCodes,
      updatedAt: new Date(),
    }, { merge: true });

    // Encode key as base64 for client-side use
    const keyBase64 = encodeBase64(userKey);

    logInfo(`Encryption key recovered using recovery code for user ${authenticatedUserId}`, 'API.encryption.recover-key');

    return NextResponse.json({
      success: true,
      message: 'Encryption key recovered successfully',
      key: keyBase64, // Base64-encoded key for client-side use
      keyVersion: storedKey.keyVersion,
      note: 'Recovery code has been marked as used and cannot be used again',
    });
  } catch (error) {
    logError(error as Error, 'API.encryption.recover-key');
    return NextResponse.json(
      { error: 'Failed to recover encryption key' },
      { status: 500 }
    );
  }
}
