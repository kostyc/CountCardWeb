import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Card } from './Card';
import { useAppTheme } from '@/hooks/useAppTheme';
import { radius, typography } from '@/constants/theme';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  onPress?: () => void;
}

export function QuickActionCard({ title, description, icon, onPress }: QuickActionCardProps) {
  const theme = useAppTheme();

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryMuted }]}>
        <SymbolView
          name={{ ios: icon, android: icon, web: icon }}
          tintColor={theme.colors.primary}
          size={22}
        />
      </View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.desc, { color: theme.colors.textMuted }]}>{description}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    minHeight: 120,
    flex: 1,
    minWidth: '46%',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: { ...typography.headline, marginBottom: 4 },
  desc: { ...typography.caption, lineHeight: 18 },
});
