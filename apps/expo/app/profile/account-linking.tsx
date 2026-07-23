import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform, Pressable } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Screen, SectionHeader, ListRow, Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatAuthError } from '@/lib/authErrors';
import {
  useGoogleAuthRequest,
  linkWithGoogleIdToken,
  linkWithGoogle,
  isGoogleSignInConfigured,
  isGoogleNativeAuthFlow,
} from '@/lib/googleAuth';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

const PROVIDER_LABELS: Record<string, string> = {
  password: 'Email / password',
  'google.com': 'Google',
  'apple.com': 'Apple',
};

function providerLabel(providerId: string): string {
  return PROVIDER_LABELS[providerId] ?? providerId;
}

export default function AccountLinkingScreen() {
  const theme = useAppTheme();
  const { user, linkWithApple, unlinkProvider, refreshUser } = useAuth();
  const [busy, setBusy] = useState<'google' | 'apple' | string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingGoogleLink, setPendingGoogleLink] = useState(false);
  const [, googleResponse, promptGoogleSignIn] = useGoogleAuthRequest();

  const providers = user?.providerData ?? [];
  const linkedIds = new Set(providers.map((p) => p.providerId));
  const canUnlink = providers.length > 1;
  const showLinkGoogle = isGoogleSignInConfigured() && !linkedIds.has('google.com');
  const showLinkApple = Platform.OS === 'ios' && !linkedIds.has('apple.com');
  const nothingToLink = !showLinkGoogle && !showLinkApple;

  useEffect(() => {
    if (!isGoogleNativeAuthFlow()) return;
    if (!pendingGoogleLink) return;
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.params.id_token;
    if (!idToken) return;

    setBusy('google');
    setError(null);
    linkWithGoogleIdToken(idToken)
      .then(() => refreshUser())
      .then(() => setSuccess('Google linked successfully'))
      .catch((e) => setError(formatAuthError(e, 'Failed to link Google')))
      .finally(() => {
        setPendingGoogleLink(false);
        setBusy(null);
      });
  }, [googleResponse, pendingGoogleLink, refreshUser]);

  async function handleLinkGoogle() {
    setError(null);
    setSuccess(null);
    setBusy('google');
    try {
      if (isGoogleNativeAuthFlow()) {
        setPendingGoogleLink(true);
        const result = await promptGoogleSignIn();
        if (result?.type !== 'success') {
          setPendingGoogleLink(false);
          setBusy(null);
        }
        return;
      }
      await linkWithGoogle();
      await refreshUser();
      setSuccess('Google linked successfully');
      setBusy(null);
    } catch (e) {
      setPendingGoogleLink(false);
      setError(formatAuthError(e, 'Failed to link Google'));
      setBusy(null);
    }
  }

  async function handleLinkApple() {
    setError(null);
    setSuccess(null);
    setBusy('apple');
    try {
      await linkWithApple();
      setSuccess('Apple linked successfully');
    } catch (e) {
      setError(formatAuthError(e, 'Failed to link Apple'));
    } finally {
      setBusy(null);
    }
  }

  function confirmUnlink(providerId: string) {
    if (!canUnlink) {
      setError('Cannot unlink the last sign-in method. Add another method first.');
      return;
    }
    Alert.alert(
      'Unlink sign-in method',
      `Remove ${providerLabel(providerId)} from this account? You will no longer be able to sign in with it until you link it again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: () => void handleUnlink(providerId),
        },
      ]
    );
  }

  async function handleUnlink(providerId: string) {
    setError(null);
    setSuccess(null);
    setBusy(providerId);
    try {
      await unlinkProvider(providerId);
      setSuccess(`${providerLabel(providerId)} unlinked`);
    } catch (e) {
      setError(formatAuthError(e, 'Failed to unlink'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen scroll>
      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Linked sign-in methods</Text>
        <Text style={[styles.body, { color: theme.colors.textMuted }]}>
          Link Google or Apple using the same email as this account so you can sign in either way.
        </Text>
      </View>

      <SectionHeader title="Currently linked" />
      <View style={[styles.group, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        {providers.length === 0 ? (
          <ListRow title="No providers found" showChevron={false} isFirst isLast />
        ) : (
          providers.map((p, index) => (
            <ListRow
              key={`${p.providerId}-${index}`}
              title={providerLabel(p.providerId)}
              subtitle={p.email ?? undefined}
              showChevron={false}
              isFirst={index === 0}
              isLast={index === providers.length - 1}
              right={
                canUnlink ? (
                  <Pressable
                    onPress={() => confirmUnlink(p.providerId)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Unlink ${providerLabel(p.providerId)}`}
                    style={styles.unlinkHit}
                  >
                    <Text style={[styles.unlink, { color: theme.colors.error }]}>
                      {busy === p.providerId ? '…' : 'Unlink'}
                    </Text>
                  </Pressable>
                ) : undefined
              }
            />
          ))
        )}
      </View>

      <SectionHeader title="Add a method" subtitle="Same email as your CountCard account" />
      <View style={styles.actions}>
        {showLinkGoogle ? (
          <Button
            title="Link Google"
            variant="secondary"
            loading={busy === 'google'}
            disabled={busy !== null}
            onPress={() => void handleLinkGoogle()}
          />
        ) : null}
        {showLinkApple ? (
          <Button
            title="Link Apple"
            variant="secondary"
            loading={busy === 'apple'}
            disabled={busy !== null}
            onPress={() => void handleLinkApple()}
          />
        ) : null}
        {nothingToLink ? (
          <Text style={[styles.allLinked, { color: theme.colors.textMuted }]}>
            All available methods for this device are linked.
          </Text>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.message, { color: theme.colors.error }]}>{error}</Text>
      ) : null}
      {success ? (
        <Text style={[styles.message, { color: theme.colors.success }]}>{success}</Text>
      ) : null}
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
  group: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  unlinkHit: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  unlink: { ...typography.callout, fontWeight: '600' },
  actions: { gap: 12, marginBottom: spacing.base },
  allLinked: { ...typography.caption, textAlign: 'center', marginTop: 4 },
  message: { ...typography.caption, marginTop: spacing.sm, marginBottom: spacing.base },
});
