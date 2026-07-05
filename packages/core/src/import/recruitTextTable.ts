/**
 * Convert delimited plain text (from PDF extraction, CSV paste, etc.) into sheet rows
 * for parseRecruitImportSheet.
 */

import { RECRUIT_IMPORT_COLUMN_ALIASES, type RecruitImportColumnKey } from './recruitExcelImport';

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function lineLooksLikeHeader(cells: string[]): boolean {
  const joined = cells.map(normalizeHeader).join(' ');
  if (joined.includes('recruit name')) return true;
  if (joined.includes('name') && (joined.includes('edipi') || joined.includes('ssn'))) return true;
  if (joined.includes('mos') && joined.includes('gt')) return true;
  return false;
}

function splitDelimitedLine(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  if (trimmed.includes('\t')) {
    return trimmed.split('\t').map((cell) => cell.trim());
  }

  if (trimmed.includes('|')) {
    return trimmed.split('|').map((cell) => cell.trim());
  }

  return trimmed.split(/\s{2,}/).map((cell) => cell.trim()).filter(Boolean);
}

/** Find the row index most likely to be the column header row. */
export function findRecruitImportHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < rows.length; i += 1) {
    const cells = (rows[i] ?? []).map((cell) => String(cell ?? '').trim()).filter(Boolean);
    if (cells.length >= 3 && lineLooksLikeHeader(cells)) {
      return i;
    }
  }
  return 0;
}

/** Split raw text into a 2D grid using tabs, pipes, or wide spaces. */
export function delimitedTextToSheetRows(text: string): unknown[][] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => splitDelimitedLine(line));
}

/**
 * Trim preamble lines (titles, platoon headers) before the column header row.
 */
export function normalizeRecruitImportSheetRows(rows: unknown[][]): unknown[][] {
  if (!rows.length) return rows;
  const headerIndex = findRecruitImportHeaderRowIndex(rows);
  return rows.slice(headerIndex);
}

/**
 * Parse platoon number from document title lines, e.g. "Platoon 2001" or "PLT 2001".
 */
export function extractPlatoonFromText(text: string): string | undefined {
  const match = text.match(/\b(?:platoon|plt\.?)\s*[#:]?\s*(\d{3,4})\b/i);
  if (!match?.[1]) return undefined;
  const digits = match[1].replace(/\D/g, '');
  return digits.length === 4 ? digits : digits.padStart(4, '0');
}

/** Known header labels for PDF position-based column alignment. */
export function getRecruitImportHeaderLabels(): string[] {
  const labels = new Set<string>();
  for (const aliases of Object.values(RECRUIT_IMPORT_COLUMN_ALIASES)) {
    for (const alias of aliases) {
      labels.add(alias);
    }
  }
  labels.add('recruit name');
  labels.add('edipi / ssn');
  labels.add('medical / admin flags');
  return [...labels];
}

export type RecruitImportColumnKeyAlias = RecruitImportColumnKey;
