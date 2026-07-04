import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getRecruitById } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { Screen, StatusBadge, SectionHeader } from '@/components/ui';
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
  const theme = useAppTheme();
  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getRecruitById(id)
      .then(setRecruit)
      .finally(() => setLoading(false));
  }, [id]);

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

      <SectionHeader title="Assignment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <DetailField label="Platoon" value={recruit.platoon} />
        <DetailField label="Squad" value={recruit.squad} />
        <DetailField label="Series" value={recruit.series} />
      </View>
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
  card: { borderRadius: radius.lg, padding: spacing.xl, gap: 16 },
  field: { gap: 4 },
  fieldLabel: { ...typography.overline, textTransform: 'none', letterSpacing: 0 },
  fieldValue: { ...typography.body, fontWeight: '500' },
});
