import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { RecruitProfile, RecruitWeightEntry } from '@countcard/core/types/models';
import { weightEntryInputSchema } from '@countcard/core/validation/lifecycleSchemas';
import { computeRecruitWeightAnalytics } from '@countcard/core/utils/recruitWeightAnalytics';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import type { AppUser } from '@countcard/core/types/auth';
import {
  addRecruitWeightEntry,
  listRecruitWeightEntries,
} from '@countcard/firebase/services/recruitWeight';
import { WeightTrendChart } from '@/components/charts/WeightTrendChart';
import { Button, Input, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

function toMillis(value: Date | { toMillis(): number } | undefined): number {
  if (!value) return Date.now();
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}

function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface RecruitWeightSectionProps {
  recruit: RecruitProfile;
  appUser: AppUser | null;
  userId: string;
}

export function RecruitWeightSection({ recruit, appUser, userId }: RecruitWeightSectionProps) {
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(windowWidth - 72, 280);
  const [entries, setEntries] = useState<RecruitWeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canEdit = useMemo(
    () => (appUser ? canEditRecruit(appUser, recruit).allowed : false),
    [appUser, recruit]
  );

  const legacySeed = useMemo(() => {
    if (recruit.weightPounds == null) return undefined;
    return {
      weightPounds: recruit.weightPounds,
      recordedAtMs: toMillis(recruit.createdAt),
    };
  }, [recruit.createdAt, recruit.weightPounds]);

  const analytics = useMemo(
    () => computeRecruitWeightAnalytics(entries, entries.length === 0 ? legacySeed : undefined),
    [entries, legacySeed]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await listRecruitWeightEntries(recruit.recruitId);
      setEntries(items);
    } finally {
      setLoading(false);
    }
  }, [recruit.recruitId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddWeighIn() {
    if (!canEdit) return;
    setError(null);

    const parsed = weightEntryInputSchema.safeParse({
      weightPounds: weightInput ? Number(weightInput) : undefined,
      notes: notesInput.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid weight');
      return;
    }

    setSaving(true);
    try {
      await addRecruitWeightEntry(recruit.recruitId, {
        weightPounds: parsed.data.weightPounds,
        recordedBy: userId,
        notes: parsed.data.notes,
      });
      setWeightInput('');
      setNotesInput('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to record weigh-in');
    } finally {
      setSaving(false);
    }
  }

  const history = useMemo(
    () => [...entries].sort((a, b) => toMillis(b.recordedAt) - toMillis(a.recordedAt)),
    [entries]
  );

  return (
    <>
      <SectionHeader title="Weight tracking" subtitle="Each weigh-in is appended to build progress over time" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        {loading ? (
          <Text style={{ color: theme.colors.textMuted }}>Loading weigh-ins…</Text>
        ) : (
          <>
            <WeightTrendChart
              points={analytics.points}
              width={chartWidth}
              lineColor={theme.colors.primary}
              labelColor={theme.colors.textMuted}
              gridColor={theme.colors.border}
            />

            {analytics.points.length > 0 ? (
              <View style={styles.statsRow}>
                <Stat label="Latest" value={`${analytics.latest ?? '—'} lbs`} theme={theme} />
                <Stat
                  label="Change"
                  value={
                    analytics.changeFromFirst != null
                      ? `${analytics.changeFromFirst > 0 ? '+' : ''}${analytics.changeFromFirst} lbs`
                      : '—'
                  }
                  theme={theme}
                />
                <Stat label="Min" value={`${analytics.min ?? '—'} lbs`} theme={theme} />
                <Stat label="Max" value={`${analytics.max ?? '—'} lbs`} theme={theme} />
              </View>
            ) : null}
          </>
        )}
      </View>

      {canEdit ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Record weigh-in</Text>
          <Input
            label="Weight (lbs)"
            value={weightInput}
            onChangeText={setWeightInput}
            keyboardType="number-pad"
            placeholder="e.g. 185"
          />
          <Input
            label="Notes (optional)"
            value={notesInput}
            onChangeText={setNotesInput}
            placeholder="Morning weigh-in"
          />
          {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
          <Button
            title={saving ? 'Saving…' : 'Append weigh-in'}
            onPress={() => void handleAddWeighIn()}
            disabled={saving || !weightInput.trim()}
          />
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Weigh-in history</Text>
        {history.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No weigh-ins recorded yet.</Text>
        ) : (
          history.map((entry) => (
            <View key={entry.entryId} style={[styles.historyRow, { borderColor: theme.colors.border }]}>
              <Text style={[styles.historyWeight, { color: theme.colors.text }]}>
                {entry.weightPounds} lbs
              </Text>
              <Text style={[styles.historyMeta, { color: theme.colors.textMuted }]}>
                {formatDateTime(toMillis(entry.recordedAt))}
              </Text>
              {entry.notes ? (
                <Text style={[styles.historyNotes, { color: theme.colors.textSecondary }]}>{entry.notes}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </>
  );
}

function Stat({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  stat: {
    minWidth: 72,
    gap: 2,
  },
  statLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
  },
  statValue: {
    ...typography.headline,
    fontSize: 14,
  },
  error: {
    ...typography.caption,
  },
  historyRow: {
    borderBottomWidth: 1,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  historyWeight: {
    ...typography.headline,
    fontSize: 15,
  },
  historyMeta: {
    ...typography.caption,
  },
  historyNotes: {
    ...typography.body,
    fontSize: 13,
  },
});
