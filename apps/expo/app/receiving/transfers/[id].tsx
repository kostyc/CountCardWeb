import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Share } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  buildTransferBatchRosterCsv,
  getTransferBatchById,
  initiateTransferBatch,
  publishTransferBatch,
} from '@countcard/firebase/services/transferBatches';
import { getRecruitProfileById } from '@countcard/firebase/services/recruits';
import type { TransferBatch } from '@countcard/core/types/models';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button, EmptyState } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';

export default function TransferBatchDetailScreen() {
  const { id: batchId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const [batch, setBatch] = useState<TransferBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canAccess = canPerformReceivingWorkflow(appUser);

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTransferBatchById(batchId);
      setBatch(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transfer batch');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function runAction(action: 'publish' | 'initiate') {
    if (!user || !batchId) return;
    setActing(true);
    setError(null);
    setMessage(null);
    try {
      if (action === 'publish') {
        await publishTransferBatch(batchId, user.uid);
        setMessage('Roster published. Company leadership can review.');
      } else {
        await initiateTransferBatch(batchId, user.uid);
        setMessage('Transfer initiated. Recruits are in transit.');
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${action} batch`);
    } finally {
      setActing(false);
    }
  }

  async function exportCsv() {
    if (!batch) return;
    setActing(true);
    setError(null);
    try {
      const recruits = await Promise.all(
        batch.recruitIds.map(async (recruitId) => {
          const r = await getRecruitProfileById(recruitId);
          if (!r) throw new Error(`Recruit not found: ${recruitId}`);
          return r;
        })
      );
      const csv = buildTransferBatchRosterCsv(batch, recruits);
      await Share.share({
        message: csv,
        title: `roster-${batch.transferBatchId}.csv`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to export roster');
    } finally {
      setActing(false);
    }
  }

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

  if (loading) {
    return (
      <Screen scroll>
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (!batch) {
    return (
      <Screen scroll>
        <EmptyState title="Batch not found" description={error ?? 'This transfer batch may have been removed.'} />
      </Screen>
    );
  }

  const dest = batch.destinationAssignment;

  return (
    <Screen scroll>
      <SectionHeader title={`Transfer batch — ${batch.pickupWeek}`} subtitle={batch.transferBatchId} />

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      {message ? <Text style={[styles.message, { color: theme.colors.primary }]}>{message}</Text> : null}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Status</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{batch.status}</Text>

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Destination</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {[dest.regiment, dest.battalion, dest.company, dest.series, dest.platoon].filter(Boolean).join(' / ')}
        </Text>

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Recruits</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{batch.recruitIds.length}</Text>
      </View>

      <View style={styles.actions}>
        {batch.status === 'draft' ? (
          <Button title="Publish roster" onPress={() => void runAction('publish')} loading={acting} />
        ) : null}
        {batch.status === 'published' ? (
          <>
            <Button title="Initiate (Friday march)" onPress={() => void runAction('initiate')} loading={acting} />
            <Button title="Export roster CSV" variant="secondary" onPress={() => void exportCsv()} loading={acting} />
          </>
        ) : null}
      </View>

      {batch.workflowHistory && batch.workflowHistory.length > 0 ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Workflow history</Text>
          {batch.workflowHistory.map((h, i) => (
            <Text key={i} style={{ color: theme.colors.textMuted, ...typography.caption, marginBottom: 4 }}>
              {h.action} — {String(h.timestamp)}
            </Text>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: spacing.xl },
  error: { ...typography.body, marginBottom: spacing.base },
  message: { ...typography.body, marginBottom: spacing.base },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 6,
  },
  cardTitle: { ...typography.subtitle, fontWeight: '600', marginBottom: spacing.sm },
  label: { ...typography.caption, marginTop: spacing.sm },
  value: { ...typography.body, fontWeight: '500' },
  actions: { gap: 12, marginBottom: spacing.xl },
});
