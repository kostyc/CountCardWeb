'use client';

/**
 * Unified roster import sources: camera, photo library, spreadsheet, and PDF.
 */

import React, { useEffect, useRef } from 'react';
import type {
  ParsedRecruitImportRow,
  RecruitImportRowError,
} from '@countcard/core/import/recruitExcelImport';
import {
  RECRUIT_IMPORT_DOCUMENT_ACCEPT,
  RECRUIT_IMPORT_IMAGE_ACCEPT,
  RECRUIT_IMPORT_SUPPORTED_FORMATS_LABEL,
} from '@/lib/import/recruitImportFile';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const MAX_ROSTER_PHOTO_PAGES = 10;

export interface RosterPhotoPageParseResult {
  rows: ParsedRecruitImportRow[];
  errors: RecruitImportRowError[];
  skippedEmptyRows: number;
  provider?: string;
  platoonHint?: string;
}

export interface RosterPhotoPage {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'parsing' | 'parsed' | 'error';
  error?: string;
  parseResult?: RosterPhotoPageParseResult;
}

export interface RecruitImportPhotoCaptureProps {
  pages: RosterPhotoPage[];
  onAddImageFiles: (files: File[]) => void;
  onDocumentFile: (file: File) => void;
  onRemovePage: (id: string) => void;
  onParsePages: () => void;
  parsing: boolean;
  disabled?: boolean;
  documentFileName?: string | null;
  documentKind?: string | null;
}

const CAPTURE_TIPS = [
  'Camera or photos: lay the roster flat, include column headers, and capture one page at a time.',
  'Spreadsheet or PDF: upload .xlsx, .xls, .csv, or .pdf — parsed immediately for preview.',
  'Set default platoon above if your file does not include a Platoon column.',
];

export function RecruitImportPhotoCapture({
  pages,
  onAddImageFiles,
  onDocumentFile,
  onRemovePage,
  onParsePages,
  parsing,
  disabled = false,
  documentFileName,
  documentKind,
}: RecruitImportPhotoCaptureProps): JSX.Element {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      pages.forEach((page) => URL.revokeObjectURL(page.previewUrl));
    };
  }, [pages]);

  const atPageLimit = pages.length >= MAX_ROSTER_PHOTO_PAGES;
  const pendingCount = pages.filter((page) => page.status === 'pending' || page.status === 'error').length;

  function handleImageFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    event.target.value = '';
    if (!fileList?.length) return;
    onAddImageFiles(Array.from(fileList));
  }

  function handleDocumentFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    onDocumentFile(file);
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Add roster</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Import via {RECRUIT_IMPORT_SUPPORTED_FORMATS_LABEL}. Review the preview, then validate before committing.
        </p>
      </div>

      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {CAPTURE_TIPS.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsing || atPageLimit}
          onClick={() => cameraInputRef.current?.click()}
        >
          Take photo
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsing || atPageLimit}
          onClick={() => libraryInputRef.current?.click()}
        >
          Choose images
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsing}
          onClick={() => documentInputRef.current?.click()}
        >
          Upload Excel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || parsing}
          onClick={() => documentInputRef.current?.click()}
        >
          Upload PDF
        </Button>
      </div>

      {pages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            disabled={disabled || parsing || pendingCount === 0}
            loading={parsing}
            onClick={onParsePages}
          >
            Extract {pendingCount > 0 ? `${pendingCount} photo page${pendingCount === 1 ? '' : 's'}` : 'photo pages'}
          </Button>
        </div>
      )}

      {atPageLimit && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Maximum {MAX_ROSTER_PHOTO_PAGES} photo pages per import. Remove a page to add another.
        </p>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept={RECRUIT_IMPORT_IMAGE_ACCEPT}
        capture="environment"
        className="hidden"
        onChange={handleImageFiles}
        disabled={disabled || parsing}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept={RECRUIT_IMPORT_IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={handleImageFiles}
        disabled={disabled || parsing}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept={RECRUIT_IMPORT_DOCUMENT_ACCEPT}
        className="hidden"
        onChange={handleDocumentFile}
        disabled={disabled || parsing}
      />

      {documentFileName && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          File selected: {documentFileName}
          {documentKind ? ` (${documentKind.toUpperCase()})` : ''}
        </p>
      )}

      {pages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className="relative rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.previewUrl}
                alt={`Roster page ${index + 1}`}
                className="h-32 w-full object-cover"
              />
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200">Page {index + 1}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{page.file.name}</p>
                <p className="text-xs capitalize text-gray-600 dark:text-gray-300">
                  {page.status === 'pending' && 'Ready to extract'}
                  {page.status === 'parsing' && 'Extracting…'}
                  {page.status === 'parsed' && 'Extracted'}
                  {page.status === 'error' && (page.error ?? 'Extract failed')}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-xs py-1"
                  disabled={disabled || parsing}
                  onClick={() => onRemovePage(page.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
