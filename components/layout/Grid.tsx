'use client';

/**
 * Grid Component
 * 
 * A responsive grid layout component using CSS Grid.
 * Supports responsive columns, gaps, and alignment.
 * 
 * @example
 * ```tsx
 * <Grid cols={{ sm: 1, md: 2, lg: 3 }} gap={4}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Grid component props
 */
export interface GridProps extends BaseComponentProps {
  /**
   * Child elements to render
   */
  children?: React.ReactNode;
  /**
   * Number of columns at each breakpoint
   * @default { sm: 1, md: 2, lg: 3 }
   */
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  /**
   * Gap between grid items (Tailwind spacing value)
   * @default 4
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
   * Minimum column width (for auto-fit/auto-fill)
   */
  minColWidth?: string;
  /**
   * Grid alignment
   */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /**
   * Grid justify
   */
  justify?: 'start' | 'center' | 'end' | 'stretch' | 'between' | 'around' | 'evenly';
}

/**
 * Grid Component
 * 
 * Creates a responsive CSS Grid layout with configurable columns and gaps.
 * 
 * @param props - Grid component props
 * @returns Grid element
 */
export default function Grid({
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 4,
  rowGap,
  colGap,
  minColWidth,
  align = 'stretch',
  justify = 'start',
  className,
  children,
  ...props
}: GridProps): JSX.Element {
  // Build grid template columns classes
  const gridColsClasses: string[] = [];

  if (cols.sm !== undefined) {
    gridColsClasses.push(`grid-cols-${cols.sm}`);
  }
  if (cols.md !== undefined) {
    gridColsClasses.push(`md:grid-cols-${cols.md}`);
  }
  if (cols.lg !== undefined) {
    gridColsClasses.push(`lg:grid-cols-${cols.lg}`);
  }
  if (cols.xl !== undefined) {
    gridColsClasses.push(`xl:grid-cols-${cols.xl}`);
  }
  if (cols['2xl'] !== undefined) {
    gridColsClasses.push(`2xl:grid-cols-${cols['2xl']}`);
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

  const justifyClasses: string[] = [];
  if (justify === 'start') justifyClasses.push('justify-start');
  if (justify === 'center') justifyClasses.push('justify-center');
  if (justify === 'end') justifyClasses.push('justify-end');
  if (justify === 'stretch') justifyClasses.push('justify-stretch');
  if (justify === 'between') justifyClasses.push('justify-between');
  if (justify === 'around') justifyClasses.push('justify-around');
  if (justify === 'evenly') justifyClasses.push('justify-evenly');

  // Build style object for minColWidth
  const style: React.CSSProperties = {};
  if (minColWidth) {
    style.gridTemplateColumns = `repeat(auto-fit, minmax(${minColWidth}, 1fr))`;
  }

  return (
    <div
      className={cn(
        'grid',
        ...gridColsClasses,
        ...gapClasses,
        ...alignClasses,
        ...justifyClasses,
        className
      )}
      style={Object.keys(style).length > 0 ? style : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
