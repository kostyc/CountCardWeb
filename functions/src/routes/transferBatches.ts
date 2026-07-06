import { Router } from 'express';
import { adminDb } from '../admin';
import { verifyAuthToken } from '../auth';
import {
  transferBatchCreateSchema,
  transferBatchRejectSchema,
  type TransferBatchStatus,
} from '@countcard/core/validation/lifecycleSchemas';
import type { RecruitProfile } from '@countcard/core/types/models';
import { buildTransferBatchRosterCsv } from '../lib/rosterCsv';
import {
  createTransferBatchAdmin,
  listTransferBatchesAdmin,
  getTransferBatchAdmin,
  publishTransferBatchAdmin,
  initiateTransferBatchAdmin,
  advanceFirstSgtReviewAdmin,
  advanceCdiReviewAdmin,
  acceptTransferBatchAdmin,
  rejectTransferBatchAdmin,
} from '../lib/transferBatchAdmin';
import {
  canManageReceivingBatches,
  canViewTransferBatch,
  canAdvanceTransferBatchStage,
  canRejectTransferBatch,
  filterTransferBatchesForToken,
} from '../lib/lifecyclePermissions';

const router = Router({ mergeParams: true });

const NOTIFY_ROLES = [
  'company_commander',
  'company_first_sgt',
  'chief_drill_instructor',
  'senior_drill_instructor',
];

router.post('/', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!canManageReceivingBatches(token)) {
      res.status(403).json({ error: 'Forbidden — Receiving workflow access required' });
      return;
    }

    const parsed = transferBatchCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
      return;
    }

    for (const recruitId of parsed.data.recruitIds) {
      const recruitSnap = await adminDb.collection('recruits').doc(recruitId).get();
      if (!recruitSnap.exists) {
        res.status(400).json({ error: `Recruit not found: ${recruitId}` });
        return;
      }
      const recruit = recruitSnap.data() as RecruitProfile;
      if (recruit.custodyPhase !== 'receiving_ready') {
        res.status(400).json({
          error: `Recruit ${recruitId} is not receiving-ready (custodyPhase: ${recruit.custodyPhase ?? 'unset'})`,
        });
        return;
      }
    }

    const batchId = `tb-${Date.now()}`;
    await createTransferBatchAdmin(batchId, {
      pickupWeek: parsed.data.pickupWeek,
      regiment: parsed.data.regiment,
      destinationAssignment: parsed.data.destinationAssignment,
      recruitIds: parsed.data.recruitIds,
      notes: parsed.data.notes,
      createdBy: token.uid,
    });

    res.json({ success: true, transferBatchId: batchId });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create batch',
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const company = typeof req.query.company === 'string' ? req.query.company : undefined;
    const batches = await listTransferBatchesAdmin({
      status: status as TransferBatchStatus | undefined,
      destinationCompany: company,
    });

    res.json({ batches: filterTransferBatchesForToken(token, batches) });
  } catch {
    res.status(500).json({ error: 'Failed to list batches' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canViewTransferBatch(token, batch)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ batch });
  } catch {
    res.status(500).json({ error: 'Failed to load batch' });
  }
});

router.get('/:id/export', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canViewTransferBatch(token, batch)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const recruits: RecruitProfile[] = [];
    for (const recruitId of batch.recruitIds) {
      const snap = await adminDb.collection('recruits').doc(recruitId).get();
      if (snap.exists) {
        recruits.push({ id: snap.id, ...snap.data() } as RecruitProfile);
      }
    }

    const csv = buildTransferBatchRosterCsv(
      batch,
      recruits.map((r) => ({
        recruitId: r.recruitId,
        edipi: r.edipi,
        firstName: r.firstName,
        lastName: r.lastName,
        rank: r.rank,
      }))
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roster-${req.params.id}.csv"`);
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to export roster' });
  }
});

router.post('/:id/publish', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!canManageReceivingBatches(token)) {
      res.status(403).json({ error: 'Forbidden — Receiving workflow access required' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canViewTransferBatch(token, batch)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const company = batch.destinationAssignment.company;
    const notificationsSentTo: Array<{ uid: string; role: string }> = [];

    if (company) {
      const usersSnap = await adminDb
        .collection('userProfiles')
        .where('organizationalAssignment.company', '==', company)
        .get();
      for (const doc of usersSnap.docs) {
        const profile = doc.data();
        const role = profile.role as string;
        if (NOTIFY_ROLES.includes(role)) {
          notificationsSentTo.push({ uid: doc.id, role });
        }
      }
    }

    await publishTransferBatchAdmin(req.params.id, token.uid, notificationsSentTo);
    res.json({ success: true, notificationsSentTo });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to publish batch',
    });
  }
});

router.post('/:id/initiate', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!canManageReceivingBatches(token)) {
      res.status(403).json({ error: 'Forbidden — Receiving workflow access required' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canViewTransferBatch(token, batch)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await initiateTransferBatchAdmin(req.params.id, token.uid);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to initiate batch',
    });
  }
});

router.post('/:id/first-sgt-review', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canAdvanceTransferBatchStage(token, batch)) {
      res.status(403).json({ error: 'Forbidden — company 1st Sgt review access required' });
      return;
    }

    await advanceFirstSgtReviewAdmin(req.params.id, token.uid);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to advance 1st Sgt review',
    });
  }
});

router.post('/:id/cdi-review', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canAdvanceTransferBatchStage(token, batch)) {
      res.status(403).json({ error: 'Forbidden — chief DI review access required' });
      return;
    }

    await advanceCdiReviewAdmin(req.params.id, token.uid);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to advance CDI review',
    });
  }
});

router.post('/:id/accept', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canAdvanceTransferBatchStage(token, batch)) {
      res.status(403).json({ error: 'Forbidden — SDI custody accept required' });
      return;
    }

    await acceptTransferBatchAdmin(req.params.id, token.uid);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to accept batch',
    });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const batch = await getTransferBatchAdmin(req.params.id);
    if (!batch) {
      res.status(404).json({ error: 'Batch not found' });
      return;
    }
    if (!canRejectTransferBatch(token, batch)) {
      res.status(403).json({ error: 'Forbidden — destination company custody access required' });
      return;
    }

    const parsed = transferBatchRejectSchema.safeParse(req.body ?? {});
    await rejectTransferBatchAdmin(
      req.params.id,
      token.uid,
      parsed.success ? parsed.data.reason : undefined
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to reject batch',
    });
  }
});

export default router;
