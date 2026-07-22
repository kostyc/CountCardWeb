import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getUserProfileById } from '@countcard/firebase/services/userProfiles';
import { Screen, SectionHeader, ListRow } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { APP_VERSION } from '@/constants/appVersion';
import { LEGAL_DOCUMENT_VERSION } from '@/constants/legalDocuments';
import { cardShadow, radius, typography } from '@/constants/theme';

export default function SettingsScreen() {
  const { user, signOut, resetPassword } = useAuth();
  const router = useRouter();
  const theme = useAppTheme();
  const [hasProfile, setHasProfile] = useState(false);
  const [policiesAccepted, setPoliciesAccepted] = useState(false);
  const [policyVersion, setPolicyVersion] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getUserProfileById(user.uid).then((p) => {
        setHasProfile(Boolean(p?.firstName));
        const accepted = Boolean(p?.privacyPolicyAccepted && p?.termsOfServiceAccepted);
        setPoliciesAccepted(accepted);
        setPolicyVersion(p?.privacyPolicyVersion ?? p?.termsOfServiceVersion ?? null);
      });
    }, [user?.uid])
  );

  async function handleResetPassword() {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      Alert.alert('Email sent', 'Check your inbox for password reset instructions.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to send reset email');
    }
  }

  return (
    <Screen scroll>
      <View style={[styles.accountCard, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.accountLabel, { color: theme.colors.textMuted }]}>Signed in as</Text>
        <Text style={[styles.accountEmail, { color: theme.colors.text }]}>{user?.email}</Text>
      </View>

      <SectionHeader title="Account" />

      <View style={[styles.group, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <ListRow title="Profile & security" onPress={() => router.push('/profile')} isFirst />
        <ListRow
          title={hasProfile ? 'Edit profile' : 'Create profile'}
          onPress={() => router.push('/profile/create')}
        />
        <ListRow title="Reset password" onPress={handleResetPassword} />
        <ListRow
          title="Sign out"
          onPress={() => signOut()}
          showChevron={false}
          isLast
          right={<Text style={[styles.signOut, { color: theme.colors.error }]}>Sign out</Text>}
        />
      </View>

      <SectionHeader title="Legal" />
      <View style={[styles.group, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <ListRow
          title="Policy acceptance"
          showChevron={false}
          isFirst
          right={
            <Text
              style={[
                styles.policyStatus,
                { color: policiesAccepted ? theme.colors.success : theme.colors.textMuted },
              ]}
            >
              {policiesAccepted
                ? `Accepted · v${policyVersion ?? LEGAL_DOCUMENT_VERSION}`
                : 'Not recorded'}
            </Text>
          }
        />
        <ListRow title="Privacy policy" onPress={() => router.push('/privacy-policy')} />
        <ListRow title="Terms of service" onPress={() => router.push('/terms-of-service')} />
        <ListRow title="Share app" onPress={() => router.push('/share')} isLast />
      </View>

      <Text style={[styles.version, { color: theme.colors.textMuted }]}>CountCard · {APP_VERSION}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 8,
  },
  accountLabel: { ...typography.caption, marginBottom: 4 },
  accountEmail: { ...typography.headline },
  group: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 24,
  },
  signOut: { ...typography.callout, fontWeight: '600' },
  policyStatus: { ...typography.caption, fontWeight: '600' },
  version: { ...typography.caption, textAlign: 'center', marginTop: 8 },
});
