/**
 * POST /api/recruits/[id]/comments — append-only comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/permissions/server';
import { recruitCommentInputSchema } from '@countcard/core/validation/lifecycleSchemas';
import { addRecruitCommentAdmin } from '@/lib/lifecycle/recruitProgressAdmin';
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
    const parsed = recruitCommentInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const commentDocId = await addRecruitCommentAdmin(recruitId, {
      authorId: token.uid,
      authorRole: token.role,
      body: parsed.data.body,
      category: parsed.data.category,
    });

    return NextResponse.json({ success: true, commentDocId });
  } catch (error) {
    logError(error as Error, 'API.recruits.comments');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add comment' },
      { status: 500 }
    );
  }
}
