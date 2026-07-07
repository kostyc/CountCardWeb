import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Text,
  RefreshControl,
  Platform,
  ScrollView,
} from 'react-native';
import { listRecruits } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import { matchesRecruitSearch } from '@countcard/core/utils/recruitSearch';
import { buildRecruitCompanySections } from '@countcard/core/utils/recruitCompanyGrouping';
import { prioritizeUnassignedRecruits } from '@countcard/core/utils/recruitAssignment';
import { DEFAULT_RECRUIT_LIST_COLUMN_IDS } from '@countcard/core/utils/recruitListColumns';
import type { RecruitProgressSummary } from '@countcard/core/utils/recruitProgressSummary';
import {
  canViewRecruit,
  getRecruitOrganizationalScope,
  getRecruitListViewMode,
  getRecruitListScopeLabel,
  sortRecruits,
} from '@countcard/core/permissions/recruits';
import type { RecruitSortField, RecruitSortOrder } from '@countcard/core/permissions/recruits';
import { getCompaniesByBattalion } from '@countcard/core/constants/organizations';
import { getEffectiveOrganizationalAssignment, getEffectiveUserRole } from '@countcard/core/utils/effectiveOrgAssignment';
import type { Battalion, Company } from '@countcard/core/validation/organizationSchemas';
import { hasPermission, isAdminRole } from '@countcard/core/permissions/roles';
import {
  loadProgressSummariesForRecruits,
  progressColumnNeedsFetch,
} from '@countcard/firebase/services/recruitProgress';
import { useRouter } from 'expo-router';
import { Screen, ListRow, EmptyState, StatusBadge, Button } from '@/components/ui';
import { RecruitListToolbar } from '@/components/recruits/RecruitListToolbar';
import { RecruitCompanySectionList } from '@/components/recruits/RecruitCompanySectionList';
import { RecruitListGrid } from '@/components/recruits/RecruitListGrid';
import { RecruitColumnPicker } from '@/components/recruits/RecruitColumnPicker';
import { useRecruitListColumns } from '@/hooks/useRecruitListColumns';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

const PAGE_SIZE = 100;

async function fetchAllScopedRecruits(
  scope: ReturnType<typeof getRecruitOrganizationalScope>
): Promise<RecruitProfile[]> {
  const all: RecruitProfile[] = [];
  let lastDoc: Awaited<ReturnType<typeof listRecruits>>['lastDoc'];
  let hasMore = true;

  while (hasMore) {
    const result = await listRecruits(scope, { pageSize: PAGE_SIZE, lastDoc });
    all.push(...result.items);
    lastDoc = result.lastDoc;
    hasMore = result.hasMore ?? false;
  }

  return all;
}

function RecruitActionBar({
  canCreateAny,
  onImport,
  onCreate,
}: {
  canCreateAny: boolean;
  onImport: () => void;
  onCreate: () => void;
}) {
  const theme = useAppTheme();

  if (!canCreateAny) {
    return null;
  }

  return (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityRole="button"
        onPress={onImport}
        style={[styles.actionChip, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}
      >
        <Text style={[styles.actionChipText, { color: theme.colors.primary }]}>Import roster</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onCreate}
        style={[styles.actionChip, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={[styles.actionChipText, { color: theme.colors.onPrimary }]}>Add Recruit</Text>
      </Pressable>
    </View>
  );
}

export default function RecruitsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser, loading: userLoading } = useAppUser(user);
  const {
    ready: columnsReady,
    visibleColumnIds,
    viewStyle,
    setViewStyle,
    toggleColumn,
    setVisibleColumnIds,
  } = useRecruitListColumns();
  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<RecruitSortField>('name');
  const [sortOrder, setSortOrder] = useState<RecruitSortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [progressSummaries, setProgressSummaries] = useState<Record<string, RecruitProgressSummary>>({});
  const [progressLoading, setProgressLoading] = useState(false);

  const listViewMode = useMemo(() => getRecruitListViewMode(getEffectiveUserRole(appUser)), [appUser]);

  const scopeLabel = useMemo(() => getRecruitListScopeLabel(appUser), [appUser]);

  const organizationalScope = useMemo(
    () => getRecruitOrganizationalScope(appUser),
    [appUser]
  );

  const userBattalion = useMemo((): Battalion | undefined => {
    const battalion = getEffectiveOrganizationalAssignment(appUser)?.battalion;
    return battalion as Battalion | undefined;
  }, [appUser]);

  const battalionCompanies = useMemo((): Company[] => {
    if (!userBattalion) return [];
    return getCompaniesByBattalion(userBattalion);
  }, [userBattalion]);

  const canCreateAny = useMemo(() => {
    if (!appUser) return false;
    const role = getEffectiveUserRole(appUser);
    if (!role) return false;
    if (isAdminRole(role)) return true;
    return (
      hasPermission(role, 'edit_own_platoon') ||
      hasPermission(role, 'edit_series') ||
      hasPermission(role, 'edit_company') ||
      hasPermission(role, 'edit_battalion')
    );
  }, [appUser]);

  const loadRecruits = useCallback(async () => {
    if (!appUser) {
      setRecruits([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const items = await fetchAllScopedRecruits(organizationalScope);
      const visible = items.filter((recruit) => canViewRecruit(appUser, recruit).allowed);
      setRecruits(visible);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load recruits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appUser, organizationalScope]);

  useEffect(() => {
    if (userLoading) return;
    setLoading(true);
    loadRecruits();
  }, [loadRecruits, userLoading]);

  const filteredRecruits = useMemo(
    () => recruits.filter((recruit) => matchesRecruitSearch(recruit, searchTerm)),
    [recruits, searchTerm]
  );

  const sortedRecruits = useMemo(() => {
    const sorted = sortRecruits(filteredRecruits, sortField, sortOrder);
    return prioritizeUnassignedRecruits(sorted, battalionCompanies);
  }, [filteredRecruits, sortField, sortOrder, battalionCompanies]);

  const companySections = useMemo(
    () => buildRecruitCompanySections(sortedRecruits, battalionCompanies),
    [sortedRecruits, battalionCompanies]
  );

  useEffect(() => {
    if (viewStyle !== 'grid' || !progressColumnNeedsFetch(visibleColumnIds)) {
      setProgressSummaries({});
      return;
    }

    let cancelled = false;
    setProgressLoading(true);
    void loadProgressSummariesForRecruits(sortedRecruits.map((recruit) => recruit.recruitId))
      .then((summaries) => {
        if (!cancelled) setProgressSummaries(summaries);
      })
      .finally(() => {
        if (!cancelled) setProgressLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sortedRecruits, viewStyle, visibleColumnIds]);

  const goImport = () => router.push('/recruits/import');
  const goCreate = () => router.push('/recruits/create');

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecruits();
  };

  const toolbarProps = {
    searchTerm,
    onSearchChange: setSearchTerm,
    sortField,
    sortOrder,
    onSortFieldChange: setSortField,
    onSortOrderToggle: () => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc')),
    scopeLabel,
    viewStyle,
    onViewStyleChange: setViewStyle,
    onCustomizeColumns: () => setColumnPickerOpen(true),
    allowGridView: Platform.OS === 'web',
  };

  const effectiveViewStyle = Platform.OS === 'web' ? viewStyle : 'list';

  const listHeader = (
    <View style={styles.listHeader}>
      <RecruitActionBar canCreateAny={canCreateAny} onImport={goImport} onCreate={goCreate} />
      <RecruitListToolbar {...toolbarProps} />
    </View>
  );

  if (userLoading || loading || !columnsReady) {
    return (
      <Screen padded={false}>
        <RecruitActionBar canCreateAny={canCreateAny} onImport={goImport} onCreate={goCreate} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen scroll>
        <RecruitActionBar canCreateAny={canCreateAny} onImport={goImport} onCreate={goCreate} />
        <EmptyState
          title="Unable to load recruits"
          message={`${error} You can still import a roster if the list is unavailable.`}
          icon="person.3"
        />
        {canCreateAny && (
          <View style={styles.emptyActions}>
            <Button title="Import roster" variant="primary" onPress={goImport} />
          </View>
        )}
      </Screen>
    );
  }

  if (recruits.length === 0) {
    return (
      <Screen scroll>
        <RecruitActionBar canCreateAny={canCreateAny} onImport={goImport} onCreate={goCreate} />
        <RecruitListToolbar {...toolbarProps} />
        <EmptyState
          title="No recruits yet"
          message="Import a roster from photos or spreadsheet data, or create recruits one at a time."
          icon="person.3"
        />
        {canCreateAny && (
          <View style={styles.emptyActions}>
            <Button title="Import roster" variant="primary" onPress={goImport} />
            <Button title="Add Recruit" variant="secondary" onPress={goCreate} />
          </View>
        )}
      </Screen>
    );
  }

  if (sortedRecruits.length === 0) {
    return (
      <Screen scroll>
        <RecruitActionBar canCreateAny={canCreateAny} onImport={goImport} onCreate={goCreate} />
        <RecruitListToolbar {...toolbarProps} />
        <EmptyState
          title="No matching recruits"
          message="Try a different last name or EDIPI."
          icon="magnifyingglass"
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <RecruitColumnPicker
        visible={columnPickerOpen}
        visibleColumnIds={visibleColumnIds}
        onToggleColumn={toggleColumn}
        onClose={() => setColumnPickerOpen(false)}
        onReset={() => void setVisibleColumnIds([...DEFAULT_RECRUIT_LIST_COLUMN_IDS])}
      />

      {effectiveViewStyle === 'grid' ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.gridScrollContent}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {listHeader}
          {progressLoading ? (
            <View style={styles.progressLoading}>
              <ActivityIndicator color={theme.colors.primary} size="small" />
              <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>Loading progress columns…</Text>
            </View>
          ) : null}
          <RecruitListGrid
            recruits={sortedRecruits}
            visibleColumnIds={visibleColumnIds}
            progressSummaries={progressSummaries}
            battalionCompanies={battalionCompanies}
            appUser={appUser}
            userId={user?.uid ?? ''}
            onRecruitPress={(recruitId) => router.push(`/recruits/${recruitId}`)}
            onRecruitsUpdated={loadRecruits}
            refreshing={refreshing}
          />
        </ScrollView>
      ) : listViewMode === 'company_columns' ? (
        <RecruitCompanySectionList
          sections={companySections}
          onRecruitPress={(id) => router.push(`/recruits/${id}`)}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={listHeader}
        />
      ) : (
        <FlatList
          data={sortedRecruits}
          keyExtractor={(item) => item.recruitId}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.list}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />
          }
          renderItem={({ item, index }) => (
            <ListRow
              title={`${item.rank ? `${item.rank} ` : ''}${item.lastName}, ${item.firstName}`}
              subtitle={
                [formatEdipiForDisplay(item), item.platoon].filter(Boolean).join(' · ') || undefined
              }
              onPress={() => router.push(`/recruits/${item.recruitId}`)}
              isFirst={index === 0}
              isLast={index === sortedRecruits.length - 1}
              right={<StatusBadge label={item.status ?? 'Unknown'} />}
            />
          )}
          ItemSeparatorComponent={null}
          style={[
            styles.fill,
            styles.group,
            { backgroundColor: theme.colors.surface },
            cardShadow(theme.scheme),
          ]}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  emptyActions: {
    paddingHorizontal: 20,
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  actionChip: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionChipText: {
    ...typography.headline,
    fontSize: 14,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  listHeader: {
    marginHorizontal: -20,
  },
  gridScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  group: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  progressLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 20,
    paddingBottom: spacing.xs,
  },
});
