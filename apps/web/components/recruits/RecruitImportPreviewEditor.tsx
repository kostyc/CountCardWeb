'use client';

/**
 * Spreadsheet-style import grid with per-cell editing and mass column updates.
 */

import React, { useMemo, useState } from 'react';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import {
  RECRUIT_IMPORT_MISSING_FIELD_LABELS,
  type ParsedRecruitImportRow,
} from '@countcard/core/import/recruitExcelImport';
import type { SelectOption } from '@/components/forms/Select';
import { Button } from '@/components/ui/Button';

export type RecruitImportGridColumn =
  | 'lastName'
  | 'firstName'
  | 'platoon'
  | 'rank'
  | 'edipi'
  | 'mos'
  | 'gtScore'
  | 'weaponsSerialNumber'
  | 'rcoSerialNumber';

const GRID_COLUMNS: Array<{ id: RecruitImportGridColumn; label: string; minWidth: string; width: string }> = [
  { id: 'lastName', label: 'Last name', minWidth: '6rem', width: '14%' },
  { id: 'firstName', label: 'First name', minWidth: '6rem', width: '14%' },
  { id: 'platoon', label: 'Platoon', minWidth: '4.5rem', width: '8%' },
  { id: 'rank', label: 'Rank', minWidth: '6rem', width: '11%' },
  { id: 'edipi', label: 'EDIPI', minWidth: '6.5rem', width: '12%' },
  { id: 'mos', label: 'MOS', minWidth: '4rem', width: '8%' },
  { id: 'gtScore', label: 'GT', minWidth: '3.5rem', width: '5%' },
  { id: 'weaponsSerialNumber', label: 'Weapons S/N', minWidth: '6rem', width: '10%' },
  { id: 'rcoSerialNumber', label: 'RCO S/N', minWidth: '6rem', width: '10%' },
];

const MASS_EDIT_COLUMNS: Array<{ id: RecruitImportGridColumn; label: string }> = GRID_COLUMNS.map(
  ({ id, label }) => ({ id, label })
);

export interface RecruitImportPreviewEditorProps {
  rows: ParsedRecruitImportRow[];
  rankOptions: SelectOption[];
  onUpdateRow: (rowNumber: number, patch: Partial<ParsedRecruitImportRow>) => void;
  onBulkUpdateRows: (
    rowNumbers: number[],
    updater: (row: ParsedRecruitImportRow) => Partial<ParsedRecruitImportRow>
  ) => void;
  disabled?: boolean;
}

function getCellValue(row: ParsedRecruitImportRow, column: RecruitImportGridColumn): string {
  switch (column) {
    case 'lastName':
      return row.lastName;
    case 'firstName':
      return row.firstName;
    case 'platoon':
      return row.platoon;
    case 'rank':
      return row.rank;
    case 'edipi':
      return row.edipi ?? '';
    case 'mos':
      return row.importMeta.mos ?? '';
    case 'gtScore':
      return row.importMeta.gtScore ?? '';
    case 'weaponsSerialNumber':
      return row.weaponsSerialNumber ?? '';
    case 'rcoSerialNumber':
      return row.rcoSerialNumber ?? '';
    default:
      return '';
  }
}

function buildPatchForColumn(
  column: RecruitImportGridColumn,
  value: string
): Partial<ParsedRecruitImportRow> {
  switch (column) {
    case 'lastName':
      return { lastName: value };
    case 'firstName':
      return { firstName: value };
    case 'platoon':
      return { platoon: value };
    case 'rank':
      return { rank: value as RecruitRank };
    case 'edipi':
      return { edipi: value };
    case 'mos':
      return { importMeta: { mos: value || undefined } };
    case 'gtScore':
      return { importMeta: { gtScore: value || undefined } };
    case 'weaponsSerialNumber':
      return { weaponsSerialNumber: value || undefined };
    case 'rcoSerialNumber':
      return { rcoSerialNumber: value || undefined };
    default:
      return {};
  }
}

const cellInputClass =
  'w-full min-w-0 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-gray-900 dark:text-gray-100 focus:border-[#001e2e] focus:bg-white dark:focus:bg-gray-950 focus:outline-none focus:ring-1 focus:ring-[#001e2e]';

export function RecruitImportPreviewEditor({
  rows,
  rankOptions,
  onUpdateRow,
  onBulkUpdateRows,
  disabled = false,
}: RecruitImportPreviewEditorProps): JSX.Element {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(() => new Set());
  const [massColumn, setMassColumn] = useState<RecruitImportGridColumn>('platoon');
  const [massValue, setMassValue] = useState('');
  const [massScope, setMassScope] = useState<'selected' | 'all'>('selected');

  const allRowNumbers = useMemo(() => rows.map((row) => row.rowNumber), [rows]);
  const allSelected = rows.length > 0 && selectedRows.size === rows.length;
  const someSelected = selectedRows.size > 0;

  function toggleRow(rowNumber: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedRows(allSelected ? new Set() : new Set(allRowNumbers));
  }

  function applyMassEdit() {
    const targets =
      massScope === 'all' ? allRowNumbers : allRowNumbers.filter((rowNumber) => selectedRows.has(rowNumber));
    if (targets.length === 0) return;

    const patch = buildPatchForColumn(massColumn, massValue);
    onBulkUpdateRows(targets, () => patch);
    setMassValue('');
  }

  function fillColumnFromFirstRow(column: RecruitImportGridColumn) {
    const firstRow = rows[0];
    if (!firstRow) return;
    const value = getCellValue(firstRow, column);
    onBulkUpdateRows(allRowNumbers, () => buildPatchForColumn(column, value));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Edit cells directly like a spreadsheet. Select rows, then apply a value to one column across many recruits.
      </p>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Mass edit
            <select
              value={massScope}
              onChange={(e) => setMassScope(e.target.value as 'selected' | 'all')}
              disabled={disabled}
              className="mt-1 block w-full min-w-[8rem] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1.5 text-sm"
            >
              <option value="selected">Selected rows ({selectedRows.size})</option>
              <option value="all">All rows ({rows.length})</option>
            </select>
          </label>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Column
            <select
              value={massColumn}
              onChange={(e) => {
                setMassColumn(e.target.value as RecruitImportGridColumn);
                setMassValue('');
              }}
              disabled={disabled}
              className="mt-1 block w-full min-w-[9rem] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1.5 text-sm"
            >
              {MASS_EDIT_COLUMNS.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex-1 min-w-[10rem]">
            Value
            {massColumn === 'rank' ? (
              <select
                value={massValue}
                onChange={(e) => setMassValue(e.target.value)}
                disabled={disabled}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1.5 text-sm"
              >
                <option value="">Choose rank…</option>
                {rankOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={massValue}
                onChange={(e) => setMassValue(e.target.value)}
                disabled={disabled}
                placeholder={massColumn === 'platoon' ? '2001' : 'Enter value'}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-950 px-2 py-1.5 text-sm"
              />
            )}
          </label>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || (massScope === 'selected' && !someSelected)}
            onClick={applyMassEdit}
          >
            Apply
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={toggleSelectAll}>
            {allSelected ? 'Clear selection' : 'Select all rows'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || rows.length === 0}
            onClick={() => fillColumnFromFirstRow('platoon')}
          >
            Copy platoon from row 1 to all
          </Button>
        </div>
      </div>

      <div className="w-full overflow-auto max-h-[min(70vh,720px)] rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full min-w-[48rem] table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[2.5rem]" />
            <col className="w-[2.75rem]" />
            {GRID_COLUMNS.map((column) => (
              <col key={column.id} style={{ width: column.width }} />
            ))}
            <col className="w-[8rem]" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="sticky left-0 z-20 bg-gray-100 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 px-2 py-2 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={toggleSelectAll}
                  disabled={disabled}
                  aria-label="Select all rows"
                />
              </th>
              <th className="sticky left-10 z-20 bg-gray-100 dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 px-2 py-2 text-left font-medium w-12">
                #
              </th>
              {GRID_COLUMNS.map((column) => (
                <th
                  key={column.id}
                  className="border-b border-r border-gray-200 dark:border-gray-700 px-2 py-2 text-left font-medium"
                >
                  {column.label}
                </th>
              ))}
              <th className="border-b border-gray-200 dark:border-gray-700 px-2 py-2 text-left font-medium w-28">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const incomplete = row.missingFields.length > 0;
              const selected = selectedRows.has(row.rowNumber);
              return (
                <tr
                  key={`${row.rowNumber}-${row.recruitId}`}
                  className={
                    selected
                      ? 'bg-sky-50 dark:bg-sky-950/30'
                      : incomplete
                        ? 'bg-amber-50/70 dark:bg-amber-950/20'
                        : 'bg-white dark:bg-gray-950'
                  }
                >
                  <td className="sticky left-0 z-10 border-b border-r border-gray-200 dark:border-gray-700 px-2 py-1 bg-inherit">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleRow(row.rowNumber)}
                      disabled={disabled}
                      aria-label={`Select row ${row.rowNumber}`}
                    />
                  </td>
                  <td className="sticky left-10 z-10 border-b border-r border-gray-200 dark:border-gray-700 px-2 py-1 text-gray-500 dark:text-gray-400 bg-inherit">
                    {row.rowNumber}
                  </td>
                  {GRID_COLUMNS.map((column) => (
                    <td
                      key={column.id}
                      className="border-b border-r border-gray-200 dark:border-gray-700 p-0 align-middle"
                    >
                      {column.id === 'rank' ? (
                        <select
                          value={row.rank}
                          onChange={(e) =>
                            onUpdateRow(row.rowNumber, { rank: e.target.value as RecruitRank })
                          }
                          disabled={disabled}
                          aria-label={`Row ${row.rowNumber} rank`}
                          className={cellInputClass}
                        >
                          {rankOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={getCellValue(row, column.id)}
                          onChange={(e) =>
                            onUpdateRow(row.rowNumber, buildPatchForColumn(column.id, e.target.value))
                          }
                          disabled={disabled}
                          aria-label={`Row ${row.rowNumber} ${column.label}`}
                          className={cellInputClass}
                        />
                      )}
                    </td>
                  ))}
                  <td className="border-b border-gray-200 dark:border-gray-700 px-2 py-1 text-xs">
                    {incomplete ? (
                      <span className="text-amber-800 dark:text-amber-300">
                        Needs {row.missingFields.map((f) => RECRUIT_IMPORT_MISSING_FIELD_LABELS[f]).join(', ')}
                      </span>
                    ) : (
                      <span className="text-green-700 dark:text-green-400">Ready</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
