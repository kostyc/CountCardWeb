import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { verifyCrossPlatformCompatibility } from '@countcard/encryption';
import { useAuth } from '@/context/AuthContext';
import { getUserProfileById } from '@countcard/firebase/services/userProfiles';
import { Screen, SectionHeader, StatusBadge, Button } from '@/components/ui';
import EncryptionKeyManagement from '@/components/profile/EncryptionKeyManagement';
import { useAppTheme } from '@/hooks/useAppTheme';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';
import { userAlert } from '@/lib/userAlert';

const ENCRYPTION_HELP_TITLE = 'How encryption works';
const ENCRYPTION_HELP_MESSAGE =
  'CountCard protects sensitive recruit information with end-to-end encryption.\n\n' +
  'Your data is encrypted on this device before it reaches the cloud, using XChaCha20-Poly1305 — a modern authenticated encryption standard.\n\n' +
  'Each user has a personal encryption key. Supported data (notes, emergency contacts, and direct messages) can only be read by people with the right keys.\n\n' +
  'Save a recovery code from Encryption & backup so you can regain access on a new device.';

const COMPATIBLE_HELP_TITLE = 'What Compatible means';
const COMPATIBLE_HELP_MESSAGE =
  'CountCard runs a quick check on this device: it loads the encryption libraries (libsodium via @countcard/encryption), encrypts sample data, and decrypts it again.\n\n' +
  'Compatible means that round-trip succeeded. Your encryption keys and protected data should work on this device, and ciphertext will stay consistent with CountCard on web and mobile.\n\n' +
  'Issue detected means the libraries could not load or the round-trip failed. Try updating the app, restarting your device, or signing in on another supported device.';

function showEncryptionHelp() {
  void userAlert(ENCRYPTION_HELP_TITLE, ENCRYPTION_HELP_MESSAGE);
}

function showCompatibleHelp() {
  void userAlert(COMPATIBLE_HELP_TITLE, COMPATIBLE_HELP_MESSAGE);
}

function HelpIconButton({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={styles.helpButton}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <SymbolView
        name={{
          ios: 'questionmark.circle',
          android: 'help_outline',
          web: 'help_outline',
        }}
        tintColor={theme.colors.textMuted}
        size={22}
      />
    </Pressable>
  );
}

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
        <Text style={[styles.title, { color: theme.colors.text }]}>Sign-in methods</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          Link Google or Apple to the same email so you can sign in either way.
        </Text>
        <Button
          title="Manage linked sign-in"
          variant="secondary"
          onPress={() => router.push('/profile/account-linking')}
        />
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <View style={styles.titleRow}>
          <Text style={[styles.titleRowTitle, { color: theme.colors.text }]}>Encryption</Text>
          <HelpIconButton
            onPress={showEncryptionHelp}
            accessibilityLabel="Learn how encryption works"
          />
        </View>
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
          <HelpIconButton
            onPress={showCompatibleHelp}
            accessibilityLabel="Learn what Compatible means"
          />
        </View>
      </View>

      <SectionHeader title="Key management" subtitle="Generate, rotate, and recover keys" />
      <EncryptionKeyManagement variant="summary" />
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.headline },
  titleRowTitle: { ...typography.headline, flex: 1 },
  helpButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { ...typography.body, lineHeight: 22 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
});
