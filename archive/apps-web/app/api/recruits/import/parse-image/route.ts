/**
 * API Route: Parse recruit roster from a document photo
 *
 * POST /api/recruits/import/parse-image
 * multipart/form-data: file (image), orgDefaults (JSON string), defaultRank (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  parseRecruitImportSheet,
  type RecruitImportOrgDefaults,
} from '@countcard/core/import/recruitExcelImport';
import {
  delimitedTextToSheetRows,
  extractPlatoonFromText,
  normalizeRecruitImportSheetRows,
} from '@countcard/core/import/recruitTextTable';
import { verifyAuthToken, isAdmin } from '@/lib/permissions/server';
import { hasPermission } from '@countcard/core/permissions/roles';
import { extractRecruitTableFromDocumentImage } from '@/lib/import/documentVision';
import { ALLOWED_IMAGE_MIMES } from '@/lib/storage/imageValidation';
import { logError } from '@/lib/utils/logger';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
      return NextResponse.json({ error: 'Missing image file' }, { status: 400 });
    }

    const mimeType = file.type === 'image/jpg' ? 'image/jpeg' : file.type;
    if (!ALLOWED_IMAGE_MIMES.includes(mimeType as (typeof ALLOWED_IMAGE_MIMES)[number])) {
      return NextResponse.json(
        { error: 'Supported image formats: JPG, PNG, or WebP' },
        { status: 400 }
      );
    }

    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image must be between 1 byte and 5 MB' }, { status: 400 });
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
    const buffer = await file.arrayBuffer();

    const { text, provider } = await extractRecruitTableFromDocumentImage(buffer, mimeType);
    const platoonHint = extractPlatoonFromText(text);
    const mergedDefaults: RecruitImportOrgDefaults = {
      ...orgDefaults,
      platoon: orgDefaults.platoon ?? platoonHint,
    };

    const sheetRows = normalizeRecruitImportSheetRows(delimitedTextToSheetRows(text));
    const result = parseRecruitImportSheet(sheetRows, mergedDefaults, { defaultRank });

    if (result.rows.length === 0 && result.errors.length === 0) {
      return NextResponse.json(
        {
          ...result,
          provider,
          platoonHint,
          error: 'Could not detect a recruit roster table in the image. Try a clearer photo or use .xlsx/.pdf.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      ...result,
      provider,
      platoonHint,
      fileKind: 'image' as const,
    });
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'API.recruits.import.parse-image');
    const message =
      err instanceof Error && err.message.includes('not configured')
        ? 'Document photo import is not configured on this server'
        : 'Failed to parse roster image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
