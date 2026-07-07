import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Modal } from 'react-native';
import type { CountCardGridRow } from '@countcard/core/types/models';
import { withComputedRowTotal } from '@countcard/core/utils/countCardGrid';
import { Button, Input } from '@/components/ui';
import { countCardGridStyles } from './CountCardGridTheme';
import { spacing, typography } from '@/constants/theme';

type RowField = keyof Omit<CountCardGridRow, 'platoon' | 'otherComments'>;

const FIELD_LABELS: { key: RowField; label: string }[] = [
  { key: 'totalStrength', label: 'T/S' },
  { key: 'totalPresent', label: 'T/P' },
  { key: 'weapons', label: 'WPN' },
  { key: 'bedRest', label: 'BR' },
  { key: 'lightDuty', label: 'LD' },
  { key: 'sickBay', label: 'SB' },
  { key: 'dental', label: 'DENT' },
  { key: 'gearGuard', label: 'GG' },
  { key: 'other', label: 'OTH' },
  { key: 'total', label: 'TOTAL' },
];

interface Props {
  row: CountCardGridRow;
  editable?: boolean;
  onChange?: (row: CountCardGridRow) => void;
}

function parseNum(text: string): number | null {
  const t = text.trim();
  if (t === '') return null;
  const n = parseInt(t, 10);
  return Number.isNaN(n) ? null : n;
}

export function CountCardGridRowEditor({ row, editable = true, onChange }: Props) {
  const [othModal, setOthModal] = useState(false);

  function updateField(key: RowField, value: number | null) {
    if (!onChange) return;
    let next = { ...row, [key]: value };
    if (key !== 'total') {
      next = withComputedRowTotal(next);
    }
    onChange(next);
  }

  function handleText(key: RowField, text: string) {
    updateField(key, parseNum(text));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.platoon}>PLT {row.platoon || '—'}</Text>
      <View style={styles.grid}>
        {FIELD_LABELS.map(({ key, label }) => (
          <View key={key} style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {editable && key !== 'total' ? (
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={row[key] != null ? String(row[key]) : ''}
                onChangeText={(t) => handleText(key, t)}
                placeholder="—"
                placeholderTextColor="#666"
              />
            ) : (
              <Text style={styles.value}>{row[key] ?? '—'}</Text>
            )}
          </View>
        ))}
      </View>
      {editable && (row.other ?? 0) > 0 && (
        <Pressable onPress={() => setOthModal(true)} style={styles.othLink}>
          <Text style={styles.othLinkText}>
            OTH comment {row.otherComments ? '✓' : '(required)'}
          </Text>
        </Pressable>
      )}
      {!editable && row.otherComments ? (
        <Text style={styles.othReadonly}>OTH: {row.otherComments}</Text>
      ) : null}

      <Modal visible={othModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>OTH Comments — PLT {row.platoon}</Text>
            <Input
              label="Comments"
              value={row.otherComments ?? ''}
              onChangeText={(t) => onChange?.({ ...row, otherComments: t })}
              multiline
            />
            <Button title="Done" onPress={() => setOthModal(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  platoon: {
    ...typography.headline,
    fontSize: 15,
    fontWeight: '700',
    color: countCardGridStyles.textColor,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  field: {
    width: '30%',
    minWidth: 88,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: countCardGridStyles.textColor,
    marginBottom: 2,
  },
  input: {
    minHeight: countCardGridStyles.minCellHeight,
    borderWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    paddingHorizontal: 8,
    fontSize: countCardGridStyles.cellFontSize,
    color: countCardGridStyles.textColor,
    backgroundColor: '#FFFFFF88',
  },
  value: {
    minHeight: countCardGridStyles.minCellHeight,
    lineHeight: countCardGridStyles.minCellHeight,
    fontSize: countCardGridStyles.cellFontSize,
    color: countCardGridStyles.textColor,
  },
  othLink: {
    marginTop: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  othLinkText: {
    color: '#0000AA',
    fontWeight: '600',
  },
  othReadonly: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: countCardGridStyles.textColor,
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
