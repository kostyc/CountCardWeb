import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import {
  canClaimIncidentTask,
  canEscalateIncidentToBattalion,
  canReassignIncidentTask,
  canResolveIncidentAlert,
} from '@countcard/core/permissions/incidentAlerts';
import {
  acknowledgeIncidentAlert,
  claimIncidentTask,
  completeIncidentTask,
  escalateIncidentAlert,
  nextEscalation,
  reassignIncidentTask,
  resolveIncidentAlert,
  subscribeIncidentAlert,
  subscribeIncidentTasks,
} from '@countcard/firebase/services/incidentAlerts';
import type { IncidentAlert, IncidentTask } from '@countcard/core/types/models';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, Button, Input, SectionHeader, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { palette, radius, spacing, typography, cardShadow } from '@/constants/theme';

export default function EmergencyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const alertId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const [alert, setAlert] = useState<IncidentAlert | null>(null);
  const [tasks, setTasks] = useState<IncidentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null);
  const [reassignUid, setReassignUid] = useState('');

  useEffect(() => {
    if (!alertId) return;
    const unsubAlert = subscribeIncidentAlert(
      alertId,
      (next) => {
        setAlert(next);
        setLoading(false);
      },
      () => setLoading(false)
    );
    const unsubTasks = subscribeIncidentTasks(alertId, setTasks);
    return () => {
      unsubAlert();
      unsubTasks();
    };
  }, [alertId]);

  const uid = user?.uid;
  const acknowledged =
    !!uid && (alert?.acknowledgedBy?.some((a) => a.userId === uid) ?? false);
  const open = alert?.workflowState === 'active' || alert?.workflowState === 'escalated';
  const canClaim = canClaimIncidentTask(appUser);
  const canReassign = canReassignIncidentTask(appUser);
  const canResolve = canResolveIncidentAlert(appUser);
  const canNotifyBattalion = canEscalateIncidentToBattalion(appUser);
  const escalateTarget = alert ? nextEscalation(alert.escalationLevel) : null;
  const showNotifyBattalion =
    canNotifyBattalion && escalateTarget === 'battalion';

  async function handleAck() {
    if (!uid || !alertId) return;
    setBusy(true);
    try {
      await acknowledgeIncidentAlert(alertId, uid);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to acknowledge');
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim(taskId: string) {
    if (!uid) return;
    setBusy(true);
    try {
      await claimIncidentTask(alertId, taskId, uid);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to claim');
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete(taskId: string) {
    if (!uid) return;
    setBusy(true);
    try {
      await completeIncidentTask(alertId, taskId, uid);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to complete');
    } finally {
      setBusy(false);
    }
  }

  async function handleReassign() {
    if (!uid || !reassignTaskId || !reassignUid.trim()) return;
    setBusy(true);
    try {
      await reassignIncidentTask(alertId, reassignTaskId, reassignUid.trim(), uid);
      setReassignTaskId(null);
      setReassignUid('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to reassign');
    } finally {
      setBusy(false);
    }
  }

  async function handleNotifyBattalion() {
    if (!uid) return;
    setBusy(true);
    try {
      await escalateIncidentAlert(alertId, uid);
      Alert.alert(
        'Battalion notified',
        'Battalion Commander, XO, and Sergeant Major have been added to this alert.'
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to notify battalion');
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve() {
    if (!uid) return;
    Alert.alert('Resolve emergency?', 'This clears the active banner for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await resolveIncidentAlert(alertId, uid);
            router.replace('/emergency' as Href);
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to resolve');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  async function handleCall911() {
    const url = Platform.OS === 'ios' ? 'telprompt:911' : 'tel:911';
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to dial', 'Call 911 from your phone dialer.');
    }
  }

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={theme.colors.primary} />
      </Screen>
    );
  }

  if (!alert) {
    return (
      <Screen>
        <Text style={{ color: theme.colors.text }}>Alert not found.</Text>
        <Button title="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={[styles.header, { backgroundColor: palette.marineRed }]}>
        <Text style={styles.headerTitle}>{alert.title}</Text>
        <Text style={styles.headerMeta}>
          {alert.incidentType.replace(/_/g, ' ')} · {alert.escalationLevel} ·{' '}
          {alert.workflowState}
        </Text>
        {alert.location ? (
          <Text style={styles.headerMeta}>Location: {alert.location}</Text>
        ) : null}
        <Text style={styles.headerBody}>{alert.description}</Text>
        {alert.sopSource === 'placeholder' ? (
          <Text style={styles.placeholderNote}>
            SOP checklist is PLACEHOLDER until command provides the official list.
          </Text>
        ) : null}
      </View>

      <View style={styles.row}>
        <StatusBadge
          label={open ? 'ACTIVE' : alert.workflowState.toUpperCase()}
          tone={open ? 'error' : 'default'}
        />
        <Button title="Call 911" variant="secondary" onPress={handleCall911} fullWidth={false} />
      </View>

      {open && !acknowledged ? (
        <Button
          title="Acknowledge alert"
          variant="danger"
          onPress={handleAck}
          loading={busy}
        />
      ) : null}

      <SectionHeader
        title="SOP commands"
        subtitle="Claim a task, then mark it done when complete"
      />

      {tasks.map((task) => (
        <View
          key={task.id}
          style={[
            styles.taskCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            cardShadow(theme.scheme),
          ]}
        >
          <View style={styles.taskTop}>
            <Text style={[styles.taskLabel, { color: theme.colors.text }]}>
              {task.sortOrder}. {task.label}
            </Text>
            <StatusBadge
              label={task.status}
              tone={
                task.status === 'done'
                  ? 'success'
                  : task.status === 'claimed'
                    ? 'warning'
                    : 'default'
              }
            />
          </View>
          <Text style={[styles.taskInstructions, { color: theme.colors.textSecondary }]}>
            {task.instructions}
          </Text>
          {task.claimedBy ? (
            <Text style={[styles.claimed, { color: theme.colors.textMuted }]}>
              Claimed by {task.claimedBy === uid ? 'you' : task.claimedBy.slice(0, 8)}…
            </Text>
          ) : null}
          {open ? (
            <View style={styles.taskActions}>
              {task.status === 'open' && canClaim ? (
                <Pressable
                  onPress={() => handleClaim(task.taskId)}
                  style={[styles.chip, { backgroundColor: palette.marineRed }]}
                  disabled={busy}
                >
                  <Text style={styles.chipText}>I&apos;ve got this</Text>
                </Pressable>
              ) : null}
              {(task.status === 'claimed' || task.status === 'open') && canClaim ? (
                <Pressable
                  onPress={() => handleComplete(task.taskId)}
                  style={[styles.chip, { backgroundColor: theme.colors.primary }]}
                  disabled={busy}
                >
                  <Text style={styles.chipText}>Mark done</Text>
                </Pressable>
              ) : null}
              {canReassign && task.status !== 'done' ? (
                <Pressable
                  onPress={() => setReassignTaskId(task.taskId)}
                  style={[styles.chip, { backgroundColor: theme.colors.surfaceElevated, borderWidth: 1, borderColor: theme.colors.border }]}
                  disabled={busy}
                >
                  <Text style={[styles.chipText, { color: theme.colors.text }]}>Reassign</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      ))}

      {reassignTaskId ? (
        <View style={styles.reassignBox}>
          <Input
            label="Reassign to Firebase UID"
            value={reassignUid}
            onChangeText={setReassignUid}
            placeholder="User UID"
          />
          <Button title="Confirm reassign" onPress={handleReassign} loading={busy} />
          <Button title="Cancel" variant="ghost" onPress={() => setReassignTaskId(null)} />
        </View>
      ) : null}

      {open ? (
        <View style={styles.footerActions}>
          {showNotifyBattalion ? (
            <Button
              title="Notify battalion command"
              variant="secondary"
              onPress={handleNotifyBattalion}
              loading={busy}
            />
          ) : null}
          {canResolve ? (
            <Button title="Resolve emergency" variant="danger" onPress={handleResolve} loading={busy} />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: { ...typography.title, color: '#FFF', marginBottom: 4 },
  headerMeta: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  headerBody: { ...typography.body, color: '#FFF', marginTop: 8 },
  placeholderNote: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 10,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: spacing.md,
  },
  taskCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  taskTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  taskLabel: { ...typography.headline, flex: 1 },
  taskInstructions: { ...typography.callout, marginBottom: 8 },
  claimed: { ...typography.caption, marginBottom: 8 },
  taskActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  reassignBox: { marginVertical: spacing.md, gap: 8 },
  footerActions: { gap: 10, marginTop: spacing.lg, marginBottom: spacing.xl },
});
