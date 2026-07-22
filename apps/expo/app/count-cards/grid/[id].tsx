import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, Share, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import type { McrdCountCard } from '@countcard/core/types/models';
import { getMcrdCountCardById } from '@countcard/firebase/services/mcrdCountCards';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { usePlatoonRosters } from '@/hooks/usePlatoonRosters';
import { Screen, Button, StatusBadge, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CountCardGridCompact } from '@/components/countCards/CountCardGridCompact';
import { McrdCountCardWorkflowActions } from '@/components/countCards/McrdCountCardWorkflowActions';
import { CountCardWorkflowHistory } from '@/components/countCards/CountCardWorkflowHistory';
import { MCRD_WORKFLOW_STATE_LABELS } from '@countcard/core/permissions/mcrdCountCardWorkflow';
import { formatMcrdCountCardForClipboard } from '@/components/countCards/formatMcrdCountCardClipboard';
import { spacing } from '@/constants/theme';

export default function McrdCountCardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();

  const [card, setCard] = useState<McrdCountCard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const doc = await getMcrdCountCardById(id);
      setCard(doc);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const platoonIds = useMemo(
    () => [...new Set((card?.rows ?? []).map((r) => r.platoon).filter(Boolean))],
    [card?.rows]
  );
  const { rosterByPlatoon } = usePlatoonRosters(platoonIds, {
    regiment: card?.regiment,
    battalion: card?.battalion,
    company: card?.company,
  });

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen scroll>
        <SectionHeader title="Count Card" subtitle="Not found" />
      </Screen>
    );
  }

  const countDate =
    card.countDate instanceof Date ? card.countDate : card.countDate.toDate();

  async function handleCopy() {
    const text = formatMcrdCountCardForClipboard({
      company: card!.company,
      series: card!.series,
      event: card!.event,
      trainingDayCode: card!.trainingDayCode,
      countDate,
      rows: card!.rows,
      notes: card!.notes,
    });
    await Share.share({ message: text });
  }

  return (
    <Screen scroll padded={false} contentContainerStyle={styles.screenContent}>
      <View style={styles.paddedSection}>
        <StatusBadge
          label={MCRD_WORKFLOW_STATE_LABELS[card.workflowState] ?? card.workflowState}
        />
      </View>

      <CountCardGridCompact
        trainingDayCode={card.trainingDayCode}
        series={card.series}
        countDateLabel={countDate.toLocaleDateString()}
        event={card.event}
        backgroundColor={card.backgroundColor}
        rows={card.rows}
        comments={card.notes}
        commentsEditable={false}
        canEditAllRows={false}
        rosterByPlatoon={rosterByPlatoon}
        onRowChange={() => {}}
      />

      <View style={styles.paddedSection}>
        <View style={styles.actions}>
          <Button title="Copy / Share" variant="secondary" onPress={handleCopy} />
        </View>

        {card.workflowHistory && card.workflowHistory.length > 0 && (
          <CountCardWorkflowHistory workflowHistory={card.workflowHistory} />
        )}

        <McrdCountCardWorkflowActions countCard={card} appUser={appUser} onSuccess={load} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    width: '100%',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  paddedSection: {
    paddingHorizontal: Platform.select({ web: spacing.sm, default: spacing.md }),
  },
  actions: {
    marginTop: spacing.md,
  },
});
