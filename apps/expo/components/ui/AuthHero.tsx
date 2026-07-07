import { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, typography } from '@/constants/theme';

const logo = require('@/assets/images/auth-logo.png');

interface AuthHeroProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export function AuthHero({ title = 'Count Card', subtitle, children }: AuthHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
      <View style={styles.brandRow}>
        <Image source={logo} style={styles.brandMark} contentFit="contain" accessibilityLabel="Count Card logo" />
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: palette.navy,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 48,
    height: 48,
  },
  title: {
    ...typography.hero,
    color: palette.white,
    fontSize: 24,
    flexShrink: 1,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 6,
  },
});
