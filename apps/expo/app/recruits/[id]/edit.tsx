import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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
import { addRecruitWeightEntry } from '@countcard/firebase/services/recruitWeight';
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

const WIDE_WEB_BREAKPOINT = 900;

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

function FormColumn({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  style?: object;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.column, style]}>
      <Text style={[styles.columnTitle, { color: theme.colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.columnSubtitle, { color: theme.colors.textMuted }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

function FormRow({ children }: { children: ReactNode }) {
  return <View style={styles.formRow}>{children}</View>;
}

export default function ModifyRecruitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && windowWidth >= WIDE_WEB_BREAKPOINT;

  const [loading, setLoading] = useState(true);
  const [edipi, setEdipi] = useState('');
  const [weaponsSerialNumber, setWeaponsSerialNumber] = useState('');
  const [rcoSerialNumber, setRcoSerialNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [rank, setRank] = useState<RecruitRank | ''>('');
  const [status, setStatus] = useState<RecruitStatus | ''>('active');
  const [regiment, setRegiment] = useState<Regiment | ''>('');
  const [battalion, setBattalion] = useState<Battalion | ''>('');
  const [company, setCompany] = useState<Company | ''>('');
  const [series, setSeries] = useState<Series | ''>('');
  const [platoon, setPlatoon] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightPounds, setWeightPounds] = useState('');
  const [initialWeightPounds, setInitialWeightPounds] = useState<number | undefined>();
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
        setMiddleInitial(recruit.middleInitial ?? '');
        setLastName(recruit.lastName);
        setRank(recruit.rank);
        setStatus(recruit.status);
        setRegiment(recruit.regiment ?? '');
        setBattalion((recruit.battalion as Battalion) ?? '');
        setCompany((recruit.company as Company) ?? '');
        setSeries((recruit.series as Series) ?? '');
        setPlatoon(recruit.platoon ?? '');
        setHeightInches(recruit.heightInches != null ? String(recruit.heightInches) : '');
        setWeightPounds(recruit.weightPounds != null ? String(recruit.weightPounds) : '');
        setInitialWeightPounds(recruit.weightPounds);
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
      const parsedHeight = heightInches.trim() ? Number(heightInches) : undefined;
      const parsedWeight = weightPounds.trim() ? Number(weightPounds) : undefined;

      const validationResult = recruitUpdateSchema.safeParse({
        recruitId: id,
        edipi: normalizeEdipiDigits(edipi.trim()) || undefined,
        weaponsSerialNumber: weaponsSerialNumber.trim() || undefined,
        rcoSerialNumber: rcoSerialNumber.trim() || undefined,
        firstName: firstName.trim(),
        middleInitial: middleInitial.trim().toUpperCase() || undefined,
        lastName: lastName.trim(),
        rank,
        status,
        regiment: regiment || undefined,
        battalion: battalion || undefined,
        company: company || undefined,
        series: series || undefined,
        platoon: platoon.trim(),
        heightInches: parsedHeight,
        weightPounds: parsedWeight,
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
          middleInitial: middleInitial.trim().toUpperCase() || undefined,
          lastName: lastName.trim(),
          rank: rank as RecruitRank,
          status: status as RecruitStatus,
          regiment: regiment || undefined,
          battalion,
          company,
          series,
          platoon: platoon.trim(),
          heightInches: parsedHeight,
          weightPounds: parsedWeight,
          updatedBy: user.uid,
        },
        user.uid
      );

      if (
        parsedWeight != null &&
        parsedWeight !== initialWeightPounds &&
        initialWeightPounds == null
      ) {
        await addRecruitWeightEntry(id, {
          weightPounds: parsedWeight,
          recordedBy: user.uid,
          notes: 'Receiving intake',
        });
      }

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

  const personalFields = (
    <>
      <FormRow>
        <View style={styles.fieldGrow}>
          <Input label="First name" value={firstName} onChangeText={setFirstName} error={fieldErrors.firstName} />
        </View>
        <View style={styles.fieldNarrow}>
          <Input
            label="MI"
            value={middleInitial}
            onChangeText={setMiddleInitial}
            autoCapitalize="characters"
            maxLength={2}
            error={fieldErrors.middleInitial}
          />
        </View>
        <View style={styles.fieldGrow}>
          <Input label="Last name" value={lastName} onChangeText={setLastName} error={fieldErrors.lastName} />
        </View>
      </FormRow>
      <Input label="EDIPI" value={edipi} onChangeText={setEdipi} keyboardType="number-pad" error={fieldErrors.edipi} />
      <FormRow>
        <View style={styles.fieldHalf}>
          <Select label="Rank" value={rank} onChange={setRank} options={rankOptions} placeholder="Select rank" />
        </View>
        <View style={styles.fieldHalf}>
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={RECRUIT_STATUS_OPTIONS}
            placeholder="Select status"
          />
        </View>
      </FormRow>
    </>
  );

  const assignmentFields = (
    <>
      <FormRow>
        <View style={styles.fieldHalf}>
          <Select label="Regiment" value={regiment} onChange={setRegiment} options={REGIMENT_OPTIONS} placeholder="Select regiment" />
        </View>
        <View style={styles.fieldHalf}>
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
        </View>
      </FormRow>
      <FormRow>
        <View style={styles.fieldHalf}>
          <Select label="Company" value={company} onChange={setCompany} options={companyOptions} placeholder="Select company" />
        </View>
        <View style={styles.fieldHalf}>
          <Select label="Series" value={series} onChange={setSeries} options={SERIES.map((s) => ({ value: s, label: s }))} placeholder="Select series" />
        </View>
      </FormRow>
      <Input label="Platoon (4 digits)" value={platoon} onChangeText={setPlatoon} keyboardType="number-pad" maxLength={4} error={fieldErrors.platoon} />
    </>
  );

  const physicalFields = (
    <FormRow>
      <View style={styles.fieldHalf}>
        <Input
          label="Height (inches)"
          value={heightInches}
          onChangeText={setHeightInches}
          keyboardType="number-pad"
          error={fieldErrors.heightInches}
        />
      </View>
      <View style={styles.fieldHalf}>
        <Input
          label="Weight at intake (lbs)"
          value={weightPounds}
          onChangeText={setWeightPounds}
          keyboardType="number-pad"
          error={fieldErrors.weightPounds}
        />
      </View>
    </FormRow>
  );

  const equipmentFields = (
    <FormRow>
      <View style={styles.fieldHalf}>
        <Input label="Weapons serial number" value={weaponsSerialNumber} onChangeText={setWeaponsSerialNumber} />
      </View>
      <View style={styles.fieldHalf}>
        <Input label="RCO serial number" value={rcoSerialNumber} onChangeText={setRcoSerialNumber} />
      </View>
    </FormRow>
  );

  const actionButtons = (
    <>
      <Button title="Cancel" variant="secondary" onPress={goBackToRecruit} disabled={submitting} />
      <Button title="Save changes" onPress={handleSubmit} loading={submitting} />
    </>
  );

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
      <Screen scroll={!isWideWeb} contentContainerStyle={isWideWeb ? styles.webContent : undefined}>
        {isWideWeb ? (
          <>
            <View style={styles.webHeader}>
              <Text style={[styles.webTitle, { color: theme.colors.text }]}>Modify recruit</Text>
              <View style={styles.webHeaderActions}>{actionButtons}</View>
            </View>

            <View style={[styles.webPanel, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
              <View style={styles.webGrid}>
                <FormColumn title="Personal">{personalFields}</FormColumn>
                <FormColumn title="Assignment">{assignmentFields}</FormColumn>
                <FormColumn title="Physical & equipment" subtitle="Height and weight recorded at intake">
                  {physicalFields}
                  {equipmentFields}
                </FormColumn>
              </View>
            </View>

            {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
          </>
        ) : (
          <>
            <SectionHeader title="Modify recruit" />
            <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
              <Input label="EDIPI" value={edipi} onChangeText={setEdipi} keyboardType="number-pad" error={fieldErrors.edipi} />
              <Input label="First name" value={firstName} onChangeText={setFirstName} error={fieldErrors.firstName} />
              <Input
                label="Middle initial"
                value={middleInitial}
                onChangeText={setMiddleInitial}
                autoCapitalize="characters"
                maxLength={2}
                error={fieldErrors.middleInitial}
              />
              <Input label="Last name" value={lastName} onChangeText={setLastName} error={fieldErrors.lastName} />
              <Select label="Rank" value={rank} onChange={setRank} options={rankOptions} placeholder="Select rank" />
              <Select
                label="Status"
                value={status}
                onChange={setStatus}
                options={RECRUIT_STATUS_OPTIONS}
                placeholder="Select status"
              />
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

            <SectionHeader title="Physical" subtitle="Height and weight recorded at intake" />
            <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
              <Input
                label="Height (inches)"
                value={heightInches}
                onChangeText={setHeightInches}
                keyboardType="number-pad"
                error={fieldErrors.heightInches}
              />
              <Input
                label="Weight at intake (lbs)"
                value={weightPounds}
                onChangeText={setWeightPounds}
                keyboardType="number-pad"
                error={fieldErrors.weightPounds}
              />
            </View>

            <SectionHeader title="Equipment" />
            <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
              <Input label="Weapons serial number" value={weaponsSerialNumber} onChangeText={setWeaponsSerialNumber} />
              <Input label="RCO serial number" value={rcoSerialNumber} onChangeText={setRcoSerialNumber} />
            </View>

            {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

            <View style={styles.actions}>{actionButtons}</View>
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  webContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.base,
    marginBottom: spacing.base,
  },
  webTitle: {
    ...typography.title,
  },
  webHeaderActions: {
    flexDirection: 'row',
    gap: 12,
    flexShrink: 0,
  },
  webPanel: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  webGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  column: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  columnTitle: {
    ...typography.headline,
    fontSize: 15,
    marginBottom: 4,
  },
  columnSubtitle: {
    ...typography.caption,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldGrow: {
    flex: 2,
    minWidth: 0,
  },
  fieldNarrow: {
    flex: 0.7,
    minWidth: 72,
    maxWidth: 96,
  },
  fieldHalf: {
    flex: 1,
    minWidth: 0,
  },
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
