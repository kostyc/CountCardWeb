/**
 * Buffer-based recruit roster file parsing for Cloud Functions.
 */

import * as XLSX from 'xlsx';
import {
  parseRecruitImportSheet,
  type RecruitImportOrgDefaults,
  type RecruitImportParseResult,
} from '@countcard/core/import/recruitExcelImport';
import {
  extractPlatoonFromText,
  findRecruitImportHeaderRowIndex,
  normalizeRecruitImportSheetRows,
} from '@countcard/core/import/recruitTextTable';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';
import { extractSheetRowsFromPdf } from './recruitPdf';

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

export type RecruitImportSpreadsheetKind = 'xlsx' | 'xls' | 'csv' | 'xlsm';
export type RecruitImportFileKind = RecruitImportSpreadsheetKind | 'pdf' | 'image';

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

const SPREADSHEET_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroenabled.12',
  'text/csv',
  'application/csv',
]);

export function isRecruitImportSpreadsheetKind(
  kind: RecruitImportFileKind | null | undefined
): kind is RecruitImportSpreadsheetKind {
  return kind === 'xlsx' || kind === 'xls' || kind === 'csv' || kind === 'xlsm';
}

export function isRecruitImportDocumentKind(
  kind: RecruitImportFileKind | null | undefined
): kind is RecruitImportSpreadsheetKind | 'pdf' {
  return isRecruitImportSpreadsheetKind(kind) || kind === 'pdf';
}

function spreadsheetKindFromExtension(fileName: string): RecruitImportSpreadsheetKind | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.xlsx')) return 'xlsx';
  if (lower.endsWith('.xls')) return 'xls';
  if (lower.endsWith('.csv')) return 'csv';
  if (lower.endsWith('.xlsm')) return 'xlsm';
  return null;
}

export function detectRecruitImportFileKind(fileName: string, mimeType?: string): RecruitImportFileKind | null {
  const extensionKind = spreadsheetKindFromExtension(fileName);
  if (extensionKind) return extensionKind;

  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext))) return 'image';
  if (mimeType?.startsWith('image/')) return 'image';

  const normalizedMime = mimeType?.toLowerCase();
  if (normalizedMime === 'application/pdf') return 'pdf';
  if (normalizedMime && SPREADSHEET_MIME_TYPES.has(normalizedMime)) {
    return 'xlsx';
  }

  return null;
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

export function readRecruitImportWorkbook(
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

export async function readRecruitImportPdf(
  buffer: ArrayBuffer,
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank }
): Promise<RecruitImportParseResult & { platoonHint?: string }> {
  const { sheetRows, platoonHint } = await extractSheetRowsFromPdf(buffer);
  const mergedDefaults: RecruitImportOrgDefaults = {
    ...orgDefaults,
    platoon: orgDefaults.platoon ?? platoonHint,
  };
  const result = parseRecruitImportSheet(sheetRows, mergedDefaults, options);

  if (result.rows.length === 0 && result.errors.length === 0) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 0,
          message:
            'Could not detect a recruit roster table in the PDF. Ensure columns match the standard format (Recruit Name, EDIPI / SSN, MOS Prog, etc.).',
        },
      ],
      skippedEmptyRows: 0,
      platoonHint,
    };
  }

  return { ...result, platoonHint };
}

export async function readRecruitImportBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  mimeType: string | undefined,
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank }
): Promise<RecruitImportParseResult & { fileKind?: RecruitImportFileKind; platoonHint?: string }> {
  const fileKind = detectRecruitImportFileKind(fileName, mimeType);
  if (!fileKind || !isRecruitImportDocumentKind(fileKind)) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Supported formats: Excel (.xlsx, .xls, .csv) or PDF' }],
      skippedEmptyRows: 0,
    };
  }

  if (buffer.byteLength > MAX_IMPORT_FILE_BYTES) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'File exceeds 5 MB limit' }],
      skippedEmptyRows: 0,
    };
  }

  if (isRecruitImportSpreadsheetKind(fileKind)) {
    const result = readRecruitImportWorkbook(buffer, orgDefaults, options);
    return { ...result, fileKind };
  }

  const pdfResult = await readRecruitImportPdf(buffer, orgDefaults, options);
  return { ...pdfResult, fileKind };
}

export { extractPlatoonFromText, DEFAULT_RECRUIT_RANK };
