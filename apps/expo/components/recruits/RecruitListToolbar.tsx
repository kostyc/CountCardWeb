import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { Input, Select } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { RecruitSortField, RecruitSortOrder } from '@countcard/core/permissions/recruits';
import type { RecruitListViewStyle } from '@/hooks/useRecruitListColumns';
import { spacing, typography, radius } from '@/constants/theme';

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
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortField: RecruitSortField;
  sortOrder: RecruitSortOrder;
  onSortFieldChange: (field: RecruitSortField) => void;
  onSortOrderToggle: () => void;
  scopeLabel?: string | null;
  viewStyle: RecruitListViewStyle;
  onViewStyleChange: (style: RecruitListViewStyle) => void;
  onCustomizeColumns?: () => void;
  allowGridView?: boolean;
}

export function RecruitListToolbar({
  searchTerm,
  onSearchChange,
  sortField,
  sortOrder,
  onSortFieldChange,
  onSortOrderToggle,
  scopeLabel,
  viewStyle,
  onViewStyleChange,
  onCustomizeColumns,
  allowGridView = Platform.OS === 'web',
}: RecruitListToolbarProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      {scopeLabel ? (
        <Text style={[styles.scope, { color: theme.colors.textMuted }]}>
          Viewing: <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{scopeLabel}</Text>
        </Text>
      ) : null}
      <Input
        label="Search"
        placeholder="Name or EDIPI"
        value={searchTerm}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
        style={styles.searchInput}
      />
      {allowGridView ? (
        <View style={styles.viewRow}>
          <Text style={[styles.viewLabel, { color: theme.colors.textMuted }]}>Layout</Text>
          <View style={styles.viewToggle}>
            {(['list', 'grid'] as const).map((style) => (
              <Pressable
                key={style}
                accessibilityRole="button"
                onPress={() => onViewStyleChange(style)}
                style={[
                  styles.viewChip,
                  {
                    backgroundColor: viewStyle === style ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.viewChipText,
                    { color: viewStyle === style ? theme.colors.onPrimary : theme.colors.text },
                  ]}
                >
                  {style === 'list' ? 'List' : 'Spreadsheet'}
                </Text>
              </Pressable>
            ))}
            {viewStyle === 'grid' && onCustomizeColumns ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCustomizeColumns}
                style={[styles.viewChip, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <Text style={[styles.viewChipText, { color: theme.colors.primary }]}>Columns</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
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
  searchInput: {
    marginBottom: 0,
    minHeight: 44,
    paddingVertical: 10,
  },
  viewRow: {
    gap: spacing.xs,
  },
  viewLabel: {
    ...typography.caption,
  },
  viewToggle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  viewChip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  viewChipText: {
    ...typography.headline,
    fontSize: 14,
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
