import { Router } from 'express';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '../admin';
import { verifyAuthToken, isAdmin, verifyOrganizationAccess } from '../auth';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import { isStatusTransitionAllowed } from '@countcard/core/constants/recruitStatus';
import {
  progressEventInputSchema,
  recruitCommentInputSchema,
} from '@countcard/core/validation/lifecycleSchemas';
import type { AppUser, OrganizationalAssignment } from '@countcard/core/types/auth';
import type { RecruitProfile } from '@countcard/core/types/models';
import { addRecruitProgressEventAdmin, addRecruitCommentAdmin } from '../lib/recruitProgressAdmin';
import { canEditRecruitProgress } from '../lib/lifecyclePermissions';

const router = Router({ mergeParams: true });

const transferRequestSchema = z.object({
  regiment: z.string().optional(),
  battalion: z.string().optional(),
  company: z.string().optional(),
  series: z.string().optional(),
  platoon: z.string().min(1, 'Platoon is required'),
  reason: z.string().optional(),
});

function buildAppUser(token: NonNullable<Awaited<ReturnType<typeof verifyAuthToken>>>): AppUser {
  return {
    uid: token.uid,
    customClaims: {
      role: token.role,
      organizationalAssignment: token.organizationalAssignment,
    },
  } as AppUser;
}

function toOrganizationalAssignment(
  body: z.infer<typeof transferRequestSchema>
): OrganizationalAssignment {
  return {
    regiment: body.regiment as OrganizationalAssignment['regiment'],
    battalion: body.battalion as OrganizationalAssignment['battalion'],
    company: body.company as OrganizationalAssignment['company'],
    series: body.series as OrganizationalAssignment['series'],
    platoon: body.platoon,
  };
}

router.post('/:id/transfer', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - valid authentication token required' });
      return;
    }

    const recruitId = req.params.id;
    if (!recruitId) {
      res.status(400).json({ error: 'Recruit ID is required' });
      return;
    }

    const parsed = transferRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid transfer payload', details: parsed.error.flatten() });
      return;
    }

    const toAssignment = toOrganizationalAssignment(parsed.data);
    const userId = token.uid;
    const appUser = buildAppUser(token);

    const recruitRef = adminDb.collection('recruits').doc(recruitId);
    const recruitSnap = await recruitRef.get();
    if (!recruitSnap.exists) {
      res.status(404).json({ error: 'Recruit not found' });
      return;
    }

    const currentRecruit = recruitSnap.data() as RecruitProfile;

    if (currentRecruit.custodyPhase && currentRecruit.custodyPhase !== 'training') {
      res.status(400).json({
        error:
          'Recruit is not in training custody. Use transfer batch workflow for Receiving pickup.',
      });
      return;
    }

    const editCheck = canEditRecruit(appUser, currentRecruit);
    if (!editCheck.allowed) {
      res.status(403).json({ error: editCheck.reason ?? 'Forbidden - cannot transfer this recruit' });
      return;
    }

    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin && !verifyOrganizationAccess(token, toAssignment)) {
      res.status(403).json({ error: 'Forbidden - insufficient permissions for target assignment' });
      return;
    }

    const fromAssignment = {
      regiment: currentRecruit.regiment,
      battalion: currentRecruit.battalion,
      company: currentRecruit.company,
      series: currentRecruit.series,
      platoon: currentRecruit.platoon,
    };

    const assignmentUnchanged =
      fromAssignment.regiment === toAssignment.regiment &&
      fromAssignment.battalion === toAssignment.battalion &&
      fromAssignment.company === toAssignment.company &&
      fromAssignment.series === toAssignment.series &&
      fromAssignment.platoon === toAssignment.platoon;

    if (assignmentUnchanged) {
      res.status(400).json({ error: 'New assignment must differ from the current assignment' });
      return;
    }

    const reason = parsed.data.reason?.trim() || undefined;
    const now = Timestamp.now();
    const changedAt = now.toDate();
    const transferEntry = {
      fromAssignment,
      toAssignment,
      timestamp: changedAt,
      transferredBy: userId,
      reason,
    };

    const newStatus = 'transferred' as const;
    let status = currentRecruit.status;
    let statusHistory = currentRecruit.statusHistory || [];

    if (currentRecruit.status !== newStatus) {
      if (!isStatusTransitionAllowed(currentRecruit.status, newStatus)) {
        res.status(400).json({
          error: `Cannot transfer recruit with status "${currentRecruit.status}".`,
        });
        return;
      }
      statusHistory = [
        ...statusHistory,
        {
          fromStatus: currentRecruit.status,
          toStatus: newStatus,
          timestamp: changedAt,
          changedBy: userId,
          reason: reason || 'Organizational transfer',
        },
      ];
      status = newStatus;
    }

    await recruitRef.update({
      regiment: toAssignment.regiment ?? FieldValue.delete(),
      battalion: toAssignment.battalion ?? FieldValue.delete(),
      company: toAssignment.company ?? FieldValue.delete(),
      series: toAssignment.series ?? FieldValue.delete(),
      platoon: toAssignment.platoon,
      status,
      statusHistory,
      transferHistory: [...(currentRecruit.transferHistory || []), transferEntry],
      updatedBy: userId,
      updatedAt: now,
    });

    try {
      const logId = `transfer-${recruitId}-${Date.now()}`;
      await adminDb.collection('adminLogs').doc(logId).set({
        logId,
        userId,
        action: 'update',
        resourceType: 'recruit',
        resourceId: recruitId,
        description: `Recruit transferred to platoon ${toAssignment.platoon}${reason ? `: ${reason}` : ''}`,
        metadata: {
          fromAssignment,
          toAssignment,
          reason: reason ?? null,
        },
        timestamp: now,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      });
    } catch {
      // audit log failure is non-fatal
    }

    res.json({ success: true, recruitId });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to transfer recruit',
    });
  }
});

router.post('/:id/progress', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const recruitId = req.params.id;
    const recruitSnap = await adminDb.collection('recruits').doc(recruitId).get();
    if (!recruitSnap.exists) {
      res.status(404).json({ error: 'Recruit not found' });
      return;
    }
    const recruit = recruitSnap.data() as RecruitProfile;
    if (!canEditRecruitProgress(token, recruit)) {
      res.status(403).json({ error: 'Forbidden — training custody edit access required' });
      return;
    }

    const parsed = progressEventInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const eventDocId = await addRecruitProgressEventAdmin(recruitId, {
      ...parsed.data,
      recordedBy: token.uid,
    });

    res.json({ success: true, eventDocId });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add progress event',
    });
  }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const recruitId = req.params.id;
    const recruitSnap = await adminDb.collection('recruits').doc(recruitId).get();
    if (!recruitSnap.exists) {
      res.status(404).json({ error: 'Recruit not found' });
      return;
    }
    const recruit = recruitSnap.data() as RecruitProfile;
    if (!canEditRecruitProgress(token, recruit)) {
      res.status(403).json({ error: 'Forbidden — training custody edit access required' });
      return;
    }

    const parsed = recruitCommentInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const commentDocId = await addRecruitCommentAdmin(recruitId, {
      authorId: token.uid,
      authorRole: token.role,
      body: parsed.data.body,
      category: parsed.data.category,
    });

    res.json({ success: true, commentDocId });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add comment',
    });
  }
});

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
