import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';
import { RECEIVING_DEFAULT_ASSIGNMENT, RECEIVING_PLATOON } from '@countcard/core/constants/custodyPhase';
import { buildReceivingCustodyFields } from '@countcard/core/import/receivingImport';
import { canPerformReceivingWorkflow } from '@countcard/core/permissions/adminAccess';
import { deriveRecruitDocumentId, normalizeEdipiDigits } from '@countcard/core/utils/recruitEdipi';
import { createRecruitProfile } from '@countcard/firebase/services/recruits';
import { addRecruitWeightEntry } from '@countcard/firebase/services/recruitWeight';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, Button, Input, Select, SectionHeader } from '@/components/ui';
import { RECRUIT_RANKS } from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';

export default function ReceivingIntakeScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();

  const [edipi, setEdipi] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rank, setRank] = useState<RecruitRank | ''>(DEFAULT_RECRUIT_RANK);
  const [heightInches, setHeightInches] = useState('');
  const [weightPounds, setWeightPounds] = useState('');
  const [istPullUps, setIstPullUps] = useState('');
  const [istPlankSeconds, setIstPlankSeconds] = useState('');
  const [istRunMin, setIstRunMin] = useState('');
  const [istRunSec, setIstRunSec] = useState('');
  const [initialPftPullUps, setInitialPftPullUps] = useState('');
  const [initialPftPlankSeconds, setInitialPftPlankSeconds] = useState('');
  const [initialCftTotal, setInitialCftTotal] = useState('');
  const [urinalysisResult, setUrinalysisResult] = useState<'pass' | 'fail' | 'pending'>('pending');
  const [urinalysisNotes, setUrinalysisNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canAccess = canPerformReceivingWorkflow(appUser);

  async function handleSubmit() {
    if (!user) return;

    const errors: Record<string, string> = {};
    const edipiDigits = normalizeEdipiDigits(edipi);
    if (!edipiDigits || edipiDigits.length !== 10) {
      errors.edipi = 'Enter a valid 10-digit EDIPI';
    }
    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!rank) errors.rank = 'Rank is required';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError(null);
    setSubmitting(true);

    try {
      const recruitDocId = deriveRecruitDocumentId(edipi);
      const receivingFields = buildReceivingCustodyFields();

      const parsedWeight = weightPounds ? Number(weightPounds) : undefined;

      await createRecruitProfile(
        recruitDocId,
        {
          recruitId: recruitDocId,
          edipi: edipiDigits || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          rank: rank as RecruitRank,
          status: 'active',
          regiment: 'West',
          battalion: RECEIVING_DEFAULT_ASSIGNMENT.battalion,
          company: RECEIVING_DEFAULT_ASSIGNMENT.company,
          platoon: RECEIVING_PLATOON,
          ...receivingFields,
          heightInches: heightInches ? Number(heightInches) : undefined,
          weightPounds: parsedWeight,
          initialIst:
            istPullUps || istPlankSeconds || istRunMin || istRunSec
              ? {
                  pullUps: istPullUps ? Number(istPullUps) : undefined,
                  plankSeconds: istPlankSeconds ? Number(istPlankSeconds) : undefined,
                  runMinutes: istRunMin ? Number(istRunMin) : undefined,
                  runSeconds: istRunSec ? Number(istRunSec) : undefined,
                  recordedAt: new Date(),
                }
              : undefined,
          initialPft:
            initialPftPullUps || initialPftPlankSeconds
              ? {
                  pullUps: initialPftPullUps ? Number(initialPftPullUps) : undefined,
                  plankSeconds: initialPftPlankSeconds ? Number(initialPftPlankSeconds) : undefined,
                  recordedAt: new Date(),
                }
              : undefined,
          initialCft: initialCftTotal
            ? { totalScore: Number(initialCftTotal), recordedAt: new Date() }
            : undefined,
          receivingUrinalysis:
            urinalysisResult !== 'pending' || urinalysisNotes.trim()
              ? {
                  result: urinalysisResult,
                  notes: urinalysisNotes.trim() || undefined,
                  recordedAt: new Date(),
                }
              : undefined,
          createdBy: user.uid,
        },
        user.uid
      );

      if (parsedWeight) {
        await addRecruitWeightEntry(recruitDocId, {
          weightPounds: parsedWeight,
          recordedBy: user.uid,
          notes: 'Receiving intake',
        });
      }

      router.replace(`/receiving/checklist/${recruitDocId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create recruit');
      setSubmitting(false);
    }
  }

  if (!canAccess && appUser) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          Receiving workflow access required.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="Receiving intake"
        subtitle="Add recruit at Support Battalion / Receiving Company"
      />

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="EDIPI"
          value={edipi}
          onChangeText={setEdipi}
          autoCapitalize="none"
          keyboardType="number-pad"
          error={fieldErrors.edipi}
        />
        <Input label="First name" value={firstName} onChangeText={setFirstName} error={fieldErrors.firstName} />
        <Input label="Last name" value={lastName} onChangeText={setLastName} error={fieldErrors.lastName} />
        <Select label="Rank" value={rank} onChange={setRank} options={RECRUIT_RANKS} placeholder="Select rank" />
        {fieldErrors.rank ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{fieldErrors.rank}</Text>
        ) : null}
        <Text style={[styles.lockedOrg, { color: theme.colors.textMuted }]}>
          Organization: West · Support · Receiving · platoon {RECEIVING_PLATOON} (locked)
        </Text>
      </View>

      <SectionHeader title="IST" subtitle="Initial Strength Test — first event at receiving" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="IST pull-ups"
          value={istPullUps}
          onChangeText={setIstPullUps}
          keyboardType="number-pad"
        />
        <Input
          label="IST plank (seconds)"
          value={istPlankSeconds}
          onChangeText={setIstPlankSeconds}
          keyboardType="number-pad"
        />
        <View style={styles.runRow}>
          <View style={styles.runField}>
            <Input
              label="IST 1.5 mi run (min)"
              value={istRunMin}
              onChangeText={setIstRunMin}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.runField}>
            <Input
              label="Run (sec)"
              value={istRunSec}
              onChangeText={setIstRunSec}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      <SectionHeader title="Initial PFT / CFT" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="Initial PFT pull-ups"
          value={initialPftPullUps}
          onChangeText={setInitialPftPullUps}
          keyboardType="number-pad"
        />
        <Input
          label="Initial PFT plank (seconds)"
          value={initialPftPlankSeconds}
          onChangeText={setInitialPftPlankSeconds}
          keyboardType="number-pad"
        />
        <Input
          label="Initial CFT total score"
          value={initialCftTotal}
          onChangeText={setInitialCftTotal}
          keyboardType="number-pad"
        />
      </View>

      <SectionHeader title="Physical" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="Height (inches)"
          value={heightInches}
          onChangeText={setHeightInches}
          keyboardType="number-pad"
        />
        <Input
          label="Weight (lbs)"
          value={weightPounds}
          onChangeText={setWeightPounds}
          keyboardType="number-pad"
        />
      </View>

      <SectionHeader title="Urinalysis" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.fieldLabel, { color: theme.colors.textSecondary }]}>Result</Text>
        <View style={styles.resultRow}>
          {(['pending', 'pass', 'fail'] as const).map((option) => {
            const selected = urinalysisResult === option;
            const label = option === 'pending' ? 'Pending' : option === 'pass' ? 'Pass' : 'Fail';
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setUrinalysisResult(option)}
                style={({ pressed }) => [
                  styles.resultChip,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.resultChipText,
                    { color: selected ? theme.colors.onPrimary : theme.colors.text },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Input
          label="Notes"
          value={urinalysisNotes}
          onChangeText={setUrinalysisNotes}
          placeholder="Optional"
        />
      </View>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={() => router.push('/receiving/transfers')} disabled={submitting} />
        <Button title="Add recruit" onPress={() => void handleSubmit()} loading={submitting} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 14,
  },
  lockedOrg: { ...typography.caption, marginTop: -4 },
  fieldError: { ...typography.caption, marginTop: -8, marginBottom: 8 },
  fieldLabel: { ...typography.caption, fontWeight: '600', marginBottom: 6 },
  runRow: { flexDirection: 'row', gap: 12 },
  runField: { flex: 1 },
  resultRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  resultChip: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  resultChipText: { ...typography.callout, fontWeight: '600' },
  error: { ...typography.body, marginBottom: spacing.sm },
  actions: { gap: 12, marginTop: spacing.sm, marginBottom: spacing.xl },
});
