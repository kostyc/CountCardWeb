import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listTransferBatches } from '@countcard/firebase/services/transferBatches';
import type { TransferBatch } from '@countcard/core/types/models';
import { canPerformIncomingCustodyWorkflow } from '@countcard/core/permissions/adminAccess';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button, ListRow, EmptyState, Input } from '@/components/ui';
import { postTransferBatchAction } from '@/lib/transferBatchApi';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/constants/theme';

export default function IncomingRecruitsScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const [batches, setBatches] = useState<TransferBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canAccess = canPerformIncomingCustodyWorkflow(appUser);
  const company = appUser?.customClaims?.organizationalAssignment?.company
    ?? appUser?.profile?.organizationalAssignment?.company;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inTransit, published] = await Promise.all([
        listTransferBatches({ status: 'in_transit', company }, { pageSize: 50 }),
        listTransferBatches({ status: 'published', company }, { pageSize: 50 }),
      ]);
      setBatches([...inTransit.items, ...published.items]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load incoming batches');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function accept(batchId: string) {
    setActing(true);
    setMessage(null);
    try {
      await postTransferBatchAction(batchId, 'accept');
      setMessage('Custody accepted.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Accept failed');
    } finally {
      setActing(false);
    }
  }

  async function reject(batchId: string) {
    setActing(true);
    setMessage(null);
    try {
      await postTransferBatchAction(batchId, 'reject', { reason: rejectReason || undefined });
      setMessage('Batch rejected.');
      setRejectReason('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setActing(false);
    }
  }

  if (!canAccess) {
    return (
      <Screen scroll>
        <EmptyState
          title="Company custody access required"
          description="SDI, CDI, or company leadership role required for incoming recruit custody."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader title="Incoming recruits" subtitle="Accept or reject in-transit custody" />

      {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : null}
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      {message ? <Text style={[styles.message, { color: theme.colors.primary }]}>{message}</Text> : null}

      {batches.length === 0 && !loading ? (
        <EmptyState title="No pending batches" description="Published or in-transit batches for your company appear here." />
      ) : (
        batches.map((b) => (
          <View key={b.transferBatchId} style={styles.batchBlock}>
            <ListRow
              title={`${b.pickupWeek} — ${b.status}`}
              subtitle={`${b.recruitIds.length} recruits → ${b.destinationAssignment.platoon ?? '—'}`}
            />
            {b.status === 'in_transit' ? (
              <View style={styles.actions}>
                <Button title="Accept custody" loading={acting} onPress={() => void accept(b.transferBatchId)} />
                <Input
                  label="Reject reason"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  placeholder="Optional reason"
                />
                <Button title="Reject" variant="secondary" loading={acting} onPress={() => void reject(b.transferBatchId)} />
              </View>
            ) : null}
          </View>
        ))
      )}

      <View style={styles.footer}>
        <Button title="Refresh" variant="secondary" onPress={() => void load()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.body, marginBottom: spacing.base },
  message: { ...typography.body, marginBottom: spacing.base },
  batchBlock: { marginBottom: spacing.base },
  actions: { gap: 10, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  footer: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
