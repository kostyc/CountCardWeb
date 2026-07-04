"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../admin");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
router.post('/profile', async (req, res) => {
    try {
        const token = await (0, auth_1.verifyAuthToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
            return;
        }
        const profileData = req.body;
        const profileRef = admin_1.adminDb.collection('userProfiles').doc(token.uid);
        await profileRef.set({ ...profileData, userId: token.uid, updatedAt: new Date() }, { merge: true });
        res.json({ success: true, message: 'Profile saved successfully' });
    }
    catch {
        res.status(500).json({ error: 'Failed to save profile' });
    }
});
router.get('/profile/completion', async (req, res) => {
    try {
        const token = await (0, auth_1.verifyAuthToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
            return;
        }
        const snap = await admin_1.adminDb.collection('userProfiles').doc(token.uid).get();
        const data = snap.data() ?? {};
        const required = ['firstName', 'lastName', 'rank', 'role'];
        const completed = required.filter((f) => Boolean(data[f])).length;
        res.json({ success: true, completionPercentage: Math.round((completed / required.length) * 100), profile: data });
    }
    catch {
        res.status(500).json({ error: 'Failed to get profile completion' });
    }
});
router.post('/accept-policies', async (req, res) => {
    try {
        const token = await (0, auth_1.verifyAuthToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
            return;
        }
        const { privacyPolicyAccepted, termsOfServiceAccepted } = req.body ?? {};
        await admin_1.adminDb.collection('userProfiles').doc(token.uid).set({
            privacyPolicyAccepted: Boolean(privacyPolicyAccepted),
            termsOfServiceAccepted: Boolean(termsOfServiceAccepted),
            policiesAcceptedAt: new Date(),
            updatedAt: new Date(),
        }, { merge: true });
        res.json({ success: true, message: 'Policy acceptance recorded' });
    }
    catch {
        res.status(500).json({ error: 'Failed to record policy acceptance' });
    }
});
router.post('/set-custom-claims', async (req, res) => {
    try {
        const token = await (0, auth_1.verifyAuthToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
            return;
        }
        const { targetUserId, claims } = req.body ?? {};
        if (!targetUserId || !claims) {
            res.status(400).json({ error: 'targetUserId and claims are required' });
            return;
        }
        res.status(403).json({ error: 'Custom claims require admin verification — use admin SDK directly' });
    }
    catch {
        res.status(500).json({ error: 'Failed to set custom claims' });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map