import { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { listCountCards } from '@countcard/firebase/services/countCards';
import type { CountCard } from '@countcard/core/types/models';
import { useRouter } from 'expo-router';
import { Screen, ListRow, EmptyState, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius } from '@/constants/theme';

export default function CountCardsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const [cards, setCards] = useState<CountCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCountCards(undefined, { limit: 50 })
      .then((result) => setCards(result.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load count cards'))
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
        <EmptyState title="Unable to load count cards" message={error} icon="checklist" />
      </Screen>
    );
  }

  if (cards.length === 0) {
    return (
      <Screen scroll>
        <EmptyState
          title="No count cards"
          message="Accountability records will show up here."
          icon="checklist"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} padded={false}>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.countCardId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ListRow
            title={item.title ?? 'Count Card'}
            subtitle={`${item.workflowState ?? item.status}${item.date ? ` · ${item.date}` : ''}`}
            onPress={() => router.push(`/count-cards/${item.countCardId}`)}
            isFirst={index === 0}
            isLast={index === cards.length - 1}
            right={<StatusBadge label={item.status ?? '—'} tone="default" />}
          />
        )}
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
