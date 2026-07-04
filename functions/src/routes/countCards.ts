import { Router, Request, Response } from 'express';
import { adminDb } from '../admin';
import { verifyAuthToken, verifyPermission } from '../auth';
import {
  approveCountCard,
  rejectCountCard,
  finalApproveCountCard,
  consolidateCountCard,
} from '@countcard/firebase/services/countCards';

const router = Router({ mergeParams: true });

router.post('/:id/approve', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    if (!verifyPermission(token, 'approve_count_card')) {
      res.status(403).json({ error: 'Forbidden - insufficient permissions to approve count cards' });
      return;
    }
    const { notes, submittedTo } = req.body ?? {};
    await approveCountCard(req.params.id, token.uid, notes, submittedTo);
    res.json({ success: true, message: 'Count card approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to approve count card' });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    if (!verifyPermission(token, 'reject_count_card')) {
      res.status(403).json({ error: 'Forbidden - insufficient permissions to reject count cards' });
      return;
    }
    const { reason } = req.body ?? {};
    await rejectCountCard(req.params.id, token.uid, reason);
    res.json({ success: true, message: 'Count card rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to reject count card' });
  }
});

router.post('/:id/final-approve', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    if (!verifyPermission(token, 'consolidate_count_cards')) {
      res.status(403).json({ error: 'Forbidden - insufficient permissions' });
      return;
    }
    const { notes } = req.body ?? {};
    await finalApproveCountCard(req.params.id, token.uid, notes);
    res.json({ success: true, message: 'Count card final approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to final approve count card' });
  }
});

router.post('/:id/consolidate', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }
    if (!verifyPermission(token, 'consolidate_count_cards')) {
      res.status(403).json({ error: 'Forbidden - insufficient permissions' });
      return;
    }
    await consolidateCountCard(req.params.id, token.uid);
    res.json({ success: true, message: 'Count card consolidated successfully' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to consolidate count card' });
  }
});

export default router;
