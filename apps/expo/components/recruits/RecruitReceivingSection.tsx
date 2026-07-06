import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { RecruitProfile } from '@countcard/core/types/models';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import type { AppUser } from '@countcard/core/types/auth';
import {
  formatFitnessScore,
  formatReceivingUrinalysis,
} from '@countcard/core/utils/recruitProgressSummary';
import { receivingUrinalysisResultSchema } from '@countcard/core/validation/lifecycleSchemas';
import { updateRecruitProfile } from '@countcard/firebase/services/recruits';
import { Button, Input, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

type UrinalysisResult = 'pass' | 'fail' | 'pending';

const URINALYSIS_OPTIONS: { value: UrinalysisResult; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'pass', label: 'Pass' },
  { value: 'fail', label: 'Fail' },
];

function ResultPicker({
  value,
  onChange,
}: {
  value: UrinalysisResult;
  onChange: (value: UrinalysisResult) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.pickerWrap}>
      <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>Result</Text>
      <View style={styles.pickerGrid}>
        {URINALYSIS_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.pickerChip,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.pickerChipText,
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

interface RecruitReceivingSectionProps {
  recruit: RecruitProfile;
  appUser: AppUser | null;
  userId: string;
  onUpdated?: () => void;
}

export function RecruitReceivingSection({
  recruit,
  appUser,
  userId,
  onUpdated,
}: RecruitReceivingSectionProps) {
  const theme = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [istPullUps, setIstPullUps] = useState('');
  const [istPlank, setIstPlank] = useState('');
  const [istRunMin, setIstRunMin] = useState('');
  const [istRunSec, setIstRunSec] = useState('');
  const [istPass, setIstPass] = useState<'' | 'pass' | 'fail'>('');
  const [urinalysisResult, setUrinalysisResult] = useState<UrinalysisResult>('pending');
  const [urinalysisNotes, setUrinalysisNotes] = useState('');

  const canEdit = useMemo(() => {
    if (!appUser) return false;
    if (canEditRecruit(appUser, recruit).allowed) return true;
    if (!canPerformReceivingWorkflow(appUser)) return false;
    return recruit.custodyPhase === 'receiving' || recruit.custodyPhase === 'receiving_ready';
  }, [appUser, recruit]);

  const resetForm = useCallback(() => {
    const ist = recruit.initialIst;
    setIstPullUps(ist?.pullUps != null ? String(ist.pullUps) : '');
    setIstPlank(ist?.plankSeconds != null ? String(ist.plankSeconds) : '');
    setIstRunMin(ist?.runMinutes != null ? String(ist.runMinutes) : '');
    setIstRunSec(ist?.runSeconds != null ? String(ist.runSeconds) : '');
    setIstPass(ist?.pass === true ? 'pass' : ist?.pass === false ? 'fail' : '');
    setUrinalysisResult(recruit.receivingUrinalysis?.result ?? 'pending');
    setUrinalysisNotes(recruit.receivingUrinalysis?.notes ?? '');
  }, [recruit.initialIst, recruit.receivingUrinalysis]);

  function startEditing() {
    resetForm();
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!canEdit) return;
    setSaving(true);
    setError(null);

    try {
      const hasIstInput =
        istPullUps.trim() ||
        istPlank.trim() ||
        istRunMin.trim() ||
        istRunSec.trim() ||
        istPass;
      const initialIst = hasIstInput
        ? {
            pullUps: istPullUps.trim() ? Number(istPullUps) : undefined,
            plankSeconds: istPlank.trim() ? Number(istPlank) : undefined,
            runMinutes: istRunMin.trim() ? Number(istRunMin) : undefined,
            runSeconds: istRunSec.trim() ? Number(istRunSec) : undefined,
            pass: istPass === 'pass' ? true : istPass === 'fail' ? false : undefined,
            recordedAt: recruit.initialIst?.recordedAt ?? new Date(),
          }
        : undefined;

      const urinalysisParsed = receivingUrinalysisResultSchema.safeParse(urinalysisResult);
      if (!urinalysisParsed.success) {
        setError('Select a valid urinalysis result');
        setSaving(false);
        return;
      }

      const receivingUrinalysis =
        urinalysisResult !== 'pending' || urinalysisNotes.trim()
          ? {
              result: urinalysisParsed.data,
              notes: urinalysisNotes.trim() || undefined,
              recordedAt: recruit.receivingUrinalysis?.recordedAt ?? new Date(),
            }
          : undefined;

      await updateRecruitProfile(
        recruit.recruitId,
        {
          recruitId: recruit.recruitId,
          initialIst,
          receivingUrinalysis,
          updatedBy: userId,
        },
        userId
      );

      setEditing(false);
      onUpdated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save receiving data');
    } finally {
      setSaving(false);
    }
  }

  const istDisplay = formatFitnessScore(recruit.initialIst, { multiline: true });
  const urinalysisDisplay = formatReceivingUrinalysis(recruit.receivingUrinalysis);

  return (
    <>
      <SectionHeader title="Receiving" subtitle="IST and urinalysis at intake" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>IST</Text>
        <Text style={[styles.value, styles.multilineValue, { color: theme.colors.text }]}>
          {istDisplay ?? '—'}
        </Text>

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Urinalysis</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{urinalysisDisplay ?? '—'}</Text>

        {canEdit && !editing ? (
          <Button title="Edit receiving data" variant="secondary" onPress={startEditing} />
        ) : null}
      </View>

      {canEdit && editing ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>IST scores</Text>
          <Input
            label="Pull-ups"
            value={istPullUps}
            onChangeText={setIstPullUps}
            keyboardType="number-pad"
            placeholder="e.g. 4"
          />
          <Input
            label="Plank (seconds)"
            value={istPlank}
            onChangeText={setIstPlank}
            keyboardType="number-pad"
            placeholder="e.g. 90"
          />
          <View style={styles.runRow}>
            <View style={styles.runField}>
              <Input
                label="1.5 mi run (min)"
                value={istRunMin}
                onChangeText={setIstRunMin}
                keyboardType="number-pad"
                placeholder="13"
              />
            </View>
            <View style={styles.runField}>
              <Input
                label="Run (sec)"
                value={istRunSec}
                onChangeText={setIstRunSec}
                keyboardType="number-pad"
                placeholder="30"
              />
            </View>
          </View>
          <View style={styles.pickerWrap}>
            <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>IST pass / fail</Text>
            <View style={styles.pickerGrid}>
              {(['', 'pass', 'fail'] as const).map((option) => {
                const selected = istPass === option;
                const label = option === '' ? '—' : option === 'pass' ? 'Pass' : 'Fail';
                return (
                  <Pressable
                    key={option || 'none'}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setIstPass(option)}
                    style={({ pressed }) => [
                      styles.pickerChip,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        opacity: pressed ? 0.88 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerChipText,
                        { color: selected ? theme.colors.onPrimary : theme.colors.text },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: spacing.sm }]}>
            Urinalysis
          </Text>
          <ResultPicker value={urinalysisResult} onChange={setUrinalysisResult} />
          <Input
            label="Notes"
            value={urinalysisNotes}
            onChangeText={setUrinalysisNotes}
            placeholder="Optional notes"
          />

          {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={() => setEditing(false)} disabled={saving} />
            <Button title={saving ? 'Saving…' : 'Save'} onPress={() => void handleSave()} disabled={saving} />
          </View>
        </View>
      ) : null}
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
  pickerWrap: {
    marginBottom: spacing.sm,
  },
  pickerLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 2,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pickerChip: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerChipText: {
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
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
  },
});
