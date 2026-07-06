import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getRecruitProfileById } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import { CUSTODY_PHASE_METADATA, isTrainingCustodyPhase } from '@countcard/core/constants/custodyPhase';
import {
  listRecruitProgressEvents,
  listRecruitComments,
} from '@countcard/firebase/services/recruitProgress';
import type { RecruitProgressEvent, RecruitComment } from '@countcard/core/types/models';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, StatusBadge, SectionHeader, Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

function DetailField({ label, value }: { label: string; value?: string | null }) {
  const theme = useAppTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.fieldValue, { color: theme.colors.text }]}>{value ?? '—'}</Text>
    </View>
  );
}

export default function RecruitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [progressEvents, setProgressEvents] = useState<RecruitProgressEvent[]>([]);
  const [comments, setComments] = useState<RecruitComment[]>([]);

  const canModify = useMemo(() => {
    if (!appUser || !recruit) return false;
    return canEditRecruit(appUser, recruit).allowed;
  }, [appUser, recruit]);

  const canTransfer = useMemo(() => {
    if (!canModify || !recruit) return false;
    return recruit.custodyPhase == null || isTrainingCustodyPhase(recruit.custodyPhase);
  }, [canModify, recruit]);

  const showProgress = recruit?.custodyPhase === 'training';

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      getRecruitProfileById(id)
        .then(async (data) => {
          setRecruit(data);
          if (data?.custodyPhase === 'training') {
            const [ev, cm] = await Promise.all([
              listRecruitProgressEvents(id),
              listRecruitComments(id),
            ]);
            setProgressEvents(ev);
            setComments(cm);
          } else {
            setProgressEvents([]);
            setComments([]);
          }
        })
        .finally(() => setLoading(false));
    }, [id])
  );

  if (loading) {
    return (
      <Screen padded={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!recruit) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          Recruit not found
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {recruit.rank} {recruit.lastName}, {recruit.firstName}
        </Text>
        <StatusBadge label={recruit.status ?? 'Unknown'} />
      </View>

      {canModify ? (
        <View style={styles.actions}>
          <Button title="Modify Recruit" onPress={() => router.push(`/recruits/${id}/edit`)} />
          {canTransfer ? (
            <Button title="Transfer Recruit" variant="secondary" onPress={() => router.push(`/recruits/${id}/transfer`)} />
          ) : null}
        </View>
      ) : null}

      {recruit.custodyPhase ? (
        <>
          <SectionHeader title="Custody" />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
            <DetailField
              label="Phase"
              value={CUSTODY_PHASE_METADATA[recruit.custodyPhase]?.label ?? recruit.custodyPhase}
            />
          </View>
        </>
      ) : null}

      <SectionHeader title="Identification" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField label="EDIPI" value={formatEdipiForDisplay(recruit)} />
      </View>

      <SectionHeader title="Equipment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField label="Weapons serial number" value={recruit.weaponsSerialNumber} />
        <DetailField label="RCO serial number" value={recruit.rcoSerialNumber} />
      </View>

      <SectionHeader title="Assignment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField label="Platoon" value={recruit.platoon} />
        <DetailField label="Squad" value={recruit.squad} />
        <DetailField label="Series" value={recruit.series} />
      </View>

      {showProgress ? (
        <>
          <SectionHeader title="Training progress" subtitle="Read-only on mobile; add events on web" />
          <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
            {progressEvents.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted }}>No progress events yet.</Text>
            ) : (
              progressEvents.slice(0, 8).map((ev) => (
                <Text key={ev.eventId} style={{ color: theme.colors.text, marginBottom: 6 }}>
                  {ev.type.replace(/_/g, ' ')}
                  {ev.notes ? ` — ${ev.notes}` : ''}
                </Text>
              ))
            )}
          </View>
          {comments.length > 0 ? (
            <>
              <SectionHeader title="Comments" />
              <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
                {comments.slice(0, 5).map((c) => (
                  <Text key={c.commentId} style={{ color: theme.colors.text, marginBottom: 8 }}>
                    {c.body}
                  </Text>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 12,
  },
  name: { ...typography.title },
  card: { borderRadius: radius.lg, padding: spacing.xl, gap: 16, marginBottom: spacing.base },
  field: { gap: 4 },
  fieldLabel: { ...typography.overline, textTransform: 'none', letterSpacing: 0 },
  fieldValue: { ...typography.body, fontWeight: '500' },
  actions: { gap: 12, marginBottom: spacing.base },
});
