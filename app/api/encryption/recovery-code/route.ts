/**
 * API Route: Generate Recovery Code
 * Generates a recovery code for the user's encryption key
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import { generateRecoveryCodeForKey, decryptStoredEncryptionKey, type StoredEncryptionKey } from '@/lib/encryption/keyManager';
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
    logError(error as Error, 'API.encryption.recovery-code.verifyAuthToken');
    return null;
  }
}

/**
 * POST /api/encryption/recovery-code
 * Generate a recovery code for user's encryption key
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

    // Get encryption key
    const keyRef = adminDb.collection('encryptionKeys').doc(authenticatedUserId);
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

    // Generate recovery code
    const recoveryCode = await generateRecoveryCodeForKey(userKey);

    // Create recovery code info
    const recoveryCodeInfo: RecoveryCodeInfo = {
      code: recoveryCode,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      used: false,
      userId: authenticatedUserId,
    };

    // Store recovery code in encryptionKeys document
    const existingRecoveryCodes = storedKey.recoveryCodes || [];
    const updatedRecoveryCodes = [...existingRecoveryCodes, recoveryCodeInfo];

    // Update encryption key document with recovery code
    await keyRef.set({
      recoveryCodes: updatedRecoveryCodes,
      updatedAt: new Date(),
    }, { merge: true });

    logInfo(`Recovery code generated for user ${authenticatedUserId}`, 'API.encryption.recovery-code');

    // Return recovery code to user (they should save this securely)
    return NextResponse.json({
      success: true,
      message: 'Recovery code generated successfully',
      recoveryCode,
      expiresAt: recoveryCodeInfo.expiresAt,
      warning: 'Save this recovery code securely. It will not be shown again.',
    });
  } catch (error) {
    logError(error as Error, 'API.encryption.recovery-code');
    return NextResponse.json(
      { error: 'Failed to generate recovery code' },
      { status: 500 }
    );
  }
}
