import type { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, spacing, typography } from '@/constants/theme';

interface CheckboxRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  accessibilityLabel: string;
}

export function CheckboxRow({
  checked,
  onChange,
  label,
  accessibilityLabel,
}: CheckboxRowProps) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onChange(!checked)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: checked ? theme.colors.primary : theme.colors.border,
            backgroundColor: checked ? theme.colors.primary : theme.colors.surface,
          },
        ]}
      >
        {checked ? <Text style={[styles.mark, { color: theme.colors.onPrimary }]}>✓</Text> : null}
      </View>
      <View style={styles.labelWrap}>{label}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  mark: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  labelWrap: {
    flex: 1,
  },
});

export const checkboxLabelTextStyle = {
  ...typography.callout,
  lineHeight: 22,
} as const;
