import { Router } from 'express';
import { adminDb } from '../admin';
import { verifyAuthToken, isAdmin } from '../auth';

const router = Router({ mergeParams: true });

router.get('/:id/export', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    const recruitId = req.params.id;
    const recruitSnap = await adminDb.collection('recruits').doc(recruitId).get();
    if (!recruitSnap.exists) {
      res.status(404).json({ error: 'Recruit not found' });
      return;
    }
    const userIsAdmin = await isAdmin(token.uid);
    if (recruitSnap.data()?.userId !== token.uid && !userIsAdmin) {
      res.status(403).json({ error: 'Forbidden - cannot export this recruit data' });
      return;
    }
    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      recruit: { id: recruitSnap.id, ...recruitSnap.data() },
    });
  } catch {
    res.status(500).json({ error: 'Failed to export recruit data' });
  }
});

export default router;
