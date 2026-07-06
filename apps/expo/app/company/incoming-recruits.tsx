'use client';

import { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  acceptTransferBatch,
  advanceCdiReview,
  advanceFirstSgtReview,
  listTransferBatches,
  rejectTransferBatch,
} from '@countcard/firebase/services/transferBatches';
import type { TransferBatch } from '@countcard/core/types/models';
import type { TransferBatchStatus } from '@countcard/core/validation/lifecycleSchemas';
import { canPerformIncomingCustodyWorkflow, isFullAdminUser } from '@countcard/core/permissions/adminAccess';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button, ListRow, EmptyState, Input } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/constants/theme';

const REVIEW_STATUSES: TransferBatchStatus[] = [
  'published',
  'first_sgt_review',
  'cdi_review',
  'sdi_accept',
];

function stageActionLabel(status: TransferBatchStatus): string | null {
  switch (status) {
    case 'first_sgt_review':
      return 'Complete 1st Sgt review';
    case 'cdi_review':
      return 'Complete CDI review';
    case 'sdi_accept':
      return 'Accept custody (SDI)';
    default:
      return null;
  }
}

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

  const canAccess = canPerformIncomingCustodyWorkflow(appUser) || isFullAdminUser(appUser);
  const role = appUser?.customClaims?.role ?? appUser?.profile?.role;
  const company = appUser?.customClaims?.organizationalAssignment?.company
    ?? appUser?.profile?.organizationalAssignment?.company;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        REVIEW_STATUSES.map((status) =>
          listTransferBatches({ status, company }, { pageSize: 50 })
        )
      );
      setBatches(results.flatMap((r) => r.items));
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

  function canActOnBatch(batch: TransferBatch): boolean {
    if (isFullAdminUser(appUser)) return true;
    switch (batch.status) {
      case 'first_sgt_review':
        return role === 'company_first_sgt';
      case 'cdi_review':
        return role === 'chief_drill_instructor';
      case 'sdi_accept':
        return role === 'senior_drill_instructor';
      default:
        return false;
    }
  }

  async function advance(batch: TransferBatch) {
    if (!user) return;
    setActing(true);
    setMessage(null);
    try {
      if (batch.status === 'first_sgt_review') {
        await advanceFirstSgtReview(batch.transferBatchId, user.uid);
      } else if (batch.status === 'cdi_review') {
        await advanceCdiReview(batch.transferBatchId, user.uid);
      } else if (batch.status === 'sdi_accept') {
        await acceptTransferBatch(batch.transferBatchId, user.uid);
      }
      setMessage('Review step completed.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActing(false);
    }
  }

  async function reject(batchId: string) {
    if (!user) return;
    setActing(true);
    setMessage(null);
    try {
      await rejectTransferBatch(batchId, user.uid, rejectReason || undefined);
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
          description="SDI, CDI, 1stSgt, or company leadership role required for incoming recruit custody."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="Incoming recruits"
        subtitle="Staged review: 1st Sgt → CDI → SDI accept"
      />

      {loading ? <ActivityIndicator size="large" color={theme.colors.primary} /> : null}
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
      {message ? <Text style={[styles.message, { color: theme.colors.primary }]}>{message}</Text> : null}

      {batches.length === 0 && !loading ? (
        <EmptyState title="No pending batches" description="Batches awaiting company review appear here." />
      ) : (
        batches.map((b) => {
          const actionLabel = stageActionLabel(b.status);
          const showAction = actionLabel && canActOnBatch(b);
          const showReject = ['first_sgt_review', 'cdi_review', 'sdi_accept', 'published'].includes(b.status);
          return (
            <View key={b.transferBatchId} style={styles.batchBlock}>
              <ListRow
                title={`${b.pickupWeek} — ${b.status}`}
                subtitle={`${b.recruitIds.length} recruits → ${b.destinationAssignment.platoon ?? '—'}`}
              />
              {showAction || showReject ? (
                <View style={styles.actions}>
                  {showAction ? (
                    <Button title={actionLabel!} loading={acting} onPress={() => void advance(b)} />
                  ) : null}
                  {showReject ? (
                    <>
                      <Input
                        label="Reject reason"
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        placeholder="Optional reason"
                      />
                      <Button title="Reject" variant="secondary" loading={acting} onPress={() => void reject(b.transferBatchId)} />
                    </>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })
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
