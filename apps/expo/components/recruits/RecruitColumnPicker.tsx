import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  RECRUIT_LIST_COLUMNS,
  type RecruitListColumnId,
} from '@countcard/core/utils/recruitListColumns';
import { Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, spacing, typography } from '@/constants/theme';

interface RecruitColumnPickerProps {
  visible: boolean;
  visibleColumnIds: RecruitListColumnId[];
  onToggleColumn: (columnId: RecruitListColumnId) => void;
  onClose: () => void;
  onReset: () => void;
}

export function RecruitColumnPicker({
  visible,
  visibleColumnIds,
  onToggleColumn,
  onClose,
  onReset,
}: RecruitColumnPickerProps) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Customize columns</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Choose which fields appear in the spreadsheet view.
          </Text>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {RECRUIT_LIST_COLUMNS.map((column) => {
              const selected = visibleColumnIds.includes(column.id);
              return (
                <Pressable
                  key={column.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => onToggleColumn(column.id)}
                  style={[styles.row, { borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.textSecondary, width: 28 }}>
                    {selected ? '☑' : '☐'}
                  </Text>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: theme.colors.text }]}>{column.label}</Text>
                    {!column.editable ? (
                      <Text style={[styles.rowHint, { color: theme.colors.textMuted }]}>Read-only</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.actions}>
            <Button title="Reset defaults" variant="secondary" onPress={onReset} />
            <Button title="Done" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 18,
  },
  subtitle: {
    ...typography.body,
    fontSize: 13,
  },
  list: {
    maxHeight: 360,
  },
  listContent: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  rowHint: {
    ...typography.caption,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
});
