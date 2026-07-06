import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { OrganizationalAssignment, Regiment } from '@countcard/core/types/auth';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import { isTrainingCustodyPhase } from '@countcard/core/constants/custodyPhase';
import {
  getRecruitProfileById,
} from '@countcard/firebase/services/recruits';
import { transferRecruit } from '@/lib/recruitTransferApi';
import { returnToRecruitProfile } from '@/lib/recruitNavigation';
import { validateOrganizationalAssignment } from '@countcard/firebase/services/organizations';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, Button, Input, Select, SectionHeader } from '@/components/ui';
import {
  REGIMENT_OPTIONS,
  BATTALIONS,
  BATTALION_COMPANIES,
  SERIES,
} from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';
import type { RecruitProfile } from '@countcard/core/types/models';

function formatAssignment(recruit: RecruitProfile): string {
  return [recruit.regiment, recruit.battalion, recruit.company, recruit.series, recruit.platoon]
    .filter(Boolean)
    .join(' / ');
}

export default function TransferRecruitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();

  const [recruit, setRecruit] = useState<RecruitProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [regiment, setRegiment] = useState<Regiment | ''>('');
  const [battalion, setBattalion] = useState<Battalion | ''>('');
  const [company, setCompany] = useState<Company | ''>('');
  const [series, setSeries] = useState<Series | ''>('');
  const [platoon, setPlatoon] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const companyOptions = battalion
    ? (BATTALION_COMPANIES[battalion] ?? []).map((c) => ({ value: c, label: c }))
    : [];

  const canTransfer = useMemo(() => {
    if (!appUser || !recruit) return false;
    if (recruit.custodyPhase && !isTrainingCustodyPhase(recruit.custodyPhase)) return false;
    return canEditRecruit(appUser, recruit).allowed;
  }, [appUser, recruit]);

  const goBackToRecruit = useCallback(() => {
    returnToRecruitProfile(router, id);
  }, [router, id]);

  useEffect(() => {
    if (!id) return;
    getRecruitProfileById(id)
      .then((data) => {
        if (!data) {
          setError('Recruit not found');
          return;
        }
        setRecruit(data);
        setRegiment(data.regiment ?? '');
        setBattalion((data.battalion as Battalion) ?? '');
        setCompany((data.company as Company) ?? '');
        setSeries((data.series as Series) ?? '');
        setPlatoon(data.platoon ?? '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recruit'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit() {
    if (!user || !id || !recruit) return;
    setSubmitting(true);
    setError(null);

    try {
      const assignment: OrganizationalAssignment = {
        regiment: regiment || undefined,
        battalion: battalion || undefined,
        company: company || undefined,
        series: series || undefined,
        platoon: platoon.trim(),
      };

      if (!platoon.trim()) {
        setError('Platoon is required');
        setSubmitting(false);
        return;
      }

      if (battalion && company) {
        const orgValidation = validateOrganizationalAssignment(assignment);
        if (!orgValidation.valid) {
          setError(orgValidation.error ?? 'Invalid organizational assignment');
          setSubmitting(false);
          return;
        }
      }

      await transferRecruit(id, assignment, user.uid, reason.trim() || undefined);
      goBackToRecruit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to transfer recruit');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          Loading…
        </Text>
      </Screen>
    );
  }

  if (!recruit || !canTransfer) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.error, textAlign: 'center', marginTop: 40 }}>
          {error ?? 'You do not have permission to transfer this recruit'}
        </Text>
      </Screen>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={goBackToRecruit}
              hitSlop={8}
              style={styles.headerBack}
              accessibilityRole="button"
              accessibilityLabel="Back to recruit profile"
            >
              <Text style={[styles.headerBackLabel, { color: theme.colors.headerText }]}>‹</Text>
            </Pressable>
          ),
        }}
      />
      <Screen scroll>
      <SectionHeader title="Transfer recruit" subtitle={`${recruit.lastName}, ${recruit.firstName}`} />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Current assignment</Text>
        <Text style={[styles.value, { color: theme.colors.text }]}>{formatAssignment(recruit)}</Text>
      </View>

      <SectionHeader title="New assignment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Select label="Regiment" value={regiment} onChange={setRegiment} options={REGIMENT_OPTIONS} placeholder="Select regiment" />
        <Select
          label="Battalion"
          value={battalion}
          onChange={(v) => {
            setBattalion(v);
            setCompany('');
          }}
          options={BATTALIONS.map((b) => ({ value: b, label: b }))}
          placeholder="Select battalion"
        />
        <Select label="Company" value={company} onChange={setCompany} options={companyOptions} placeholder="Select company" />
        <Select label="Series" value={series} onChange={setSeries} options={SERIES.map((s) => ({ value: s, label: s }))} placeholder="Select series" />
        <Input label="Platoon (4 digits)" value={platoon} onChangeText={setPlatoon} keyboardType="number-pad" maxLength={4} />
        <Input label="Reason (optional)" value={reason} onChangeText={setReason} placeholder="e.g. Reassigned to follow series" />
      </View>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={goBackToRecruit} disabled={submitting} />
        <Button title="Transfer recruit" onPress={handleSubmit} loading={submitting} />
      </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 14,
  },
  label: { ...typography.caption },
  value: { ...typography.body, fontWeight: '500' },
  error: { ...typography.body, marginBottom: spacing.sm },
  actions: { gap: 12, marginTop: spacing.sm, marginBottom: spacing.xl },
  headerBack: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBackLabel: {
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '300',
  },
});
