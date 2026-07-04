import { Text, View, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, typography } from '@/constants/theme';

interface StatusBadgeProps {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

export function StatusBadge({ label, tone = 'default' }: StatusBadgeProps) {
  const theme = useAppTheme();

  const tones = {
    default: { bg: theme.colors.overlay, text: theme.colors.textSecondary },
    success: { bg: 'rgba(16, 185, 129, 0.15)', text: theme.colors.success },
    warning: { bg: 'rgba(245, 158, 11, 0.15)', text: theme.colors.warning },
    error: { bg: 'rgba(239, 68, 68, 0.12)', text: theme.colors.error },
  };

  const t = tones[tone];

  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: { ...typography.caption, fontWeight: '600', fontSize: 12 },
});
