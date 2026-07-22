import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Screen, SectionHeader, Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { APP_VERSION } from '@/constants/appVersion';
import { getAppShareUrl, shareCountCardApp } from '@/lib/shareApp';
import { cardShadow, radius, spacing, typography } from '@/constants/theme';

export default function ShareScreen() {
  const theme = useAppTheme();
  const [sharing, setSharing] = useState(false);
  const shareUrl = getAppShareUrl();

  async function handleShare() {
    setSharing(true);
    try {
      const result = await shareCountCardApp();
      if (result === 'copied') {
        Alert.alert('Link copied', 'The CountCard link was copied to your clipboard.');
      } else if (result === 'failed') {
        Alert.alert('Unable to share', 'Copy the link below and send it manually.');
      }
    } finally {
      setSharing(false);
    }
  }

  return (
    <Screen scroll>
      <SectionHeader
        title="Share CountCard"
        subtitle="Invite colleagues to the recruit accountability app"
      />

      <View style={[styles.card, { backgroundColor: theme.colors.surface }, cardShadow(theme.scheme)]}>
        <Text style={[styles.body, { color: theme.colors.text }]}>
          CountCard helps drill instructors and authorized staff manage recruit profiles, receiving intake,
          count cards, and unit messaging — with encryption and role-based access.
        </Text>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Share link</Text>
        <Text style={[styles.url, { color: theme.colors.primary }]} selectable>
          {shareUrl}
        </Text>
        <Text style={[styles.version, { color: theme.colors.textMuted }]}>Version {APP_VERSION}</Text>
        <Button title={sharing ? 'Sharing…' : 'Share app'} onPress={() => void handleShare()} loading={sharing} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  body: { ...typography.body, lineHeight: 22 },
  label: { ...typography.caption, fontWeight: '700', textTransform: 'uppercase' },
  url: { ...typography.callout, fontWeight: '600' },
  version: { ...typography.caption },
});
