import { Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { typography } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  const theme = useAppTheme();

  return (
    <>
      <Text style={[styles.title, { color: theme.colors.textMuted }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.overline, marginBottom: 4, marginTop: 8, marginLeft: 4 },
  subtitle: { ...typography.caption, marginBottom: 12, marginLeft: 4 },
});
