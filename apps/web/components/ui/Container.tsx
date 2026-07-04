'use client';

/**
 * Container Component
 * 
 * A container component with max-width variants, padding options, and centered layout.
 * Useful for constraining content width and providing consistent page layouts.
 * 
 * @example
 * ```tsx
 * <Container maxWidth="lg" padding="md" centered>
 *   <h1>Page Title</h1>
 *   <p>Page content</p>
 * </Container>
 * 
 * <Container maxWidth="full" padding="lg">
 *   <div>Full width content with padding</div>
 * </Container>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { ComponentSize } from '@/types/components';

/**
 * Container max-width variants
 */
export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/**
 * Container component props
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Maximum width variant
   * @default 'lg'
   */
  maxWidth?: ContainerMaxWidth;
  /**
   * Padding size
   * @default 'md'
   */
  padding?: ComponentSize;
  /**
   * Whether to center the container
   * @default true
   */
  centered?: boolean;
  /**
   * Container content
   */
  children: React.ReactNode;
}

/**
 * Container component
 * 
 * Provides max-width constraints, padding, and centering for page content.
 */
export const Container: React.FC<ContainerProps> = ({
  maxWidth = 'lg',
  padding = 'md',
  centered = true,
  className,
  children,
  ...props
}) => {
  // Max-width classes
  const maxWidthClasses: Record<ContainerMaxWidth, string> = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  // Padding classes
  const paddingClasses: Record<ComponentSize, string> = {
    sm: 'px-4 py-3',
    md: 'px-6 py-4',
    lg: 'px-8 py-6',
    xl: 'px-10 py-8',
  };

  // Base container classes
  const containerClasses = cn(
    'w-full',
    // Max width
    maxWidthClasses[maxWidth],
    // Padding
    paddingClasses[padding],
    // Centered
    centered && 'mx-auto',
    className
  );

  return (
    <div className={containerClasses} {...props}>
      {children}
    </div>
  );
};

Container.displayName = 'Container';
