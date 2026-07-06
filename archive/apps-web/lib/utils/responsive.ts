/**
 * Responsive Utilities
 * 
 * Utilities and hooks for responsive design including breakpoint detection,
 * media query utilities, and responsive value utilities.
 */

'use client';

import { useState, useEffect } from 'react';
import { breakpoints } from '@countcard/ui/tokens';

/**
 * Breakpoint type based on design tokens
 */
export type Breakpoint = keyof typeof breakpoints;

/**
 * Breakpoint values in pixels (for JavaScript calculations)
 */
export const breakpointValues: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook to detect current breakpoint
 * 
 * Returns the current breakpoint based on window width.
 * 
 * @example
 * ```tsx
 * const breakpoint = useBreakpoint();
 * if (breakpoint === 'lg') {
 *   // Desktop layout
 * }
 * ```
 * 
 * @returns Current breakpoint name
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('sm');

  useEffect(() => {
    const updateBreakpoint = (): void => {
      const width = window.innerWidth;

      if (width >= breakpointValues['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= breakpointValues.xl) {
        setBreakpoint('xl');
      } else if (width >= breakpointValues.lg) {
        setBreakpoint('lg');
      } else if (width >= breakpointValues.md) {
        setBreakpoint('md');
      } else {
        setBreakpoint('sm');
      }
    };

    // Set initial breakpoint
    updateBreakpoint();

    // Listen for resize events
    window.addEventListener('resize', updateBreakpoint);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, []);

  return breakpoint;
}

/**
 * Hook to check if current viewport matches a specific breakpoint or larger
 * 
 * @param minBreakpoint - Minimum breakpoint to match
 * @returns True if viewport is at least the specified breakpoint
 * 
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery('lg');
 * if (isDesktop) {
 *   // Show desktop layout
 * }
 * ```
 */
export function useMediaQuery(minBreakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${breakpointValues[minBreakpoint]}px)`
    );

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event listener
    const handler = (event: MediaQueryListEvent): void => {
      setMatches(event.matches);
    };

    // Add listener (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [minBreakpoint]);

  return matches;
}

/**
 * Hook to check if viewport is mobile (smaller than md breakpoint)
 * 
 * @returns True if viewport is mobile
 * 
 * @example
 * ```tsx
 * const isMobile = useIsMobile();
 * ```
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('md');
}

/**
 * Hook to check if viewport is tablet (md to lg)
 * 
 * @returns True if viewport is tablet
 * 
 * @example
 * ```tsx
 * const isTablet = useIsTablet();
 * ```
 */
export function useIsTablet(): boolean {
  const isAtLeastMd = useMediaQuery('md');
  const isAtLeastLg = useMediaQuery('lg');
  return isAtLeastMd && !isAtLeastLg;
}

/**
 * Hook to check if viewport is desktop (lg or larger)
 * 
 * @returns True if viewport is desktop
 * 
 * @example
 * ```tsx
 * const isDesktop = useIsDesktop();
 * ```
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('lg');
}

/**
 * Responsive value utility
 * 
 * Returns different values based on breakpoint.
 * Useful for conditional rendering or styling.
 * 
 * @param values - Object mapping breakpoints to values
 * @param defaultValue - Default value for smaller breakpoints
 * @returns Value for current breakpoint
 * 
 * @example
 * ```tsx
 * const columns = useResponsiveValue({
 *   sm: 1,
 *   md: 2,
 *   lg: 3,
 *   xl: 4,
 * }, 1);
 * ```
 */
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint();
  const breakpointOrder: Breakpoint[] = ['sm', 'md', 'lg', 'xl', '2xl'];

  // Find the value for current breakpoint or the largest smaller breakpoint
  const currentIndex = breakpointOrder.indexOf(breakpoint);

  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp] as T;
    }
  }

  return defaultValue;
}

/**
 * Get responsive class names based on breakpoint
 * 
 * Returns Tailwind CSS classes that apply at different breakpoints.
 * 
 * @param classes - Object mapping breakpoints to class names
 * @param baseClasses - Base classes that apply to all breakpoints
 * @returns Combined class string
 * 
 * @example
 * ```tsx
 * const classes = getResponsiveClasses({
 *   sm: 'text-sm',
 *   md: 'text-base',
 *   lg: 'text-lg',
 * }, 'font-semibold');
 * ```
 */
export function getResponsiveClasses(
  classes: Partial<Record<Breakpoint, string>>,
  baseClasses = ''
): string {
  const classArray: string[] = [baseClasses];

  Object.entries(classes).forEach(([breakpoint, className]) => {
    if (className) {
      classArray.push(`${breakpoint}:${className}`);
    }
  });

  return classArray.filter(Boolean).join(' ');
}

/**
 * Check if a breakpoint matches the current viewport
 * 
 * @param breakpoint - Breakpoint to check
 * @returns True if viewport matches breakpoint
 */
export function matchesBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth >= breakpointValues[breakpoint];
}

/**
 * Get viewport width
 * 
 * @returns Current viewport width in pixels
 */
export function getViewportWidth(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  return window.innerWidth;
}

/**
 * Get viewport height
 * 
 * @returns Current viewport height in pixels
 */
export function getViewportHeight(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  return window.innerHeight;
}

/**
 * Responsive spacing utility
 * 
 * Returns responsive spacing values based on breakpoint.
 * 
 * @param spacing - Object mapping breakpoints to spacing values
 * @param defaultSpacing - Default spacing for smaller breakpoints
 * @returns Spacing value for current breakpoint
 * 
 * @example
 * ```tsx
 * const padding = useResponsiveSpacing({
 *   sm: 'p-4',
 *   md: 'p-6',
 *   lg: 'p-8',
 * }, 'p-4');
 * ```
 */
export function useResponsiveSpacing(
  spacing: Partial<Record<Breakpoint, string>>,
  defaultSpacing: string
): string {
  return useResponsiveValue(spacing, defaultSpacing);
}
