import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { OrganizationalAssignment, Regiment } from '@countcard/core/types/auth';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import { DEFAULT_RECRUIT_RANK } from '@countcard/core/constants/recruitRanks';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import type { RecruitStatus } from '@countcard/core/validation/recruitSchemas';
import { recruitCreateSchema } from '@countcard/core/validation/recruitSchemas';
import { deriveRecruitDocumentId, normalizeEdipiDigits } from '@countcard/core/utils/recruitEdipi';
import { canCreateRecruit } from '@countcard/core/permissions/recruits';
import { hasPermission } from '@countcard/core/permissions/roles';
import { createRecruitProfile } from '@countcard/firebase/services/recruits';
import { validateOrganizationalAssignment } from '@countcard/firebase/services/organizations';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { pickValidatedImage } from '@/lib/imagePicker';
import { imageUploadHint, type PickedImage } from '@/lib/imageValidation';
import { uploadRecruitPhoto } from '@/lib/storage';
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

export default function CreateRecruitScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const router = useRouter();
  const theme = useAppTheme();

  const [edipi, setEdipi] = useState('');
  const [weaponsSerialNumber, setWeaponsSerialNumber] = useState('');
  const [rcoSerialNumber, setRcoSerialNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rank, setRank] = useState<RecruitRank | ''>(DEFAULT_RECRUIT_RANK);
  const [status, setStatus] = useState<RecruitStatus | ''>('active');
  const [regiment, setRegiment] = useState<Regiment | ''>('');
  const [battalion, setBattalion] = useState<Battalion | ''>('');
  const [company, setCompany] = useState<Company | ''>('');
  const [series, setSeries] = useState<Series | ''>('');
  const [platoon, setPlatoon] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rankOptions = RECRUIT_RANKS;
  const companyOptions = battalion
    ? (BATTALION_COMPANIES[battalion] ?? []).map((c) => ({ value: c, label: c }))
    : [];

  const canCreateAny = useMemo(() => {
    if (!appUser) return false;
    const role = appUser.customClaims?.role || appUser.profile?.role;
    if (!role) return false;
    return (
      hasPermission(role, 'edit_own_platoon') ||
      hasPermission(role, 'edit_series') ||
      hasPermission(role, 'edit_company') ||
      hasPermission(role, 'edit_battalion')
    );
  }, [appUser]);

  useEffect(() => {
    if (appUser && !canCreateAny) {
      Alert.alert('Access denied', 'You do not have permission to create recruits.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/recruits') },
      ]);
    }
  }, [appUser, canCreateAny, router]);

  async function handlePickPhoto() {
    const result = await pickValidatedImage();
    if (result.cancelled) return;
    if (!result.ok) {
      Alert.alert('Invalid image', result.error ?? 'Could not use that image.');
      return;
    }
    setPhoto(result.image);
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const recruitDocId = deriveRecruitDocumentId(edipi.trim());
      const edipiDigits = normalizeEdipiDigits(edipi.trim());

      const validationResult = recruitCreateSchema.safeParse({
        recruitId: recruitDocId,
        edipi: edipiDigits || undefined,
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
        createdBy: user.uid,
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

        const targetOrg = buildOrgAssignment(regiment, battalion, company, series, platoon);
        const permissionCheck = canCreateRecruit(appUser, targetOrg);
        if (!permissionCheck.allowed) {
          setFieldErrors({ platoon: permissionCheck.reason ?? 'Permission denied' });
          setSubmitting(false);
          return;
        }
      }

      let photoUrl: string | undefined;
      if (photo) {
        photoUrl = await uploadRecruitPhoto(photo, recruitDocId);
      }

      await createRecruitProfile(
        recruitDocId,
        {
          recruitId: recruitDocId,
          edipi: edipiDigits || undefined,
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
          photoUrl,
          createdBy: user.uid,
        },
        user.uid
      );

      router.replace(`/recruits/${recruitDocId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create recruit');
      setSubmitting(false);
    }
  }

  if (appUser && !canCreateAny) {
    return (
      <Screen scroll>
        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', marginTop: 40 }}>
          You do not have permission to create recruits.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader title="Personal information" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="EDIPI"
          value={edipi}
          onChangeText={setEdipi}
          autoCapitalize="none"
          keyboardType="number-pad"
          error={fieldErrors.edipi ?? fieldErrors.recruitId}
        />
        <Input label="First name" value={firstName} onChangeText={setFirstName} error={fieldErrors.firstName} />
        <Input label="Last name" value={lastName} onChangeText={setLastName} error={fieldErrors.lastName} />
        <Select
          label="Rank"
          value={rank}
          onChange={setRank}
          options={rankOptions}
          placeholder="Select rank"
        />
        {fieldErrors.rank ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{fieldErrors.rank}</Text>
        ) : null}
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={RECRUIT_STATUS_OPTIONS}
          placeholder="Select status"
        />
        {fieldErrors.status ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{fieldErrors.status}</Text>
        ) : null}
        <Text style={[styles.photoHint, { color: theme.colors.textMuted }]}>
          {imageUploadHint('recruit')}
        </Text>
        {photo ? (
          <>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <Text style={[styles.photoMeta, { color: theme.colors.textMuted }]}>
              {(photo.fileSize / (1024 * 1024)).toFixed(1)} MB · {photo.width}×{photo.height}
            </Text>
          </>
        ) : null}
        <Button title={photo ? 'Change photo' : 'Add photo'} variant="secondary" onPress={handlePickPhoto} />
      </View>

      <SectionHeader title="Organizational assignment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Select
          label="Regiment"
          value={regiment}
          onChange={setRegiment}
          options={REGIMENT_OPTIONS}
          placeholder="Select regiment"
        />
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
        <Select
          label="Company"
          value={company}
          onChange={setCompany}
          options={companyOptions}
          placeholder="Select company"
        />
        {fieldErrors.company ? (
          <Text style={[styles.fieldError, { color: theme.colors.error }]}>{fieldErrors.company}</Text>
        ) : null}
        <Select
          label="Series"
          value={series}
          onChange={setSeries}
          options={SERIES.map((s) => ({ value: s, label: s }))}
          placeholder="Select series"
        />
        <Input
          label="Platoon (4 digits)"
          value={platoon}
          onChangeText={setPlatoon}
          keyboardType="number-pad"
          maxLength={4}
          error={fieldErrors.platoon}
        />
      </View>

      <SectionHeader title="Equipment" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Input
          label="Weapons serial number"
          value={weaponsSerialNumber}
          onChangeText={setWeaponsSerialNumber}
          error={fieldErrors.weaponsSerialNumber}
        />
        <Input
          label="RCO serial number"
          value={rcoSerialNumber}
          onChangeText={setRcoSerialNumber}
          error={fieldErrors.rcoSerialNumber}
        />
      </View>

      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} disabled={submitting} />
        <Button title="Add Recruit" onPress={handleSubmit} loading={submitting} />
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
  photo: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    alignSelf: 'center',
  },
  photoHint: { ...typography.caption, marginBottom: 4 },
  photoMeta: { ...typography.caption, textAlign: 'center' },
  error: { ...typography.body, marginBottom: spacing.sm },
  fieldError: { ...typography.caption, marginTop: -8, marginBottom: 8 },
  actions: { gap: 12, marginTop: spacing.sm, marginBottom: spacing.xl },
});
