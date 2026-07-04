"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../admin");
const auth_1 = require("../auth");
const router = (0, express_1.Router)();
router.get('/users', async (req, res) => {
    try {
        const token = await (0, auth_1.verifyAuthToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
            return;
        }
        if (!(await (0, auth_1.isAdmin)(token.uid))) {
            res.status(403).json({ error: 'Forbidden - admin access required' });
            return;
        }
        const searchQuery = req.query.search || '';
        const limit = parseInt(req.query.limit || '50', 10);
        const snapshot = await admin_1.adminDb.collection('userProfiles').limit(limit).get();
        let users = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            users = users.filter((u) => String(u.displayName ?? '').toLowerCase().includes(q) ||
                String(u.email ?? '').toLowerCase().includes(q));
        }
        res.json({ success: true, users });
    }
    catch {
        res.status(500).json({ error: 'Failed to list users' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map