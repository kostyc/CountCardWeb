/**
 * API Route: Recruit bulk import from parsed Excel rows
 *
 * POST /api/recruits/import
 * Body: { rows: RecruitImportCommitRow[], dryRun?: boolean }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import {
  verifyAuthToken,
  isAdmin,
  verifyOrganizationAccess,
} from '@/lib/permissions/server';
import { canCreateRecruit } from '@countcard/core/permissions/recruits';
import { recruitImportCommitRequestSchema } from '@countcard/core/import/recruitExcelImport';
import { logError, logInfo } from '@/lib/utils/logger';
import type { OrganizationalAssignment, AppUser } from '@/types/auth';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';
import { Timestamp } from 'firebase-admin/firestore';

interface ImportRowResult {
  rowNumber: number;
  recruitId: string;
  status: 'created' | 'skipped' | 'error';
  message?: string;
}

function toOrganizationalAssignment(row: {
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon: string;
}): OrganizationalAssignment {
  return {
    regiment: row.regiment as OrganizationalAssignment['regiment'],
    battalion: row.battalion as Battalion | undefined,
    company: row.company as Company | undefined,
    series: row.series as Series | undefined,
    platoon: row.platoon,
  };
}

function buildAppUserFromToken(token: Awaited<ReturnType<typeof verifyAuthToken>>): AppUser | null {
  if (!token) return null;
  return {
    uid: token.uid,
    customClaims: {
      role: token.role,
      organizationalAssignment: token.organizationalAssignment,
    },
  } as AppUser;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = recruitImportCommitRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid import payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { rows, dryRun = false } = parsed.data;
    const userId = token.uid;
    const appUser = buildAppUserFromToken(token);
    const userIsAdmin = await isAdmin(userId);
    const results: ImportRowResult[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
      const targetOrg = toOrganizationalAssignment(row);

      if (!userIsAdmin) {
        const permission = canCreateRecruit(appUser, targetOrg);
        if (!permission.allowed) {
          failed += 1;
          results.push({
            rowNumber: row.rowNumber,
            recruitId: row.recruitId,
            status: 'error',
            message: permission.reason ?? 'Insufficient permissions for this platoon',
          });
          continue;
        }

        if (!verifyOrganizationAccess(token, targetOrg)) {
          failed += 1;
          results.push({
            rowNumber: row.rowNumber,
            recruitId: row.recruitId,
            status: 'error',
            message: 'Organizational scope does not allow import for this platoon',
          });
          continue;
        }
      }

      const existing = await adminDb.collection('recruits').doc(row.recruitId).get();
      if (existing.exists) {
        skipped += 1;
        results.push({
          rowNumber: row.rowNumber,
          recruitId: row.recruitId,
          status: 'skipped',
          message: 'Recruit already exists',
        });
        continue;
      }

      if (dryRun) {
        created += 1;
        results.push({
          rowNumber: row.rowNumber,
          recruitId: row.recruitId,
          status: 'created',
          message: 'Validated (dry run)',
        });
        continue;
      }

      const now = Timestamp.now();
      const recruitDoc = {
        recruitId: row.recruitId,
        edipi: row.edipi || undefined,
        weaponsSerialNumber: row.weaponsSerialNumber,
        rcoSerialNumber: row.rcoSerialNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        rank: row.rank,
        status: row.status,
        regiment: row.regiment,
        battalion: row.battalion,
        company: row.company,
        series: row.series,
        platoon: row.platoon,
        medicalNotes: row.medicalNotes,
        extendedNotes: row.extendedNotes,
        createdBy: userId,
        updatedBy: userId,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await adminDb.collection('recruits').doc(row.recruitId).set(recruitDoc);
        created += 1;
        results.push({
          rowNumber: row.rowNumber,
          recruitId: row.recruitId,
          status: 'created',
        });
      } catch (writeError) {
        failed += 1;
        results.push({
          rowNumber: row.rowNumber,
          recruitId: row.recruitId,
          status: 'error',
          message: writeError instanceof Error ? writeError.message : 'Failed to create recruit',
        });
      }
    }

    if (!dryRun && created > 0) {
      try {
        const logId = `import-${userId}-${Date.now()}`;
        const now = new Date();
        await adminDb.collection('adminLogs').doc(logId).set({
          logId,
          userId,
          action: 'import',
          resourceType: 'recruit',
          resourceId: logId,
          description: `Imported ${created} recruit(s) from spreadsheet`,
          metadata: {
            created,
            skipped,
            failed,
            rowCount: rows.length,
          },
          timestamp: now,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          updatedBy: userId,
        });
      } catch (logErr) {
        logError(logErr as Error, 'API.recruits.import.createAdminLog');
      }
    }

    logInfo(
      `Recruit import ${dryRun ? '(dry run) ' : ''}completed: ${created} created, ${skipped} skipped, ${failed} failed`,
      'API.recruits.import'
    );

    return NextResponse.json({
      dryRun,
      summary: { created, skipped, failed, total: rows.length },
      results,
    });
  } catch (error) {
    logError(error as Error, 'API.recruits.import');
    return NextResponse.json({ error: 'Failed to import recruits' }, { status: 500 });
  }
}
