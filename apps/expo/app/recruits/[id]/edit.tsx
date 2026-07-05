import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View, Text, StyleSheet, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import type { OrganizationalAssignment, Regiment } from '@countcard/core/types/auth';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import type { RecruitStatus } from '@countcard/core/validation/recruitSchemas';
import { recruitUpdateSchema } from '@countcard/core/validation/recruitSchemas';
import { normalizeEdipiDigits } from '@countcard/core/utils/recruitEdipi';
import { canEditRecruit } from '@countcard/core/permissions/recruits';
import {
  getRecruitProfileById,
  updateRecruitProfile,
} from '@countcard/firebase/services/recruits';
import { validateOrganizationalAssignment } from '@countcard/firebase/services/organizations';
import { returnToRecruitProfile } from '@/lib/recruitNavigation';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, Button, Input, Select, SectionHeader } from '@/components/ui';
import {
  RECRUIT_RANKS,
  REGIMENT_OPTIONS,
  BATTALIONS,
  BATTALION_COMPANIES,
  SERIES,
} from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';

const RECRUIT_STATUS_OPTIONS: { value: RecruitStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'transferred', label: 'Transferred' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'separated', label: 'Separated' },
  { value: 'medical_hold', label: 'Medical Hold' },
  { value: 'other', label: 'Other' },
];

function buildOrgAssignment(
  regiment: Regiment | '',
  battalion: Battalion | '',
  company: Company | '',
  series: Series | '',
  platoon: string
): OrganizationalAssignment {
  return {
    regiment: regiment || undefined,
    battalion: battalion || undefined,
    company: company || undefined,
    series: series || undefined,
    platoon: platoon || undefined,
  };
}

export default function ModifyRecruitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [edipi, setEdipi] = useState('');
  const [weaponsSerialNumber, setWeaponsSerialNumber] = useState('');
  const [rcoSerialNumber, setRcoSerialNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rank, setRank] = useState<RecruitRank | ''>('');
  const [status, setStatus] = useState<RecruitStatus | ''>('active');
  const [regiment, setRegiment] = useState<Regiment | ''>('');
  const [battalion, setBattalion] = useState<Battalion | ''>('');
  const [company, setCompany] = useState<Company | ''>('');
  const [series, setSeries] = useState<Series | ''>('');
  const [platoon, setPlatoon] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rankOptions = RECRUIT_RANKS;
  const companyOptions = battalion
    ? (BATTALION_COMPANIES[battalion] ?? []).map((c) => ({ value: c, label: c }))
    : [];

  const canModify = useMemo(() => {
    if (!appUser || !id) return false;
    return true;
  }, [appUser, id]);

  const goBackToRecruit = useCallback(() => {
    returnToRecruitProfile(router, id);
  }, [router, id]);

  useEffect(() => {
    if (!id) return;
    getRecruitProfileById(id)
      .then((recruit) => {
        if (!recruit) {
          setError('Recruit not found');
          return;
        }
        if (appUser) {
          const check = canEditRecruit(appUser, recruit);
          if (!check.allowed) {
            setError(check.reason ?? 'You do not have permission to modify this recruit');
            return;
          }
        }
        setEdipi(recruit.edipi ?? '');
        setWeaponsSerialNumber(recruit.weaponsSerialNumber ?? '');
        setRcoSerialNumber(recruit.rcoSerialNumber ?? '');
        setFirstName(recruit.firstName);
        setLastName(recruit.lastName);
        setRank(recruit.rank);
        setStatus(recruit.status);
        setRegiment(recruit.regiment ?? '');
        setBattalion((recruit.battalion as Battalion) ?? '');
        setCompany((recruit.company as Company) ?? '');
        setSeries((recruit.series as Series) ?? '');
        setPlatoon(recruit.platoon ?? '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load recruit'))
      .finally(() => setLoading(false));
  }, [id, appUser]);

  async function handleSubmit() {
    if (!user || !id) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const validationResult = recruitUpdateSchema.safeParse({
        recruitId: id,
        edipi: normalizeEdipiDigits(edipi.trim()) || undefined,
        weaponsSerialNumber: weaponsSerialNumber.trim() || undefined,
        rcoSerialNumber: rcoSerialNumber.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        rank,
        status,
        regiment: regiment || undefined,
        battalion: battalion || undefined,
        company: company || undefined,
        series: series || undefined,
        platoon: platoon.trim(),
        updatedBy: user.uid,
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

      if (battalion && company) {
        const orgValidation = validateOrganizationalAssignment(
          buildOrgAssignment(regiment, battalion, company, series, platoon)
        );
        if (!orgValidation.valid) {
          setFieldErrors({ company: orgValidation.error ?? 'Invalid assignment' });
          setSubmitting(false);
          return;
        }
      }

      await updateRecruitProfile(
        id,
        {
          recruitId: id,
          edipi: normalizeEdipiDigits(edipi.trim()) || undefined,
          weaponsSerialNumber: weaponsSerialNumber.trim() || undefined,
          rcoSerialNumber: rcoSerialNumber.trim() || undefined,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          rank: rank as RecruitRank,
          status: status as RecruitStatus,
          regiment: regiment || undefined,
          battalion,
          company,
          series,
          platoon: platoon.trim(),
          updatedBy: user.uid,
        },
        user.uid
      );

      goBackToRecruit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to modify recruit');
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

  if (error && !firstName) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.error, textAlign: 'center', marginTop: 40 }}>{error}</Text>
      </Screen>
    );
  }

  if (!canModify) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          You do not have permission to modify recruits.
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
      <SectionHeader title="Modify recruit" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input label="EDIPI" value={edipi} onChangeText={setEdipi} keyboardType="number-pad" error={fieldErrors.edipi} />
        <Input label="First name" value={firstName} onChangeText={setFirstName} error={fieldErrors.firstName} />
        <Input label="Last name" value={lastName} onChangeText={setLastName} error={fieldErrors.lastName} />
        <Select label="Rank" value={rank} onChange={setRank} options={rankOptions} placeholder="Select rank" />
        <Select label="Status" value={status} onChange={setStatus} options={RECRUIT_STATUS_OPTIONS} placeholder="Select status" />
      </View>

      <SectionHeader title="Organizational assignment" />
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
        <Input label="Platoon (4 digits)" value={platoon} onChangeText={setPlatoon} keyboardType="number-pad" maxLength={4} error={fieldErrors.platoon} />
      </View>

      <SectionHeader title="Equipment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input label="Weapons serial number" value={weaponsSerialNumber} onChangeText={setWeaponsSerialNumber} />
        <Input label="RCO serial number" value={rcoSerialNumber} onChangeText={setRcoSerialNumber} />
      </View>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={goBackToRecruit} disabled={submitting} />
        <Button title="Save changes" onPress={handleSubmit} loading={submitting} />
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
