'use client';

/**
 * Section Component
 * 
 * A section component with title, description, and spacing variants.
 * Useful for organizing page content into distinct sections.
 * 
 * @example
 * ```tsx
 * <Section
 *   title="Recruit Management"
 *   description="Manage and track recruit information"
 *   spacing="lg"
 * >
 *   <Card>Content here</Card>
 * </Section>
 * 
 * <Section title="Settings" spacing="md">
 *   <Form>Settings form</Form>
 * </Section>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { ComponentSize } from '@/types/components';

/**
 * Section spacing variants
 */
export type SectionSpacing = ComponentSize | 'none';

/**
 * Section component props
 */
export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Section title
   */
  title?: string;
  /**
   * Section description/subtitle
   */
  description?: string;
  /**
   * Spacing variant (vertical padding)
   * @default 'md'
   */
  spacing?: SectionSpacing;
  /**
   * Title size
   * @default 'lg'
   */
  titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /**
   * Section content
   */
  children: React.ReactNode;
  /**
   * HTML element to render as
   * @default 'section'
   */
  as?: 'section' | 'div' | 'article';
}

/**
 * Section component
 * 
 * Provides consistent section structure with title, description, and spacing.
 */
export const Section: React.FC<SectionProps> = ({
  title,
  description,
  spacing = 'md',
  titleSize = 'lg',
  as: Component = 'section',
  className,
  children,
  ...props
}) => {
  // Spacing classes
  const spacingClasses: Record<SectionSpacing, string> = {
    none: '',
    sm: 'py-4',
    md: 'py-6',
    lg: 'py-8',
    xl: 'py-10',
  };

  // Title size classes
  const titleSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
    '2xl': 'text-5xl',
  };

  // Base section classes
  const sectionClasses = cn(
    'w-full',
    // Spacing
    spacingClasses[spacing],
    className
  );

  return (
    <Component className={sectionClasses} {...props}>
      {/* Title and description */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2
              className={cn(
                'font-heading font-bold',
                'text-text-heading-light dark:text-text-heading-dark',
                titleSizeClasses[titleSize],
                'mb-2'
              )}
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              className={cn(
                'text-base',
                'text-text-secondary-light dark:text-text-secondary-dark',
                'max-w-3xl'
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Section content */}
      {children}
    </Component>
  );
};

Section.displayName = 'Section';
