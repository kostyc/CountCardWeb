/**
 * Read recruit roster files (.xlsx, .xls, .csv, .pdf) into row arrays for @countcard/core parsing.
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
import { extractSheetRowsFromPdf } from './recruitPdf';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const RECRUIT_IMPORT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const RECRUIT_IMPORT_DOCUMENT_ACCEPT =
  '.xlsx,.xls,.xlsm,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.ms-excel.sheet.macroenabled.12,text/csv,application/csv,application/pdf';
export const RECRUIT_IMPORT_SUPPORTED_FORMATS_LABEL =
  'camera, JPG/PNG/WebP photos, Excel (.xlsx, .xls, .csv), or PDF';

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

export async function readRecruitImportFile(
  file: File,
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank }
): Promise<RecruitImportParseResult & { fileKind?: RecruitImportFileKind; platoonHint?: string }> {
  const fileKind = detectRecruitImportFileKind(file.name, file.type);
  if (!fileKind) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 0,
          message: 'Supported formats: .xlsx, .xls, .csv, .pdf, or image (JPG, PNG, WebP)',
        },
      ],
      skippedEmptyRows: 0,
    };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'File exceeds 5 MB limit' }],
      skippedEmptyRows: 0,
    };
  }

  if (fileKind === 'image') {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Use readRecruitImportImageViaApi for roster photos' }],
      skippedEmptyRows: 0,
      fileKind,
    };
  }

  const buffer = await file.arrayBuffer();

  if (isRecruitImportSpreadsheetKind(fileKind)) {
    const result = readRecruitImportWorkbook(buffer, orgDefaults, options);
    return { ...result, fileKind };
  }

  const pdfResult = await readRecruitImportPdf(buffer, orgDefaults, options);
  return { ...pdfResult, fileKind };
}

export async function readRecruitImportImageViaApi(
  file: File,
  orgDefaults: RecruitImportOrgDefaults,
  options: { defaultRank?: RecruitRank; idToken: string }
): Promise<
  RecruitImportParseResult & { fileKind: 'image'; platoonHint?: string; provider?: string }
> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'Image exceeds 5 MB limit' }],
      skippedEmptyRows: 0,
      fileKind: 'image',
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('orgDefaults', JSON.stringify(orgDefaults));
  if (options.defaultRank) {
    formData.append('defaultRank', options.defaultRank);
  }

  const response = await fetch('/api/recruits/import/parse-image', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.idToken}` },
    body: formData,
  });

  const data = (await response.json()) as RecruitImportParseResult & {
    platoonHint?: string;
    provider?: string;
    error?: string;
  };

  if (!response.ok) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: data.error ?? 'Failed to parse roster photo' }],
      skippedEmptyRows: 0,
      fileKind: 'image',
    };
  }

  return {
    rows: data.rows,
    errors: data.errors,
    skippedEmptyRows: data.skippedEmptyRows,
    platoonHint: data.platoonHint,
    provider: data.provider,
    fileKind: 'image',
  };
}

export async function readRecruitImportDocumentViaApi(
  file: File,
  orgDefaults: RecruitImportOrgDefaults,
  options: { defaultRank?: RecruitRank; idToken: string }
): Promise<
  RecruitImportParseResult & {
    fileKind?: RecruitImportSpreadsheetKind | 'pdf';
    platoonHint?: string;
  }
> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: 'File exceeds 5 MB limit' }],
      skippedEmptyRows: 0,
    };
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('orgDefaults', JSON.stringify(orgDefaults));
  if (options.defaultRank) {
    formData.append('defaultRank', options.defaultRank);
  }

  const response = await fetch('/api/recruits/import/parse-document', {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.idToken}` },
    body: formData,
  });

  const data = (await response.json()) as RecruitImportParseResult & {
    fileKind?: RecruitImportSpreadsheetKind | 'pdf';
    platoonHint?: string;
    error?: string;
  };

  if (!response.ok) {
    return {
      rows: [],
      errors: [{ rowNumber: 0, message: data.error ?? 'Failed to parse roster file' }],
      skippedEmptyRows: 0,
    };
  }

  return {
    rows: data.rows,
    errors: data.errors,
    skippedEmptyRows: data.skippedEmptyRows,
    platoonHint: data.platoonHint,
    fileKind: data.fileKind,
  };
}

/** @deprecated Use readRecruitImportFile — kept for existing imports */
export { readRecruitImportFile as readRecruitImportExcelFile };

// Re-export platoon hint helper for tests
export { extractPlatoonFromText };
