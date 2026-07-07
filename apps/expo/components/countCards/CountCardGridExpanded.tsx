import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Modal, Pressable, Platform } from 'react-native';
import type { CountCardGridRow, CountCardBackgroundColor, RecruitProfile } from '@countcard/core/types/models';
import {
  computeAccountedStrength,
  computeFooterTotals,
  DISPOSITION_FIELDS,
  hasDispositionAssignmentMismatch,
  isGridRowEmpty,
  setDispositionRecruits,
  withComputedRowTotal,
  type DispositionField,
} from '@countcard/core/utils/countCardGrid';
import { GRID_COLUMNS, countCardGridStyles, getCountCardSurfaceColor } from './CountCardGridTheme';
import { CountCardDispositionPicker } from './CountCardDispositionPicker';
import {
  CountCardDispositionSummary,
  dispositionFieldForColumn,
} from './CountCardDispositionSummary';
import { Button, Input } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';

interface Props {
  rows: CountCardGridRow[];
  backgroundColor: CountCardBackgroundColor;
  editablePlatoons?: Set<string>;
  canEditAllRows?: boolean;
  profilePlatoon?: string;
  rosterByPlatoon?: Record<string, RecruitProfile[]>;
  rosterLoading?: boolean;
  rosterError?: string | null;
  onRowChange?: (index: number, row: CountCardGridRow) => void;
  embedded?: boolean;
}

interface PickerState {
  rowIndex: number;
  field: DispositionField;
  row: CountCardGridRow;
}

export function CountCardGridExpanded({
  rows,
  backgroundColor,
  editablePlatoons,
  canEditAllRows = false,
  profilePlatoon,
  rosterByPlatoon,
  rosterLoading = false,
  rosterError = null,
  onRowChange,
  embedded = false,
}: Props) {
  const surface = getCountCardSurfaceColor(backgroundColor);
  const footer = computeFooterTotals(rows);
  const [othModal, setOthModal] = useState<{ rowIndex: number; row: CountCardGridRow } | null>(
    null
  );
  const [picker, setPicker] = useState<PickerState | null>(null);
  const autoOpenedRows = useRef(new Set<string>());

  const anyRosterLoaded = rows.some((row) => rosterForPlatoon(row.platoon).length > 0);

  useEffect(() => {
    if (!onRowChange || rosterLoading) return;
    rows.forEach((row, rowIndex) => {
      const platoonKey = row.platoon?.trim();
      if (!platoonKey) return;
      const roster = rosterForPlatoon(row.platoon);
      if (!roster.length) return;
      const rowKey = `${platoonKey}-${rowIndex}`;
      if (autoOpenedRows.current.has(rowKey)) return;
      if (!hasDispositionAssignmentMismatch(row)) return;

      for (const field of DISPOSITION_FIELDS) {
        const count = row[field] ?? 0;
        const assigned = row.dispositionAssignments?.[field]?.length ?? 0;
        if (count > 0 && assigned !== count) {
          autoOpenedRows.current.add(rowKey);
          setPicker({ rowIndex, field, row });
          return;
        }
      }
    });
  }, [rows, rosterByPlatoon, rosterLoading, onRowChange]);

  function rosterForPlatoon(platoon?: string): RecruitProfile[] {
    const key = platoon?.trim();
    if (!key) return [];
    return rosterByPlatoon?.[key] ?? (platoon ? rosterByPlatoon?.[platoon] : undefined) ?? [];
  }

  function rosterLoadedForPlatoon(platoon?: string): boolean {
    const key = platoon?.trim();
    if (!key || rosterLoading) return false;
    if (!rosterByPlatoon) return false;
    return Object.prototype.hasOwnProperty.call(rosterByPlatoon, key);
  }

  function rosterForRow(row: CountCardGridRow): RecruitProfile[] {
    return rosterForPlatoon(row.platoon);
  }

  function rosterIdsForRow(row: CountCardGridRow): string[] {
    return rosterForRow(row).map((r) => r.recruitId);
  }

  function commitRow(rowIndex: number, row: CountCardGridRow) {
    if (!onRowChange) return;
    onRowChange(rowIndex, withComputedRowTotal(row));
  }

  function handlePlatoonChange(rowIndex: number, row: CountCardGridRow, text: string) {
    commitRow(rowIndex, { ...row, platoon: text.slice(0, 20) });
  }

  function handleNumericChange(
    rowIndex: number,
    row: CountCardGridRow,
    key: keyof CountCardGridRow,
    text: string
  ) {
    const parsed = text.trim() === '' ? null : parseInt(text.replace(/\D/g, ''), 10);
    const num = parsed != null && !Number.isNaN(parsed) ? parsed : null;
    const next = withComputedRowTotal({ ...row, [key]: num } as CountCardGridRow);
    commitRow(rowIndex, next);
    if (key === 'other' && (num ?? 0) > 0 && !next.otherComments?.trim()) {
      setOthModal({ rowIndex, row: next });
    }
  }

  function openDispositionPicker(rowIndex: number, row: CountCardGridRow, field: DispositionField) {
    setPicker({ rowIndex, field, row });
  }

  function handleDispositionSave(recruitIds: string[]) {
    if (!picker) return;
    const rosterIds = rosterIdsForRow(picker.row);
    const next = setDispositionRecruits(picker.row, picker.field, recruitIds, rosterIds);
    commitRow(picker.rowIndex, next);
    if (picker.field === 'other' && recruitIds.length > 0 && !next.otherComments?.trim()) {
      setOthModal({ rowIndex: picker.rowIndex, row: next });
    }
    setPicker(null);
  }

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        bounces={false}
        style={styles.tableScroll}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View
          style={[
            styles.table,
            embedded && styles.tableEmbedded,
            { backgroundColor: surface },
          ]}
        >
          <View style={styles.headerRow}>
            {GRID_COLUMNS.map((col) => {
              const dispositionField = dispositionFieldForColumn(col.key);
              const showTapHint = anyRosterLoaded && dispositionField != null;
              return (
                <View key={col.key} style={[styles.cell, styles.headerCell, { width: col.width }]}>
                  <Text
                    style={[
                      styles.headerText,
                      (col.key === 'other' || col.key === 'total') && styles.headerBold,
                    ]}
                  >
                    {col.header}
                  </Text>
                  {showTapHint ? (
                    <Text style={styles.headerTapHint} accessibilityElementsHidden>
                      {Platform.OS === 'web' ? 'click' : 'tap'}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>

          {rows.map((row, rowIndex) => {
            const canEdit = !editablePlatoons || editablePlatoons.has(row.platoon);
            const canEditPlatoon =
              canEdit && (canEditAllRows || !profilePlatoon?.trim());
            const roster = rosterForRow(row);
            const rosterMode = roster.length > 0;
            const rosterUnavailable =
              canEdit && rosterLoadedForPlatoon(row.platoon) && roster.length === 0;
            const assignmentMismatch = rosterMode && hasDispositionAssignmentMismatch(row);
            const showOthLink = canEdit && (row.other ?? 0) > 0;
            const ts = row.totalStrength;
            const accounted = computeAccountedStrength(row);
            const showBalance =
              !isGridRowEmpty(row) && ts != null && ts !== accounted;

            return (
              <View key={`${row.platoon}-${rowIndex}`}>
                <View style={styles.dataRow}>
                  {GRID_COLUMNS.map((col) => {
                    const key = col.key as keyof CountCardGridRow;
                    const isPlatoon = col.key === 'platoon';
                    const isTotal = col.key === 'total';
                    const dispositionField = dispositionFieldForColumn(col.key);
                    const value = row[key];
                    const rosterLocked =
                      rosterMode &&
                      (col.key === 'totalStrength' ||
                        col.key === 'totalPresent' ||
                        dispositionField != null);

                    if (canEdit && dispositionField && rosterMode) {
                      const count = row[dispositionField] ?? 0;
                      const assigned = row.dispositionAssignments?.[dispositionField]?.length ?? 0;
                      const mismatch = count > 0 && assigned !== count;
                      return (
                        <Pressable
                          key={col.key}
                          accessibilityRole="button"
                          accessibilityLabel={`Select ${col.header} recruits`}
                          accessibilityHint={
                            Platform.OS === 'web'
                              ? 'Click to choose recruits from roster'
                              : 'Tap to choose recruits from roster'
                          }
                          onPress={() => openDispositionPicker(rowIndex, row, dispositionField)}
                          style={({ pressed, hovered }) => [
                            styles.cell,
                            styles.tappableCell,
                            mismatch && styles.tappableCellMismatch,
                            (pressed || (Platform.OS === 'web' && hovered)) && styles.tappableCellPressed,
                            { width: col.width },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cellText,
                              styles.tappableText,
                              mismatch && styles.tappableTextMismatch,
                            ]}
                          >
                            {count > 0 ? count : Platform.OS === 'web' ? '+' : '•'}
                          </Text>
                        </Pressable>
                      );
                    }

                    if (canEdit && col.key === 'totalPresent' && rosterMode) {
                      return (
                        <View key={col.key} style={[styles.cell, { width: col.width }]}>
                          <Text style={styles.cellText}>{row.totalPresent ?? 0}</Text>
                        </View>
                      );
                    }

                    if (isPlatoon) {
                      return (
                        <View
                          key={col.key}
                          style={[
                            styles.cell,
                            styles.pltCell,
                            canEditPlatoon && styles.pltCellEditable,
                            { width: col.width },
                          ]}
                        >
                          {canEditPlatoon ? (
                            <TextInput
                              style={[styles.input, styles.pltInput]}
                              value={row.platoon}
                              onChangeText={(t) => handlePlatoonChange(rowIndex, row, t)}
                              placeholder="PLT"
                              placeholderTextColor="#666666"
                              maxLength={20}
                              autoCapitalize="characters"
                            />
                          ) : (
                            <Text style={styles.cellText}>{row.platoon}</Text>
                          )}
                        </View>
                      );
                    }

                    return (
                      <View key={col.key} style={[styles.cell, { width: col.width }]}>
                        {canEdit && !isTotal && !rosterLocked ? (
                          <TextInput
                            style={styles.input}
                            keyboardType="number-pad"
                            value={value != null && value !== '' ? String(value) : ''}
                            onChangeText={(t) => handleNumericChange(rowIndex, row, key, t)}
                            placeholder=""
                            placeholderTextColor="#666666"
                          />
                        ) : (
                          <Text style={styles.cellText}>
                            {value ?? (rosterLocked ? value ?? 0 : '')}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {rosterMode ? (
                  <CountCardDispositionSummary row={row} roster={roster} />
                ) : null}

                {rosterUnavailable ? (
                  <View style={styles.rosterStatusRow}>
                    <Text style={styles.rosterUnavailableText}>
                      Roster unavailable — counts only
                      {rosterError ? ` (${rosterError})` : ''}
                    </Text>
                  </View>
                ) : null}

                {assignmentMismatch ? (
                  <View style={styles.mismatchRow}>
                    <Text style={styles.mismatchText}>
                      {Platform.OS === 'web' ? 'Click' : 'Tap'} BR, LD, SB, DENT, GG, or OTH to
                      assign recruits — counts must match selections.
                    </Text>
                  </View>
                ) : null}

                {showBalance && (
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceText}>
                      T/P+BR+LD+SB+DENT+GG+OTH = {accounted} — must total T/S ({ts})
                    </Text>
                  </View>
                )}

                {showOthLink && (
                  <Pressable
                    style={styles.othRow}
                    onPress={() => setOthModal({ rowIndex, row })}
                  >
                    <Text style={styles.othLink}>
                      OTH comment {row.otherComments ? '✓' : '(required)'}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}

          <View style={[styles.dataRow, styles.footerRow]}>
            {GRID_COLUMNS.map((col) => {
              const key = col.key as keyof CountCardGridRow;
              const val = footer[key];
              return (
                <View
                  key={col.key}
                  style={[
                    styles.cell,
                    col.key === 'platoon' && styles.pltCell,
                    { width: col.width },
                  ]}
                >
                  <Text style={[styles.cellText, styles.footerText]}>
                    {col.key === 'platoon' ? 'TOTAL' : val ?? ''}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {picker ? (
        <CountCardDispositionPicker
          visible
          disposition={picker.field}
          platoon={picker.row.platoon}
          roster={rosterForRow(picker.row)}
          selectedIds={picker.row.dispositionAssignments?.[picker.field] ?? []}
          existingAssignments={picker.row.dispositionAssignments}
          onClose={() => setPicker(null)}
          onSave={handleDispositionSave}
        />
      ) : null}

      <Modal visible={othModal != null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              OTH Comments — PLT {othModal?.row.platoon || '—'}
            </Text>
            <Input
              label="Comments"
              value={othModal?.row.otherComments ?? ''}
              onChangeText={(t) => {
                if (!othModal) return;
                setOthModal({
                  ...othModal,
                  row: { ...othModal.row, otherComments: t },
                });
              }}
              multiline
            />
            <Button
              title="Done"
              onPress={() => {
                if (othModal) {
                  commitRow(othModal.rowIndex, othModal.row);
                }
                setOthModal(null);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  tableScroll: {
    width: '100%',
  },
  tableScrollContent: {
    flexGrow: 1,
    minWidth: '100%',
  },
  table: {
    borderWidth: 1,
    borderColor: countCardGridStyles.borderColor,
  },
  tableEmbedded: {
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
  },
  footerRow: {
    borderBottomWidth: 0,
  },
  cell: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    paddingHorizontal: 2,
  },
  tappableCell: {
    minHeight: 44,
    backgroundColor: '#00000008',
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  tappableCellPressed: {
    backgroundColor: '#00000018',
  },
  tappableCellMismatch: {
    backgroundColor: '#FFF3E0',
  },
  tappableText: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  tappableTextMismatch: {
    color: '#E65100',
  },
  headerTapHint: {
    fontSize: 8,
    fontWeight: '600',
    color: '#444444',
    textAlign: 'center',
    marginTop: 1,
  },
  rosterStatusRow: {
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  rosterUnavailableText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555555',
  },
  mismatchRow: {
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  mismatchText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E65100',
  },
  pltCell: {
    alignItems: 'flex-start',
    paddingLeft: 6,
  },
  pltCellEditable: {
    minHeight: 44,
  },
  pltInput: {
    minHeight: 44,
    textAlign: 'left',
    paddingHorizontal: 4,
  },
  headerCell: {
    minHeight: 32,
  },
  headerText: {
    fontSize: countCardGridStyles.headerFontSize,
    fontWeight: '700',
    color: countCardGridStyles.textColor,
    textAlign: 'center',
  },
  headerBold: {
    fontWeight: '800',
  },
  cellText: {
    fontSize: countCardGridStyles.cellFontSize,
    color: countCardGridStyles.textColor,
    textAlign: 'center',
    width: '100%',
  },
  footerText: {
    fontWeight: '800',
  },
  input: {
    width: '100%',
    minHeight: 32,
    textAlign: 'center',
    fontSize: countCardGridStyles.cellFontSize,
    color: countCardGridStyles.textColor,
    padding: 0,
  },
  othRow: {
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    paddingHorizontal: spacing.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  balanceRow: {
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  balanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B00020',
  },
  othLink: {
    fontSize: 11,
    color: '#0000AA',
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    gap: spacing.md,
  },
  modalTitle: {
    ...typography.headline,
    fontWeight: '700',
  },
});
