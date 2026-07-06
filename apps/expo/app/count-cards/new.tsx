import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { checkPermission } from '@countcard/core/permissions/utils';
import { countCardCreateSchema } from '@countcard/core/validation/countCardSchemas';
import { createCountCard } from '@countcard/firebase/services/countCards';
import { getRecruitsByPlatoon } from '@countcard/firebase/services/recruits';
import type { RecruitProfile } from '@countcard/core/types/models';
import { formatEdipiForDisplay } from '@countcard/core/utils/recruitEdipi';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, Button, Input, Select, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

type AccountabilityStatus = 'present' | 'absent' | 'excused' | 'medical' | 'other';

interface RecruitEntry {
  recruitId: string;
  recruit: RecruitProfile;
  status: AccountabilityStatus;
  notes?: string;
}

const STATUS_OPTIONS: { value: AccountabilityStatus; label: string }[] = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'excused', label: 'Excused' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

function generateCountCardId(): string {
  return `CC-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export default function NewCountCardScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();

  const userPlatoon =
    appUser?.customClaims?.organizationalAssignment?.platoon ||
    appUser?.profile?.organizationalAssignment?.platoon;
  const userOrg =
    appUser?.customClaims?.organizationalAssignment ||
    appUser?.profile?.organizationalAssignment;

  const canCreate = checkPermission(appUser, 'create_count_card');

  const [location, setLocation] = useState('');
  const [availableRecruits, setAvailableRecruits] = useState<RecruitProfile[]>([]);
  const [entries, setEntries] = useState<RecruitEntry[]>([]);
  const [loadingRecruits, setLoadingRecruits] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appUser && !canCreate.allowed) {
      Alert.alert('Access denied', 'You do not have permission to create count cards.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/count-cards') },
      ]);
    }
  }, [appUser, canCreate.allowed, router]);

  useEffect(() => {
    if (!userPlatoon) return;
    setLoadingRecruits(true);
    getRecruitsByPlatoon(userPlatoon, { pageSize: 500 })
      .then((result) => {
        setAvailableRecruits(result.items);
        setEntries(
          result.items.map((recruit) => ({
            recruitId: recruit.recruitId,
            recruit,
            status: 'present' as AccountabilityStatus,
          }))
        );
      })
      .finally(() => setLoadingRecruits(false));
  }, [userPlatoon]);

  function updateEntry(recruitId: string, patch: Partial<RecruitEntry>) {
    setEntries((prev) => prev.map((e) => (e.recruitId === recruitId ? { ...e, ...patch } : e)));
  }

  async function persistCountCard(workflowState: 'submitted' | 'draft') {
    if (!user || !userPlatoon || !userOrg) return;

    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const countCardId = generateCountCardId();
      const timestamp = new Date();
      const recruitCounts: Record<string, number> = {};
      entries.forEach((entry) => {
        recruitCounts[entry.status] = (recruitCounts[entry.status] || 0) + 1;
      });

      const workflowHistory = [
        {
          state: workflowState,
          timestamp: Timestamp.now(),
          userId: user.uid,
          notes:
            workflowState === 'draft'
              ? 'Count card saved as draft'
              : 'Count card submitted to Duty Senior Drill Instructor',
        },
      ];

      const validationResult = countCardCreateSchema.safeParse({
        countCardId,
        platoon: userPlatoon,
        company: userOrg.company || '',
        battalion: userOrg.battalion || '',
        regiment: userOrg.regiment,
        status: 'pending',
        workflowState,
        submittedBy: user.uid,
        location: workflowState === 'draft' && !location.trim() ? 'Draft' : location.trim(),
        timestamp,
        recruitCounts,
        workflowHistory,
      });

      if (!validationResult.success) {
        const next: Record<string, string> = {};
        validationResult.error.issues.forEach((issue) => {
          next[String(issue.path[0])] = issue.message;
        });
        setFieldErrors(next);
        setSubmitting(false);
        return;
      }

      if (entries.length === 0) {
        setFieldErrors({ recruits: 'Select at least one recruit' });
        setSubmitting(false);
        return;
      }

      await createCountCard(
        countCardId,
        {
          countCardId,
          platoon: userPlatoon,
          company: userOrg.company || '',
          battalion: userOrg.battalion || '',
          regiment: userOrg.regiment,
          status: 'pending',
          workflowState,
          submittedBy: user.uid,
          location: workflowState === 'draft' && !location.trim() ? 'Draft' : location.trim(),
          timestamp,
          recruitCounts,
          workflowHistory,
          createdBy: user.uid,
        },
        user.uid
      );

      router.replace('/(tabs)/count-cards');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save count card');
      setSubmitting(false);
    }
  }

  if (appUser && !canCreate.allowed) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          You do not have permission to create count cards.
        </Text>
      </Screen>
    );
  }

  if (!userPlatoon) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          You must be assigned to a platoon to create count cards.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text style={[styles.intro, { color: theme.colors.textMuted }]}>
        Assign accountability status for each recruit in your platoon, then submit to your Duty
        Senior Drill Instructor.
      </Text>

      <SectionHeader title="Details" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Barracks, Chow Hall"
          error={fieldErrors.location}
        />
      </View>

      <SectionHeader title={`Recruits (${entries.length})`} subtitle={`Platoon ${userPlatoon}`} />
      {loadingRecruits ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 24 }} />
      ) : availableRecruits.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colors.textMuted }]}>
          No recruits found in your platoon.
        </Text>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          {entries.map((entry) => (
            <View key={entry.recruitId} style={[styles.recruitRow, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.recruitInfo}>
                <Text style={[styles.recruitName, { color: theme.colors.text }]}>
                  {entry.recruit.rank} {entry.recruit.lastName}, {entry.recruit.firstName}
                </Text>
                <Text style={[styles.recruitId, { color: theme.colors.textMuted }]}>
                  EDIPI {formatEdipiForDisplay(entry.recruit)}
                </Text>
              </View>
              <Select
                label="Status"
                value={entry.status}
                onChange={(v) => updateEntry(entry.recruitId, { status: v })}
                options={STATUS_OPTIONS}
              />
              {entry.status === 'other' ? (
                <Input
                  label="Notes (required for Other)"
                  value={entry.notes ?? ''}
                  onChangeText={(notes) => updateEntry(entry.recruitId, { notes })}
                />
              ) : null}
            </View>
          ))}
        </View>
      )}

      {fieldErrors.recruits ? (
        <Text style={[styles.error, { color: theme.colors.error }]}>{fieldErrors.recruits}</Text>
      ) : null}
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} disabled={submitting} />
        <Button
          title="Save draft"
          variant="secondary"
          onPress={() => persistCountCard('draft')}
          loading={submitting}
          disabled={entries.length === 0}
        />
        <Button
          title="Submit count card"
          onPress={() => persistCountCard('submitted')}
          loading={submitting}
          disabled={entries.length === 0 || !location.trim()}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { ...typography.body, marginBottom: spacing.base, lineHeight: 22 },
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 16,
  },
  recruitRow: { gap: 10, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  recruitInfo: { gap: 2 },
  recruitName: { ...typography.body, fontWeight: '600' },
  recruitId: { ...typography.caption },
  empty: { textAlign: 'center', marginVertical: 24 },
  error: { ...typography.body, marginBottom: spacing.sm },
  actions: { gap: 12, marginTop: spacing.sm, marginBottom: spacing.xl },
});
