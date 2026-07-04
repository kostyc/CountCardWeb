import { useState } from 'react';
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
import { spacing, typography } from '@/constants/theme';

export default function SignUpScreen() {
  const { signUpWithEmail } = useAuth();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <AuthHero title="Join CountCard" subtitle="Create your drill instructor account" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formWrap}
      >
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>Create account</Text>
          <Text style={[styles.formSubtitle, { color: theme.colors.textMuted }]}>
            Use your official email address
          </Text>

          <Input
            label="Email"
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          ) : null}

          <Button title="Create Account" onPress={handleSignUp} loading={loading} />

          <TextLink href="/(auth)/login" style={{ ...styles.link, color: theme.colors.primary }}>
            Already have an account? Sign in
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
