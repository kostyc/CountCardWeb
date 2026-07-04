import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { listRecruits } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { useRouter } from 'expo-router';
import { Screen, ListRow, EmptyState, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius } from '@/constants/theme';

export default function RecruitsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [recruits, setRecruits] = useState<RecruitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRecruits(undefined, { limit: 50 })
      .then((result) => setRecruits(result.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recruits'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Screen padded={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen scroll>
        <EmptyState title="Unable to load recruits" message={error} icon="person.3" />
      </Screen>
    );
  }

  if (recruits.length === 0) {
    return (
      <Screen scroll>
        <EmptyState
          title="No recruits yet"
          message="Recruit profiles will appear here once added."
          icon="person.3"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={recruits}
        keyExtractor={(item) => item.recruitId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ListRow
            title={`${item.rank ? `${item.rank} ` : ''}${item.lastName}, ${item.firstName}`}
            subtitle={[item.platoon, item.squad].filter(Boolean).join(' · ') || undefined}
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
  list: { padding: 20, paddingBottom: 32 },
  group: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
