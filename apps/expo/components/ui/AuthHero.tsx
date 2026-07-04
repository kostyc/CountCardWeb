import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, typography } from '@/constants/theme';

interface AuthHeroProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export function AuthHero({ title = 'CountCard', subtitle = 'Marine Corps accountability', children }: AuthHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
      <View style={styles.brandMark}>
        <Text style={styles.brandLetter}>CC</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.navy,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: palette.marineRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  brandLetter: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    ...typography.hero,
    color: palette.white,
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 6,
  },
});
