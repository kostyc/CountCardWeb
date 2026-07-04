import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, typography } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            color: theme.colors.text,
          },
          style,
        ]}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { ...typography.caption, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  error: { ...typography.caption, marginTop: 6, marginLeft: 2 },
});
