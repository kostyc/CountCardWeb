import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { RecruitProfile, RecruitProgressEvent } from '@countcard/core/types/models';
import type { ProgressEventType } from '@countcard/core/validation/lifecycleSchemas';
import {
  formatFitnessScore,
  formatProgressEventDisplay,
  isFitnessScoreEventType,
} from '@countcard/core/utils/recruitProgressSummary';
import { PROGRESS_EVENT_ORDER, progressEventLabel } from '@countcard/core/constants/progressEvents';
import { canEditRecruitProgress } from '@countcard/core/permissions/lifecycle';
import type { AppUser } from '@countcard/core/types/auth';
import {
  addRecruitProgressEvent,
  listRecruitProgressEvents,
} from '@countcard/firebase/services/recruitProgress';
import { Button, Input, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

const EVENT_TYPES: { value: ProgressEventType; label: string }[] = PROGRESS_EVENT_ORDER.map(
  (value) => ({ value, label: progressEventLabel(value) })
);

const PROGRESS_SUMMARY_FIELDS: { key: ProgressEventType; label: string }[] = [
  { key: 'initial_drill', label: 'IST' },
  { key: 'initial_pft', label: 'Initial PFT' },
  { key: 'initial_cft', label: 'Initial CFT' },
  { key: 'final_pft', label: 'Final PFT' },
  { key: 'final_cft', label: 'Final CFT' },
  { key: 'final_drill', label: 'Final Drill' },
  { key: 'final_inspection', label: 'Final Inspection' },
  { key: 'initial_inspection', label: 'Initial Inspection' },
  { key: 'bn_co_inspection', label: 'Bn Co Inspection' },
  { key: 'general_comment', label: 'Comments' },
];

function toMillis(value: Date | { toMillis(): number } | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}

function EventTypePicker({
  value,
  onChange,
}: {
  value: ProgressEventType;
  onChange: (value: ProgressEventType) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.eventTypeWrap}>
      <Text style={[styles.eventTypeLabel, { color: theme.colors.textSecondary }]}>Event type</Text>
      <View style={styles.eventTypeGrid}>
        {EVENT_TYPES.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.eventTypeChip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.eventTypeChipText,
                  { color: selected ? theme.colors.onPrimary : theme.colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PassFailPicker({
  value,
  onChange,
}: {
  value: '' | 'pass' | 'fail';
  onChange: (value: '' | 'pass' | 'fail') => void;
}) {
  const theme = useAppTheme();
  const options: { value: '' | 'pass' | 'fail'; label: string }[] = [
    { value: '', label: '—' },
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail' },
  ];

  return (
    <View style={styles.eventTypeWrap}>
      <Text style={[styles.eventTypeLabel, { color: theme.colors.textSecondary }]}>Pass / fail</Text>
      <View style={styles.eventTypeGrid}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value || 'none'}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.passFailChip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.eventTypeChipText,
                  { color: selected ? theme.colors.onPrimary : theme.colors.text },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

interface RecruitProgressSectionProps {
  recruit: RecruitProfile;
  appUser: AppUser | null;
  userId: string;
}

export function RecruitProgressSection({ recruit, appUser, userId }: RecruitProgressSectionProps) {
  const theme = useAppTheme();
  const [events, setEvents] = useState<RecruitProgressEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState<ProgressEventType>('initial_drill');
  const [eventNotes, setEventNotes] = useState('');
  const [scorePullUps, setScorePullUps] = useState('');
  const [scorePlank, setScorePlank] = useState('');
  const [scoreCrunches, setScoreCrunches] = useState('');
  const [scoreRunMin, setScoreRunMin] = useState('');
  const [scoreRunSec, setScoreRunSec] = useState('');
  const [scoreTotal, setScoreTotal] = useState('');
  const [passFail, setPassFail] = useState<'' | 'pass' | 'fail'>('');

  const canEdit = useMemo(
    () => (appUser ? canEditRecruitProgress(appUser, recruit) : false),
    [appUser, recruit]
  );

  const latestEventsByType = useMemo(() => {
    const latest = new Map<ProgressEventType, RecruitProgressEvent>();
    for (const event of events) {
      const existing = latest.get(event.type);
      if (!existing || toMillis(event.recordedAt) >= toMillis(existing.recordedAt)) {
        latest.set(event.type, event);
      }
    }
    return latest;
  }, [events]);

  const showFitnessFields = isFitnessScoreEventType(eventType);
  const showPassFail =
    eventType.includes('inspection') || eventType === 'hike' || isFitnessScoreEventType(eventType);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const ev = await listRecruitProgressEvents(recruit.recruitId);
      setEvents(ev);
    } finally {
      setLoading(false);
    }
  }, [recruit.recruitId]);

  useEffect(() => {
    void load();
  }, [load]);

  function clearScoreFields() {
    setScorePullUps('');
    setScorePlank('');
    setScoreCrunches('');
    setScoreRunMin('');
    setScoreRunSec('');
    setScoreTotal('');
    setPassFail('');
  }

  function handleEventTypeChange(next: ProgressEventType) {
    setEventType(next);
    clearScoreFields();
  }

  function buildScoresPayload(): Record<string, unknown> | undefined {
    const scores: Record<string, unknown> = {};
    if (scorePullUps.trim()) scores.pullUps = Number(scorePullUps);
    if (scorePlank.trim()) scores.plankSeconds = Number(scorePlank);
    if (scoreCrunches.trim()) scores.crunches = Number(scoreCrunches);
    if (scoreRunMin.trim()) scores.runMinutes = Number(scoreRunMin);
    if (scoreRunSec.trim()) scores.runSeconds = Number(scoreRunSec);
    if (scoreTotal.trim()) scores.totalScore = Number(scoreTotal);
    if (passFail === 'pass') scores.pass = true;
    if (passFail === 'fail') scores.pass = false;
    return Object.keys(scores).length > 0 ? scores : undefined;
  }

  function canSubmitEvent(): boolean {
    return Boolean(buildScoresPayload() || passFail || eventNotes.trim());
  }

  async function handleAddEvent() {
    if (!canEdit || !canSubmitEvent()) return;
    setSaving(true);
    try {
      await addRecruitProgressEvent(recruit.recruitId, {
        type: eventType,
        recordedBy: userId,
        scores: buildScoresPayload(),
        passFail: passFail === 'pass' ? true : passFail === 'fail' ? false : undefined,
        notes: eventNotes.trim() || undefined,
      });
      setEventNotes('');
      clearScoreFields();
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionHeader title="Fitness & progress" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>IST (profile)</Text>
        <Text style={[styles.value, styles.multilineValue, { color: theme.colors.text }]}>
          {formatFitnessScore(recruit.initialIst, { multiline: true }) ?? '—'}
        </Text>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Initial PFT (profile)</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatFitnessScore(recruit.initialPft, { multiline: true }) ?? '—'}
        </Text>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Initial CFT (profile)</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>
          {formatFitnessScore(recruit.initialCft, { multiline: true }) ?? '—'}
        </Text>

        {PROGRESS_SUMMARY_FIELDS.map(({ key, label }) => {
          const event = latestEventsByType.get(key);
          const display = event
            ? formatProgressEventDisplay(event, { multiline: true })
            : undefined;
          if (!display) return null;
          return (
            <View key={key}>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
              <Text style={[styles.value, styles.multilineValue, { color: theme.colors.text }]}>
                {display}
              </Text>
            </View>
          );
        })}
      </View>

      {canEdit ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Record progress event</Text>
          <EventTypePicker value={eventType} onChange={handleEventTypeChange} />
          {showFitnessFields ? (
            <>
              <Input
                label="Pull-ups"
                value={scorePullUps}
                onChangeText={setScorePullUps}
                keyboardType="number-pad"
                placeholder="e.g. 20"
              />
              <Input
                label="Plank (seconds)"
                value={scorePlank}
                onChangeText={setScorePlank}
                keyboardType="number-pad"
                placeholder="e.g. 210"
              />
              <Input
                label="Crunches"
                value={scoreCrunches}
                onChangeText={setScoreCrunches}
                keyboardType="number-pad"
              />
              <View style={styles.runRow}>
                <View style={styles.runField}>
                  <Input
                    label="Run (min)"
                    value={scoreRunMin}
                    onChangeText={setScoreRunMin}
                    keyboardType="number-pad"
                    placeholder="9"
                  />
                </View>
                <View style={styles.runField}>
                  <Input
                    label="Run (sec)"
                    value={scoreRunSec}
                    onChangeText={setScoreRunSec}
                    keyboardType="number-pad"
                    placeholder="45"
                  />
                </View>
              </View>
              <Input
                label="Total score"
                value={scoreTotal}
                onChangeText={setScoreTotal}
                keyboardType="number-pad"
                placeholder="Optional composite score"
              />
            </>
          ) : null}
          {showPassFail ? <PassFailPicker value={passFail} onChange={setPassFail} /> : null}
          <Input
            label="Notes"
            value={eventNotes}
            onChangeText={setEventNotes}
            placeholder="Optional notes"
          />
          <Button
            title={saving ? 'Saving…' : 'Record event'}
            onPress={() => void handleAddEvent()}
            disabled={saving || !canSubmitEvent()}
          />
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Progress timeline</Text>
        {loading ? (
          <Text style={{ color: theme.colors.textMuted }}>Loading…</Text>
        ) : events.length === 0 ? (
          <Text style={{ color: theme.colors.textMuted }}>No progress events recorded.</Text>
        ) : (
          events.map((event) => {
            const display =
              formatProgressEventDisplay(event, { multiline: true }) ?? 'Recorded';
            return (
              <View key={event.eventId} style={styles.eventRow}>
                <Text style={[styles.eventType, { color: theme.colors.text }]}>
                  {progressEventLabel(event.type)}
                </Text>
                <Text style={[styles.eventNotes, { color: theme.colors.textSecondary }]}>{display}</Text>
              </View>
            );
          })
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    textTransform: 'uppercase',
  },
  value: {
    ...typography.body,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  multilineValue: {
    lineHeight: 20,
  },
  eventRow: {
    gap: 2,
    marginBottom: spacing.sm,
  },
  eventType: {
    ...typography.headline,
    fontSize: 14,
  },
  eventNotes: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 18,
  },
  eventTypeWrap: {
    marginBottom: spacing.base,
  },
  eventTypeLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  eventTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  eventTypeChip: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  passFailChip: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  eventTypeChipText: {
    ...typography.callout,
    fontWeight: '600',
  },
  runRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  runField: {
    flex: 1,
  },
});
