'use client';

/**
 * Breadcrumbs Component
 * 
 * Displays hierarchical navigation path with links and separators.
 * Provides context for users about their location in the application.
 * 
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Recruits', href: '/dashboard/recruits' },
 *     { label: 'John Doe' }, // Current page (no href)
 *   ]}
 * />
 * ```
 */

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Breadcrumb item structure
 */
export interface BreadcrumbItem {
  /**
   * Label text for the breadcrumb item
   */
  label: string;
  /**
   * Optional href for navigation (if not provided, item is current page)
   */
  href?: string;
  /**
   * Optional icon to display before label
   */
  icon?: React.ReactNode;
}

/**
 * Breadcrumbs component props
 */
export interface BreadcrumbsProps extends BaseComponentProps {
  /**
   * Array of breadcrumb items
   */
  items: BreadcrumbItem[];
  /**
   * Separator between breadcrumb items
   * @default '/'
   */
  separator?: React.ReactNode;
  /**
   * Maximum number of items to show (truncates with ellipsis)
   */
  maxItems?: number;
}

/**
 * Breadcrumbs Component
 * 
 * Displays a hierarchical navigation path. The last item is typically
 * the current page and is not clickable.
 * 
 * @param props - Breadcrumbs component props
 * @returns Breadcrumbs navigation element
 */
export default function Breadcrumbs({
  items,
  separator = '/',
  maxItems,
  className,
  ...props
}: BreadcrumbsProps): JSX.Element {
  // Truncate items if maxItems is specified
  const displayItems = maxItems && items.length > maxItems
    ? [
        items[0], // First item
        { label: '...', href: undefined }, // Ellipsis
        ...items.slice(-(maxItems - 2)), // Last items
      ]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-2', className)}
      {...props}
    >
      <ol className="flex items-center space-x-2" role="list">
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <li
              key={index}
              className="flex items-center"
              aria-current={isLast ? 'page' : undefined}
            >
              {index > 0 && (
                <span
                  className="mx-2 text-text-secondary-light dark:text-text-secondary-dark"
                  aria-hidden="true"
                >
                  {separator}
                </span>
              )}

              {isEllipsis ? (
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  {item.label}
                </span>
              ) : item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1',
                    'text-text-secondary-light dark:text-text-secondary-dark',
                    'hover:text-text-primary-light dark:hover:text-text-primary-dark',
                    'transition-colors duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 focus:rounded',
                    'underline-offset-4 hover:underline'
                  )}
                >
                  {item.icon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    'flex items-center gap-1',
                    'text-text-primary-light dark:text-text-primary-dark',
                    'font-medium'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="flex-shrink-0" aria-hidden="true">
                      {item.icon}
                    </span>
                  )}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
