"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../admin");
const auth_1 = require("../auth");
const encryption_1 = require("@countcard/encryption");
const router = (0, express_1.Router)();
async function requireUid(req, res) {
    const token = await (0, auth_1.verifyAuthToken)(req);
    if (!token) {
        res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
        return null;
    }
    return token.uid;
}
router.get('/key', async (req, res) => {
    try {
        const uid = await requireUid(req, res);
        if (!uid)
            return;
        const requestedUserId = req.query.userId || uid;
        if (requestedUserId !== uid) {
            res.status(403).json({ error: 'Forbidden - you can only retrieve your own encryption key' });
            return;
        }
        const keySnap = await admin_1.adminDb.collection('encryptionKeys').doc(requestedUserId).get();
        if (!keySnap.exists) {
            res.status(404).json({ error: 'Encryption key not found. Generate a key first.' });
            return;
        }
        const storedKey = keySnap.data();
        const userKey = await (0, encryption_1.decryptStoredEncryptionKey)(storedKey);
        res.json({ success: true, key: (0, encryption_1.encodeBase64)(userKey), keyVersion: storedKey.keyVersion });
    }
    catch {
        res.status(500).json({ error: 'Failed to retrieve encryption key' });
    }
});
router.post('/generate-key', async (req, res) => {
    try {
        const uid = await requireUid(req, res);
        if (!uid)
            return;
        const keyRef = admin_1.adminDb.collection('encryptionKeys').doc(uid);
        if ((await keyRef.get()).exists) {
            res.status(409).json({ error: 'Encryption key already exists. Use rotate-key endpoint to rotate the key.' });
            return;
        }
        const userKey = await (0, encryption_1.generateUserKey)();
        const keyDoc = await (0, encryption_1.prepareEncryptionKeyForStorage)(uid, userKey, 1);
        await keyRef.set(keyDoc);
        await admin_1.adminDb.collection('encryptionConfig').doc(uid).set({
            userId: uid,
            keyVersion: 1,
            algorithm: 'XChaCha20-Poly1305',
            keyRotationEnabled: true,
            recoveryCodesEnabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        res.json({ success: true, message: 'Encryption key generated and stored successfully', keyVersion: keyDoc.keyVersion });
    }
    catch {
        res.status(500).json({ error: 'Failed to generate encryption key' });
    }
});
router.post('/rotate-key', async (req, res) => {
    try {
        const uid = await requireUid(req, res);
        if (!uid)
            return;
        const keyRef = admin_1.adminDb.collection('encryptionKeys').doc(uid);
        const existing = await keyRef.get();
        if (!existing.exists) {
            res.status(404).json({ error: 'Encryption key not found' });
            return;
        }
        const newKey = await (0, encryption_1.generateUserKey)();
        const keyDoc = await (0, encryption_1.prepareEncryptionKeyForStorage)(uid, newKey, (existing.data()?.keyVersion ?? 0) + 1);
        await keyRef.set(keyDoc);
        res.json({ success: true, message: 'Encryption key rotated successfully', keyVersion: keyDoc.keyVersion });
    }
    catch {
        res.status(500).json({ error: 'Failed to rotate encryption key' });
    }
});
router.post('/recovery-code', async (req, res) => {
    try {
        const uid = await requireUid(req, res);
        if (!uid)
            return;
        res.status(501).json({ error: 'Recovery code generation delegated to client key manager' });
    }
    catch {
        res.status(500).json({ error: 'Failed to generate recovery code' });
    }
});
router.post('/recover-key', async (req, res) => {
    try {
        const uid = await requireUid(req, res);
        if (!uid)
            return;
        res.status(501).json({ error: 'Key recovery requires client-side verification flow' });
    }
    catch {
        res.status(500).json({ error: 'Failed to recover encryption key' });
    }
});
exports.default = router;
//# sourceMappingURL=encryption.js.map