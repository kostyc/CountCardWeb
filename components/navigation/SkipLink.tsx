'use client';

/**
 * Skip Link Component
 * 
 * Provides a keyboard-accessible skip link to jump to main content.
 * Essential for accessibility and keyboard navigation.
 * 
 * @example
 * ```tsx
 * <SkipLink href="#main-content" />
 * ```
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Skip Link component props
 */
export interface SkipLinkProps extends BaseComponentProps {
  /**
   * Target ID of the main content area
   * @default 'main-content'
   */
  href?: string;
  /**
   * Text to display for the skip link
   * @default 'Skip to main content'
   */
  children?: React.ReactNode;
}

/**
 * Skip Link Component
 * 
 * A visually hidden link that becomes visible on focus, allowing keyboard
 * users to skip navigation and jump directly to the main content.
 * 
 * @param props - SkipLink component props
 * @returns Skip link element
 */
export default function SkipLink({
  href = '#main-content',
  children = 'Skip to main content',
  className,
  ...props
}: SkipLinkProps): JSX.Element {
  return (
    <Link
      href={href}
      className={cn(
        // Visually hidden by default
        'sr-only',
        // Visible on focus
        'focus:not-sr-only',
        'focus:absolute',
        'focus:top-4',
        'focus:left-4',
        'focus:z-[9999]',
        'focus:px-4',
        'focus:py-2',
        'focus:bg-marine-red',
        'focus:text-white',
        'focus:rounded-md',
        'focus:shadow-lg',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-marine-red',
        'focus:ring-offset-2',
        'focus:font-semibold',
        'focus:transition-all',
        'focus:duration-200',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
