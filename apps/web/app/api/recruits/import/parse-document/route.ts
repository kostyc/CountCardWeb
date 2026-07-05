/**
 * API Route: Parse recruit roster from Excel or PDF upload
 *
 * POST /api/recruits/import/parse-document
 * multipart/form-data: file (.xlsx, .xls, .csv, .pdf), orgDefaults (JSON string), defaultRank (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { RecruitImportOrgDefaults } from '@countcard/core/import/recruitExcelImport';
import { verifyAuthToken, isAdmin } from '@/lib/permissions/server';
import { hasPermission } from '@countcard/core/permissions/roles';
import {
  detectRecruitImportFileKind,
  isRecruitImportDocumentKind,
  readRecruitImportFile,
} from '@/lib/import/recruitImportFile';
import { logError } from '@/lib/utils/logger';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const orgDefaultsSchema = z.object({
  regiment: z.string().optional(),
  battalion: z.string().optional(),
  company: z.string().optional(),
  series: z.string().optional(),
  platoon: z.string().optional(),
});

function userCanImportRecruits(token: NonNullable<Awaited<ReturnType<typeof verifyAuthToken>>>): boolean {
  if (token.role && hasPermission(token.role, 'edit_own_platoon')) return true;
  if (token.role && hasPermission(token.role, 'edit_series')) return true;
  if (token.role && hasPermission(token.role, 'edit_company')) return true;
  if (token.role && hasPermission(token.role, 'edit_battalion')) return true;
  return false;
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

    const userIsAdmin = await isAdmin(token.uid);
    if (!userIsAdmin && !userCanImportRecruits(token)) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing roster file' }, { status: 400 });
    }

    const fileKind = detectRecruitImportFileKind(file.name, file.type);
    if (!isRecruitImportDocumentKind(fileKind)) {
      return NextResponse.json(
        { error: 'Supported formats: Excel (.xlsx, .xls, .csv) or PDF' },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File must be between 1 byte and 5 MB' }, { status: 400 });
    }

    const orgDefaultsRaw = formData.get('orgDefaults');
    let orgDefaults: RecruitImportOrgDefaults = {};
    if (typeof orgDefaultsRaw === 'string' && orgDefaultsRaw.trim()) {
      const parsedOrg = orgDefaultsSchema.safeParse(JSON.parse(orgDefaultsRaw));
      if (!parsedOrg.success) {
        return NextResponse.json({ error: 'Invalid orgDefaults payload' }, { status: 400 });
      }
      orgDefaults = parsedOrg.data;
    }

    const defaultRank = (formData.get('defaultRank') as RecruitRank | null) ?? DEFAULT_RECRUIT_RANK;
    const result = await readRecruitImportFile(file, orgDefaults, { defaultRank });

    if (result.rows.length === 0 && result.errors.length > 0) {
      return NextResponse.json(
        {
          ...result,
          fileKind,
          platoonHint: result.platoonHint,
          error: result.errors[0]?.message ?? 'Could not parse roster file',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ...result,
      fileKind,
    });
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'API.recruits.import.parse-document');
    return NextResponse.json({ error: 'Failed to parse roster file' }, { status: 500 });
  }
}
