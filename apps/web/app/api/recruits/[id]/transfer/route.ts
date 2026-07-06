/**
 * API Route: Transfer recruit to a new organizational assignment
 *
 * POST /api/recruits/[id]/transfer
 * Writes recruit updates and admin audit log via Admin SDK (bypasses client adminLogs rules).
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import {
  verifyAuthToken,
  isAdmin,
  verifyOrganizationAccess,
} from '@/lib/permissions/server';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import { isStatusTransitionAllowed } from '@countcard/core/constants/recruitStatus';
import { logError, logInfo } from '@/lib/utils/logger';
import type { AppUser, OrganizationalAssignment } from '@/types/auth';
import type { RecruitProfile } from '@/types/models';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';

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

function toOrganizationalAssignment(body: z.infer<typeof transferRequestSchema>): OrganizationalAssignment {
  return {
    regiment: body.regiment as OrganizationalAssignment['regiment'],
    battalion: body.battalion as Battalion | undefined,
    company: body.company as Company | undefined,
    series: body.series as Series | undefined,
    platoon: body.platoon,
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    const { id: recruitId } = await params;
    if (!recruitId) {
      return NextResponse.json({ error: 'Recruit ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = transferRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid transfer payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const toAssignment = toOrganizationalAssignment(parsed.data);
    const userId = token.uid;
    const appUser = buildAppUser(token);

    const recruitRef = adminDb.collection('recruits').doc(recruitId);
    const recruitSnap = await recruitRef.get();
    if (!recruitSnap.exists) {
      return NextResponse.json({ error: 'Recruit not found' }, { status: 404 });
    }

    const currentRecruit = recruitSnap.data() as RecruitProfile;

    if (
      currentRecruit.custodyPhase &&
      currentRecruit.custodyPhase !== 'training'
    ) {
      return NextResponse.json(
        {
          error:
            'Recruit is not in training custody. Use transfer batch workflow for Receiving pickup.',
        },
        { status: 400 }
      );
    }

    const editCheck = canEditRecruit(appUser, currentRecruit);
    if (!editCheck.allowed) {
      return NextResponse.json(
        { error: editCheck.reason ?? 'Forbidden - cannot transfer this recruit' },
        { status: 403 }
      );
    }

    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin && !verifyOrganizationAccess(token, toAssignment)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions for target assignment' },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: 'New assignment must differ from the current assignment' },
        { status: 400 }
      );
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
        return NextResponse.json(
          { error: `Cannot transfer recruit with status "${currentRecruit.status}".` },
          { status: 400 }
        );
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
    } catch (logErr) {
      logError(logErr as Error, 'API.recruits.transfer.createAdminLog');
    }

    logInfo('Recruit transferred via API', 'API.recruits.transfer', { recruitId });

    return NextResponse.json({ success: true, recruitId });
  } catch (error) {
    logError(error as Error, 'API.recruits.transfer');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to transfer recruit' },
      { status: 500 }
    );
  }
}
