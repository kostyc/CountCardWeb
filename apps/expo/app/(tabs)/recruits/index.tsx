import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Text,
  RefreshControl,
} from 'react-native';
import { listRecruits } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import {
  canViewRecruit,
  getRecruitOrganizationalScope,
  getRecruitListViewMode,
  getRecruitListScopeLabel,
  sortRecruits,
} from '@countcard/core/permissions/recruits';
import type { RecruitSortField, RecruitSortOrder } from '@countcard/core/permissions/recruits';
import { getCompaniesByBattalion } from '@countcard/core/constants/organizations';
import type { Battalion, Company } from '@countcard/core/validation/organizationSchemas';
import { hasPermission, isAdminRole } from '@countcard/core/permissions/roles';
import { useRouter } from 'expo-router';
import { Screen, ListRow, EmptyState, StatusBadge, Button } from '@/components/ui';
import { RecruitListToolbar } from '@/components/recruits/RecruitListToolbar';
import {
  RecruitCompanySectionList,
  type RecruitCompanySection,
} from '@/components/recruits/RecruitCompanySectionList';
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
        <Text style={[styles.actionChipText, { color: '#fff' }]}>Add Recruit</Text>
      </Pressable>
    </View>
  );
}

export default function RecruitsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser, loading: userLoading } = useAppUser(user);
  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<RecruitSortField>('name');
  const [sortOrder, setSortOrder] = useState<RecruitSortOrder>('asc');

  const listViewMode = useMemo(() => {
    const role = appUser?.customClaims?.role || appUser?.profile?.role;
    return getRecruitListViewMode(role);
  }, [appUser]);

  const scopeLabel = useMemo(() => getRecruitListScopeLabel(appUser), [appUser]);

  const organizationalScope = useMemo(
    () => getRecruitOrganizationalScope(appUser),
    [appUser]
  );

  const userBattalion = useMemo((): Battalion | undefined => {
    const battalion =
      appUser?.customClaims?.organizationalAssignment?.battalion ||
      appUser?.profile?.organizationalAssignment?.battalion;
    return battalion as Battalion | undefined;
  }, [appUser]);

  const battalionCompanies = useMemo((): Company[] => {
    if (!userBattalion) return [];
    return getCompaniesByBattalion(userBattalion);
  }, [userBattalion]);

  const canCreateAny = useMemo(() => {
    if (!appUser) return false;
    const role = appUser.customClaims?.role || appUser.profile?.role;
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

  const sortedRecruits = useMemo(
    () => sortRecruits(recruits, sortField, sortOrder),
    [recruits, sortField, sortOrder]
  );

  const companySections = useMemo((): RecruitCompanySection[] => {
    const grouped: Record<string, RecruitProfile[]> = {};
    for (const company of battalionCompanies) {
      grouped[company] = [];
    }
    for (const recruit of sortedRecruits) {
      const company = recruit.company;
      if (company && grouped[company]) {
        grouped[company].push(recruit);
      }
    }
    return battalionCompanies.map((company) => ({
      title: company,
      company,
      data: grouped[company] ?? [],
    }));
  }, [sortedRecruits, battalionCompanies]);

  const goImport = () => router.push('/recruits/import');
  const goCreate = () => router.push('/recruits/create');

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecruits();
  };

  if (userLoading || loading) {
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

  if (sortedRecruits.length === 0) {
    return (
      <Screen scroll>
        <RecruitActionBar canCreateAny={canCreateAny} onImport={goImport} onCreate={goCreate} />
        <RecruitListToolbar
          sortField={sortField}
          sortOrder={sortOrder}
          onSortFieldChange={setSortField}
          onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
          scopeLabel={scopeLabel}
        />
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

  return (
    <Screen scroll={false} padded={false}>
      <RecruitActionBar canCreateAny={canCreateAny} onImport={goImport} onCreate={goCreate} />
      <RecruitListToolbar
        sortField={sortField}
        sortOrder={sortOrder}
        onSortFieldChange={setSortField}
        onSortOrderToggle={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
        scopeLabel={scopeLabel}
      />

      {listViewMode === 'company_columns' ? (
        <RecruitCompanySectionList
          sections={companySections}
          onRecruitPress={(id) => router.push(`/recruits/${id}`)}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      ) : (
        <FlatList
          data={sortedRecruits}
          keyExtractor={(item) => item.recruitId}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  list: { padding: 20, paddingBottom: 32 },
  group: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
