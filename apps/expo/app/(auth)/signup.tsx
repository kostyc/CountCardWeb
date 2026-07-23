import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from 'react-native';
import { recordPolicyAcceptance } from '@countcard/firebase/services/userProfiles';
import { useAuth } from '@/context/AuthContext';
import {
  AuthHero,
  Button,
  Input,
  TextLink,
  CheckboxRow,
  checkboxLabelTextStyle,
} from '@/components/ui';
import { LEGAL_DOCUMENT_VERSION } from '@/constants/legalDocuments';
import { requireAuth } from '@/lib/firebase';
import { formatAuthError } from '@/lib/authErrors';
import {
  useGoogleAuthRequest,
  signInWithGoogleIdToken,
  signInWithGoogle,
  isGoogleSignInConfigured,
  isGoogleNativeAuthFlow,
} from '@/lib/googleAuth';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/constants/theme';

export default function SignUpScreen() {
  const { signUpWithEmail, signInWithApple } = useAuth();
  const theme = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingOauthPolicies, setPendingOauthPolicies] = useState(false);
  const [, googleResponse, promptGoogleSignIn] = useGoogleAuthRequest();

  const policiesOk = privacyAccepted && termsAccepted;
  const canSubmit =
    policiesOk && email.trim().length > 0 && password.length >= 6;

  async function recordPoliciesForCurrentUser() {
    const uid = requireAuth().currentUser?.uid;
    if (!uid) {
      throw new Error('Account created but session is missing. Sign in and accept policies again.');
    }
    await recordPolicyAcceptance(uid, {
      privacyPolicyAccepted: true,
      termsOfServiceAccepted: true,
      privacyPolicyVersion: LEGAL_DOCUMENT_VERSION,
      termsOfServiceVersion: LEGAL_DOCUMENT_VERSION,
    });
  }

  useEffect(() => {
    if (!isGoogleNativeAuthFlow()) return;
    if (!pendingOauthPolicies) return;
    if (googleResponse?.type !== 'success') return;
    const idToken = googleResponse.params.id_token;
    if (!idToken) return;

    setLoading(true);
    setError(null);
    signInWithGoogleIdToken(idToken)
      .then(() => recordPoliciesForCurrentUser())
      .catch((e) => setError(formatAuthError(e, 'Google Sign-Up failed')))
      .finally(() => {
        setPendingOauthPolicies(false);
        setLoading(false);
      });
  }, [googleResponse, pendingOauthPolicies]);

  function requirePolicies(): boolean {
    if (!policiesOk) {
      setError('Accept the Privacy Policy and Terms of Service to continue');
      return false;
    }
    return true;
  }

  async function handleSignUp() {
    if (!requirePolicies()) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signUpWithEmail(email.trim(), password);
      await recordPoliciesForCurrentUser();
    } catch (e) {
      setError(formatAuthError(e, 'Sign up failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!requirePolicies()) return;
    setLoading(true);
    setError(null);
    try {
      if (isGoogleNativeAuthFlow()) {
        setPendingOauthPolicies(true);
        const result = await promptGoogleSignIn();
        if (result?.type !== 'success') {
          setPendingOauthPolicies(false);
          setLoading(false);
        }
        // Success: loading cleared in useEffect after token exchange + policies
        return;
      }
      await signInWithGoogle();
      await recordPoliciesForCurrentUser();
    } catch (e) {
      setPendingOauthPolicies(false);
      setError(formatAuthError(e, 'Google Sign-Up failed'));
    } finally {
      if (!isGoogleNativeAuthFlow()) {
        setLoading(false);
      }
    }
  }

  async function handleApple() {
    if (!requirePolicies()) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithApple();
      await recordPoliciesForCurrentUser();
    } catch (e) {
      setError(formatAuthError(e, 'Apple Sign-Up failed'));
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

          <View style={styles.policies}>
            <CheckboxRow
              checked={privacyAccepted}
              onChange={setPrivacyAccepted}
              accessibilityLabel="Accept Privacy Policy"
              label={
                <Text style={[checkboxLabelTextStyle, { color: theme.colors.text }]}>
                  I agree to the Privacy Policy (v{LEGAL_DOCUMENT_VERSION})
                </Text>
              }
            />
            <CheckboxRow
              checked={termsAccepted}
              onChange={setTermsAccepted}
              accessibilityLabel="Accept Terms of Service"
              label={
                <Text style={[checkboxLabelTextStyle, { color: theme.colors.text }]}>
                  I agree to the Terms of Service (v{LEGAL_DOCUMENT_VERSION})
                </Text>
              }
            />
            <View style={styles.policyLinks}>
              <TextLink
                href="/privacy-policy"
                style={{ ...styles.policyLink, color: theme.colors.primary }}
              >
                Read Privacy Policy
              </TextLink>
              <Text style={{ color: theme.colors.textMuted }}> · </Text>
              <TextLink
                href="/terms-of-service"
                style={{ ...styles.policyLink, color: theme.colors.primary }}
              >
                Read Terms of Service
              </TextLink>
            </View>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          ) : null}

          <Button
            title="Create Account"
            onPress={() => {
              if (!canSubmit) {
                setError('Accept the Privacy Policy and Terms of Service to continue');
                return;
              }
              void handleSignUp();
            }}
            loading={loading}
            disabled={!canSubmit || loading}
          />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.borderSubtle }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textMuted }]}>
              or continue with
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.borderSubtle }]} />
          </View>

          {isGoogleSignInConfigured() ? (
            <View style={styles.oauthWrap}>
              <Button
                title="Continue with Google"
                onPress={() => void handleGoogle()}
                variant="secondary"
                loading={loading}
                disabled={loading}
              />
            </View>
          ) : null}

          {Platform.OS === 'ios' ? (
            <View style={styles.oauthWrap}>
              <Button
                title="Continue with Apple"
                onPress={() => void handleApple()}
                variant="secondary"
                loading={loading}
                disabled={loading}
              />
            </View>
          ) : null}

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
  policies: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    gap: 4,
  },
  policyLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingLeft: 36,
  },
  policyLink: {
    ...typography.caption,
    fontWeight: '700',
    paddingVertical: 6,
  },
  errorText: { ...typography.caption, marginBottom: spacing.md, marginTop: -8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { ...typography.caption, fontWeight: '600' },
  oauthWrap: { marginTop: 12 },
  link: {
    ...typography.callout,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingVertical: 8,
  },
});
