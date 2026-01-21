'use client';

/**
 * Card Component
 * 
 * A comprehensive card component with header, body, and footer sections,
 * multiple elevation variants, padding options, and interactive states.
 * 
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>
 *     <h3>Card Title</h3>
 *   </Card.Header>
 *   <Card.Body>
 *     <p>Card content goes here</p>
 *   </Card.Body>
 *   <Card.Footer>
 *     <Button>Action</Button>
 *   </Card.Footer>
 * </Card>
 * 
 * <Card variant="elevated" hover onClick={handleClick}>
 *   <Card.Body>Clickable card</Card.Body>
 * </Card>
 * ```
 */

import React from 'react';
import { cn } from '@/lib/components/utils';
import type { CardElevation, ComponentSize } from '@/types/components';

/**
 * Card component props
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card elevation variant
   * @default 'base'
   */
  elevation?: CardElevation;
  /**
   * Card padding size
   * @default 'md'
   */
  padding?: ComponentSize;
  /**
   * Whether the card has hover effects
   * @default false
   */
  hover?: boolean;
  /**
   * Whether the card is clickable (adds cursor pointer and click handler)
   * @default false
   */
  clickable?: boolean;
  /**
   * Click handler (only used if clickable is true)
   */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /**
   * Card content
   */
  children: React.ReactNode;
}

/**
 * Card Header component props
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Header content
   */
  children: React.ReactNode;
}

/**
 * Card Body component props
 */
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Body content
   */
  children: React.ReactNode;
}

/**
 * Card Footer component props
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Footer content
   */
  children: React.ReactNode;
}

/**
 * Card component type with subcomponents
 */
export interface CardComponent extends React.FC<CardProps> {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
}

/**
 * Card component
 * 
 * Supports multiple elevation variants, padding options, hover effects, and clickable states.
 */
export const Card: CardComponent = ({
  elevation = 'base',
  padding = 'md',
  hover = false,
  clickable = false,
  onClick,
  className,
  children,
  ...props
}) => {
  // Elevation/shadow classes (using Tailwind default shadow utilities)
  const elevationClasses: Record<CardElevation, string> = {
    none: 'shadow-none',
    sm: 'shadow-sm',
    base: 'shadow',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  };

  // Padding classes
  const paddingClasses: Record<ComponentSize, string> = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  // Base card classes
  const cardClasses = cn(
    'rounded-xl',
    'bg-background-card-light dark:bg-background-card-dark',
    'border border-border-secondary-light dark:border-border-secondary-dark',
    'transition-all duration-200',
    // Elevation
    elevationClasses[elevation],
    // Hover effects
    hover && 'hover:shadow-lg hover:-translate-y-0.5',
    // Clickable state
    clickable && 'cursor-pointer',
    clickable && hover && 'hover:shadow-xl hover:-translate-y-1',
    className
  );

  return (
    <div
      className={cardClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as any);
              }
            }
          : undefined
      }
      aria-label={clickable ? props['aria-label'] : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Header component
 * 
 * Displays header content at the top of the card.
 */
export const CardHeader: React.FC<CardHeaderProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'border-b border-border-secondary-light dark:border-border-secondary-dark',
        'pb-4 mb-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Card Body component
 * 
 * Displays main content in the card. Applies padding based on card padding prop.
 */
export const CardBody: React.FC<CardBodyProps & { padding?: ComponentSize }> = ({
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const paddingClasses: Record<ComponentSize, string> = {
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  return (
    <div className={cn(paddingClasses[padding], className)} {...props}>
      {children}
    </div>
  );
};

/**
 * Card Footer component
 * 
 * Displays footer content at the bottom of the card.
 */
export const CardFooter: React.FC<CardFooterProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'border-t border-border-secondary-light dark:border-border-secondary-dark',
        'pt-4 mt-4',
        'flex items-center justify-end gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Attach subcomponents to Card for easier access
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardBody.displayName = 'CardBody';
CardFooter.displayName = 'CardFooter';
