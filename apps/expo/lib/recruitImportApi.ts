import { authenticatedFetch, getApiBaseUrl } from '@countcard/api-client';
import {
  mergeRecruitImportParseResults,
  type ParsedRecruitImportRow,
  type RecruitImportDuplicateWarning,
  type RecruitImportOrgDefaults,
  type RecruitImportParseResult,
} from '@countcard/core/import/recruitExcelImport';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import type { AppUser } from '@countcard/core/types/auth';
import type { PickedImage } from '@/lib/imageValidation';
import type { PickedRosterDocument } from '@/lib/rosterDocumentPicker';
import { commitRecruitImportLocal, parseRosterSpreadsheetFromUri, type ImportCommitResult } from '@/lib/recruitImportLocal';

export interface RosterPageParseResult extends RecruitImportParseResult {
  provider?: string;
  platoonHint?: string;
}

export type { ImportCommitResult, ImportCommitSummary } from '@/lib/recruitImportLocal';

function extensionFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function isSpreadsheetFileName(name: string): boolean {
  return ['xlsx', 'xls', 'xlsm', 'csv'].includes(extensionFromName(name));
}

function requireApiBaseUrl(): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      'Photo and PDF import require EXPO_PUBLIC_API_BASE_URL in .env.local. Excel import works without the API.'
    );
  }
  return baseUrl;
}

/** Parse Excel/CSV on-device; PDF still uses the HTTP API when available. */
export async function parseRosterDocumentFile(
  document: PickedRosterDocument,
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank }
): Promise<RosterPageParseResult & { fileKind?: string }> {
  if (isSpreadsheetFileName(document.name)) {
    const result = await parseRosterSpreadsheetFromUri(document.uri, document.name, orgDefaults, {
      defaultRank: options?.defaultRank,
      size: document.size,
    });
    return {
      ...result,
      fileKind: extensionFromName(document.name),
    };
  }

  requireApiBaseUrl();

  const formData = new FormData();
  formData.append(
    'file',
    {
      uri: document.uri,
      type: document.mimeType,
      name: document.name,
    } as unknown as Blob
  );
  formData.append('orgDefaults', JSON.stringify(orgDefaults));
  if (options?.defaultRank) {
    formData.append('defaultRank', options.defaultRank);
  }

  const response = await authenticatedFetch('/api/recruits/import/parse-document', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as RosterPageParseResult & { fileKind?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to parse roster file');
  }

  return data;
}

/** @deprecated Use parseRosterDocumentFile */
export const parseRosterDocumentViaApi = parseRosterDocumentFile;

export async function parseRosterImageViaApi(
  image: PickedImage,
  orgDefaults: RecruitImportOrgDefaults,
  options?: { defaultRank?: RecruitRank; fileName?: string }
): Promise<RosterPageParseResult> {
  requireApiBaseUrl();

  const formData = new FormData();
  formData.append(
    'file',
    {
      uri: image.uri,
      type: image.mimeType,
      name: options?.fileName ?? `roster-page.${image.mimeType === 'image/png' ? 'png' : 'jpg'}`,
    } as unknown as Blob
  );
  formData.append('orgDefaults', JSON.stringify(orgDefaults));
  if (options?.defaultRank) {
    formData.append('defaultRank', options.defaultRank);
  }

  const response = await authenticatedFetch('/api/recruits/import/parse-image', {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as RosterPageParseResult & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to parse roster photo');
  }

  return data;
}

export function mergeParsedRosterPages(
  pageResults: RosterPageParseResult[]
): RecruitImportParseResult & { duplicateWarnings: RecruitImportDuplicateWarning[] } {
  return mergeRecruitImportParseResults(pageResults);
}

/** Commit parsed rows via Firestore (no HTTP API required). */
export async function commitRecruitImport(
  rows: ParsedRecruitImportRow[],
  dryRun: boolean,
  userId: string,
  appUser: AppUser | null,
  options?: { receivingMode?: boolean }
): Promise<ImportCommitResult> {
  return commitRecruitImportLocal(rows, dryRun, userId, appUser, options);
}
