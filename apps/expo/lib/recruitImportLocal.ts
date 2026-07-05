/**
 * Expo-native recruit import: parse spreadsheets and commit via Firestore (no HTTP API).
 * Matches Sprint 26 workaround when Cloud Run returns 403.
 */

import * as XLSX from 'xlsx';
import {
  parseRecruitImportSheet,
  type ParsedRecruitImportRow,
  type RecruitImportOrgDefaults,
  type RecruitImportParseResult,
} from '@countcard/core/import/recruitExcelImport';
import {
  extractPlatoonFromText,
  findRecruitImportHeaderRowIndex,
  normalizeRecruitImportSheetRows,
} from '@countcard/core/import/recruitTextTable';
import { canCreateRecruit } from '@countcard/core/permissions/recruits';
import { isAdminRole } from '@countcard/core/permissions/roles';
import type { AppUser, OrganizationalAssignment } from '@countcard/core/types/auth';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import {
  isImportRowReadyForCommit,
  normalizeImportRowForCommit,
  normalizePlatoonNumber,
  refreshImportRowIdentity,
} from '@countcard/core/import/recruitExcelImport';
import { createRecruitProfile, getRecruitProfileById } from '@countcard/firebase/services/recruits';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export interface ImportCommitSummary {
  created: number;
  skipped: number;
  failed: number;
  total: number;
}

export interface ImportCommitResult {
  dryRun: boolean;
  summary: ImportCommitSummary;
  results: Array<{
    rowNumber: number;
    recruitId: string;
    status: 'created' | 'skipped' | 'error';
    message?: string;
  }>;
}

function extensionFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function extractPlatoonHintFromSheetRows(rows: unknown[][]): string | undefined {
  if (!rows.length) return undefined;
  const headerIndex = findRecruitImportHeaderRowIndex(rows);
  if (headerIndex <= 0) return undefined;

  const preambleText = rows
    .slice(0, headerIndex)
    .flatMap((row) => (Array.isArray(row) ? row : []).map((cell) => String(cell ?? '').trim()))
    .filter(Boolean)
    .join(' ');

  return extractPlatoonFromText(preambleText);
}

function parseWorkbookBuffer(
  buffer: ArrayBuffer,
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank }
): RecruitImportParseResult & { platoonHint?: string } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Workbook has no sheets' }],
      skippedEmptyRows: 0,
    };
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  }) as unknown[][];

  const platoonHint = extractPlatoonHintFromSheetRows(rawRows);
  const sheetRows = normalizeRecruitImportSheetRows(rawRows);
  const mergedDefaults: RecruitImportOrgDefaults = {
    ...orgDefaults,
    platoon: orgDefaults.platoon ?? platoonHint,
  };

  const result = parseRecruitImportSheet(sheetRows, mergedDefaults, options);
  return { ...result, platoonHint };
}

export async function parseRosterSpreadsheetFromUri(
  uri: string,
  fileName: string,
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank; size?: number }
): Promise<RecruitImportParseResult & { platoonHint?: string }> {
  const ext = extensionFromName(fileName);
  if (!['xlsx', 'xls', 'xlsm', 'csv'].includes(ext)) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Choose an Excel (.xlsx, .xls, .csv) roster file.' }],
      skippedEmptyRows: 0,
    };
  }

  if (options?.size && options.size > MAX_FILE_BYTES) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'File exceeds 5 MB limit' }],
      skippedEmptyRows: 0,
    };
  }

  const response = await fetch(uri);
  if (!response.ok) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Could not read the selected file.' }],
      skippedEmptyRows: 0,
    };
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_FILE_BYTES) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'File exceeds 5 MB limit' }],
      skippedEmptyRows: 0,
    };
  }

  return parseWorkbookBuffer(buffer, orgDefaults, options);
}

function toOrganizationalAssignment(row: ParsedRecruitImportRow): OrganizationalAssignment {
  return {
    regiment: row.regiment,
    battalion: row.battalion as Battalion | undefined,
    company: row.company as Company | undefined,
    series: row.series as Series | undefined,
    platoon: row.platoon,
  };
}

export async function commitRecruitImportLocal(
  rows: ParsedRecruitImportRow[],
  dryRun: boolean,
  userId: string,
  appUser: AppUser | null
): Promise<ImportCommitResult> {
  const incomplete = rows.filter((row) => !isImportRowReadyForCommit(row));
  if (incomplete.length > 0) {
    throw new Error(`Fill in missing fields for ${incomplete.length} recruit(s) before importing.`);
  }

  const normalizedRows = rows.map(normalizeImportRowForCommit);
  const role = appUser?.customClaims?.role || appUser?.profile?.role;
  const userIsAdmin = role ? isAdminRole(role) : false;
  const results: ImportCommitResult['results'] = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of normalizedRows) {
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
    }

    const existing = await getRecruitProfileById(row.recruitId);
    if (existing) {
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

    try {
      await createRecruitProfile(
        row.recruitId,
        {
          recruitId: row.recruitId,
          edipi: row.edipi || undefined,
          weaponsSerialNumber: row.weaponsSerialNumber,
          rcoSerialNumber: row.rcoSerialNumber,
          firstName: row.firstName,
          lastName: row.lastName,
          rank: row.rank ?? DEFAULT_RECRUIT_RANK,
          status: row.status,
          regiment: row.regiment,
          battalion: row.battalion,
          company: row.company,
          series: row.series,
          platoon: row.platoon,
          medicalNotes: row.medicalNotes,
          extendedNotes: row.extendedNotes,
          createdBy: userId,
        },
        userId
      );
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

  return {
    dryRun,
      summary: { created, skipped, failed, total: normalizedRows.length },
    results,
  };
}
