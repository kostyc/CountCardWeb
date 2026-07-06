import { Router } from 'express';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { verifyAuthToken } from '../auth';
import { diLeadershipCardInputSchema, diRecommendationInputSchema } from '@countcard/core/validation/lifecycleSchemas';
import {
  createDILeadershipCardAdmin,
  signDILeadershipCardAdmin,
  appendDIRecommendationAdmin,
} from '../lib/diLeadershipCardsAdmin';
import { canCreateDiCard } from '../lib/lifecyclePermissions';

const router = Router({ mergeParams: true });

const signSchema = z.object({
  which: z.enum(['di', 'senior']),
  signatureImageUrl: z.string().url().optional(),
  attestationHash: z.string().optional(),
});

router.post('/', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!canCreateDiCard(token)) {
      res.status(403).json({ error: 'Forbidden — DI leadership card access required' });
      return;
    }

    const parsed = diLeadershipCardInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    const cardId = `dic-${Date.now()}`;
    const org = token.organizationalAssignment;
    await createDILeadershipCardAdmin(
      cardId,
      {
        cardId,
        subjectUserId: parsed.data.subjectUserId,
        authorRole: parsed.data.authorRole,
        cardType: parsed.data.cardType,
        importImageUrl: parsed.data.importImageUrl,
        summary: parsed.data.summary,
        workflowState: 'draft',
        organizationalAssignment: {
          regiment: org?.regiment,
          battalion: org?.battalion,
          company: org?.company,
          series: org?.series,
          platoon: org?.platoon,
        },
        createdBy: token.uid,
      },
      token.uid
    );

    res.json({ success: true, cardId });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create card',
    });
  }
});

router.post('/:id/sign', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!canCreateDiCard(token)) {
      res.status(403).json({ error: 'Forbidden — DI leadership card access required' });
      return;
    }

    const parsed = signSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    await signDILeadershipCardAdmin(
      req.params.id,
      parsed.data.which,
      {
        userId: token.uid,
        signedAt: Timestamp.now().toDate(),
        signatureImageUrl: parsed.data.signatureImageUrl,
        attestationHash: parsed.data.attestationHash,
      },
      token.uid
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to sign card',
    });
  }
});

router.post('/:id/recommendations', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!canCreateDiCard(token)) {
      res.status(403).json({ error: 'Forbidden — DI leadership card access required' });
      return;
    }

    const parsed = diRecommendationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    await appendDIRecommendationAdmin(req.params.id, token.uid, parsed.data.text, token.uid);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to append recommendation',
    });
  }
});

export default router;
