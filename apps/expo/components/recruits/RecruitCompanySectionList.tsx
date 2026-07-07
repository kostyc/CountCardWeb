import { SectionList, Text, View, StyleSheet, Platform } from 'react-native';
import type { ReactElement } from 'react';
import type { RecruitProfile } from '@countcard/core/types/models';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import type { Company } from '@countcard/core/validation/organizationSchemas';
import { ListRow, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

export interface RecruitCompanySection {
  title: string;
  company: Company;
  data: RecruitProfile[];
}

interface RecruitCompanySectionListProps {
  sections: RecruitCompanySection[];
  onRecruitPress: (recruitId: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: ReactElement | (() => ReactElement);
}

export function RecruitCompanySectionList({
  sections,
  onRecruitPress,
  refreshing,
  onRefresh,
  ListHeaderComponent,
}: RecruitCompanySectionListProps) {
  const theme = useAppTheme();

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.recruitId}
      stickySectionHeadersEnabled
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListHeaderComponent={ListHeaderComponent}
      contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
      contentContainerStyle={styles.list}
      renderSectionHeader={({ section }) => (
        <View
          style={[
            styles.sectionHeader,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{section.title}</Text>
          <Text style={[styles.sectionCount, { color: theme.colors.textMuted }]}>
            {section.data.length} recruit{section.data.length === 1 ? '' : 's'}
          </Text>
        </View>
      )}
      renderItem={({ item, index, section }) => (
        <ListRow
          title={`${item.rank ? `${item.rank} ` : ''}${item.lastName}, ${item.firstName}`}
          subtitle={
            [formatEdipiForDisplay(item), item.platoon].filter(Boolean).join(' · ') || undefined
          }
          onPress={() => onRecruitPress(item.recruitId)}
          isFirst={index === 0}
          isLast={index === section.data.length - 1}
          right={<StatusBadge label={item.status ?? 'Unknown'} />}
        />
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? (
          <View style={[styles.emptySection, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>No recruits</Text>
          </View>
        ) : null
      }
      ItemSeparatorComponent={null}
      SectionSeparatorComponent={() => <View style={styles.sectionGap} />}
      style={{ flex: 1 }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.headline,
    fontSize: 16,
  },
  sectionCount: {
    ...typography.caption,
    marginTop: 2,
  },
  sectionGap: {
    height: spacing.md,
  },
  emptySection: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
});
