/**
 * POST /api/conversations/org-channel — create platoon/company/battalion channel
 */

import { NextRequest, NextResponse } from 'next/server';
import '@/lib/firebase/config';
import { verifyAuthToken } from '@/lib/permissions/server';
import { conversationTypeSchema, conversationOrgScopeSchema } from '@countcard/core/validation/lifecycleSchemas';
import { createOrgChannelConversationAdmin } from '@/lib/lifecycle/conversationsAdmin';
import { canCreateOrgChannel } from '@/lib/lifecycle/permissions';
import { z } from 'zod';
import { logError } from '@/lib/utils/logger';

const bodySchema = z.object({
  conversationType: conversationTypeSchema,
  organizationalScope: conversationOrgScopeSchema,
  title: z.string().max(200).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canCreateOrgChannel(token)) {
      return NextResponse.json({ error: 'Forbidden — org channel creation not permitted' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (parsed.data.conversationType === 'direct') {
      return NextResponse.json({ error: 'Use direct conversation flow for DMs' }, { status: 400 });
    }

    const conversationId = await createOrgChannelConversationAdmin({
      conversationType: parsed.data.conversationType,
      organizationalScope: parsed.data.organizationalScope,
      createdBy: token.uid,
      title: parsed.data.title,
    });

    return NextResponse.json({ success: true, conversationId });
  } catch (error) {
    logError(error as Error, 'API.conversations.orgChannel');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create channel' },
      { status: 500 }
    );
  }
}
