import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { formatTrainingDayDisplay } from '@countcard/core/constants/mcrdTrainingMatrix';
import { spacing, typography } from '@/constants/theme';

interface Props {
  trainingDayCode?: string;
  configured: boolean;
}

export function CompanyTrainingDayPanel({ trainingDayCode, configured }: Props) {
  const router = useRouter();

  if (!configured) {
    return (
      <View style={styles.panelSlot}>
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/company/training-day')}
        >
          <Text style={styles.bannerTitle}>Training Day not set</Text>
          <Text style={styles.bannerBody}>
            Company must set F-1 Friday before creating a count card. Tap to configure.
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.panelSlot}>
      <View style={styles.badgeRow}>
        <Text style={styles.badge}>
          T-DAY: {trainingDayCode ? formatTrainingDayDisplay(trainingDayCode) : '—'}
        </Text>
        <Pressable onPress={() => router.push('/company/training-day')}>
          <Text style={styles.link}>Update</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panelSlot: {
    marginBottom: spacing.sm,
  },
  banner: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#856404',
    padding: spacing.md,
    borderRadius: 8,
  },
  bannerTitle: {
    ...typography.headline,
    fontWeight: '700',
    color: '#856404',
  },
  bannerBody: {
    marginTop: 4,
    color: '#856404',
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    ...typography.headline,
    fontWeight: '700',
  },
  link: {
    color: '#007AFF',
    fontWeight: '600',
    minHeight: 44,
    lineHeight: 44,
  },
});
