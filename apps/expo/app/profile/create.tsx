import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import type { OrganizationalAssignment, Regiment, USMCRank, UserRole } from '@countcard/core/types/auth';
import type { UserProfileDocument } from '@countcard/core/types/models';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import { saveUserProfileToFirestore } from '@/lib/saveUserProfile';
import { trySyncCustomClaims } from '@/lib/syncCustomClaims';
import { useAuth } from '@/context/AuthContext';
import { getUserProfileById } from '@countcard/firebase/services/userProfiles';
import { pickValidatedImage } from '@/lib/imagePicker';
import { imageUploadHint } from '@/lib/imageValidation';
import type { PickedImage } from '@/lib/imageValidation';
import { uploadProfilePicture } from '@/lib/storage';
import { Screen, Button, Input, Select, SectionHeader } from '@/components/ui';
import {
  ENLISTED_RANKS,
  OFFICER_RANKS,
  USER_ROLES,
  REGIMENT_OPTIONS,
  BATTALIONS,
  BATTALION_COMPANIES,
  SERIES,
} from '@/constants/profileOptions';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography, radius, cardShadow } from '@/constants/theme';

function buildOrgAssignment(
  regiment: Regiment | '',
  battalion: Battalion | '',
  company: Company | '',
  series: Series | '',
  platoon: string
): OrganizationalAssignment | undefined {
  if (!regiment && !battalion && !company && !series && !platoon) return undefined;
  const assignment: OrganizationalAssignment = {};
  if (regiment) assignment.regiment = regiment;
  if (battalion) assignment.battalion = battalion;
  if (company) assignment.company = company;
  if (series) assignment.series = series;
  if (platoon) assignment.platoon = platoon;
  return assignment;
}

function existingPhotoUrl(profile: UserProfileDocument): string | null {
  return profile.profilePictureUrl ?? (profile as UserProfileDocument & { photoURL?: string }).photoURL ?? null;
}

export default function ProfileCreateScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rank, setRank] = useState<USMCRank | ''>('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [regiment, setRegiment] = useState<Regiment | ''>('');
  const [battalion, setBattalion] = useState<Battalion | ''>('');
  const [company, setCompany] = useState<Company | ''>('');
  const [series, setSeries] = useState<Series | ''>('');
  const [platoon, setPlatoon] = useState('');
  const [photo, setPhoto] = useState<PickedImage | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    getUserProfileById(user.uid)
      .then((profile) => {
        if (cancelled || !profile?.firstName) return;

        setIsEditing(true);
        setFirstName(profile.firstName);
        setLastName(profile.lastName);
        setRank(profile.rank);
        setEmail(profile.email ?? user.email ?? '');
        setPhoneNumber(profile.phoneNumber ?? '');
        setRole(profile.role ?? '');
        const org = profile.organizationalAssignment;
        if (org) {
          setRegiment(org.regiment ?? '');
          setBattalion(org.battalion ?? '');
          setCompany(org.company ?? '');
          setSeries(org.series ?? '');
          setPlatoon(org.platoon ?? '');
        }
        setExistingPhoto(existingPhotoUrl(profile));
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.email]);

  const rankOptions = [...ENLISTED_RANKS, ...OFFICER_RANKS];
  const companyOptions = battalion
    ? (BATTALION_COMPANIES[battalion] ?? []).map((c) => ({ value: c, label: c }))
    : [];

  async function handleSubmit() {
    if (!user || !rank) return;
    setSubmitting(true);
    setError(null);
    try {
      let profilePictureUrl: string | null = null;
      if (photo) {
        profilePictureUrl = await uploadProfilePicture(photo, user.uid);
      }

      const organizationalAssignment = buildOrgAssignment(regiment, battalion, company, series, platoon);

      await saveUserProfileToFirestore({
        userId: user.uid,
        firstName,
        lastName,
        rank,
        email,
        phoneNumber,
        role: role || undefined,
        organizationalAssignment,
        profilePictureUrl,
      });

      const claimsSynced = await trySyncCustomClaims();

      if ((role || organizationalAssignment) && !claimsSynced) {
        Alert.alert(
          'Profile saved',
          'Your profile was saved. Permissions apply from your profile; custom claims will sync shortly.'
        );
      }

      router.replace(isEditing ? '/profile' : '/(tabs)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : isEditing ? 'Profile update failed' : 'Profile creation failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function pickPhoto() {
    const result = await pickValidatedImage();
    if (result.cancelled) return;
    if (!result.ok) {
      Alert.alert('Invalid image', result.error ?? 'Could not use that image.');
      return;
    }
    setPhoto(result.image);
  }

  return (
    <Screen scroll>
      {loadingProfile ? (
        <ActivityIndicator size="large" style={{ marginVertical: spacing.xl }} />
      ) : (
        <>
      <SectionHeader
        title={isEditing ? 'Edit profile' : 'Create profile'}
        subtitle={
          isEditing
            ? `Step ${step} of 3 — update your CountCard profile`
            : `Step ${step} of 3 — complete your CountCard profile`
        }
      />

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Input label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
          <Input label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
          <Select label="Rank" value={rank} options={rankOptions} onChange={setRank} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input label="Phone" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <Button
            title="Next: Role & assignment"
            onPress={() => {
              if (!firstName || !lastName || !rank || !email || !phoneNumber) {
                Alert.alert('Required fields', 'Fill in all required fields to continue.');
                return;
              }
              setStep(2);
            }}
          />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Select label="Role (optional)" value={role} options={USER_ROLES} onChange={setRole} />
          <Select label="Regiment" value={regiment} options={REGIMENT_OPTIONS} onChange={setRegiment} />
          <Select
            label="Battalion"
            value={battalion}
            options={BATTALIONS.map((b) => ({ value: b, label: b }))}
            onChange={(v) => {
              setBattalion(v);
              setCompany('');
            }}
          />
          {companyOptions.length > 0 ? (
            <Select label="Company" value={company} options={companyOptions} onChange={setCompany} />
          ) : null}
          <Select
            label="Series"
            value={series}
            options={SERIES.map((s) => ({ value: s, label: s }))}
            onChange={setSeries}
          />
          <Input label="Platoon (4 digits)" value={platoon} onChangeText={setPlatoon} keyboardType="number-pad" />
          <View style={styles.row}>
            <Button title="Back" variant="secondary" onPress={() => setStep(1)} style={styles.half} />
            <Button title="Next: Photo" onPress={() => setStep(3)} style={styles.half} />
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.hint, { color: theme.colors.textMuted }]}>
            {imageUploadHint('profile')} Optional — you can add one later.
          </Text>
          {photo ? (
            <>
              <Image source={{ uri: photo.uri }} style={styles.preview} />
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                {(photo.fileSize / (1024 * 1024)).toFixed(1)} MB · {photo.width}×{photo.height}
              </Text>
            </>
          ) : existingPhoto ? (
            <>
              <Image source={{ uri: existingPhoto }} style={styles.preview} />
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>Current profile photo</Text>
            </>
          ) : null}
          <Button title={photo || existingPhoto ? 'Change photo' : 'Add photo'} variant="secondary" onPress={pickPhoto} />
          {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
          <View style={styles.row}>
            <Button title="Back" variant="secondary" onPress={() => setStep(2)} style={styles.half} />
            <Button
              title={isEditing ? 'Save profile' : 'Create profile'}
              onPress={handleSubmit}
              loading={submitting}
              style={styles.half}
            />
          </View>
        </View>
      ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.xl, gap: 4 },
  hint: { ...typography.body, marginBottom: spacing.md },
  preview: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginVertical: spacing.md },
  meta: { ...typography.caption, textAlign: 'center', marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  half: { flex: 1 },
  error: { ...typography.caption, marginTop: 8 },
});
