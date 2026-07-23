import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { getEffectiveOrganizationalAssignment } from '@countcard/core/utils/effectiveOrgAssignment';
import { listIncidentAlertsForBattalion } from '@countcard/firebase/services/incidentAlerts';
import type { IncidentAlert } from '@countcard/core/types/models';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, Button, EmptyState, SectionHeader, StatusBadge } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { palette, radius, spacing, typography, cardShadow } from '@/constants/theme';

export default function EmergencyListScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const [alerts, setAlerts] = useState<IncidentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const org = getEffectiveOrganizationalAssignment(appUser);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!org?.battalion) {
        setAlerts([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const items = await listIncidentAlertsForBattalion(org.battalion);
        if (!cancelled) setAlerts(items);
      } catch {
        if (!cancelled) setAlerts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [org?.battalion]);

  const visible = useMemo(() => {
    if (!user) return [];
    return alerts.filter((a) => a.notifiedUserIds?.includes(user.uid));
  }, [alerts, user]);

  return (
    <Screen scroll>
      <SectionHeader
        title="Emergency alerts"
        subtitle="Alerts where you are on the company CoC notify list"
      />
      <Button
        title="Start emergency"
        variant="danger"
        onPress={() => router.push('/emergency/new' as Href)}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={theme.colors.primary} />
      ) : !org?.battalion ? (
        <EmptyState
          title="Assignment required"
          message="Set your battalion in profile to view emergency alerts."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No alerts"
          message="No emergency alerts for your notify chain yet."
        />
      ) : (
        <View style={styles.list}>
          {visible.map((a) => {
            const open = a.workflowState === 'active' || a.workflowState === 'escalated';
            return (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/emergency/${a.id}` as Href)}
                style={[
                  styles.card,
                  {
                    backgroundColor: open ? palette.marineRed : theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                  !open && cardShadow(theme.scheme),
                ]}
              >
                <View style={styles.cardTop}>
                  <Text
                    style={[styles.cardTitle, { color: open ? '#FFF' : theme.colors.text }]}
                    numberOfLines={2}
                  >
                    {a.title}
                  </Text>
                  <StatusBadge
                    label={a.workflowState}
                    tone={open ? 'error' : 'default'}
                  />
                </View>
                <Text
                  style={[styles.cardMeta, { color: open ? 'rgba(255,255,255,0.85)' : theme.colors.textMuted }]}
                >
                  {a.incidentType.replace(/_/g, ' ')} · {a.escalationLevel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { marginTop: spacing.lg, gap: 10, marginBottom: spacing.xl },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: { ...typography.headline, flex: 1 },
  cardMeta: { ...typography.caption },
});
