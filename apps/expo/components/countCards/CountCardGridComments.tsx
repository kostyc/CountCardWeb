import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import type { CountCardBackgroundColor } from '@countcard/core/types/models';
import { countCardGridStyles, getCountCardSurfaceColor } from './CountCardGridTheme';
import { spacing } from '@/constants/theme';

interface Props {
  backgroundColor: CountCardBackgroundColor;
  value?: string;
  onChange?: (value: string) => void;
  editable?: boolean;
}

export function CountCardGridComments({
  backgroundColor,
  value = '',
  onChange,
  editable = true,
}: Props) {
  const surface = getCountCardSurfaceColor(backgroundColor);
  const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

  if (!editable && !value.trim()) {
    return null;
  }

  return (
    <View style={[styles.wrap, { backgroundColor: surface }]}>
      <Text style={[styles.label, { fontFamily: mono }]}>COMMENTS:</Text>
      {editable ? (
        <TextInput
          style={[styles.input, { fontFamily: mono }]}
          value={value}
          onChangeText={onChange}
          placeholder="Optional notes for this count card"
          placeholderTextColor="#666666"
          multiline
          textAlignVertical="top"
        />
      ) : (
        <Text style={[styles.readonly, { fontFamily: mono }]}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  label: {
    fontSize: countCardGridStyles.headerFontSize,
    fontWeight: '700',
    color: countCardGridStyles.textColor,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: countCardGridStyles.borderColor,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: countCardGridStyles.cellFontSize,
    color: countCardGridStyles.textColor,
    backgroundColor: '#FFFFFF55',
  },
  readonly: {
    fontSize: countCardGridStyles.cellFontSize,
    color: countCardGridStyles.textColor,
    lineHeight: 20,
  },
});
