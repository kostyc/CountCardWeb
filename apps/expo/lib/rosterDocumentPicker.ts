/**
 * Pick roster spreadsheet or PDF files on mobile.
 */

import * as DocumentPicker from 'expo-document-picker';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroenabled.12',
  'text/csv',
  'application/csv',
  'com.microsoft.excel.xls',
  'org.openxmlformats.spreadsheetml.sheet',
] as const;

export interface PickedRosterDocument {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export type PickRosterDocumentResult =
  | { ok: true; document: PickedRosterDocument }
  | { ok: false; error?: string; cancelled?: boolean };

function extensionFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function normalizeMimeType(name: string, mimeType?: string | null): string {
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType;

  const ext = extensionFromName(name);
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (ext === 'xls') return 'application/vnd.ms-excel';
  if (ext === 'xlsm') return 'application/vnd.ms-excel.sheet.macroenabled.12';
  if (ext === 'csv') return 'text/csv';
  return mimeType ?? 'application/octet-stream';
}

export async function pickRosterDocumentFile(): Promise<PickRosterDocumentResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...DOCUMENT_MIME_TYPES],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) {
    return { ok: false, cancelled: true };
  }

  const asset = result.assets[0];
  const size = asset.size ?? 0;
  if (size > MAX_FILE_BYTES) {
    return { ok: false, error: 'File exceeds 5 MB limit.' };
  }

  const name = asset.name ?? 'roster';
  const ext = extensionFromName(name);
  if (!['pdf', 'xlsx', 'xls', 'xlsm', 'csv'].includes(ext)) {
    return { ok: false, error: 'Choose an Excel (.xlsx, .xls, .csv) or PDF roster file.' };
  }

  return {
    ok: true,
    document: {
      uri: asset.uri,
      name,
      mimeType: normalizeMimeType(name, asset.mimeType),
      size,
    },
  };
}
