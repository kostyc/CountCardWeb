/**
 * Design Tokens
 *
 * Canonical design tokens for CountCard (web + Expo).
 * See docs/DESIGN-SYSTEM.md for usage guidelines.
 */

/**
 * Brand palette and semantic colors (aligned with archive/apps-web app globals (legacy))
 */
export const colors = {
  palette: {
    marineRed: '#940000',
    marineRedDark: '#660000',
    marineRedLight: '#b81818',
    navy: '#001e2e',
    navyDark: '#002a3f',
    navyLight: '#003a56',
    tan: '#84754E',
    tanDark: '#6B5F3F',
    tanLight: '#B8A082',
    white: '#ffffff',
    black: '#000000',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    onPrimary: '#ffffff',
  },
  state: {
    selectedHighlight: '#e8f4fa',
    incompleteHighlight: '#fff8eb',
  },
  semantic: {
    light: {
      bgPrimary: '#FFFFFF',
      bgSecondary: '#F5F5F5',
      bgTertiary: '#E8E8E8',
      bgHeader: '#001e2e',
      bgCard: '#FFFFFF',
      bgInput: '#FFFFFF',
      textPrimary: '#000000',
      textSecondary: '#4A5568',
      textMuted: '#64748b',
      textHeading: '#940000',
      textLink: '#940000',
      textLinkHover: '#660000',
      borderPrimary: '#CBD5E0',
      borderSecondary: '#E2E8F0',
      borderFocus: '#940000',
      primaryMuted: '#fce8e8',
      tabBar: '#ffffff',
      tabBarBorder: '#E2E8F0',
      overlay: 'rgba(0, 30, 46, 0.04)',
    },
    dark: {
      bgPrimary: '#001e2e',
      bgSecondary: '#002a3f',
      bgTertiary: '#003a56',
      bgHeader: '#000000',
      bgCard: '#002a3f',
      bgInput: '#003a56',
      textPrimary: '#FFFFFF',
      textSecondary: '#CBD5E0',
      textMuted: '#94a3b8',
      textHeading: '#FF8E8E',
      textLink: '#FF8E8E',
      textLinkHover: '#FFB3B3',
      borderPrimary: '#4A5568',
      borderSecondary: '#2D3748',
      borderFocus: '#FF8E8E',
      primaryMuted: 'rgba(148, 0, 0, 0.25)',
      tabBar: '#002a3f',
      tabBarBorder: '#1e3a4d',
      overlay: 'rgba(255, 255, 255, 0.06)',
      error: '#f87171',
      success: '#34d399',
      warning: '#fbbf24',
    },
  },
} as const;

/**
 * Font families — web CSS stacks and React Native fallbacks
 */
export const fontFamilies = {
  heading: "Colossalis, Georgia, serif",
  body: 'Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  /** Until Colossalis is bundled in apps/expo/assets/fonts/ */
  headingNative: 'Georgia',
  bodyNative: 'System',
} as const;

/**
 * Spacing Scale — 4px base unit
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
} as const;

/** Spacing as numbers for React Native */
export const spacingNative = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

/**
 * Typography Scale
 */
export const typography = {
  fontSizes: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '80px',
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

/**
 * Border Radius Scale
 */
export const borderRadius = {
  none: '0px',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  full: '9999px',
} as const;

/** Border radius as numbers for React Native */
export const borderRadiusNative = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

/**
 * Shadow/Elevation Scale
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  timingFunction: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  delay: {
    none: '0ms',
    fast: '50ms',
    base: '100ms',
    slow: '200ms',
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const designTokens = {
  colors,
  fontFamilies,
  spacing,
  spacingNative,
  typography,
  borderRadius,
  borderRadiusNative,
  shadows,
  animation,
  zIndex,
  breakpoints,
} as const;

export type Colors = typeof colors;
export type FontFamilies = typeof fontFamilies;
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Animation = typeof animation;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
