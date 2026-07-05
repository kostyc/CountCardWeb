/**
 * Recruit roster import parsing and validation (format-agnostic row mapping).
 * Used after reading .xlsx or .pdf into plain row arrays.
 */

import { z } from 'zod';
import { recruitCreateSchema } from '../validation/recruitSchemas';
import type { RecruitRank } from '../constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '../constants/recruitRanks';
import { deriveRecruitDocumentId, normalizeEdipiDigits } from '../utils/recruitEdipi';

/** Supported spreadsheet column headers (case-insensitive match). */
export const RECRUIT_IMPORT_COLUMN_ALIASES = {
  recruitName: ['recruit name', 'name', 'recruit'],
  edipi: ['edipi / ssn', 'edipi', 'ssn', 'edipi/ssn'],
  mos: ['mos prog', 'mos', 'mos program', 'mos code'],
  platoon: ['platoon', 'platoon number', 'plt', 'platoon #', 'platoon no'],
  istPullUps: ['ist pull-ups', 'ist pull ups', 'pull-ups', 'pull ups'],
  istPlank: ['ist plank', 'plank'],
  istRun: ['ist 1.5mi', 'ist 1.5 mi', '1.5mi', '1.5 mi run', 'run'],
  gtScore: ['gt score', 'gt', 'gtscore'],
  flags: ['medical / admin flags', 'medical/admin flags', 'flags', 'notes', 'admin flags'],
  weaponsSerial: [
    'weapons serial',
    'weapon serial',
    'weapons serial number',
    'weapon serial number',
    'rifle serial',
  ],
  rcoSerial: ['rco serial', 'rco serial number', 'rco', 'optics serial'],
  firstName: ['first name', 'firstname', 'given name', 'first'],
  lastName: ['last name', 'lastname', 'surname', 'last'],
} as const;

export type RecruitImportColumnKey = keyof typeof RECRUIT_IMPORT_COLUMN_ALIASES;

export interface RecruitImportOrgDefaults {
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  /** Used when spreadsheet row has no platoon column/value. */
  platoon?: string;
}

export type RecruitImportMissingField = 'firstName' | 'lastName' | 'platoon';

export const RECRUIT_IMPORT_MISSING_FIELD_LABELS: Record<RecruitImportMissingField, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  platoon: 'Platoon',
};

export interface ParsedRecruitImportRow {
  rowNumber: number;
  recruitId: string;
  edipi?: string;
  firstName: string;
  lastName: string;
  rank: RecruitRank;
  status: 'active';
  regiment?: string;
  battalion?: string;
  company?: string;
  series?: string;
  platoon: string;
  weaponsSerialNumber?: string;
  rcoSerialNumber?: string;
  medicalNotes?: string;
  extendedNotes?: string;
  /** Fields the user must fill before commit. */
  missingFields: RecruitImportMissingField[];
  /** Raw import metadata (non-PII summary only in logs). */
  importMeta: {
    mos?: string;
    istPullUps?: string;
    istPlank?: string;
    istRun?: string;
    gtScore?: string;
  };
}

export interface RecruitImportRowError {
  rowNumber: number;
  message: string;
}

export interface RecruitImportParseResult {
  rows: ParsedRecruitImportRow[];
  errors: RecruitImportRowError[];
  skippedEmptyRows: number;
}

export type RecruitImportDuplicateType = 'duplicate_id' | 'duplicate_name_platoon';

export interface RecruitImportDuplicateWarning {
  type: RecruitImportDuplicateType;
  rowNumber: number;
  recruitId: string;
  duplicateOfRow: number;
  message: string;
}

function namePlatoonKey(row: Pick<ParsedRecruitImportRow, 'firstName' | 'lastName' | 'platoon' | 'recruitId'>): string {
  const platoon = row.platoon.trim() || 'unknown';
  const last = row.lastName.trim().toLowerCase() || 'unknown';
  const first = row.firstName.trim().toLowerCase() || 'unknown';
  if (!row.firstName.trim() && !row.lastName.trim()) {
    return row.recruitId;
  }
  return `${last}|${first}|${platoon}`;
}

export function computeImportRowMissingFields(
  row: Pick<ParsedRecruitImportRow, 'firstName' | 'lastName' | 'platoon'>
): RecruitImportMissingField[] {
  const missing: RecruitImportMissingField[] = [];
  if (!row.firstName?.trim()) missing.push('firstName');
  if (!row.lastName?.trim()) missing.push('lastName');
  if (!/^\d{4}$/.test(row.platoon?.trim() ?? '')) missing.push('platoon');
  return missing;
}

export function withImportRowMissingFields(row: ParsedRecruitImportRow): ParsedRecruitImportRow {
  return {
    ...row,
    missingFields: computeImportRowMissingFields(row),
  };
}

export function isImportRowReadyForCommit(row: ParsedRecruitImportRow): boolean {
  return computeImportRowMissingFields(row).length === 0;
}

/** Re-derive recruitId when EDIPI is added or cleared during review. */
export function refreshImportRowIdentity(row: ParsedRecruitImportRow): ParsedRecruitImportRow {
  const edipiDigits = normalizeEdipiDigits(row.edipi ?? '');
  const recruitId =
    edipiDigits.length >= 4
      ? deriveRecruitDocumentId(row.edipi ?? '', row.rowNumber)
      : row.recruitId.startsWith('import-row-')
        ? row.recruitId
        : deriveRecruitDocumentId('', row.rowNumber);

  return withImportRowMissingFields({
    ...row,
    edipi: edipiDigits || undefined,
    recruitId,
  });
}

export function normalizeImportRowForCommit(row: ParsedRecruitImportRow): ParsedRecruitImportRow {
  const refreshed = refreshImportRowIdentity({
    ...row,
    firstName: row.firstName.trim(),
    lastName: row.lastName.trim(),
    platoon: row.platoon.trim(),
  });
  return refreshed;
}

function rowHasImportableData(values: {
  recruitName: string;
  firstName: string;
  lastName: string;
  edipiRaw: string;
  mos?: string;
  weaponsSerialRaw: string;
  rcoSerialRaw: string;
}): boolean {
  return Boolean(
    values.recruitName.trim() ||
      values.firstName.trim() ||
      values.lastName.trim() ||
      values.edipiRaw.trim() ||
      values.mos?.trim() ||
      values.weaponsSerialRaw.trim() ||
      values.rcoSerialRaw.trim()
  );
}

function resolveImportNameParts(
  cells: unknown[],
  headerMap: Map<RecruitImportColumnKey, number>
): { firstName: string; lastName: string } {
  let firstName = cellValue(cells, headerMap.get('firstName'));
  let lastName = cellValue(cells, headerMap.get('lastName'));
  const recruitName = cellValue(cells, headerMap.get('recruitName'));

  if (recruitName) {
    const parsed = parseRecruitDisplayName(recruitName);
    if (parsed) {
      firstName = firstName || parsed.firstName;
      lastName = lastName || parsed.lastName;
    } else if (!firstName && !lastName) {
      lastName = recruitName.trim();
    }
  }

  return { firstName, lastName };
}

function sheetHasImportableColumns(headerMap: Map<RecruitImportColumnKey, number>): boolean {
  if (headerMap.has('recruitName') || headerMap.has('edipi')) return true;
  if (headerMap.has('firstName') && headerMap.has('lastName')) return true;
  if (headerMap.has('lastName') || headerMap.has('firstName')) return true;
  return false;
}

/**
 * Merge multiple parse results (e.g. multi-page photos) and dedupe within the batch.
 * - Same recruitId (EDIPI): keep first row, skip later rows with a warning.
 * - Same name + platoon with different IDs: keep both rows but flag for review.
 */
export function mergeRecruitImportParseResults(
  results: RecruitImportParseResult[]
): RecruitImportParseResult & { duplicateWarnings: RecruitImportDuplicateWarning[] } {
  const duplicateWarnings: RecruitImportDuplicateWarning[] = [];
  const mergedRows: ParsedRecruitImportRow[] = [];
  const errors: RecruitImportRowError[] = [];
  let skippedEmptyRows = 0;

  const seenIds = new Map<string, number>();
  const seenNamePlatoon = new Map<string, number>();

  for (const result of results) {
    errors.push(...result.errors);
    skippedEmptyRows += result.skippedEmptyRows;

    for (const row of result.rows) {
      const existingIdRow = seenIds.get(row.recruitId);
      if (existingIdRow !== undefined) {
        duplicateWarnings.push({
          type: 'duplicate_id',
          rowNumber: row.rowNumber,
          recruitId: row.recruitId,
          duplicateOfRow: existingIdRow,
          message: `Duplicate EDIPI/ID (same as row ${existingIdRow}); skipped`,
        });
        continue;
      }

      const nameKey = namePlatoonKey(row);
      const existingNameRow = seenNamePlatoon.get(nameKey);
      if (existingNameRow !== undefined) {
        duplicateWarnings.push({
          type: 'duplicate_name_platoon',
          rowNumber: row.rowNumber,
          recruitId: row.recruitId,
          duplicateOfRow: existingNameRow,
          message: `Same name and platoon as row ${existingNameRow}; verify this is not a duplicate`,
        });
      }

      seenIds.set(row.recruitId, row.rowNumber);
      if (!seenNamePlatoon.has(nameKey)) {
        seenNamePlatoon.set(nameKey, row.rowNumber);
      }
      mergedRows.push(row);
    }
  }

  return { rows: mergedRows, errors, skippedEmptyRows, duplicateWarnings };
}

const DEFAULT_IMPORT_RANK: RecruitRank = DEFAULT_RECRUIT_RANK;

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildHeaderMap(headers: string[]): Map<RecruitImportColumnKey, number> {
  const map = new Map<RecruitImportColumnKey, number>();
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    for (const [key, aliases] of Object.entries(RECRUIT_IMPORT_COLUMN_ALIASES) as [
      RecruitImportColumnKey,
      readonly string[],
    ][]) {
      if (aliases.includes(normalized) && !map.has(key)) {
        map.set(key, index);
      }
    }
  });
  return map;
}

function cellValue(row: unknown[], index: number | undefined): string {
  if (index === undefined || index < 0 || index >= row.length) return '';
  const raw = row[index];
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}

function parseNumericCell(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Excel serial time (fraction of day) → M:SS display. */
export function formatExcelDuration(value: string | number): string | undefined {
  const numeric = typeof value === 'number' ? value : parseNumericCell(value);
  if (numeric === null) return undefined;
  const totalSeconds = Math.round(numeric * 24 * 60 * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** "LAST, First M." → { lastName, firstName } */
export function parseRecruitDisplayName(raw: string): { firstName: string; lastName: string } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const commaIndex = trimmed.indexOf(',');
  if (commaIndex >= 0) {
    const lastName = sanitizeRecruitNamePart(trimmed.slice(0, commaIndex));
    const firstName = sanitizeRecruitNamePart(trimmed.slice(commaIndex + 1));
    if (!lastName || !firstName) return null;
    return { lastName, firstName };
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const lastName = sanitizeRecruitNamePart(parts[parts.length - 1]);
  const firstName = sanitizeRecruitNamePart(parts.slice(0, -1).join(' '));
  if (!lastName || !firstName) return null;
  return { lastName, firstName };
}

function sanitizeRecruitNamePart(value: string): string {
  return value
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Derive stable recruitId from EDIPI/SSN digits; fallback uses row number. */
export function deriveRecruitIdFromEdipi(raw: string, rowNumber: number): string {
  return deriveRecruitDocumentId(raw, rowNumber);
}

export { deriveRecruitDocumentId, normalizeEdipiDigits, formatEdipiForDisplay } from '../utils/recruitEdipi';

export function normalizePlatoonNumber(raw: string, fallback?: string): string | undefined {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 4) return digits;
  if (digits.length > 0 && digits.length < 4) return digits.padStart(4, '0');
  if (fallback) {
    const fallbackDigits = fallback.replace(/\D/g, '');
    if (fallbackDigits.length === 4) return fallbackDigits;
    if (fallbackDigits.length > 0) return fallbackDigits.padStart(4, '0');
  }
  return undefined;
}

function buildExtendedNotes(parts: Array<string | undefined>): string | undefined {
  const joined = parts.filter(Boolean).join('\n');
  return joined || undefined;
}

function buildMedicalNotes(flags: string): string | undefined {
  const trimmed = flags.trim();
  if (!trimmed || /^none\.?$/i.test(trimmed)) return undefined;
  return trimmed;
}

export function parseRecruitImportSheet(
  sheetRows: unknown[][],
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank }
): RecruitImportParseResult {
  const defaultRank = options?.defaultRank ?? DEFAULT_IMPORT_RANK;
  const errors: RecruitImportRowError[] = [];
  const parsed: ParsedRecruitImportRow[] = [];
  let skippedEmptyRows = 0;

  if (!sheetRows.length) {
    return { rows: [], errors: [{ rowNumber: 0, message: 'Roster file is empty' }], skippedEmptyRows: 0 };
  }

  const [headerRow, ...dataRows] = sheetRows;
  const headers = (headerRow ?? []).map((cell) => String(cell ?? '').trim());
  const headerMap = buildHeaderMap(headers);

  if (!sheetHasImportableColumns(headerMap)) {
    return {
      rows: [],
      errors: [
        {
          rowNumber: 1,
          message:
            'Could not find name or EDIPI columns. Expected headers like Recruit Name, First Name, Last Name, or EDIPI / SSN.',
        },
      ],
      skippedEmptyRows: 0,
    };
  }

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const cells = Array.isArray(row) ? row : [];
    const edipiRaw = cellValue(cells, headerMap.get('edipi'));
    const { firstName, lastName } = resolveImportNameParts(cells, headerMap);
    const recruitName = cellValue(cells, headerMap.get('recruitName'));
    const platoonRaw = cellValue(cells, headerMap.get('platoon'));
    const mos = cellValue(cells, headerMap.get('mos')) || undefined;
    const weaponsSerialRaw = cellValue(cells, headerMap.get('weaponsSerial'));
    const rcoSerialRaw = cellValue(cells, headerMap.get('rcoSerial'));

    if (
      !rowHasImportableData({
        recruitName,
        firstName,
        lastName,
        edipiRaw,
        mos,
        weaponsSerialRaw,
        rcoSerialRaw,
      })
    ) {
      skippedEmptyRows += 1;
      return;
    }

    const platoon = normalizePlatoonNumber(platoonRaw, orgDefaults.platoon) ?? '';
    const pullUpsRaw = cellValue(cells, headerMap.get('istPullUps'));
    const plankRaw = cellValue(cells, headerMap.get('istPlank'));
    const runRaw = cellValue(cells, headerMap.get('istRun'));
    const gtScoreRaw = cellValue(cells, headerMap.get('gtScore'));
    const flags = cellValue(cells, headerMap.get('flags'));

    const pullUps = pullUpsRaw ? String(parseNumericCell(pullUpsRaw) ?? pullUpsRaw) : undefined;
    const plank = formatExcelDuration(plankRaw) ?? (plankRaw || undefined);
    const run = formatExcelDuration(runRaw) ?? (runRaw || undefined);
    const gtScore = gtScoreRaw ? String(parseNumericCell(gtScoreRaw) ?? gtScoreRaw) : undefined;

    const extendedNotes = buildExtendedNotes([
      mos ? `MOS: ${mos}` : undefined,
      pullUps ? `IST Pull-ups: ${pullUps}` : undefined,
      plank ? `IST Plank: ${plank}` : undefined,
      run ? `IST 1.5mi: ${run}` : undefined,
      gtScore ? `GT Score: ${gtScore}` : undefined,
    ]);

    const edipiDigits = normalizeEdipiDigits(edipiRaw);
    const recruitId = deriveRecruitDocumentId(edipiRaw, rowNumber);

    parsed.push(
      withImportRowMissingFields({
        rowNumber,
        recruitId,
        edipi: edipiDigits || undefined,
        firstName,
        lastName,
        rank: defaultRank,
        status: 'active',
        regiment: orgDefaults.regiment,
        battalion: orgDefaults.battalion,
        company: orgDefaults.company,
        series: orgDefaults.series,
        platoon,
        weaponsSerialNumber: weaponsSerialRaw || undefined,
        rcoSerialNumber: rcoSerialRaw || undefined,
        medicalNotes: buildMedicalNotes(flags),
        extendedNotes,
        importMeta: {
          mos,
          istPullUps: pullUps,
          istPlank: plank,
          istRun: run,
          gtScore,
        },
        missingFields: [],
      })
    );
  });

  return { rows: parsed, errors, skippedEmptyRows };
}

const optionalImportEdipiSchema = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  recruitCreateSchema.shape.edipi
);

export const recruitImportCommitRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  recruitId: recruitCreateSchema.shape.recruitId,
  edipi: optionalImportEdipiSchema,
  firstName: recruitCreateSchema.shape.firstName,
  lastName: recruitCreateSchema.shape.lastName,
  rank: recruitCreateSchema.shape.rank,
  status: recruitCreateSchema.shape.status,
  regiment: recruitCreateSchema.shape.regiment,
  battalion: recruitCreateSchema.shape.battalion,
  company: recruitCreateSchema.shape.company,
  series: recruitCreateSchema.shape.series,
  platoon: recruitCreateSchema.shape.platoon,
  weaponsSerialNumber: recruitCreateSchema.shape.weaponsSerialNumber,
  rcoSerialNumber: recruitCreateSchema.shape.rcoSerialNumber,
  medicalNotes: recruitCreateSchema.shape.medicalNotes,
  extendedNotes: recruitCreateSchema.shape.extendedNotes,
});

export const recruitImportCommitRequestSchema = z.object({
  rows: z.array(recruitImportCommitRowSchema).min(1).max(500),
  dryRun: z.boolean().optional(),
});

export type RecruitImportCommitRow = z.infer<typeof recruitImportCommitRowSchema>;
export type RecruitImportCommitRequest = z.infer<typeof recruitImportCommitRequestSchema>;
