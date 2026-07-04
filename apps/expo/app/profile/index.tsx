import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { verifyCrossPlatformCompatibility } from '@countcard/encryption';
import { useAuth } from '@/context/AuthContext';
import { getUserProfileById } from '@countcard/firebase/services/userProfiles';
import { Screen, SectionHeader, StatusBadge, Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

export default function ProfileScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [encryptionOk, setEncryptionOk] = useState<boolean | null>(null);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    verifyCrossPlatformCompatibility().then((r) => setEncryptionOk(r.success));
  }, []);

  useEffect(() => {
    if (!user) return;
    getUserProfileById(user.uid).then((p) => setHasProfile(Boolean(p?.firstName)));
  }, [user?.uid]);

  return (
    <Screen scroll>
      {hasProfile === false ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Complete your profile</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Set up your rank, role, and organizational assignment to use CountCard.
          </Text>
          <Button title="Create profile" onPress={() => router.push('/profile/create')} />
        </View>
      ) : null}

      {hasProfile ? (
        <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Your profile</Text>
          <Text style={[styles.body, { color: theme.colors.textMuted }]}>
            Update your rank, role, organizational assignment, or profile photo.
          </Text>
          <Button title="Edit profile" onPress={() => router.push('/profile/create')} />
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Encryption</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          End-to-end encryption protects recruit data across web and mobile.
        </Text>
        <View style={styles.badgeRow}>
          <StatusBadge
            label={
              encryptionOk === null
                ? 'Checking…'
                : encryptionOk
                  ? 'Compatible'
                  : 'Issue detected'
            }
            tone={encryptionOk ? 'success' : encryptionOk === false ? 'error' : 'default'}
          />
        </View>
      </View>

      <SectionHeader title="Key management" subtitle="Generate, rotate, and recover keys" />
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
          Advanced key management UI is available on web. Native key flows will ship in a future
          release.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.base,
    gap: 10,
  },
  title: { ...typography.headline },
  body: { ...typography.body, lineHeight: 22 },
  badgeRow: { marginTop: 4 },
});
