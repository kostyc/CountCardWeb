/**
 * Spreadsheet-style import grid for Expo with row selection and mass column edits.
 */

import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, useWindowDimensions } from 'react-native';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import {
  refreshImportRowIdentity,
  type ParsedRecruitImportRow,
} from '@countcard/core/import/recruitExcelImport';
import { Button, Select } from '@/components/ui';
import { spacing, typography, radius } from '@/constants/theme';

type GridColumn = 'platoon' | 'rank' | 'lastName' | 'firstName' | 'edipi' | 'mos' | 'gtScore';

const GRID_COLUMNS: Array<{ id: GridColumn; label: string; minWidth: number; flex: number }> = [
  { id: 'lastName', label: 'Last', minWidth: 72, flex: 1.2 },
  { id: 'firstName', label: 'First', minWidth: 72, flex: 1.2 },
  { id: 'platoon', label: 'Plt', minWidth: 52, flex: 0.7 },
  { id: 'rank', label: 'Rank', minWidth: 88, flex: 1.1 },
  { id: 'edipi', label: 'EDIPI', minWidth: 88, flex: 1 },
  { id: 'mos', label: 'MOS', minWidth: 56, flex: 0.85 },
  { id: 'gtScore', label: 'GT', minWidth: 44, flex: 0.5 },
];

const CHECKBOX_COL_WIDTH = 36;
const ROW_NUM_COL_WIDTH = 36;

function computeColumnWidths(containerWidth: number): Record<GridColumn, number> {
  const fixedWidth = CHECKBOX_COL_WIDTH + ROW_NUM_COL_WIDTH;
  const minDataWidth = GRID_COLUMNS.reduce((sum, column) => sum + column.minWidth, 0);
  const minTableWidth = fixedWidth + minDataWidth;
  const tableWidth = Math.max(containerWidth, minTableWidth);
  const extra = tableWidth - minTableWidth;
  const totalFlex = GRID_COLUMNS.reduce((sum, column) => sum + column.flex, 0);

  const widths = {} as Record<GridColumn, number>;
  for (const column of GRID_COLUMNS) {
    widths[column.id] = column.minWidth + (extra * column.flex) / totalFlex;
  }
  return widths;
}

function getCellValue(row: ParsedRecruitImportRow, column: GridColumn): string {
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
    default:
      return '';
  }
}

function buildPatch(column: GridColumn, value: string): Partial<ParsedRecruitImportRow> {
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
    default:
      return {};
  }
}

export interface RecruitImportGridProps {
  rows: ParsedRecruitImportRow[];
  rankOptions: Array<{ value: string; label: string }>;
  onChangeRows: (rows: ParsedRecruitImportRow[]) => void;
  disabled?: boolean;
  textColor: string;
  textSecondary: string;
  surface: string;
  borderColor: string;
  errorColor: string;
  successColor: string;
}

export function RecruitImportGrid({
  rows,
  rankOptions,
  onChangeRows,
  disabled = false,
  textColor,
  textSecondary,
  surface,
  borderColor,
  errorColor,
  successColor,
}: RecruitImportGridProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [massColumn, setMassColumn] = useState<GridColumn>('platoon');
  const [massValue, setMassValue] = useState('');
  const [massScope, setMassScope] = useState<'selected' | 'all'>('all');

  const layoutWidth = containerWidth > 0 ? containerWidth : Math.max(windowWidth - 64, 320);
  const columnWidths = useMemo(() => computeColumnWidths(layoutWidth), [layoutWidth]);
  const tableWidth = useMemo(() => {
    const dataWidth = GRID_COLUMNS.reduce((sum, column) => sum + columnWidths[column.id], 0);
    return CHECKBOX_COL_WIDTH + ROW_NUM_COL_WIDTH + dataWidth;
  }, [columnWidths]);

  const rowNumbers = useMemo(() => rows.map((row) => row.rowNumber), [rows]);

  function updateRow(rowNumber: number, patch: Partial<ParsedRecruitImportRow>) {
    onChangeRows(
      rows.map((row) => {
        if (row.rowNumber !== rowNumber) return row;
        const merged = {
          ...row,
          ...patch,
          importMeta: patch.importMeta ? { ...row.importMeta, ...patch.importMeta } : row.importMeta,
        };
        return refreshImportRowIdentity(merged);
      })
    );
  }

  function applyMassEdit() {
    const targets = massScope === 'all' ? rowNumbers : rowNumbers.filter((n) => selected.has(n));
    if (targets.length === 0) return;
    const patch = buildPatch(massColumn, massValue);
    const targetSet = new Set(targets);
    onChangeRows(
      rows.map((row) => {
        if (!targetSet.has(row.rowNumber)) return row;
        const merged = {
          ...row,
          ...patch,
          importMeta: patch.importMeta ? { ...row.importMeta, ...patch.importMeta } : row.importMeta,
        };
        return refreshImportRowIdentity(merged);
      })
    );
    setMassValue('');
  }

  function toggleRow(rowNumber: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowNumber)) next.delete(rowNumber);
      else next.add(rowNumber);
      return next;
    });
  }

  return (
    <View
      style={styles.wrapper}
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth > 0 && Math.abs(nextWidth - containerWidth) > 1) {
          setContainerWidth(nextWidth);
        }
      }}
    >
      <Text style={[styles.help, { color: textSecondary }]}>
        Spreadsheet view — scroll horizontally. Select rows for mass edits.
      </Text>

      <View style={[styles.massEdit, { backgroundColor: surface, borderColor }]}>
        <Select
          label="Mass edit scope"
          value={massScope}
          onChange={(value) => setMassScope(value as 'selected' | 'all')}
          options={[
            { value: 'all', label: `All rows (${rows.length})` },
            { value: 'selected', label: `Selected (${selected.size})` },
          ]}
        />
        <Select
          label="Column"
          value={massColumn}
          onChange={(value) => {
            setMassColumn(value as GridColumn);
            setMassValue('');
          }}
          options={GRID_COLUMNS.map((column) => ({ value: column.id, label: column.label }))}
        />
        {massColumn === 'rank' ? (
          <Select
            label="Value"
            value={massValue}
            onChange={setMassValue}
            options={rankOptions}
          />
        ) : (
          <View>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Value</Text>
            <TextInput
              value={massValue}
              onChangeText={setMassValue}
              editable={!disabled}
              placeholder={massColumn === 'platoon' ? '2001' : 'Enter value'}
              style={[styles.massInput, { color: textColor, borderColor }]}
            />
          </View>
        )}
        <Button
          title="Apply to rows"
          variant="secondary"
          onPress={applyMassEdit}
          disabled={disabled || (massScope === 'selected' && selected.size === 0)}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={styles.tableScroll}
        contentContainerStyle={{ minWidth: tableWidth }}
      >
        <View style={{ width: tableWidth }}>
          <View style={[styles.headerRow, { borderColor, backgroundColor: surface }]}>
            <View style={[styles.checkboxCell, { borderColor, width: CHECKBOX_COL_WIDTH }]}>
              <Pressable
                onPress={() =>
                  setSelected(selected.size === rows.length ? new Set() : new Set(rowNumbers))
                }
                disabled={disabled}
              >
                <Text style={{ color: textSecondary }}>{selected.size === rows.length ? '☑' : '☐'}</Text>
              </Pressable>
            </View>
            <View style={[styles.rowNumCell, { borderColor, width: ROW_NUM_COL_WIDTH }]}>
              <Text style={[styles.headerText, { color: textSecondary }]}>#</Text>
            </View>
            {GRID_COLUMNS.map((column) => (
              <View
                key={column.id}
                style={[styles.headerCell, { width: columnWidths[column.id], borderColor }]}
              >
                <Text style={[styles.headerText, { color: textSecondary }]} numberOfLines={1}>
                  {column.label}
                </Text>
              </View>
            ))}
          </View>

          {rows.map((row) => {
            const incomplete = row.missingFields.length > 0;
            const isSelected = selected.has(row.rowNumber);
            return (
              <View
                key={`${row.rowNumber}-${row.recruitId}`}
                style={[
                  styles.dataRow,
                  {
                    borderColor,
                    backgroundColor: isSelected ? '#e8f4fa' : incomplete ? '#fff8eb' : surface,
                  },
                ]}
              >
                <View style={[styles.checkboxCell, { borderColor, width: CHECKBOX_COL_WIDTH }]}>
                  <Pressable onPress={() => toggleRow(row.rowNumber)} disabled={disabled}>
                    <Text style={{ color: textSecondary }}>{isSelected ? '☑' : '☐'}</Text>
                  </Pressable>
                </View>
                <View style={[styles.rowNumCell, { borderColor, width: ROW_NUM_COL_WIDTH }]}>
                  <Text style={[styles.cellText, { color: textSecondary }]}>{row.rowNumber}</Text>
                </View>
                {GRID_COLUMNS.map((column) => (
                  <View
                    key={column.id}
                    style={[styles.dataCell, { width: columnWidths[column.id], borderColor }]}
                  >
                    {column.id === 'rank' ? (
                      <Select
                        compact
                        value={row.rank}
                        onChange={(value) => updateRow(row.rowNumber, { rank: value as RecruitRank })}
                        options={rankOptions}
                      />
                    ) : (
                      <TextInput
                        value={getCellValue(row, column.id)}
                        onChangeText={(text) => updateRow(row.rowNumber, buildPatch(column.id, text))}
                        editable={!disabled}
                        style={[styles.cellInput, { color: textColor }]}
                      />
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {rows.some((row) => row.missingFields.length > 0) && (
        <Text style={[styles.help, { color: errorColor }]}>
          Rows highlighted in amber need required fields before import.
        </Text>
      )}
      {rows.every((row) => row.missingFields.length === 0) && (
        <Text style={[styles.help, { color: successColor }]}>All rows ready to import.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
    width: '100%',
    alignSelf: 'stretch',
  },
  tableScroll: {
    width: '100%',
  },
  help: {
    ...typography.body,
    fontSize: 13,
  },
  massEdit: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  fieldLabel: {
    ...typography.body,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  massInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
  },
  headerRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  dataRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
  },
  checkboxCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  rowNumCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  headerCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  dataCell: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  headerText: {
    ...typography.body,
    fontSize: 12,
    fontWeight: '600',
  },
  cellText: {
    ...typography.body,
    fontSize: 12,
  },
  cellInput: {
    fontSize: 13,
    paddingVertical: 2,
    minHeight: 28,
  },
});
