import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { AuthHero, Button, Input, TextLink } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  useGoogleAuthRequest,
  signInWithGoogleIdToken,
  signInWithGoogle,
  isGoogleSignInConfigured,
  isGoogleNativeAuthFlow,
} from '@/lib/googleAuth';
import { spacing, typography } from '@/constants/theme';

export default function LoginScreen() {
  const { signInWithEmail, signInWithApple } = useAuth();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, googleResponse, promptGoogleSignIn] = useGoogleAuthRequest();

  useEffect(() => {
    if (!isGoogleNativeAuthFlow()) return;
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.params.id_token;
    if (!idToken) return;

    setLoading(true);
    setError(null);
    signInWithGoogleIdToken(idToken)
      .catch((e) => setError(e instanceof Error ? e.message : 'Google Sign-In failed'))
      .finally(() => setLoading(false));
  }, [googleResponse]);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleApple() {
    setLoading(true);
    setError(null);
    try {
      await signInWithApple();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Apple Sign-In failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      if (isGoogleNativeAuthFlow()) {
        await promptGoogleSignIn();
      } else {
        await signInWithGoogle();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AuthHero />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formWrap}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>Sign in</Text>
          <Text style={[styles.formSubtitle, { color: theme.colors.textMuted }]}>
            Enter your credentials to continue
          </Text>

          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          ) : null}

          <Button title="Sign In" onPress={handleLogin} loading={loading} />

          {isGoogleSignInConfigured() ? (
            <View style={styles.oauthWrap}>
              <Button
                title="Sign in with Google"
                onPress={handleGoogle}
                variant="secondary"
                loading={loading}
              />
            </View>
          ) : null}

          {Platform.OS === 'ios' ? (
            <View style={styles.oauthWrap}>
              <Button title="Sign in with Apple" onPress={handleApple} variant="secondary" loading={loading} />
            </View>
          ) : null}

          <TextLink href="/(auth)/signup" style={{ ...styles.link, color: theme.colors.primary }}>
            New here? Create an account
          </TextLink>
          <TextLink
            href="/(auth)/reset-password"
            style={{ ...styles.linkSecondary, color: theme.colors.textMuted }}
          >
            Forgot password?
          </TextLink>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  formWrap: { flex: 1, marginTop: -20 },
  form: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  formTitle: { ...typography.title, marginBottom: 4 },
  formSubtitle: { ...typography.body, marginBottom: spacing.xl },
  errorText: { ...typography.caption, marginBottom: spacing.md, marginTop: -8 },
  oauthWrap: { marginTop: 12 },
  link: {
    ...typography.callout,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingVertical: 8,
  },
  linkSecondary: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingVertical: 8,
  },
});
