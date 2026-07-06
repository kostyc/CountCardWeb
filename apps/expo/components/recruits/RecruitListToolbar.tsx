import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Select } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { RecruitSortField, RecruitSortOrder } from '@countcard/core/permissions/recruits';
import { spacing, typography } from '@/constants/theme';

const SORT_OPTIONS: { value: RecruitSortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'rank', label: 'Rank' },
  { value: 'status', label: 'Status' },
  { value: 'platoon', label: 'Platoon' },
  { value: 'series', label: 'Series' },
  { value: 'createdAt', label: 'Created' },
  { value: 'updatedAt', label: 'Updated' },
];

interface RecruitListToolbarProps {
  sortField: RecruitSortField;
  sortOrder: RecruitSortOrder;
  onSortFieldChange: (field: RecruitSortField) => void;
  onSortOrderToggle: () => void;
  scopeLabel?: string | null;
}

export function RecruitListToolbar({
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderToggle,
  scopeLabel,
}: RecruitListToolbarProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      {scopeLabel ? (
        <Text style={[styles.scope, { color: theme.colors.textMuted }]}>
          Viewing: <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{scopeLabel}</Text>
        </Text>
      ) : null}
      <View style={styles.row}>
        <View style={styles.sortField}>
          <Select
            label="Sort by"
            value={sortField}
            options={SORT_OPTIONS}
            onChange={onSortFieldChange}
            compact
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
          onPress={onSortOrderToggle}
          style={[styles.orderButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Text style={[styles.orderText, { color: theme.colors.primary }]}>
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    gap: spacing.sm,
  },
  scope: {
    ...typography.caption,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  sortField: {
    flex: 1,
  },
  orderButton: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    marginBottom: 16,
  },
  orderText: {
    ...typography.headline,
    fontSize: 14,
  },
});
