import { Text, StyleSheet } from 'react-native';
import { Screen, TextLink } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { spacing, typography } from '@/constants/theme';

export default function ResetPasswordConfirmScreen() {
  const theme = useAppTheme();

  return (
    <Screen scroll>
      <Text style={[styles.title, { color: theme.colors.text }]}>Password reset link</Text>
      <Text style={[styles.body, { color: theme.colors.textMuted }]}>
        Open the link from your email to set a new password. After updating your password, return to
        the app and sign in with your new credentials.
      </Text>
      <TextLink href="/(auth)/login" style={{ ...styles.link, color: theme.colors.primary }}>
        Go to sign in
      </TextLink>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, marginBottom: spacing.md },
  body: { ...typography.body, lineHeight: 22, marginBottom: spacing.xl },
  link: { ...typography.callout, fontWeight: '600' },
});
