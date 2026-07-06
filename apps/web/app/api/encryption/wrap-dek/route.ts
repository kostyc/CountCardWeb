/**
 * POST /api/encryption/wrap-dek — wrap message DEK for a recipient
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken } from '@/lib/permissions/server';
import { apiWrapDekSchema } from '@countcard/core/validation/apiRouteSchemas';
import { decryptStoredEncryptionKey, type StoredEncryptionKey } from '@/lib/encryption/keyManager';
import { encrypt } from '@/lib/encryption/encryptionService.web';
import { logError } from '@/lib/utils/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = apiWrapDekSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { recipientUserId, dekBase64 } = parsed.data;
    const keySnap = await adminDb.collection('encryptionKeys').doc(recipientUserId).get();
    if (!keySnap.exists) {
      return NextResponse.json({ error: 'Recipient encryption key not found' }, { status: 404 });
    }

    const storedKey = keySnap.data() as StoredEncryptionKey;
    storedKey.userId = recipientUserId;
    const recipientKey = await decryptStoredEncryptionKey(storedKey);
    const wrap = await encrypt(dekBase64, recipientKey);

    return NextResponse.json({ wrap });
  } catch (error) {
    logError(error as Error, 'API.encryption.wrap-dek');
    return NextResponse.json({ error: 'Failed to wrap DEK' }, { status: 500 });
  }
}
