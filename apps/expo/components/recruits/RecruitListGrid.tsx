import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { RecruitProfile } from '@countcard/core/types/models';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import type { RecruitStatus } from '@countcard/core/validation/recruitSchemas';
import {
  buildRecruitColumnPatch,
  computeRecruitColumnWidths,
  getRecruitColumnValue,
  getRecruitListColumnDef,
  type RecruitListColumnId,
} from '@countcard/core/utils/recruitListColumns';
import type { RecruitProgressSummary } from '@countcard/core/utils/recruitProgressSummary';
import { isRecruitOrgUnassigned } from '@countcard/core/utils/recruitAssignment';
import type { Company } from '@countcard/core/validation/organizationSchemas';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import type { AppUser } from '@countcard/core/types/auth';
import { updateRecruitProfile } from '@countcard/firebase/services/recruits';
import { addRecruitWeightEntry } from '@countcard/firebase/services/recruitWeight';
import { isAppendOnlyRecruitColumn } from '@countcard/core/utils/recruitWeightAnalytics';
import { normalizeEdipiDigits } from '@countcard/core/utils/recruitEdipi';
import { Button, Select } from '@/components/ui';
import { RECRUIT_RANKS } from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius } from '@/constants/theme';
import { colors } from '@countcard/ui/tokens';

const CHECKBOX_COL_WIDTH = 36;

function gridColumnStyle(width: number, borderColor: string) {
  return {
    width,
    minWidth: width,
    maxWidth: width,
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'hidden' as const,
    borderColor,
  };
}
const STATUS_OPTIONS: { value: RecruitStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'separated', label: 'Separated' },
  { value: 'medical_hold', label: 'Medical Hold' },
  { value: 'other', label: 'Other' },
];


export interface RecruitListGridProps {
  recruits: RecruitProfile[];
  visibleColumnIds: RecruitListColumnId[];
  progressSummaries: Record<string, RecruitProgressSummary>;
  battalionCompanies?: Company[];
  appUser: AppUser | null;
  userId: string;
  onRecruitPress: (recruitId: string) => void;
  onRecruitsUpdated: () => void;
  refreshing?: boolean;
}

export function RecruitListGrid({
  recruits,
  visibleColumnIds,
  progressSummaries,
  battalionCompanies,
  appUser,
  userId,
  onRecruitPress,
  onRecruitsUpdated,
}: RecruitListGridProps) {
  const theme = useAppTheme();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [massColumn, setMassColumn] = useState<RecruitListColumnId>('platoon');
  const [massValue, setMassValue] = useState('');
  const [massScope, setMassScope] = useState<'selected' | 'all'>('selected');
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<Record<RecruitListColumnId, string>>>>({});

  const editableColumns = useMemo(
    () =>
      visibleColumnIds.filter((id) => getRecruitListColumnDef(id).editable),
    [visibleColumnIds]
  );

  const columnWidths = useMemo(() => {
    const cellTextsByColumn = {} as Record<RecruitListColumnId, string[]>;
    for (const columnId of visibleColumnIds) {
      const def = getRecruitListColumnDef(columnId);
      const texts = [def.label];
      if (columnId === 'rank') {
        texts.push(...RECRUIT_RANKS.map((option) => option.label), ...RECRUIT_RANKS.map((option) => option.value));
      }
      if (columnId === 'status') {
        texts.push(...STATUS_OPTIONS.map((option) => option.label), ...STATUS_OPTIONS.map((option) => option.value));
      }
      for (const recruit of recruits) {
        texts.push(getRecruitColumnValue(recruit, columnId, progressSummaries[recruit.recruitId]));
        const draft = drafts[recruit.recruitId]?.[columnId];
        if (draft !== undefined) texts.push(draft);
      }
      cellTextsByColumn[columnId] = texts;
    }
    return computeRecruitColumnWidths(visibleColumnIds, cellTextsByColumn);
  }, [visibleColumnIds, recruits, progressSummaries, drafts]);

  const tableWidth = useMemo(() => {
    const dataWidth = visibleColumnIds.reduce((sum, id) => sum + columnWidths[id], 0);
    return CHECKBOX_COL_WIDTH + dataWidth;
  }, [columnWidths, visibleColumnIds]);

  const recruitIds = useMemo(() => recruits.map((recruit) => recruit.recruitId), [recruits]);

  function getDraftValue(recruit: RecruitProfile, columnId: RecruitListColumnId): string {
    const draft = drafts[recruit.recruitId]?.[columnId];
    if (draft !== undefined) return draft;
    return getRecruitColumnValue(recruit, columnId, progressSummaries[recruit.recruitId]);
  }

  function setDraftValue(recruitId: string, columnId: RecruitListColumnId, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [recruitId]: {
        ...prev[recruitId],
        [columnId]: value,
      },
    }));
  }

  function canEdit(recruit: RecruitProfile): boolean {
    if (!appUser) return false;
    return canEditRecruit(appUser, recruit).allowed;
  }

  async function saveRecruitEdits(recruit: RecruitProfile) {
    const rowDraft = drafts[recruit.recruitId];
    if (!rowDraft || Object.keys(rowDraft).length === 0) return;
    if (!canEdit(recruit)) return;

    const patch: Partial<RecruitProfile> = {};
    for (const [columnId, value] of Object.entries(rowDraft) as [RecruitListColumnId, string][]) {
      if (isAppendOnlyRecruitColumn(columnId)) {
        const weight = Number(value);
        if (!value || Number.isNaN(weight) || weight === recruit.weightPounds) continue;
        await addRecruitWeightEntry(recruit.recruitId, {
          weightPounds: weight,
          recordedBy: userId,
          notes: 'Spreadsheet entry',
        });
        continue;
      }
      Object.assign(patch, buildRecruitColumnPatch(columnId, value));
    }
    if (patch.edipi) {
      patch.edipi = normalizeEdipiDigits(patch.edipi);
    }

    if (Object.keys(patch).length > 0) {
      await updateRecruitProfile(
        recruit.recruitId,
        {
          recruitId: recruit.recruitId,
          ...patch,
          updatedBy: userId,
        },
        userId
      );
    }

    setDrafts((prev) => {
      const next = { ...prev };
      delete next[recruit.recruitId];
      return next;
    });
  }

  async function applyMassEdit() {
    const targets =
      massScope === 'all'
        ? recruits.filter((recruit) => canEdit(recruit))
        : recruits.filter((recruit) => selected.has(recruit.recruitId) && canEdit(recruit));

    if (targets.length === 0) {
      Alert.alert('No editable recruits', 'Select recruits you are allowed to modify.');
      return;
    }

    const columnDef = getRecruitListColumnDef(massColumn);
    if (!columnDef.editable) {
      Alert.alert('Read-only column', 'Choose an editable column for mass edit.');
      return;
    }

    setSaving(true);
    try {
      let failures = 0;
      for (const recruit of targets) {
        try {
          if (isAppendOnlyRecruitColumn(massColumn)) {
            const weight = Number(massValue);
            if (Number.isNaN(weight)) {
              failures += 1;
              continue;
            }
            await addRecruitWeightEntry(recruit.recruitId, {
              weightPounds: weight,
              recordedBy: userId,
              notes: 'Mass edit',
            });
            continue;
          }

          const patch = buildRecruitColumnPatch(massColumn, massValue);
          if (patch.edipi) {
            patch.edipi = normalizeEdipiDigits(patch.edipi);
          }
          await updateRecruitProfile(
            recruit.recruitId,
            {
              recruitId: recruit.recruitId,
              ...patch,
              updatedBy: userId,
            },
            userId
          );
        } catch {
          failures += 1;
        }
      }

      setMassValue('');
      setSelected(new Set());
      onRecruitsUpdated();

      if (failures > 0) {
        Alert.alert('Partial success', `Updated ${targets.length - failures} of ${targets.length} recruits.`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveDirtyRows() {
    const dirtyIds = Object.keys(drafts);
    if (dirtyIds.length === 0) return;

    setSaving(true);
    try {
      let failures = 0;
      for (const recruit of recruits) {
        if (!drafts[recruit.recruitId]) continue;
        if (!canEdit(recruit)) {
          failures += 1;
          continue;
        }
        try {
          await saveRecruitEdits(recruit);
        } catch {
          failures += 1;
        }
      }
      onRecruitsUpdated();
      if (failures > 0) {
        Alert.alert('Partial success', 'Some row edits could not be saved.');
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleRow(recruitId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(recruitId)) next.delete(recruitId);
      else next.add(recruitId);
      return next;
    });
  }

  const dirtyCount = Object.keys(drafts).length;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.help, { color: theme.colors.textMuted }]}>
        Spreadsheet view — scroll horizontally. Unassigned recruits appear first. Weight edits append a new weigh-in. Select rows for mass edits.
      </Text>

      <View style={[styles.massEdit, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Select
          label="Mass edit scope"
          value={massScope}
          onChange={(value) => setMassScope(value as 'selected' | 'all')}
          options={[
            { value: 'selected', label: `Selected (${selected.size})` },
            { value: 'all', label: `All editable (${recruits.filter((r) => canEdit(r)).length})` },
          ]}
        />
        <Select
          label="Column"
          value={massColumn}
          onChange={(value) => {
            setMassColumn(value as RecruitListColumnId);
            setMassValue('');
          }}
          options={editableColumns.map((id) => ({
            value: id,
            label: getRecruitListColumnDef(id).label,
          }))}
        />
        {massColumn === 'rank' ? (
          <Select label="Value" value={massValue} onChange={setMassValue} options={RECRUIT_RANKS} />
        ) : massColumn === 'status' ? (
          <Select label="Value" value={massValue} onChange={setMassValue} options={STATUS_OPTIONS} />
        ) : (
          <View>
            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Value</Text>
            <TextInput
              value={massValue}
              onChangeText={setMassValue}
              editable={!saving}
              multiline={massColumn === 'comments'}
              placeholder={massColumn === 'platoon' ? '2001' : 'Enter value'}
              style={[styles.massInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
            />
          </View>
        )}
        <Button
          title={saving ? 'Saving…' : 'Apply to rows'}
          variant="secondary"
          onPress={() => void applyMassEdit()}
          disabled={saving || (massScope === 'selected' && selected.size === 0) || !massValue}
        />
        {dirtyCount > 0 ? (
          <Button
            title={`Save ${dirtyCount} edited row${dirtyCount === 1 ? '' : 's'}`}
            onPress={() => void saveDirtyRows()}
            disabled={saving}
          />
        ) : null}
      </View>

      {saving ? (
        <View style={styles.savingRow}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={styles.tableScroll}
        contentContainerStyle={{ minWidth: tableWidth }}
      >
        <View style={{ width: tableWidth }}>
          <View style={[styles.headerRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={[styles.checkboxCell, { borderColor: theme.colors.border, width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH, maxWidth: CHECKBOX_COL_WIDTH, flexShrink: 0 }]}>
              <Pressable
                onPress={() =>
                  setSelected(selected.size === recruitIds.length ? new Set() : new Set(recruitIds))
                }
              >
                <Text style={{ color: theme.colors.textMuted }}>
                  {selected.size === recruitIds.length && recruitIds.length > 0 ? '☑' : '☐'}
                </Text>
              </Pressable>
            </View>
            {visibleColumnIds.map((columnId) => (
              <View
                key={columnId}
                style={[styles.headerCell, gridColumnStyle(columnWidths[columnId], theme.colors.border)]}
              >
                <Text
                  style={[styles.headerText, { color: theme.colors.textMuted }]}
                  numberOfLines={getRecruitListColumnDef(columnId).wrap ? undefined : 1}
                  ellipsizeMode="tail"
                >
                  {getRecruitListColumnDef(columnId).label}
                </Text>
              </View>
            ))}
          </View>

          {recruits.map((recruit) => {
            const unassigned = isRecruitOrgUnassigned(recruit, battalionCompanies);
            const isSelected = selected.has(recruit.recruitId);
            const editable = canEdit(recruit);
            const rowDirty = Boolean(drafts[recruit.recruitId]);

            return (
              <Pressable
                key={recruit.recruitId}
                onPress={() => onRecruitPress(recruit.recruitId)}
                style={[
                  styles.dataRow,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: isSelected
                      ? colors.state.selectedHighlight
                      : unassigned
                        ? colors.state.incompleteHighlight
                        : rowDirty
                          ? '#E8F1FF'
                          : theme.colors.surface,
                  },
                ]}
              >
                <View style={[styles.checkboxCell, { borderColor: theme.colors.border, width: CHECKBOX_COL_WIDTH, minWidth: CHECKBOX_COL_WIDTH, maxWidth: CHECKBOX_COL_WIDTH, flexShrink: 0 }]}>
                  <Pressable onPress={() => toggleRow(recruit.recruitId)}>
                    <Text style={{ color: theme.colors.textMuted }}>{isSelected ? '☑' : '☐'}</Text>
                  </Pressable>
                </View>
                {visibleColumnIds.map((columnId) => {
                  const columnDef = getRecruitListColumnDef(columnId);
                  const value = getDraftValue(recruit, columnId);
                  return (
                    <View
                      key={columnId}
                      style={[
                        styles.dataCell,
                        columnDef.wrap ? styles.dataCellWrap : null,
                        gridColumnStyle(columnWidths[columnId], theme.colors.border),
                      ]}
                    >
                      <View style={styles.cellInner}>
                        {!columnDef.editable || !editable ? (
                          <Text
                            style={[styles.cellText, { color: theme.colors.text }]}
                            numberOfLines={columnDef.wrap ? undefined : 1}
                            ellipsizeMode="tail"
                          >
                            {value || '—'}
                          </Text>
                        ) : columnId === 'rank' ? (
                          <Select
                            compact
                            fillWidth
                            value={(value as RecruitRank) || recruit.rank}
                            onChange={(next) => setDraftValue(recruit.recruitId, columnId, next)}
                            options={RECRUIT_RANKS}
                          />
                        ) : columnId === 'status' ? (
                          <Select
                            compact
                            fillWidth
                            value={(value as RecruitStatus) || recruit.status}
                            onChange={(next) => setDraftValue(recruit.recruitId, columnId, next)}
                            options={STATUS_OPTIONS}
                          />
                        ) : (
                          <TextInput
                            value={value}
                            onChangeText={(text) => setDraftValue(recruit.recruitId, columnId, text)}
                            multiline={columnDef.wrap}
                            textAlignVertical={columnDef.wrap ? 'top' : 'center'}
                            style={[
                              styles.cellInput,
                              columnDef.wrap ? styles.cellInputWrap : null,
                              { color: theme.colors.text, width: '100%' },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                  );
                })}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
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
    minHeight: 44,
  },
  savingRow: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  tableScroll: {
    flexGrow: 0,
  },
  headerRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    alignItems: 'stretch',
  },
  dataRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    alignItems: 'stretch',
  },
  checkboxCell: {
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
    minHeight: 44,
  },
  cellInner: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  dataCellWrap: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: spacing.sm,
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
  cellInputWrap: {
    minHeight: 44,
    maxHeight: 120,
  },
});
