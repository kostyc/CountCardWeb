import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  TRAINING_DAY_CODES,
  formatTrainingDayDisplay,
  isFriday,
} from '@countcard/core/constants/mcrdTrainingMatrix';
import { canSetCompanyTrainingDay } from '@countcard/core/permissions/companyTrainingDay';
import { getEffectiveOrganizationalAssignment } from '@countcard/core/utils/effectiveOrgAssignment';
import {
  advanceTrainingDay,
  getCompanyTrainingDay,
  setCurrentTrainingDay,
  setF1Friday,
} from '@countcard/firebase/services/companyTrainingDays';
import { useAuth } from '@/context/AuthContext';
import { useAppUser } from '@/hooks/useAppUser';
import { Screen, SectionHeader, Button, DateInput, Select } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

const CODE_OPTIONS = TRAINING_DAY_CODES.map((c) => ({
  value: c,
  label: formatTrainingDayDisplay(c),
}));

export default function CompanyTrainingDayScreen() {
  const { user } = useAuth();
  const { appUser } = useAppUser(user);
  const theme = useAppTheme();
  const router = useRouter();

  const org = getEffectiveOrganizationalAssignment(appUser);

  const [f1DateStr, setF1DateStr] = useState('');
  const [specificCode, setSpecificCode] = useState('');
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const perm = canSetCompanyTrainingDay(appUser, {
    regiment: org?.regiment,
    battalion: org?.battalion,
    company: org?.company,
  });

  useEffect(() => {
    if (!user || !org?.regiment || !org.battalion || !org.company) {
      setFetching(false);
      return;
    }
    getCompanyTrainingDay(org.regiment, org.battalion, org.company)
      .then((doc) => {
        if (doc) {
          setCurrentCode(doc.currentTrainingDayCode);
          const f1 =
            doc.f1Friday instanceof Date ? doc.f1Friday : doc.f1Friday.toDate();
          setF1DateStr(f1.toISOString().slice(0, 10));
        }
      })
      .catch((e) => {
        Alert.alert(
          'Unable to load',
          e instanceof Error ? e.message : 'Could not load company training day.'
        );
      })
      .finally(() => setFetching(false));
  }, [user, org?.regiment, org?.battalion, org?.company]);

  async function handleSetF1() {
    if (!user || !org?.regiment || !org.battalion || !org.company) return;
    if (!perm.allowed) {
      Alert.alert('Not allowed', perm.reason);
      return;
    }
    const parts = f1DateStr.split('-').map(Number);
    if (parts.length !== 3) {
      Alert.alert('Invalid date', 'Use YYYY-MM-DD');
      return;
    }
    const f1 = new Date(parts[0], parts[1] - 1, parts[2]);
    if (!isFriday(f1)) {
      Alert.alert('F-1 must be Friday', 'Pick the Friday that starts forming (F-1).');
      return;
    }
    setLoading(true);
    try {
      await setF1Friday(
        org.regiment,
        org.battalion,
        org.company,
        f1,
        new Date(),
        user.uid,
        appUser?.customClaims?.role ?? appUser?.profile?.role
      );
      const doc = await getCompanyTrainingDay(org.regiment, org.battalion, org.company);
      setCurrentCode(doc?.currentTrainingDayCode ?? null);
      Alert.alert('Saved', 'F-1 Friday and training day updated.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvance() {
    if (!user || !org?.regiment || !org.battalion || !org.company) return;
    setLoading(true);
    try {
      const next = await advanceTrainingDay(
        org.regiment,
        org.battalion,
        org.company,
        user.uid,
        appUser?.customClaims?.role ?? appUser?.profile?.role
      );
      setCurrentCode(next);
      Alert.alert('Advanced', next ? `Now ${formatTrainingDayDisplay(next)}` : 'End of cycle');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetSpecific() {
    if (!user || !org?.regiment || !org.battalion || !org.company || !specificCode) return;
    setLoading(true);
    try {
      await setCurrentTrainingDay(
        org.regiment,
        org.battalion,
        org.company,
        specificCode,
        new Date(),
        user.uid,
        appUser?.customClaims?.role ?? appUser?.profile?.role
      );
      setCurrentCode(specificCode);
      Alert.alert('Saved', `Training day set to ${formatTrainingDayDisplay(specificCode)}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (!org?.company) {
    return (
      <Screen scroll>
        <SectionHeader title="Company Training Day" />
        <Text style={typography.body}>
          Assign yourself to a company (regiment, battalion, and company) before you can set T-DAY.
        </Text>
        <View style={styles.profileCta}>
          <Button title="Edit profile" onPress={() => router.push('/profile/create')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="Company Training Day"
        subtitle={`${org.company} · Usually set by Co Cmdr, XO, 1stSgt, or Chief DI`}
      />

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        {fetching ? (
          <Text>Loading…</Text>
        ) : (
          <>
            <Text style={styles.current}>
              Current T-DAY:{' '}
              <Text style={styles.bold}>
                {currentCode ? formatTrainingDayDisplay(currentCode) : 'Not set'}
              </Text>
            </Text>

            <DateInput
              label="F-1 Friday"
              value={f1DateStr}
              onChangeText={setF1DateStr}
              placeholder="2026-03-06"
              keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'default'}
            />
            <Button title="Set F-1 Friday" onPress={handleSetF1} loading={loading} disabled={!perm.allowed} />

            <View style={styles.divider} />

            <Button
              title="Advance to next day"
              variant="secondary"
              onPress={handleAdvance}
              loading={loading}
              disabled={!perm.allowed || !currentCode}
            />

            <Select
              label="Set specific day"
              value={specificCode}
              onChange={setSpecificCode}
              options={CODE_OPTIONS}
            />
            <Button
              title="Apply specific day"
              variant="secondary"
              onPress={handleSetSpecific}
              loading={loading}
              disabled={!perm.allowed || !specificCode}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  current: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: spacing.sm,
  },
  profileCta: {
    marginTop: spacing.lg,
  },
});
