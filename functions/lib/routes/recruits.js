"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../admin");
const auth_1 = require("../auth");
const router = (0, express_1.Router)({ mergeParams: true });
router.get('/:id/export', async (req, res) => {
    try {
        const token = await (0, auth_1.verifyAuthToken)(req);
        if (!token) {
            res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
            return;
        }
        const recruitId = req.params.id;
        const recruitSnap = await admin_1.adminDb.collection('recruits').doc(recruitId).get();
        if (!recruitSnap.exists) {
            res.status(404).json({ error: 'Recruit not found' });
            return;
        }
        const userIsAdmin = await (0, auth_1.isAdmin)(token.uid);
        if (recruitSnap.data()?.userId !== token.uid && !userIsAdmin) {
            res.status(403).json({ error: 'Forbidden - cannot export this recruit data' });
            return;
        }
        res.json({
            success: true,
            exportDate: new Date().toISOString(),
            recruit: { id: recruitSnap.id, ...recruitSnap.data() },
        });
    }
    catch {
        res.status(500).json({ error: 'Failed to export recruit data' });
    }
});
exports.default = router;
//# sourceMappingURL=recruits.js.map