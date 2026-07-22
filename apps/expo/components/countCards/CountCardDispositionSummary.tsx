import { View, Text, StyleSheet } from 'react-native';
import type { CountCardGridRow, RecruitProfile } from '@countcard/core/types/models';
import {
  DISPOSITION_FIELDS,
  DISPOSITION_LABELS,
  getDispositionRecruitIds,
  type DispositionField,
} from '@countcard/core/utils/countCardGrid';
import { formatRecruitListName } from '@countcard/core/utils/recruitDisplay';
import { countCardGridStyles } from './CountCardGridTheme';
import { spacing } from '@/constants/theme';

interface Props {
  row: CountCardGridRow;
  roster?: RecruitProfile[];
}

export function CountCardDispositionSummary({ row, roster }: Props) {
  const assignments = row.dispositionAssignments;
  if (!assignments || !roster?.length) return null;

  const byId = new Map(roster.map((r) => [r.recruitId, r]));
  const assigned = getDispositionRecruitIds(assignments);
  const present = roster.filter((r) => !assigned.has(r.recruitId));

  const dispositionLines = DISPOSITION_FIELDS.flatMap((field) => {
    const ids = assignments[field] ?? [];
    if (!ids.length) return [];
    const names = ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((r) => formatRecruitListName(r!));
    return [`${DISPOSITION_LABELS[field]} (${ids.length}): ${names.join(', ')}`];
  });

  if (!dispositionLines.length && !present.length) return null;

  return (
    <View style={styles.wrap}>
      {present.length > 0 ? (
        <Text style={styles.line}>
          T/P ({present.length}):{' '}
          {present.map((r) => formatRecruitListName(r)).join(', ')}
        </Text>
      ) : null}
      {dispositionLines.map((line) => (
        <Text key={line} style={styles.line}>
          {line}
        </Text>
      ))}
    </View>
  );
}

export function dispositionFieldForColumn(columnKey: string): DispositionField | null {
  if (columnKey === 'bedRest') return 'bedRest';
  if (columnKey === 'lightDuty') return 'lightDuty';
  if (columnKey === 'sickBay') return 'sickBay';
  if (columnKey === 'dental') return 'dental';
  if (columnKey === 'gearGuard') return 'gearGuard';
  if (columnKey === 'other') return 'other';
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 2,
  },
  line: {
    fontSize: 10,
    color: countCardGridStyles.textColor,
    lineHeight: 14,
  },
});
