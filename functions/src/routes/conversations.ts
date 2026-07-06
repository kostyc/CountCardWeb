import { Router } from 'express';
import { z } from 'zod';
import { verifyAuthToken } from '../auth';
import { conversationTypeSchema, conversationOrgScopeSchema } from '@countcard/core/validation/lifecycleSchemas';
import { createOrgChannelConversationAdmin } from '../lib/conversationsAdmin';
import { canCreateOrgChannel } from '../lib/lifecyclePermissions';

const router = Router({ mergeParams: true });

const orgChannelBodySchema = z.object({
  conversationType: conversationTypeSchema,
  organizationalScope: conversationOrgScopeSchema,
  title: z.string().max(200).optional(),
});

router.post('/org-channel', async (req, res) => {
  try {
    const token = await verifyAuthToken(req);
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!canCreateOrgChannel(token)) {
      res.status(403).json({ error: 'Forbidden — org channel creation not permitted' });
      return;
    }

    const parsed = orgChannelBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid payload' });
      return;
    }

    if (parsed.data.conversationType === 'direct') {
      res.status(400).json({ error: 'Use direct conversation flow for DMs' });
      return;
    }

    const conversationId = await createOrgChannelConversationAdmin({
      conversationType: parsed.data.conversationType,
      organizationalScope: parsed.data.organizationalScope,
      createdBy: token.uid,
      title: parsed.data.title,
    });

    res.json({ success: true, conversationId });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create channel',
    });
  }
});

export default router;
