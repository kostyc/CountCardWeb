import { Platform, TextStyle, ViewStyle } from 'react-native';

/** CountCard design tokens — aligned with docs/DESIGN-SYSTEM.md */
export const palette = {
  marineRed: '#940000',
  marineRedDark: '#660000',
  marineRedLight: '#b81818',
  navy: '#001e2e',
  navyLight: '#002a3f',
  navyMuted: '#003a56',
  tan: '#84754E',
  tanLight: '#B8A082',
  white: '#ffffff',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  hero: { fontSize: 32, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700' as TextStyle['fontWeight'], letterSpacing: -0.3 },
  headline: { fontSize: 18, fontWeight: '600' as TextStyle['fontWeight'] },
  body: { fontSize: 16, fontWeight: '400' as TextStyle['fontWeight'] },
  callout: { fontSize: 15, fontWeight: '500' as TextStyle['fontWeight'] },
  caption: { fontSize: 13, fontWeight: '400' as TextStyle['fontWeight'] },
  overline: {
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: 0.8,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  },
};

export type ColorScheme = 'light' | 'dark';

export interface AppTheme {
  scheme: ColorScheme;
  colors: {
    background: string;
    backgroundSecondary: string;
    surface: string;
    surfaceElevated: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    primary: string;
    primaryMuted: string;
    accent: string;
    border: string;
    borderSubtle: string;
    tabBar: string;
    tabBarBorder: string;
    header: string;
    headerText: string;
    error: string;
    success: string;
    warning: string;
    overlay: string;
  };
}

export const lightTheme: AppTheme = {
  scheme: 'light',
  colors: {
    background: '#f0f2f5',
    backgroundSecondary: '#e8ecf0',
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    text: palette.navy,
    textSecondary: '#334155',
    textMuted: '#64748b',
    primary: palette.marineRed,
    primaryMuted: '#fce8e8',
    accent: palette.tan,
    border: '#e2e8f0',
    borderSubtle: '#f1f5f9',
    tabBar: '#ffffff',
    tabBarBorder: '#e2e8f0',
    header: palette.navy,
    headerText: palette.white,
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
    overlay: 'rgba(0, 30, 46, 0.04)',
  },
};

export const darkTheme: AppTheme = {
  scheme: 'dark',
  colors: {
    background: palette.navy,
    backgroundSecondary: palette.navyLight,
    surface: palette.navyLight,
    surfaceElevated: palette.navyMuted,
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    primary: palette.marineRedLight,
    primaryMuted: 'rgba(148, 0, 0, 0.25)',
    accent: palette.tanLight,
    border: '#1e3a4d',
    borderSubtle: '#163040',
    tabBar: palette.navyLight,
    tabBarBorder: '#1e3a4d',
    header: palette.navyLight,
    headerText: '#f8fafc',
    error: '#f87171',
    success: '#34d399',
    warning: '#fbbf24',
    overlay: 'rgba(255, 255, 255, 0.06)',
  },
};

export function getTheme(scheme: ColorScheme | null | undefined): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export function cardShadow(scheme: ColorScheme): ViewStyle {
  if (scheme === 'dark') {
    return Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
      default: {},
    }) as ViewStyle;
  }
  return Platform.select({
    ios: {
      shadowColor: palette.navy,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    android: { elevation: 3 },
    default: {},
  }) as ViewStyle;
}

export function tabBarShadow(scheme: ColorScheme): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: scheme === 'dark' ? 0.3 : 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle;
}
