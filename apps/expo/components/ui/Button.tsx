import { ActivityIndicator, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  fullWidth = true,
}: ButtonProps) {
  const theme = useAppTheme();

  const bg =
    variant === 'primary'
      ? theme.colors.primary
      : variant === 'danger'
        ? theme.colors.error
        : variant === 'secondary'
          ? theme.colors.surface
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? theme.colors.onPrimary
      : variant === 'secondary'
        ? theme.colors.text
        : theme.colors.primary;

  const border =
    variant === 'secondary'
      ? { borderWidth: 1.5, borderColor: theme.colors.border }
      : variant === 'ghost'
        ? {}
        : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.88 : 1 },
        border,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  fullWidth: { width: '100%' },
  label: { ...typography.callout, fontWeight: '600' },
});
