import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import type { McrdCountCard } from '@countcard/core/types/models';
import type { AppUser } from '@countcard/core/types/auth';
import { checkPermission, getUserRole } from '@countcard/core/permissions/utils';
import {
  getMcrdWorkflowActions,
  MCRD_WORKFLOW_ACTION_LABELS,
  type McrdWorkflowAction,
} from '@countcard/core/permissions/mcrdCountCardWorkflow';
import {
  consolidateMcrdCountCardBySdi,
  finalApproveMcrdCountCard,
  forwardMcrdCountCard,
  rejectMcrdCountCard,
  submitMcrdCountCard,
  validateMcrdCountCardByCdi,
} from '@countcard/firebase/services/mcrdCountCards';
import { useAuth } from '@/context/AuthContext';
import { Button, Input, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing } from '@/constants/theme';

interface Props {
  countCard: McrdCountCard;
  appUser: AppUser | null;
  onSuccess?: () => void;
}

function permissionForAction(action: McrdWorkflowAction): Parameters<typeof checkPermission>[1] {
  switch (action) {
    case 'submit':
      return 'create_count_card';
    case 'reject':
      return 'reject_count_card';
    case 'sdi_consolidate':
    case 'cdi_validate':
      return 'approve_count_card';
    case 'forward':
    case 'final_approve':
      return 'consolidate_count_cards';
    default:
      return 'create_count_card';
  }
}

export function McrdCountCardWorkflowActions({ countCard, appUser, onSuccess }: Props) {
  const { user } = useAuth();
  const theme = useAppTheme();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const role = getUserRole(appUser);
  const roleActions = getMcrdWorkflowActions(role, countCard.workflowState);
  const actions = roleActions.filter((action) => checkPermission(appUser, permissionForAction(action)).allowed);

  if (actions.length === 0) return null;

  async function runAction(action: McrdWorkflowAction) {
    if (!user) return;
    if (action === 'reject' && !notes.trim()) {
      Alert.alert('Notes required', 'Add rejection notes.');
      return;
    }

    setLoading(true);
    try {
      const trimmed = notes.trim() || undefined;
      switch (action) {
        case 'submit':
          await submitMcrdCountCard(countCard.countCardId, user.uid, trimmed);
          break;
        case 'reject':
          await rejectMcrdCountCard(countCard.countCardId, user.uid, notes.trim());
          break;
        case 'sdi_consolidate':
          await consolidateMcrdCountCardBySdi(countCard.countCardId, user.uid, trimmed);
          break;
        case 'cdi_validate':
          await validateMcrdCountCardByCdi(countCard.countCardId, user.uid, trimmed);
          break;
        case 'forward':
          await forwardMcrdCountCard(countCard.countCardId, user.uid, trimmed);
          break;
        case 'final_approve':
          await finalApproveMcrdCountCard(countCard.countCardId, user.uid, trimmed);
          break;
      }
      Alert.alert('Success', 'Workflow updated.');
      onSuccess?.();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  const showNotes = actions.some((a) => a === 'reject') || actions.length > 1;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
      <SectionHeader title="Workflow" />
      {showNotes ? (
        <Input label="Notes" value={notes} onChangeText={setNotes} multiline />
      ) : null}
      <View style={styles.actions}>
        {actions.map((action) => (
          <Button
            key={action}
            title={MCRD_WORKFLOW_ACTION_LABELS[action]}
            variant={action === 'reject' ? 'secondary' : 'primary'}
            loading={loading}
            onPress={() => runAction(action)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
