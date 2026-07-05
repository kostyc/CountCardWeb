import { useEffect, useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, Text } from 'react-native';
import { listRecruits } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import { hasPermission, isAdminRole } from '@countcard/core/permissions/roles';
import { useRouter } from 'expo-router';
import { Screen, ListRow, EmptyState, StatusBadge, Button } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

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
  const { appUser } = useAppUser(user);
  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    listRecruits(undefined, { pageSize: 50 })
      .then((result) => setRecruits(result.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recruits'))
      .finally(() => setLoading(false));
  }, []);

  const goImport = () => router.push('/recruits/import');
  const goCreate = () => router.push('/recruits/create');

  if (loading) {
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
      <FlatList
        data={recruits}
        keyExtractor={(item) => item.recruitId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ListRow
            title={`${item.rank ? `${item.rank} ` : ''}${item.lastName}, ${item.firstName}`}
            subtitle={
              [formatEdipiForDisplay(item), item.platoon, item.squad].filter(Boolean).join(' · ') || undefined
            }
            onPress={() => router.push(`/recruits/${item.recruitId}`)}
            isFirst={index === 0}
            isLast={index === recruits.length - 1}
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
