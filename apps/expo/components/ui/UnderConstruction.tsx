import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from './Screen';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, spacing, typography } from '@/constants/theme';

interface UnderConstructionProps {
  title: string;
  sprintRef?: string;
  needsAdded?: string[];
  showBackLink?: boolean;
}

export function UnderConstruction({
  title,
  sprintRef,
  needsAdded = ['This area is not fully built yet.'],
  showBackLink = true,
}: UnderConstructionProps) {
  const theme = useAppTheme();
  const router = useRouter();

  return (
    <Screen scroll>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Under construction · {sprintRef ?? 'Unknown sprint'}
        </Text>
        <Text style={[styles.sectionLabel, { color: theme.colors.textMuted }]}>
          What needs to be added
        </Text>
        {needsAdded.map((item) => (
          <Text key={item} style={[styles.item, { color: theme.colors.text }]}>
            • {item}
          </Text>
        ))}
        {showBackLink ? (
          <Pressable onPress={() => router.replace('/(tabs)/dashboard')} style={styles.back}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back to Dashboard</Text>
          </Pressable>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  title: { ...typography.title, marginBottom: spacing.sm },
  subtitle: { ...typography.body, marginBottom: spacing.xl },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  item: { ...typography.body, marginBottom: spacing.sm, lineHeight: 22 },
  back: { marginTop: spacing.xl, paddingVertical: spacing.sm },
  backText: { ...typography.callout, fontWeight: '600' },
});
