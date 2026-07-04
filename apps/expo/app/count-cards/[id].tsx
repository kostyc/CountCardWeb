import { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getCountCardById } from '@countcard/firebase/services/countCards';
import type { CountCard } from '@countcard/core/types/models';
import { CountCardWorkflowActions } from '@/components/countCards/CountCardWorkflowActions';
import { CountCardWorkflowHistory } from '@/components/countCards/CountCardWorkflowHistory';
import { Screen, StatusBadge, SectionHeader } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
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

export default function CountCardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const [card, setCard] = useState<CountCard | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getCountCardById(id)
      .then(setCard)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return (
      <Screen padded={false}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!card) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          Count card not found
        </Text>
      </Screen>
    );
  }

  const orgPath = [card.regiment, card.battalion, card.company, card.series, card.platoon]
    .filter(Boolean)
    .join(' / ');

  const totalRecruits = card.recruitCounts
    ? Object.values(card.recruitCounts).reduce((sum, n) => sum + n, 0)
    : 0;

  return (
    <Screen scroll>
      <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.name, { color: theme.colors.text }]}>
          {card.location || 'Count Card'}
        </Text>
        <View style={styles.badges}>
          <StatusBadge label={card.status ?? '—'} />
          <StatusBadge label={card.workflowState ?? '—'} tone="warning" />
        </View>
      </View>

      <SectionHeader title="Details" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField
          label="Timestamp"
          value={
            card.timestamp instanceof Date
              ? card.timestamp.toLocaleString()
              : card.timestamp
                ? String(card.timestamp)
                : undefined
          }
        />
        <DetailField label="Organization" value={orgPath || undefined} />
        <DetailField label="Total recruits" value={String(totalRecruits)} />
        <DetailField label="Submitted by" value={card.submittedBy} />
      </View>

      <CountCardWorkflowActions countCard={card} appUser={appUser} onSuccess={reload} />
      <CountCardWorkflowHistory workflowHistory={card.workflowHistory ?? []} />
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
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  card: { borderRadius: radius.lg, padding: spacing.xl, gap: 16, marginBottom: spacing.base },
  field: { gap: 4 },
  fieldLabel: { ...typography.overline, textTransform: 'none', letterSpacing: 0 },
  fieldValue: { ...typography.body, fontWeight: '500' },
});
