import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AuthHero, Button, Input, TextLink } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const theme = useAppTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setEmailSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AuthHero />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formWrap}>
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>
            {emailSent ? 'Check your email' : 'Reset password'}
          </Text>
          <Text style={[styles.formSubtitle, { color: theme.colors.textMuted }]}>
            {emailSent
              ? `We sent a reset link to ${email}. Open it on this device to continue.`
              : 'Enter your email and we will send a reset link.'}
          </Text>

          {!emailSent ? (
            <>
              <Input
                label="Email"
                placeholder="you@example.com"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
              />
              {error ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              ) : null}
              <Button title="Send reset link" onPress={handleSubmit} loading={loading} />
            </>
          ) : (
            <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login')} />
          )}

          <TextLink href="/(auth)/login" style={{ ...styles.link, color: theme.colors.primary }}>
            ← Back to sign in
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
  link: {
    ...typography.callout,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingVertical: 8,
  },
});
