import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import type { CountCard } from '@countcard/core/types/models';
import type { AppUser } from '@countcard/core/types/auth';
import { checkPermission } from '@countcard/core/permissions/utils';
import {
  approveCountCard,
  rejectCountCard,
  consolidateCountCard,
  finalApproveCountCard,
} from '@countcard/firebase/services/countCards';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

type ActionType = 'approve' | 'reject' | 'consolidate' | 'final-approve';

interface Props {
  countCard: CountCard;
  appUser: AppUser | null;
  onSuccess?: () => void;
}

export function CountCardWorkflowActions({ countCard, appUser, onSuccess }: Props) {
  const { user } = useAuth();
  const theme = useAppTheme();
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [notes, setNotes] = useState('');
  const [submittedTo, setSubmittedTo] = useState('');
  const [loading, setLoading] = useState(false);

  const canApprove = checkPermission(appUser, 'approve_count_card');
  const canReject = checkPermission(appUser, 'reject_count_card');
  const canConsolidate = checkPermission(appUser, 'consolidate_count_cards');

  const canShowApprove =
    canApprove.allowed &&
    (countCard.workflowState === 'submitted' || countCard.workflowState === 'under_review');
  const canShowReject =
    canReject.allowed &&
    (countCard.workflowState === 'submitted' || countCard.workflowState === 'under_review');
  const canShowConsolidate = canConsolidate.allowed && countCard.workflowState === 'approved';
  const canShowFinalApprove = canConsolidate.allowed && countCard.workflowState === 'consolidated';

  if (!canShowApprove && !canShowReject && !canShowConsolidate && !canShowFinalApprove) {
    return null;
  }

  async function runAction(action: ActionType) {
    if (!user) {
      Alert.alert('Error', 'You must be signed in.');
      return;
    }
    if (action === 'reject' && !notes.trim()) {
      Alert.alert('Notes required', 'Add rejection notes before submitting.');
      return;
    }

    setLoading(true);
    try {
      const submittedToIds = submittedTo
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const trimmedNotes = notes.trim() || undefined;

      switch (action) {
        case 'approve':
          await approveCountCard(
            countCard.countCardId,
            user.uid,
            trimmedNotes,
            submittedToIds.length ? submittedToIds : undefined
          );
          break;
        case 'reject':
          await rejectCountCard(countCard.countCardId, user.uid, notes.trim());
          break;
        case 'consolidate':
          await consolidateCountCard(
            countCard.countCardId,
            user.uid,
            trimmedNotes,
            submittedToIds.length ? submittedToIds : undefined
          );
          break;
        case 'final-approve':
          await finalApproveCountCard(countCard.countCardId, user.uid, trimmedNotes);
          break;
      }

      setActionType(null);
      setNotes('');
      setSubmittedTo('');
      onSuccess?.();
      Alert.alert('Success', 'Workflow updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
      <SectionHeader title="Workflow actions" />
      {!actionType ? (
        <View style={styles.actions}>
          {canShowApprove ? (
            <Button title="Approve" onPress={() => setActionType('approve')} variant="secondary" />
          ) : null}
          {canShowReject ? (
            <Button title="Reject" onPress={() => setActionType('reject')} variant="danger" />
          ) : null}
          {canShowConsolidate ? (
            <Button title="Consolidate" onPress={() => setActionType('consolidate')} variant="secondary" />
          ) : null}
          {canShowFinalApprove ? (
            <Button title="Final approve" onPress={() => setActionType('final-approve')} />
          ) : null}
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={[styles.actionLabel, { color: theme.colors.text }]}>
            {actionType.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </Text>
          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={actionType === 'reject' ? 'Required for rejection' : 'Optional'}
          />
          {actionType === 'approve' || actionType === 'consolidate' ? (
            <Input
              label="Submit to (user IDs, comma-separated)"
              value={submittedTo}
              onChangeText={setSubmittedTo}
              autoCapitalize="none"
            />
          ) : null}
          <View style={styles.row}>
            <Button title="Cancel" variant="ghost" onPress={() => setActionType(null)} style={styles.half} />
            <Button
              title="Submit"
              loading={loading}
              onPress={() => actionType && runAction(actionType)}
              style={styles.half}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.base, gap: 12 },
  actions: { gap: 10 },
  form: { gap: 4 },
  actionLabel: { ...typography.headline, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12, marginTop: 8 },
  half: { flex: 1 },
});
