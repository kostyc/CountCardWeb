'use client';

/**
 * Recruit roster import — upload .xlsx, .pdf, or multi-page document photos; preview parsed rows, commit via API.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRecruitPermissions } from '@/hooks/useRecruitPermissions';
import { readRecruitImportFile, readRecruitImportImageViaApi, detectRecruitImportFileKind, isRecruitImportDocumentKind } from '@/lib/import/recruitImportFile';
import {
  mergeRecruitImportParseResults,
  isImportRowReadyForCommit,
  normalizeImportRowForCommit,
  normalizePlatoonNumber,
  refreshImportRowIdentity,
  type ParsedRecruitImportRow,
  type RecruitImportDuplicateWarning,
  type RecruitImportParseResult,
} from '@countcard/core/import/recruitExcelImport';
import {
  OrganizationalAssignment,
  type OrganizationalAssignmentValue,
} from './OrganizationalAssignment';
import {
  RecruitImportPhotoCapture,
  MAX_ROSTER_PHOTO_PAGES,
  type RosterPhotoPage,
} from './RecruitImportPhotoCapture';
import { RecruitImportPreviewEditor } from './RecruitImportPreviewEditor';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/forms/Select';
import { getRecruitRankOptions } from '@/lib/utils/ranks';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { logError } from '@/lib/utils/logger';

export interface RecruitImportProps {
  onImportComplete?: (summary: { created: number; skipped: number; failed: number }) => void;
}

interface ImportApiResult {
  dryRun: boolean;
  summary: { created: number; skipped: number; failed: number; total: number };
  results: Array<{
    rowNumber: number;
    recruitId: string;
    status: 'created' | 'skipped' | 'error';
    message?: string;
  }>;
}

type PageParseResult = RecruitImportParseResult & { provider?: string; platoonHint?: string };

function createPageId(): string {
  return `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function mergePagesIntoPreview(
  pages: RosterPhotoPage[],
  orgForParse: OrganizationalAssignmentValue
): {
  merged: ReturnType<typeof mergeRecruitImportParseResults>;
  provider?: string;
  platoonHint?: string;
} {
  const parseResults: PageParseResult[] = pages
    .filter((page) => page.status === 'parsed' && page.parseResult)
    .map((page) => ({
      rows: page.parseResult!.rows,
      errors: page.parseResult!.errors,
      skippedEmptyRows: page.parseResult!.skippedEmptyRows,
      provider: page.parseResult!.provider,
      platoonHint: page.parseResult!.platoonHint,
    }));

  const merged = mergeRecruitImportParseResults(parseResults);
  const provider = parseResults.find((result) => result.provider)?.provider;
  const platoonHint = parseResults.find((result) => result.platoonHint)?.platoonHint;

  return { merged, provider, platoonHint: platoonHint && !orgForParse.platoon ? platoonHint : undefined };
}

export function RecruitImport({ onImportComplete }: RecruitImportProps): JSX.Element {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { canCreateAny, getOrganizationalScope } = useRecruitPermissions();

  const [orgDefaults, setOrgDefaults] = useState<OrganizationalAssignmentValue>({});
  const [defaultRank, setDefaultRank] = useState<RecruitRank | ''>('E-1');
  const [parsedRows, setParsedRows] = useState<ParsedRecruitImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<RecruitImportParseResult['errors']>([]);
  const [duplicateWarnings, setDuplicateWarnings] = useState<RecruitImportDuplicateWarning[]>([]);
  const [skippedEmptyRows, setSkippedEmptyRows] = useState(0);
  const [documentFileName, setDocumentFileName] = useState<string | null>(null);
  const [documentKind, setDocumentKind] = useState<'xlsx' | 'xls' | 'csv' | 'xlsm' | 'pdf' | null>(null);
  const [photoPages, setPhotoPages] = useState<RosterPhotoPage[]>([]);
  const [platoonHint, setPlatoonHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsingPhotos, setParsingPhotos] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [lastResult, setLastResult] = useState<ImportApiResult | null>(null);
  const [visionProvider, setVisionProvider] = useState<string | null>(null);

  const rankOptions = useMemo(() => getRecruitRankOptions(), []);

  useEffect(() => {
    const scope = getOrganizationalScope();
    if (scope.regiment || scope.battalion || scope.company || scope.series || scope.platoon) {
      setOrgDefaults((prev) => ({
        regiment: prev.regiment ?? (scope.regiment as OrganizationalAssignmentValue['regiment']),
        battalion: prev.battalion ?? scope.battalion,
        company: prev.company ?? scope.company,
        series: prev.series ?? scope.series,
        platoon: prev.platoon ?? scope.platoon,
      }));
    }
  }, [getOrganizationalScope]);

  const orgForParse = useMemo(
    () => ({
      regiment: orgDefaults.regiment,
      battalion: orgDefaults.battalion,
      company: orgDefaults.company,
      series: orgDefaults.series,
      platoon: orgDefaults.platoon,
    }),
    [orgDefaults]
  );

  const applyMergedPreview = useCallback(
    (pages: RosterPhotoPage[]) => {
      const { merged, provider, platoonHint: detectedPlatoon } = mergePagesIntoPreview(pages, orgForParse);
      setParsedRows(merged.rows);
      setParseErrors(merged.errors);
      setSkippedEmptyRows(merged.skippedEmptyRows);
      setDuplicateWarnings(merged.duplicateWarnings);
      setVisionProvider(provider ?? null);
      if (detectedPlatoon) {
        setPlatoonHint(detectedPlatoon);
        setOrgDefaults((prev) => ({ ...prev, platoon: prev.platoon ?? detectedPlatoon }));
      }
      return merged.rows.length;
    },
    [orgForParse]
  );

  useEffect(() => {
    if (!orgForParse.platoon) return;
    setParsedRows((prev) =>
      prev.map((row) => {
        if (/^\d{4}$/.test(row.platoon.trim())) return row;
        const normalized = normalizePlatoonNumber('', orgForParse.platoon);
        if (!normalized) return row;
        return refreshImportRowIdentity({ ...row, platoon: normalized });
      })
    );
  }, [orgForParse.platoon]);

  const incompleteRowCount = useMemo(
    () => parsedRows.filter((row) => !isImportRowReadyForCommit(row)).length,
    [parsedRows]
  );

  const updateParsedRow = useCallback((rowNumber: number, patch: Partial<ParsedRecruitImportRow>) => {
    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.rowNumber !== rowNumber) return row;
        const merged = {
          ...row,
          ...patch,
          importMeta: patch.importMeta ? { ...row.importMeta, ...patch.importMeta } : row.importMeta,
        };
        return refreshImportRowIdentity(merged);
      })
    );
  }, []);

  const bulkUpdateParsedRows = useCallback(
    (
      rowNumbers: number[],
      updater: (row: ParsedRecruitImportRow) => Partial<ParsedRecruitImportRow>
    ) => {
      const selected = new Set(rowNumbers);
      setParsedRows((prev) =>
        prev.map((row) => {
          if (!selected.has(row.rowNumber)) return row;
          const patch = updater(row);
          const merged = {
            ...row,
            ...patch,
            importMeta: patch.importMeta ? { ...row.importMeta, ...patch.importMeta } : row.importMeta,
          };
          return refreshImportRowIdentity(merged);
        })
      );
    },
    []
  );

  const resetParsedPreview = useCallback(() => {
    setParsedRows([]);
    setParseErrors([]);
    setDuplicateWarnings([]);
    setSkippedEmptyRows(0);
    setLastResult(null);
    setVisionProvider(null);
    setPlatoonHint(null);
  }, []);

  const parseDocumentFile = useCallback(
    async (file: File) => {
      const kind = detectRecruitImportFileKind(file.name, file.type);
      if (!isRecruitImportDocumentKind(kind)) {
        showToast({
          variant: 'error',
          message: 'Choose an Excel (.xlsx, .xls, .csv) or PDF roster file.',
        });
        return;
      }

      setLoading(true);
      setLastResult(null);
      setDocumentFileName(file.name);
      setDocumentKind(kind);
      setPhotoPages((prev) => {
        prev.forEach((page) => URL.revokeObjectURL(page.previewUrl));
        return [];
      });

      try {
        const result = await readRecruitImportFile(file, orgForParse, {
          defaultRank: (defaultRank || 'E-1') as RecruitRank,
        });

        const merged = mergeRecruitImportParseResults([result]);
        setParsedRows(merged.rows);
        setParseErrors(merged.errors);
        setSkippedEmptyRows(merged.skippedEmptyRows);
        setDuplicateWarnings(merged.duplicateWarnings);
        setVisionProvider(null);

        if (result.platoonHint && !orgForParse.platoon) {
          setPlatoonHint(result.platoonHint);
          setOrgDefaults((prev) => ({ ...prev, platoon: prev.platoon ?? result.platoonHint }));
        }

        if (merged.errors.length > 0 && merged.rows.length === 0) {
          showToast({
            variant: 'error',
            message: `Could not parse file: ${merged.errors[0]?.message ?? 'Unknown error'}`,
          });
        } else {
          const needsReview = merged.rows.filter((row) => row.missingFields.length > 0).length;
          showToast({
            variant: needsReview > 0 ? 'warning' : 'success',
            message:
              needsReview > 0
                ? `Parsed ${merged.rows.length} recruit(s). ${needsReview} row(s) need fields filled in before import.`
                : `Parsed ${merged.rows.length} recruit(s) from ${file.name}`,
          });
        }
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'RecruitImport.parseDocument');
        showToast({
          variant: 'error',
          message: err instanceof Error ? err.message : 'Failed to read roster file',
        });
        resetParsedPreview();
      } finally {
        setLoading(false);
      }
    },
    [defaultRank, orgForParse, resetParsedPreview, showToast]
  );

  const handleAddImageFiles = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((file) => detectRecruitImportFileKind(file.name, file.type) === 'image');
      if (imageFiles.length === 0) {
        showToast({ variant: 'error', message: 'Choose JPG, PNG, or WebP images for photo import.' });
        return;
      }

      const remaining = MAX_ROSTER_PHOTO_PAGES - photoPages.length;
      if (remaining <= 0) {
        showToast({ variant: 'error', message: `Maximum ${MAX_ROSTER_PHOTO_PAGES} pages per import.` });
        return;
      }

      const accepted = imageFiles.slice(0, remaining);
      if (accepted.length < imageFiles.length) {
        showToast({
          variant: 'warning',
          message: `Only ${accepted.length} page(s) added (${MAX_ROSTER_PHOTO_PAGES} page limit).`,
        });
      }

      setDocumentFileName(null);
      setDocumentKind(null);

      setPhotoPages((prev) => {
        const next = [
          ...prev,
          ...accepted.map((file) => ({
            id: createPageId(),
            file,
            previewUrl: URL.createObjectURL(file),
            status: 'pending' as const,
          })),
        ];
        const parsedCount = next.filter((page) => page.status === 'parsed' && page.parseResult).length;
        if (parsedCount > 0) {
          applyMergedPreview(next);
          showToast({
            variant: 'info',
            message: 'New page added. Extract pages again to include it in the preview.',
          });
        } else {
          resetParsedPreview();
        }
        return next;
      });
    },
    [applyMergedPreview, photoPages.length, resetParsedPreview, showToast]
  );

  const handleRemovePhotoPage = useCallback(
    (id: string) => {
      setPhotoPages((prev) => {
        const page = prev.find((item) => item.id === id);
        if (page) URL.revokeObjectURL(page.previewUrl);
        const next = prev.filter((item) => item.id !== id);
        if (next.some((item) => item.status === 'parsed')) {
          applyMergedPreview(next);
        } else {
          resetParsedPreview();
        }
        return next;
      });
    },
    [applyMergedPreview, resetParsedPreview]
  );

  const handleParsePhotoPages = useCallback(async () => {
    if (!user) {
      showToast({ variant: 'error', message: 'You must be signed in to import from photos.' });
      return;
    }

    const pagesToParse = photoPages.filter((page) => page.status === 'pending' || page.status === 'error');
    if (pagesToParse.length === 0) {
      showToast({ variant: 'error', message: 'Add at least one roster page photo first.' });
      return;
    }

    setParsingPhotos(true);
    setLastResult(null);
    const idToken = await user.getIdToken();
    let failedPages = 0;
    const nextPages = [...photoPages];

    for (const page of pagesToParse) {
      const index = nextPages.findIndex((item) => item.id === page.id);
      if (index < 0) continue;

      nextPages[index] = { ...nextPages[index], status: 'parsing', error: undefined, parseResult: undefined };
      setPhotoPages([...nextPages]);

      try {
        const result = await readRecruitImportImageViaApi(page.file, orgForParse, {
          defaultRank: (defaultRank || 'E-1') as RecruitRank,
          idToken,
        });

        if (result.rows.length === 0) {
          failedPages += 1;
          const message = result.errors[0]?.message ?? 'Could not extract roster table';
          nextPages[index] = { ...nextPages[index], status: 'error', error: message, parseResult: result };
        } else {
          nextPages[index] = {
            ...nextPages[index],
            status: 'parsed',
            error: undefined,
            parseResult: {
              rows: result.rows,
              errors: result.errors,
              skippedEmptyRows: result.skippedEmptyRows,
              provider: result.provider,
              platoonHint: result.platoonHint,
            },
          };
        }
      } catch (err) {
        failedPages += 1;
        const message = err instanceof Error ? err.message : 'Failed to parse page';
        nextPages[index] = { ...nextPages[index], status: 'error', error: message };
        logError(err instanceof Error ? err : new Error(String(err)), 'RecruitImport.parsePhotoPage');
      }

      setPhotoPages([...nextPages]);
    }

    const rowCount = applyMergedPreview(nextPages);
    const provider = nextPages.find((page) => page.parseResult?.provider)?.parseResult?.provider;
    const providerNote = provider ? ` via ${provider === 'gemini' ? 'Gemini' : 'xAI'}` : '';

    if (rowCount === 0) {
      showToast({
        variant: 'error',
        message:
          failedPages > 0
            ? 'Could not extract roster data. Retake photos with better lighting and framing.'
            : 'No recruit rows found in the selected pages.',
      });
    } else {
      const needsReview = nextPages
        .flatMap((page) => page.parseResult?.rows ?? [])
        .filter((row) => row.missingFields?.length > 0).length;
      showToast({
        variant: failedPages > 0 || needsReview > 0 ? 'warning' : 'success',
        message: `Parsed ${rowCount} recruit(s) from ${nextPages.filter((p) => p.status === 'parsed').length} page(s)${providerNote}${
          failedPages > 0 ? ` · ${failedPages} page(s) failed` : ''
        }${needsReview > 0 ? ` · ${needsReview} row(s) need fields filled in` : ''}`,
      });
    }

    setParsingPhotos(false);
  }, [applyMergedPreview, defaultRank, orgForParse, photoPages, showToast, user]);

  const handleDocumentChange = useCallback(
    async (file: File) => {
      await parseDocumentFile(file);
    },
    [parseDocumentFile]
  );

  const commitImport = useCallback(
    async (dryRun: boolean) => {
      if (!user) {
        showToast({ variant: 'error', message: 'You must be signed in to import recruits.' });
        return;
      }
      if (parsedRows.length === 0) {
        showToast({ variant: 'error', message: 'Upload and parse a roster file first.' });
        return;
      }
      if (incompleteRowCount > 0) {
        showToast({
          variant: 'error',
          message: `Fill in missing fields for ${incompleteRowCount} recruit(s) before importing.`,
        });
        return;
      }

      setCommitting(true);
      try {
        const idToken = await user.getIdToken();
        const normalizedRows = parsedRows.map(normalizeImportRowForCommit);
        const payload = {
          dryRun,
          rows: normalizedRows.map((row) => ({
            rowNumber: row.rowNumber,
            recruitId: row.recruitId,
            edipi: row.edipi,
            firstName: row.firstName,
            lastName: row.lastName,
            rank: row.rank,
            status: row.status,
            regiment: row.regiment,
            battalion: row.battalion,
            company: row.company,
            series: row.series,
            platoon: row.platoon,
            weaponsSerialNumber: row.weaponsSerialNumber,
            rcoSerialNumber: row.rcoSerialNumber,
            medicalNotes: row.medicalNotes,
            extendedNotes: row.extendedNotes,
          })),
        };

        const response = await fetch('/api/recruits/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as ImportApiResult & { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? 'Import request failed');
        }

        setLastResult(data);
        showToast({
          variant: data.summary.failed > 0 ? 'warning' : 'success',
          message: dryRun
            ? `Dry run: ${data.summary.created} would be created, ${data.summary.skipped} skipped, ${data.summary.failed} failed`
            : `Import complete: ${data.summary.created} created, ${data.summary.skipped} skipped, ${data.summary.failed} failed`,
        });

        if (!dryRun) {
          onImportComplete?.(data.summary);
        }
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'RecruitImport.commit');
        showToast({
          variant: 'error',
          message: err instanceof Error ? err.message : 'Import failed',
        });
      } finally {
        setCommitting(false);
      }
    },
    [incompleteRowCount, onImportComplete, parsedRows, showToast, user]
  );

  if (!canCreateAny) {
    return (
      <Card className="p-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          You do not have permission to import recruits.
        </p>
      </Card>
    );
  }

  const busy = loading || parsingPhotos || committing;

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Import roster</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Import via camera, photos, Excel, or PDF. Review the preview and run a dry run before committing.
          </p>
        </div>

        {platoonHint && (
          <p className="text-sm text-[#001e2e] dark:text-sky-300">
            Detected platoon <strong>{platoonHint}</strong> from the document.
          </p>
        )}

        <OrganizationalAssignment value={orgDefaults} onChange={setOrgDefaults} />

        <Select
          label="Default rank (for imported recruits)"
          value={defaultRank}
          onChange={(e) => setDefaultRank(e.target.value as RecruitRank | '')}
          options={rankOptions}
        />
      </Card>

      <RecruitImportPhotoCapture
        pages={photoPages}
        onAddImageFiles={handleAddImageFiles}
        onDocumentFile={handleDocumentChange}
        onRemovePage={handleRemovePhotoPage}
        onParsePages={handleParsePhotoPages}
        parsing={parsingPhotos}
        disabled={busy}
        documentFileName={documentFileName}
        documentKind={documentKind}
      />

      {parseErrors.length > 0 && (
        <Card className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Parse warnings</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-300">
            {parseErrors.map((err) => (
              <li key={`${err.rowNumber}-${err.message}`}>
                Row {err.rowNumber}: {err.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {duplicateWarnings.length > 0 && (
        <Card className="p-4 border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200">Duplicate review</h3>
          <ul className="mt-2 space-y-1 text-sm text-orange-800 dark:text-orange-300">
            {duplicateWarnings.map((warning) => (
              <li key={`${warning.type}-${warning.rowNumber}-${warning.recruitId}`}>
                Row {warning.rowNumber}: {warning.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {parsedRows.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Preview ({parsedRows.length} recruit{parsedRows.length === 1 ? '' : 's'})
              </h3>
              {skippedEmptyRows > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Skipped {skippedEmptyRows} empty row(s)
                </p>
              )}
              {incompleteRowCount > 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {incompleteRowCount} recruit(s) need required fields before import
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => commitImport(true)}
                disabled={busy || incompleteRowCount > 0}
                loading={committing}
              >
                Validate (dry run)
              </Button>
              <Button
                variant="primary"
                onClick={() => commitImport(false)}
                disabled={busy || incompleteRowCount > 0}
                loading={committing}
              >
                Import recruits
              </Button>
            </div>
          </div>

          <RecruitImportPreviewEditor
            rows={parsedRows}
            rankOptions={rankOptions}
            onUpdateRow={updateParsedRow}
            onBulkUpdateRows={bulkUpdateParsedRows}
            disabled={busy}
          />
        </Card>
      )}

      {lastResult && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {lastResult.dryRun ? 'Dry run results' : 'Import results'}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Created: {lastResult.summary.created} · Skipped: {lastResult.summary.skipped} · Failed:{' '}
            {lastResult.summary.failed}
          </p>
          {lastResult.results.some((r) => r.status === 'error') && (
            <ul className="mt-2 space-y-1 text-sm text-red-600 dark:text-red-400">
              {lastResult.results
                .filter((r) => r.status === 'error')
                .map((r) => (
                  <li key={`${r.rowNumber}-${r.recruitId}`}>
                    Row {r.rowNumber}: {r.message}
                  </li>
                ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
