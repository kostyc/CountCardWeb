'use client';

/**
 * Navigation Menu Component
 * 
 * A flexible navigation menu component supporting horizontal and vertical layouts,
 * active state indicators, submenus, and keyboard navigation.
 * 
 * @example
 * ```tsx
 * <NavMenu
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
 *     { label: 'Recruits', href: '/recruits', icon: <UsersIcon /> },
 *     {
 *       label: 'Settings',
 *       href: '/settings',
 *       children: [
 *         { label: 'Profile', href: '/settings/profile' },
 *         { label: 'Security', href: '/settings/security' },
 *       ],
 *     },
 *   ]}
 *   orientation="horizontal"
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/components/utils';
import type { BaseComponentProps } from '@/types/components';

/**
 * Navigation menu item structure
 */
export interface NavMenuItem {
  /**
   * Label text for the menu item
   */
  label: string;
  /**
   * Href for navigation
   */
  href: string;
  /**
   * Optional icon to display before label
   */
  icon?: React.ReactNode;
  /**
   * Optional submenu items
   */
  children?: NavMenuItem[];
  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
  /**
   * Optional badge or count to display
   */
  badge?: string | number;
  /**
   * Optional tooltip text
   */
  tooltip?: string;
}

/**
 * Navigation Menu component props
 */
export interface NavMenuProps extends BaseComponentProps {
  /**
   * Array of navigation menu items
   */
  items: NavMenuItem[];
  /**
   * Menu orientation
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether to show active state indicators
   * @default true
   */
  showActiveIndicator?: boolean;
  /**
   * Whether submenus are collapsible
   * @default true
   */
  collapsible?: boolean;
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Navigation Menu Component
 * 
 * Provides a flexible navigation menu with support for horizontal and vertical
 * layouts, active states, submenus, and full keyboard navigation.
 * 
 * @param props - NavMenu component props
 * @returns Navigation menu element
 */
export default function NavMenu({
  items,
  orientation = 'horizontal',
  showActiveIndicator = true,
  collapsible = true,
  size = 'md',
  className,
  ...props
}: NavMenuProps): JSX.Element {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const menuRef = useRef<HTMLUListElement>(null);

  /**
   * Check if a menu item is active
   */
  const isActive = (href: string): boolean => {
    if (href === pathname) return true;
    // Check if current path starts with href (for nested routes)
    return pathname.startsWith(href) && href !== '/';
  };

  /**
   * Toggle submenu open/closed
   */
  const toggleSubmenu = (href: string): void => {
    if (!collapsible) return;
    setOpenSubmenus((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    item: NavMenuItem,
    index: number
  ): void => {
    if (item.children && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      toggleSubmenu(item.href);
    }

    // Arrow key navigation
    if (orientation === 'vertical') {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextItem = menuRef.current?.querySelector(
          `[data-nav-index="${index + 1}"]`
        ) as HTMLElement;
        nextItem?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevItem = menuRef.current?.querySelector(
          `[data-nav-index="${index - 1}"]`
        ) as HTMLElement;
        prevItem?.focus();
      }
    } else {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const nextItem = menuRef.current?.querySelector(
          `[data-nav-index="${index + 1}"]`
        ) as HTMLElement;
        nextItem?.focus();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const prevItem = menuRef.current?.querySelector(
          `[data-nav-index="${index - 1}"]`
        ) as HTMLElement;
        prevItem?.focus();
      }
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3',
  };

  // Base menu classes
  const menuClasses = cn(
    'flex',
    orientation === 'horizontal' ? 'flex-row space-x-1' : 'flex-col space-y-1',
    className
  );

  /**
   * Render a menu item
   */
  const renderMenuItem = (item: NavMenuItem, index: number, depth = 0): JSX.Element => {
    const active = isActive(item.href);
    const hasChildren = item.children && item.children.length > 0;
    const isSubmenuOpen = openSubmenus.has(item.href);

    const itemClasses = cn(
      'flex items-center gap-2',
      'rounded-md',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2',
      sizeClasses[size],
      active && showActiveIndicator
        ? 'bg-marine-red/10 text-marine-red dark:bg-marine-red/20 dark:text-marine-red font-medium'
        : 'text-text-primary-light dark:text-text-primary-dark hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark',
      item.disabled && 'opacity-50 cursor-not-allowed',
      depth > 0 && 'ml-4'
    );

    return (
      <li key={`${item.href}-${index}`} className="relative">
        <div className="flex items-center">
          {item.href && !item.disabled ? (
            <Link
              href={item.href}
              className={itemClasses}
              data-nav-index={index}
              onKeyDown={(e) => handleKeyDown(e, item, index)}
              aria-current={active ? 'page' : undefined}
              aria-disabled={item.disabled}
            >
              {item.icon && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-marine-red text-white">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isSubmenuOpen && 'transform rotate-90'
                  )}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </Link>
          ) : (
            <span
              className={itemClasses}
              data-nav-index={index}
              onKeyDown={(e) => handleKeyDown(e, item, index)}
              aria-disabled={item.disabled}
            >
              {item.icon && (
                <span className="flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto px-2 py-0.5 text-xs font-semibold rounded-full bg-marine-red text-white">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleSubmenu(item.href)}
                  className="ml-auto p-1 rounded hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark"
                  aria-expanded={isSubmenuOpen}
                  aria-label={`Toggle ${item.label} submenu`}
                >
                  <svg
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isSubmenuOpen && 'transform rotate-90'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
            </span>
          )}

          {/* Active indicator */}
          {active && showActiveIndicator && orientation === 'vertical' && (
            <span
              className="absolute left-0 top-0 bottom-0 w-1 bg-marine-red rounded-r"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Submenu */}
        {hasChildren && isSubmenuOpen && (
          <ul
            className={cn(
              'mt-1 space-y-1',
              orientation === 'vertical' ? 'ml-4' : 'absolute top-full left-0 mt-1 bg-background-card-light dark:bg-background-card-dark border border-border-primary-light dark:border-border-primary-dark rounded-md shadow-lg p-2 min-w-[200px] z-50'
            )}
            role="menu"
          >
            {item.children!.map((child, childIndex) =>
              renderMenuItem(child, childIndex, depth + 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav aria-label="Main navigation" {...props}>
      <ul ref={menuRef} className={menuClasses} role="menubar">
        {items.map((item, index) => renderMenuItem(item, index))}
      </ul>
    </nav>
  );
}
