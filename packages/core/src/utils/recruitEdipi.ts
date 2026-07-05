/**
 * EDIPI helpers for recruit profiles and imports.
 */

export function normalizeEdipiDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Firestore document id derived from EDIPI (stable across imports). */
export function deriveRecruitDocumentId(edipiRaw: string, rowNumber?: number): string {
  const digits = normalizeEdipiDigits(edipiRaw);
  if (digits.length >= 4) {
    return `edipi-${digits}`;
  }
  if (rowNumber !== undefined) {
    return `import-row-${rowNumber}`;
  }
  return `import-row-${Date.now()}`;
}

/** User-facing EDIPI label from stored profile fields. */
export function formatEdipiForDisplay(recruit: { edipi?: string; recruitId?: string }): string {
  if (recruit.edipi?.trim()) {
    return recruit.edipi.trim();
  }
  const id = recruit.recruitId ?? '';
  if (id.startsWith('edipi-')) {
    return id.slice(5);
  }
  return id;
}

/** @deprecated Use deriveRecruitDocumentId */
export const deriveRecruitIdFromEdipi = deriveRecruitDocumentId;
