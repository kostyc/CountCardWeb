import { ReactNode } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, typography } from '@/constants/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  left?: ReactNode;
  right?: ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}

export function ListRow({
  title,
  subtitle,
  onPress,
  showChevron = true,
  left,
  right,
  isFirst,
  isLast,
}: ListRowProps) {
  const theme = useAppTheme();

  const content = (
    <>
      {left ? <View style={styles.left}>{left}</View> : null}
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ?? (showChevron && onPress ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          tintColor={theme.colors.textMuted}
          size={14}
          weight="semibold"
        />
      ) : null)}
    </>
  );

  const rowStyle = [
    styles.row,
    {
      backgroundColor: theme.colors.surface,
      borderBottomColor: isLast ? 'transparent' : theme.colors.borderSubtle,
    },
    isFirst && styles.first,
    isLast && styles.last,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [...rowStyle, { opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  first: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  last: { borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
  left: { marginRight: 12 },
  body: { flex: 1, marginRight: 8 },
  title: { ...typography.callout, fontWeight: '600' },
  subtitle: { ...typography.caption, marginTop: 2 },
});
