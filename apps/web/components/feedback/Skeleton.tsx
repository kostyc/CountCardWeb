'use client';

/**
 * Skeleton Component
 * 
 * A skeleton loading component for text, images, cards, and custom shapes.
 * Provides a shimmer animation to indicate content is loading.
 * 
 * @example
 * ```tsx
 * <Skeleton variant="text" width="200px" />
 * 
 * <Skeleton variant="image" width="300px" height="200px" />
 * 
 * <Skeleton variant="card" />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Skeleton variant types
 */
export type SkeletonVariant = 'text' | 'image' | 'card' | 'circle' | 'rect';

/**
 * Skeleton component props
 */
export interface SkeletonProps extends BaseComponentProps {
  /**
   * Skeleton variant
   * @default 'text'
   */
  variant?: SkeletonVariant;
  /**
   * Width of the skeleton
   */
  width?: string | number;
  /**
   * Height of the skeleton
   */
  height?: string | number;
  /**
   * Number of lines for text variant
   * @default 1
   */
  lines?: number;
  /**
   * Whether to show animation
   * @default true
   */
  animate?: boolean;
  /**
   * Custom shape (for circle or custom shapes)
   */
  shape?: 'circle' | 'rect' | 'rounded';
}

/**
 * Skeleton Component
 * 
 * Displays a placeholder skeleton with shimmer animation to indicate
 * content is loading. Supports multiple variants for different content types.
 * 
 * @param props - Skeleton component props
 * @returns Skeleton element
 */
export default function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  animate = true,
  shape = 'rounded',
  className,
  ...props
}: SkeletonProps): JSX.Element {
  // Base skeleton classes
  const baseClasses = cn(
    'bg-background-secondary-light dark:bg-background-secondary-dark',
    animate && 'animate-pulse',
    shape === 'circle' && 'rounded-full',
    shape === 'rounded' && 'rounded-md',
    shape === 'rect' && 'rounded-none',
    className
  );

  // Variant-specific styles
  const variantStyles: Record<SkeletonVariant, React.CSSProperties> = {
    text: {
      width: width || '100%',
      height: height || '1rem',
    },
    image: {
      width: width || '100%',
      height: height || '200px',
    },
    card: {
      width: width || '100%',
      height: height || '200px',
    },
    circle: {
      width: width || height || '40px',
      height: height || width || '40px',
    },
    rect: {
      width: width || '100%',
      height: height || '1rem',
    },
  };

  // Render text variant with multiple lines
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              index === lines - 1 && 'w-3/4' // Last line is shorter
            )}
            style={{
              height: height || '1rem',
            }}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={baseClasses}
      style={variantStyles[variant]}
      aria-hidden="true"
      {...props}
    />
  );
}
