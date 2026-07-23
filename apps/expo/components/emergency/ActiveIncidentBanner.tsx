import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { getEffectiveOrganizationalAssignment } from '@countcard/core/utils/effectiveOrgAssignment';
import {
  acknowledgeIncidentAlert,
  subscribeActiveIncidentAlertsForBattalion,
} from '@countcard/firebase/services/incidentAlerts';
import type { IncidentAlert } from '@countcard/core/types/models';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { palette, spacing, typography } from '@/constants/theme';

/**
 * Full-width banner when the signed-in user is on an active alert’s notify list
 * (company CoC, or battalion leadership after CO escalate).
 */
export function ActiveIncidentBanner() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const [alerts, setAlerts] = useState<IncidentAlert[]>([]);
  const org = getEffectiveOrganizationalAssignment(appUser);
  const battalion = org?.battalion;

  useEffect(() => {
    if (!battalion || !user) {
      setAlerts([]);
      return;
    }
    return subscribeActiveIncidentAlertsForBattalion(battalion, setAlerts);
  }, [battalion, user?.uid]);

  const forMe = useMemo(() => {
    if (!user) return [];
    return alerts.filter((a) => a.notifiedUserIds?.includes(user.uid));
  }, [alerts, user]);

  const primary = useMemo(() => {
    if (!user) return null;
    return (
      forMe.find((a) => !a.acknowledgedBy?.some((x) => x.userId === user.uid)) ??
      forMe[0] ??
      null
    );
  }, [forMe, user]);

  if (!primary || !user) return null;

  const needsAck = !primary.acknowledgedBy?.some((x) => x.userId === user.uid);

  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Pressable
        style={styles.banner}
        onPress={() => router.push(`/emergency/${primary.id}` as Href)}
      >
        <Text style={styles.title}>EMERGENCY ACTIVE</Text>
        <Text style={styles.body} numberOfLines={2}>
          {primary.title}
        </Text>
        <Text style={styles.cta}>Tap for SOP commands →</Text>
      </Pressable>
      {needsAck ? (
        <Pressable
          style={styles.ack}
          onPress={() => {
            void acknowledgeIncidentAlert(primary.id, user.uid);
          }}
        >
          <Text style={styles.ackText}>Acknowledge</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: palette.marineRed,
    borderBottomWidth: 1,
    borderBottomColor: palette.marineRedDark,
  },
  banner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  body: {
    ...typography.callout,
    color: '#FFF',
    marginTop: 2,
  },
  cta: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  ack: {
    backgroundColor: palette.marineRedDark,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  ackText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
