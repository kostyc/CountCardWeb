import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useAppTheme } from '@/hooks/useAppTheme';
import { typography } from '@/constants/theme';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: 'person.3' | 'checklist' | 'tray';
}

export function EmptyState({ title, message, icon = 'tray' }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: theme.colors.overlay }]}>
        <SymbolView
          name={{ ios: icon, android: icon, web: icon }}
          tintColor={theme.colors.textMuted}
          size={32}
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { ...typography.headline, textAlign: 'center' },
  message: { ...typography.body, textAlign: 'center', marginTop: 8, lineHeight: 22 },
});
