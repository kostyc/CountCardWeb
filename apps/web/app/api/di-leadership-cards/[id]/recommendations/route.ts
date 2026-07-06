/**
 * POST /api/di-leadership-cards/[id]/recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { diRecommendationInputSchema } from '@countcard/core/validation/lifecycleSchemas';
import { appendDIRecommendation } from '@/lib/services/firestore/diLeadershipCards';
import { canCreateDiCard } from '@/lib/lifecycle/permissions';
import { logError } from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!canCreateDiCard(token)) {
      return NextResponse.json({ error: 'Forbidden — DI leadership card access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = diRecommendationInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await appendDIRecommendation(id, token.uid, parsed.data.text, token.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'API.diLeadershipCards.recommendations');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to append recommendation' },
      { status: 500 }
    );
  }
}
