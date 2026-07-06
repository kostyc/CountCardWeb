/**
 * POST /api/di-leadership-cards/[id]/sign
 */

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import '@/lib/firebase/config';
import { verifyAuthToken } from '@/lib/permissions/server';
import { signDILeadershipCard } from '@/lib/services/firestore/diLeadershipCards';
import { canCreateDiCard } from '@/lib/lifecycle/permissions';
import { logError } from '@/lib/utils/logger';
import { z } from 'zod';

const signSchema = z.object({
  which: z.enum(['di', 'senior']),
  signatureImageUrl: z.string().url().optional(),
  attestationHash: z.string().optional(),
});

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
    const parsed = signSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await signDILeadershipCard(
      id,
      parsed.data.which,
      {
        userId: token.uid,
        signedAt: Timestamp.now(),
        signatureImageUrl: parsed.data.signatureImageUrl,
        attestationHash: parsed.data.attestationHash,
      },
      token.uid
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logError(error as Error, 'API.diLeadershipCards.sign');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign card' },
      { status: 500 }
    );
  }
}
