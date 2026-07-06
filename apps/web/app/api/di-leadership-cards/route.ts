/**
 * POST /api/di-leadership-cards
 */

import { NextRequest, NextResponse } from 'next/server';
import '@/lib/firebase/config';
import { verifyAuthToken } from '@/lib/permissions/server';
import { diLeadershipCardInputSchema } from '@countcard/core/validation/lifecycleSchemas';
import { createDILeadershipCardAdmin } from '@/lib/lifecycle/diLeadershipCardsAdmin';
import { canCreateDiCard } from '@/lib/lifecycle/permissions';
import { logError } from '@/lib/utils/logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canCreateDiCard(token)) {
      return NextResponse.json({ error: 'Forbidden — DI leadership card access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = diLeadershipCardInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
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

    return NextResponse.json({ success: true, cardId });
  } catch (error) {
    logError(error as Error, 'API.diLeadershipCards.create');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create card' },
      { status: 500 }
    );
  }
}
