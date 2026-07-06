/**
 * POST /api/recruits/[id]/progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { progressEventInputSchema } from '@countcard/core/validation/lifecycleSchemas';
import { addRecruitProgressEventAdmin } from '@/lib/lifecycle/recruitProgressAdmin';
import { canEditRecruitProgress } from '@/lib/lifecycle/permissions';
import { adminDb } from '@/lib/firebase/admin';
import type { RecruitProfile } from '@/types/models';
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

    const { id: recruitId } = await params;
    const recruitSnap = await adminDb.collection('recruits').doc(recruitId).get();
    if (!recruitSnap.exists) {
      return NextResponse.json({ error: 'Recruit not found' }, { status: 404 });
    }
    const recruit = recruitSnap.data() as RecruitProfile;
    if (!canEditRecruitProgress(token, recruit)) {
      return NextResponse.json({ error: 'Forbidden — training custody edit access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = progressEventInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const eventDocId = await addRecruitProgressEventAdmin(recruitId, {
      ...parsed.data,
      recordedBy: token.uid,
    });

    return NextResponse.json({ success: true, eventDocId });
  } catch (error) {
    logError(error as Error, 'API.recruits.progress');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add progress event' },
      { status: 500 }
    );
  }
}
