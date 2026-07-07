import { useCallback, useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, Pressable, Text } from 'react-native';
import { listCountCards } from '@countcard/firebase/services/countCards';
import { listMcrdCountCards } from '@countcard/firebase/services/mcrdCountCards';
import type { CountCard, McrdCountCard } from '@countcard/core/types/models';
import { formatTrainingDayDisplay } from '@countcard/core/constants/mcrdTrainingMatrix';
import { getEffectiveOrganizationalAssignment } from '@countcard/core/utils/effectiveOrgAssignment';
import { MCRD_WORKFLOW_STATE_LABELS } from '@countcard/core/permissions/mcrdCountCardWorkflow';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, ListRow, EmptyState, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

type ListItem =
  | { kind: 'legacy'; card: CountCard }
  | { kind: 'grid'; card: McrdCountCard };

export default function CountCardsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const org = getEffectiveOrganizationalAssignment(appUser);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const gridFilters =
        org?.regiment && org.battalion && org.company
          ? {
              regiment: org.regiment,
              battalion: org.battalion,
              company: org.company,
            }
          : undefined;
      const [legacy, grid] = await Promise.all([
        listCountCards(undefined, { pageSize: 30 }),
        listMcrdCountCards(gridFilters, { pageSize: 30 }),
      ]);
      const merged: ListItem[] = [
        ...grid.items.map((card) => ({ kind: 'grid' as const, card })),
        ...legacy.items.map((card) => ({ kind: 'legacy' as const, card })),
      ];
      merged.sort((a, b) => {
        const da =
          a.kind === 'grid'
            ? a.card.countDate instanceof Date
              ? a.card.countDate.getTime()
              : a.card.countDate.toDate().getTime()
            : a.card.timestamp instanceof Date
              ? a.card.timestamp.getTime()
              : a.card.timestamp.toDate().getTime();
        const db =
          b.kind === 'grid'
            ? b.card.countDate instanceof Date
              ? b.card.countDate.getTime()
              : b.card.countDate.toDate().getTime()
            : b.card.timestamp instanceof Date
              ? b.card.timestamp.getTime()
              : b.card.timestamp.toDate().getTime();
        return db - da;
      });
      setItems(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load count cards');
    } finally {
      setLoading(false);
    }
  }, [org?.regiment, org?.battalion, org?.company]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.headerActions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/count-cards/grid/new')}
        >
          <Text style={styles.actionBtnText}>COUNT CARD</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtnOutline, { borderColor: theme.colors.primary }]}
          onPress={() => router.push('/company/training-day')}
        >
          <Text style={[styles.actionBtnOutlineText, { color: theme.colors.primary }]}>
            T-DAY
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.pad}>
          <EmptyState title="Unable to load" message={error} icon="checklist" />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.pad}>
          <EmptyState
            title="No count cards"
            message="Create a COUNT CARD (MCRD 1513/6) or legacy accountability record."
            icon="checklist"
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) =>
            item.kind === 'grid' ? `grid-${item.card.countCardId}` : `legacy-${item.card.countCardId}`
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            if (item.kind === 'grid') {
              const c = item.card;
              const date =
                c.countDate instanceof Date ? c.countDate : c.countDate.toDate();
              return (
                <ListRow
                  title={`COUNT CARD · ${c.company}`}
                  subtitle={`${MCRD_WORKFLOW_STATE_LABELS[c.workflowState] ?? c.workflowState} · T-DAY ${formatTrainingDayDisplay(c.trainingDayCode)} · ${date.toLocaleDateString()}`}
                  onPress={() => router.push(`/count-cards/grid/${c.countCardId}`)}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  right={
                    <StatusBadge
                      label={MCRD_WORKFLOW_STATE_LABELS[c.workflowState] ?? c.workflowState}
                      tone="default"
                    />
                  }
                />
              );
            }
            const c = item.card;
            return (
              <ListRow
                title={`Legacy · ${c.platoon}`}
                subtitle={c.workflowState ?? c.status}
                onPress={() => router.push(`/count-cards/${c.countCardId}`)}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                right={<StatusBadge label={c.status ?? '—'} tone="default" />}
              />
            );
          }}
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnOutline: {
    minHeight: 44,
    minWidth: 72,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  actionBtnOutlineText: {
    fontWeight: '700',
    fontSize: 13,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pad: { padding: 20 },
  list: { padding: 20, paddingBottom: 32 },
  group: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
