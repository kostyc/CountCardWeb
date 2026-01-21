/**
 * Component Utilities
 * 
 * Utility functions for component development including className merging,
 * variant class name generation, and size class name generation.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ComponentSize, ComponentColor, ComponentVariant } from '@/types/components';

/**
 * Merge class names with Tailwind CSS conflict resolution
 * 
 * This function combines clsx for conditional class names and tailwind-merge
 * to intelligently merge Tailwind CSS classes, resolving conflicts by
 * keeping the last conflicting class.
 * 
 * @param inputs - Class names or conditional class name objects
 * @returns Merged class name string
 * 
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4') // Returns 'py-1 px-4' (px-2 is overridden by px-4)
 * cn('bg-red-500', { 'bg-blue-500': isActive }) // Returns conditional class
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generate size-based class names
 * 
 * Maps component sizes to Tailwind CSS classes for consistent sizing
 * across components.
 * 
 * @param size - Component size variant
 * @param sizeMap - Map of size to class names
 * @returns Class name string for the size
 * 
 * @example
 * ```tsx
 * const sizeClasses = getSizeClasses('lg', {
 *   sm: 'text-sm px-2 py-1',
 *   md: 'text-base px-3 py-2',
 *   lg: 'text-lg px-4 py-3',
 *   xl: 'text-xl px-6 py-4',
 * });
 * ```
 */
export function getSizeClasses(
  size: ComponentSize,
  sizeMap: Record<ComponentSize, string>
): string {
  return sizeMap[size] || sizeMap.md;
}

/**
 * Generate color variant class names
 * 
 * Maps component color variants to Tailwind CSS classes for consistent
 * color usage across components.
 * 
 * @param color - Component color variant
 * @param colorMap - Map of color to class names
 * @returns Class name string for the color
 * 
 * @example
 * ```tsx
 * const colorClasses = getColorClasses('primary', {
 *   primary: 'bg-marine-red text-white',
 *   secondary: 'bg-navy-blue text-white',
 *   error: 'bg-red-500 text-white',
 * });
 * ```
 */
export function getColorClasses(
  color: ComponentColor,
  colorMap: Partial<Record<ComponentColor, string>>
): string {
  return colorMap[color] || colorMap.primary || '';
}

/**
 * Generate variant class names
 * 
 * Maps component variants to Tailwind CSS classes for consistent
 * variant styling across components.
 * 
 * @param variant - Component variant
 * @param variantMap - Map of variant to class names
 * @returns Class name string for the variant
 * 
 * @example
 * ```tsx
 * const variantClasses = getVariantClasses('outline', {
 *   solid: 'bg-primary text-white',
 *   outline: 'border-2 border-primary text-primary',
 *   ghost: 'text-primary',
 * });
 * ```
 */
export function getVariantClasses(
  variant: ComponentVariant,
  variantMap: Partial<Record<ComponentVariant, string>>
): string {
  return variantMap[variant] || variantMap.solid || '';
}

/**
 * Generate combined variant class names
 * 
 * Combines size, color, and variant class names into a single string.
 * Useful for components that support multiple variant dimensions.
 * 
 * @param options - Variant options object
 * @param options.size - Component size
 * @param options.sizeMap - Size to class name map
 * @param options.color - Component color
 * @param options.colorMap - Color to class name map
 * @param options.variant - Component variant
 * @param options.variantMap - Variant to class name map
 * @param options.className - Additional class names
 * @returns Merged class name string
 * 
 * @example
 * ```tsx
 * const classes = getVariantClassesCombined({
 *   size: 'lg',
 *   sizeMap: { sm: 'text-sm', md: 'text-base', lg: 'text-lg', xl: 'text-xl' },
 *   color: 'primary',
 *   colorMap: { primary: 'bg-marine-red', secondary: 'bg-navy-blue' },
 *   variant: 'solid',
 *   variantMap: { solid: 'text-white', outline: 'border-2' },
 *   className: 'font-semibold',
 * });
 * ```
 */
export function getVariantClassesCombined(options: {
  size?: ComponentSize;
  sizeMap?: Record<ComponentSize, string>;
  color?: ComponentColor;
  colorMap?: Partial<Record<ComponentColor, string>>;
  variant?: ComponentVariant;
  variantMap?: Partial<Record<ComponentVariant, string>>;
  className?: string;
}): string {
  const classes: string[] = [];

  if (options.size && options.sizeMap) {
    classes.push(getSizeClasses(options.size, options.sizeMap));
  }

  if (options.color && options.colorMap) {
    classes.push(getColorClasses(options.color, options.colorMap));
  }

  if (options.variant && options.variantMap) {
    classes.push(getVariantClasses(options.variant, options.variantMap));
  }

  if (options.className) {
    classes.push(options.className);
  }

  return cn(...classes);
}

/**
 * Generate responsive class names
 * 
 * Creates responsive class names based on breakpoint values.
 * 
 * @param values - Map of breakpoint to class names
 * @returns Responsive class name string
 * 
 * @example
 * ```tsx
 * const responsiveClasses = getResponsiveClasses({
 *   base: 'text-sm',
 *   md: 'text-base',
 *   lg: 'text-lg',
 * });
 * // Returns: 'text-sm md:text-base lg:text-lg'
 * ```
 */
export function getResponsiveClasses(values: {
  base?: string;
  sm?: string;
  md?: string;
  lg?: string;
  xl?: string;
  '2xl'?: string;
}): string {
  const classes: string[] = [];

  if (values.base) classes.push(values.base);
  if (values.sm) classes.push(`sm:${values.sm}`);
  if (values.md) classes.push(`md:${values.md}`);
  if (values.lg) classes.push(`lg:${values.lg}`);
  if (values.xl) classes.push(`xl:${values.xl}`);
  if (values['2xl']) classes.push(`2xl:${values['2xl']}`);

  return cn(...classes);
}

/**
 * Generate state-based class names
 * 
 * Creates class names based on component state (hover, active, focus, disabled).
 * 
 * @param baseClasses - Base class names
 * @param states - State class names
 * @returns Combined class name string with state modifiers
 * 
 * @example
 * ```tsx
 * const stateClasses = getStateClasses('bg-primary', {
 *   hover: 'hover:bg-primary-dark',
 *   active: 'active:scale-95',
 *   focus: 'focus:ring-2 focus:ring-primary',
 *   disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
 * });
 * ```
 */
export function getStateClasses(
  baseClasses: string,
  states?: {
    hover?: string;
    active?: string;
    focus?: string;
    disabled?: string;
  }
): string {
  const classes: string[] = [baseClasses];

  if (states?.hover) classes.push(states.hover);
  if (states?.active) classes.push(states.active);
  if (states?.focus) classes.push(states.focus);
  if (states?.disabled) classes.push(states.disabled);

  return cn(...classes);
}
