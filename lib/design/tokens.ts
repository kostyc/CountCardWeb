/**
 * Design Tokens
 * 
 * Centralized design tokens for the CountCard application.
 * These tokens define spacing, typography, colors, shadows, animations, and z-index scales
 * that are used consistently throughout the application.
 */

/**
 * Spacing Scale
 * Based on 4px base unit for consistent spacing
 */
export const spacing = {
  xs: '4px',    // 0.25rem
  sm: '8px',    // 0.5rem
  md: '12px',   // 0.75rem
  base: '16px', // 1rem
  lg: '24px',   // 1.5rem
  xl: '32px',   // 2rem
  '2xl': '48px', // 3rem
  '3xl': '64px', // 4rem
  '4xl': '96px', // 6rem
} as const;

/**
 * Typography Scale
 * Font sizes, line heights, and font weights
 */
export const typography = {
  fontSizes: {
    xs: '12px',      // 0.75rem - Caption
    sm: '14px',      // 0.875rem - Small
    base: '16px',    // 1rem - Body
    lg: '18px',     // 1.125rem - Body Large
    xl: '20px',     // 1.25rem
    '2xl': '24px',  // 1.5rem - H5
    '3xl': '30px',  // 1.875rem - H4
    '4xl': '36px',  // 2.25rem - H3
    '5xl': '48px',  // 3rem - H2
    '6xl': '80px',  // 5rem - H1
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
 * Rounded corners for components
 */
export const borderRadius = {
  none: '0px',
  sm: '4px',    // 0.25rem
  base: '8px',  // 0.5rem
  md: '12px',   // 0.75rem
  lg: '16px',   // 1rem
  xl: '24px',   // 1.5rem
  '2xl': '32px', // 2rem
  full: '9999px', // Fully rounded
} as const;

/**
 * Shadow/Elevation Scale
 * Box shadows for depth and elevation
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

/**
 * Animation Timing Functions
 * Easing functions for smooth animations
 */
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

/**
 * Z-Index Scale
 * Layering system for components
 */
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

/**
 * Breakpoints
 * Responsive design breakpoints
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Design Token Export
 * All design tokens in a single object for easy access
 */
export const designTokens = {
  spacing,
  typography,
  borderRadius,
  shadows,
  animation,
  zIndex,
  breakpoints,
} as const;

/**
 * Type exports for design tokens
 */
export type Spacing = typeof spacing;
export type Typography = typeof typography;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Animation = typeof animation;
export type ZIndex = typeof zIndex;
export type Breakpoints = typeof breakpoints;
