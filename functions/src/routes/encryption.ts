import { Router, Request, Response } from 'express';
import { adminDb } from '../admin';
import { verifyAuthToken } from '../auth';
import {
  decryptStoredEncryptionKey,
  encodeBase64,
  generateUserKey,
  prepareEncryptionKeyForStorage,
  type StoredEncryptionKey,
} from '@countcard/encryption';

const router = Router();

async function requireUid(req: Request, res: Response): Promise<string | null> {
  const token = await verifyAuthToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
    return null;
  }
  return token.uid;
}

router.get('/key', async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    const requestedUserId = (req.query.userId as string) || uid;
    if (requestedUserId !== uid) {
      res.status(403).json({ error: 'Forbidden - you can only retrieve your own encryption key' });
      return;
    }
    const keySnap = await adminDb.collection('encryptionKeys').doc(requestedUserId).get();
    if (!keySnap.exists) {
      res.status(404).json({ error: 'Encryption key not found. Generate a key first.' });
      return;
    }
    const storedKey = keySnap.data() as StoredEncryptionKey;
    const userKey = await decryptStoredEncryptionKey(storedKey);
    res.json({ success: true, key: encodeBase64(userKey), keyVersion: storedKey.keyVersion });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve encryption key' });
  }
});

router.post('/generate-key', async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    const keyRef = adminDb.collection('encryptionKeys').doc(uid);
    if ((await keyRef.get()).exists) {
      res.status(409).json({ error: 'Encryption key already exists. Use rotate-key endpoint to rotate the key.' });
      return;
    }
    const userKey = await generateUserKey();
    const keyDoc = await prepareEncryptionKeyForStorage(uid, userKey, 1);
    await keyRef.set(keyDoc);
    await adminDb.collection('encryptionConfig').doc(uid).set({
      userId: uid,
      keyVersion: 1,
      algorithm: 'XChaCha20-Poly1305',
      keyRotationEnabled: true,
      recoveryCodesEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    res.json({ success: true, message: 'Encryption key generated and stored successfully', keyVersion: keyDoc.keyVersion });
  } catch {
    res.status(500).json({ error: 'Failed to generate encryption key' });
  }
});

router.post('/rotate-key', async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    const keyRef = adminDb.collection('encryptionKeys').doc(uid);
    const existing = await keyRef.get();
    if (!existing.exists) {
      res.status(404).json({ error: 'Encryption key not found' });
      return;
    }
    const newKey = await generateUserKey();
    const keyDoc = await prepareEncryptionKeyForStorage(uid, newKey, (existing.data()?.keyVersion ?? 0) + 1);
    await keyRef.set(keyDoc);
    res.json({ success: true, message: 'Encryption key rotated successfully', keyVersion: keyDoc.keyVersion });
  } catch {
    res.status(500).json({ error: 'Failed to rotate encryption key' });
  }
});

router.post('/recovery-code', async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    res.status(501).json({ error: 'Recovery code generation delegated to client key manager' });
  } catch {
    res.status(500).json({ error: 'Failed to generate recovery code' });
  }
});

router.post('/recover-key', async (req, res) => {
  try {
    const uid = await requireUid(req, res);
    if (!uid) return;
    res.status(501).json({ error: 'Key recovery requires client-side verification flow' });
  } catch {
    res.status(500).json({ error: 'Failed to recover encryption key' });
  }
});

export default router;
