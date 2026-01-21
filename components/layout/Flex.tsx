'use client';

/**
 * Flex Component
 * 
 * A responsive flexbox layout component.
 * Supports responsive direction, wrap, gap, and alignment.
 * 
 * @example
 * ```tsx
 * <Flex direction={{ sm: 'col', md: 'row' }} gap={4} align="center">
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 * </Flex>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Flex component props
 */
export interface FlexProps extends BaseComponentProps {
  /**
   * Child elements to render
   */
  children?: React.ReactNode;
  /**
   * Flex direction at each breakpoint
   * @default 'row'
   */
  direction?: {
    sm?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    md?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    lg?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    xl?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
    '2xl'?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  } | 'row' | 'col' | 'row-reverse' | 'col-reverse';
  /**
   * Whether to wrap items
   * @default false
   */
  wrap?: boolean | 'wrap' | 'nowrap' | 'wrap-reverse';
  /**
   * Gap between flex items (Tailwind spacing value)
   * @default 0
   */
  gap?: number | string;
  /**
   * Row gap (if different from gap)
   */
  rowGap?: number | string;
  /**
   * Column gap (if different from gap)
   */
  colGap?: number | string;
  /**
   * Align items
   * @default 'stretch'
   */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /**
   * Justify content
   * @default 'start'
   */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /**
   * Grow items to fill available space
   * @default false
   */
  grow?: boolean;
  /**
   * Shrink items when space is limited
   * @default true
   */
  shrink?: boolean;
}

/**
 * Flex Component
 * 
 * Creates a responsive flexbox layout with configurable direction, wrap, and alignment.
 * 
 * @param props - Flex component props
 * @returns Flex element
 */
export default function Flex({
  direction = 'row',
  wrap = false,
  gap = 0,
  rowGap,
  colGap,
  align = 'stretch',
  justify = 'start',
  grow = false,
  shrink = true,
  className,
  children,
  ...props
}: FlexProps): JSX.Element {
  // Build direction classes
  const directionClasses: string[] = [];

  if (typeof direction === 'string') {
    directionClasses.push(`flex-${direction}`);
  } else {
    if (direction.sm) {
      directionClasses.push(`flex-${direction.sm}`);
    }
    if (direction.md) {
      directionClasses.push(`md:flex-${direction.md}`);
    }
    if (direction.lg) {
      directionClasses.push(`lg:flex-${direction.lg}`);
    }
    if (direction.xl) {
      directionClasses.push(`xl:flex-${direction.xl}`);
    }
    if (direction['2xl']) {
      directionClasses.push(`2xl:flex-${direction['2xl']}`);
    }
  }

  // Build wrap classes
  const wrapClasses: string[] = [];
  if (wrap === true || wrap === 'wrap') {
    wrapClasses.push('flex-wrap');
  } else if (wrap === 'nowrap') {
    wrapClasses.push('flex-nowrap');
  } else if (wrap === 'wrap-reverse') {
    wrapClasses.push('flex-wrap-reverse');
  }

  // Build gap classes
  const gapClasses: string[] = [];
  if (gap) {
    gapClasses.push(`gap-${gap}`);
  }
  if (rowGap) {
    gapClasses.push(`gap-y-${rowGap}`);
  }
  if (colGap) {
    gapClasses.push(`gap-x-${colGap}`);
  }

  // Build alignment classes
  const alignClasses: string[] = [];
  if (align === 'start') alignClasses.push('items-start');
  if (align === 'center') alignClasses.push('items-center');
  if (align === 'end') alignClasses.push('items-end');
  if (align === 'stretch') alignClasses.push('items-stretch');
  if (align === 'baseline') alignClasses.push('items-baseline');

  const justifyClasses: string[] = [];
  if (justify === 'start') justifyClasses.push('justify-start');
  if (justify === 'center') justifyClasses.push('justify-center');
  if (justify === 'end') justifyClasses.push('justify-end');
  if (justify === 'between') justifyClasses.push('justify-between');
  if (justify === 'around') justifyClasses.push('justify-around');
  if (justify === 'evenly') justifyClasses.push('justify-evenly');

  // Build grow/shrink classes
  const growShrinkClasses: string[] = [];
  if (grow) {
    growShrinkClasses.push('flex-grow');
  }
  if (!shrink) {
    growShrinkClasses.push('flex-shrink-0');
  }

  return (
    <div
      className={cn(
        'flex',
        ...directionClasses,
        ...wrapClasses,
        ...gapClasses,
        ...alignClasses,
        ...justifyClasses,
        ...growShrinkClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
