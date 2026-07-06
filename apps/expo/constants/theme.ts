import { Platform, TextStyle, ViewStyle } from 'react-native';
import {
  colors,
  fontFamilies,
  spacingNative,
  borderRadiusNative,
} from '@countcard/ui/tokens';

/** Re-export canonical palette from @countcard/ui */
export const palette = colors.palette;

/** Spacing and radius aligned with web design tokens */
export const spacing = spacingNative;
export const radius = borderRadiusNative;

export const typography = {
  hero: {
    fontFamily: fontFamilies.headingNative,
    fontSize: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamilies.headingNative,
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
  },
  headline: {
    fontFamily: fontFamilies.bodyNative,
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  body: {
    fontFamily: fontFamilies.bodyNative,
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  callout: {
    fontFamily: fontFamilies.bodyNative,
    fontSize: 15,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  caption: {
    fontFamily: fontFamilies.bodyNative,
    fontSize: 13,
    fontWeight: '400' as TextStyle['fontWeight'],
  },
  overline: {
    fontFamily: fontFamilies.bodyNative,
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
    onPrimary: string;
    selectedHighlight: string;
    incompleteHighlight: string;
  };
}

const light = colors.semantic.light;

export const lightTheme: AppTheme = {
  scheme: 'light',
  colors: {
    background: light.bgPrimary,
    backgroundSecondary: light.bgSecondary,
    surface: light.bgCard,
    surfaceElevated: light.bgCard,
    text: light.textPrimary,
    textSecondary: light.textSecondary,
    textMuted: light.textMuted,
    primary: palette.marineRed,
    primaryMuted: light.primaryMuted,
    accent: palette.tan,
    border: light.borderSecondary,
    borderSubtle: light.borderPrimary,
    tabBar: light.tabBar,
    tabBarBorder: light.tabBarBorder,
    header: light.bgHeader,
    headerText: palette.white,
    error: palette.error,
    success: palette.success,
    warning: palette.warning,
    overlay: light.overlay,
    onPrimary: palette.onPrimary,
    selectedHighlight: colors.state.selectedHighlight,
    incompleteHighlight: colors.state.incompleteHighlight,
  },
};

const dark = colors.semantic.dark;

export const darkTheme: AppTheme = {
  scheme: 'dark',
  colors: {
    background: dark.bgPrimary,
    backgroundSecondary: dark.bgSecondary,
    surface: dark.bgCard,
    surfaceElevated: dark.bgTertiary,
    text: dark.textPrimary,
    textSecondary: dark.textSecondary,
    textMuted: dark.textMuted,
    primary: palette.marineRedLight,
    primaryMuted: dark.primaryMuted,
    accent: palette.tanLight,
    border: dark.tabBarBorder,
    borderSubtle: dark.borderSecondary,
    tabBar: dark.tabBar,
    tabBarBorder: dark.tabBarBorder,
    header: dark.bgSecondary,
    headerText: dark.textPrimary,
    error: dark.error,
    success: dark.success,
    warning: dark.warning,
    overlay: dark.overlay,
    onPrimary: palette.onPrimary,
    selectedHighlight: colors.state.selectedHighlight,
    incompleteHighlight: colors.state.incompleteHighlight,
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
