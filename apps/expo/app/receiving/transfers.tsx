import { useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { listTransferBatches } from '@countcard/firebase/services/transferBatches';
import { listRecruits } from '@countcard/firebase/services/recruits';
import type { TransferBatch } from '@countcard/core/types/models';
import type { RecruitProfile } from '@countcard/core/types/models';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button, ListRow, EmptyState } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';

export default function ReceivingTransfersScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const router = useRouter();
  const [batches, setBatches] = useState<TransferBatch[]>([]);
  const [readyRecruits, setReadyRecruits] = useState<RecruitProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canAccess = canPerformReceivingWorkflow(appUser);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchResult, recruitResult] = await Promise.all([
        listTransferBatches(undefined, { pageSize: 50 }),
        listRecruits({ custodyPhase: 'receiving_ready' }, { pageSize: 100 }),
      ]);
      setBatches(batchResult.items);
      setReadyRecruits(recruitResult.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load receiving data');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!canAccess) {
    return (
      <Screen scroll>
        <EmptyState
          title="Receiving access required"
          description="Your account must be assigned to Support Battalion / Receiving Company."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="Receiving transfers"
        subtitle="Custody batches and ready recruits"
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : null}

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
          Ready for transfer ({readyRecruits.length})
        </Text>
        {readyRecruits.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No recruits marked receiving-ready.</Text>
        ) : (
          readyRecruits.slice(0, 10).map((r) => (
            <Pressable key={r.recruitId} onPress={() => router.push(`/recruits/${r.recruitId}`)}>
              <Text style={{ color: theme.colors.primary, marginBottom: 6 }}>
                {r.lastName}, {r.firstName}
              </Text>
            </Pressable>
          ))
        )}
        <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
          Create and publish batches on the web app at /receiving/transfers.
        </Text>
      </View>

      <SectionHeader title="Transfer batches" />
      {batches.length === 0 && !loading ? (
        <EmptyState title="No batches" description="Draft transfer batches will appear here." />
      ) : (
        batches.map((b) => (
          <ListRow
            key={b.transferBatchId}
            title={`${b.pickupWeek} — ${b.status}`}
            subtitle={`${b.recruitIds.length} recruits → ${b.destinationAssignment.company ?? '—'}`}
            onPress={() => router.push(`/recruits`)}
          />
        ))
      )}

      <View style={styles.footer}>
        <Button title="Refresh" variant="secondary" onPress={() => void load()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.lg },
  error: { ...typography.body, marginBottom: spacing.base },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 8,
  },
  cardTitle: { ...typography.subtitle, fontWeight: '600' },
  hint: { ...typography.caption, marginTop: spacing.sm },
  footer: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
