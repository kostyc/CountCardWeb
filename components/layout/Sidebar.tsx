'use client';

/**
 * Sidebar Component
 * 
 * A responsive sidebar navigation component with collapsible sections,
 * active state indicators, and mobile drawer support.
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard', icon: <HomeIcon /> },
 *     { label: 'Recruits', href: '/recruits', icon: <UsersIcon /> },
 *     {
 *       label: 'Settings',
 *       children: [
 *         { label: 'Profile', href: '/settings/profile' },
 *         { label: 'Security', href: '/settings/security' },
 *       ],
 *     },
 *   ]}
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 * ```
 */

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/components/utils';
import { NavMenu, type NavMenuItem } from '@/components/navigation';
import type { BaseComponentProps } from '@/types/components';

/**
 * Sidebar component props
 */
export interface SidebarProps extends BaseComponentProps {
  /**
   * Navigation menu items
   */
  items: NavMenuItem[];
  /**
   * Whether the sidebar is open (for mobile drawer)
   */
  isOpen?: boolean;
  /**
   * Callback when sidebar should close (for mobile)
   */
  onClose?: () => void;
  /**
   * Sidebar width variant
   * @default 'md'
   */
  width?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether sidebar is collapsible
   * @default false
   */
  collapsible?: boolean;
  /**
   * Optional header content (logo, title, etc.)
   */
  header?: React.ReactNode;
  /**
   * Optional footer content
   */
  footer?: React.ReactNode;
}

/**
 * Sidebar Component
 * 
 * Provides a responsive sidebar navigation with support for collapsible
 * sections, active state indicators, and mobile drawer behavior.
 * 
 * @param props - Sidebar component props
 * @returns Sidebar navigation element
 */
export default function Sidebar({
  items,
  isOpen = true,
  onClose,
  width = 'md',
  collapsible = false,
  header,
  footer,
  className,
  ...props
}: SidebarProps): JSX.Element {
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname, onClose]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Width classes
  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
    xl: 'w-96',
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen',
          'bg-background-card-light dark:bg-background-card-dark',
          'border-r border-border-primary-light dark:border-border-primary-dark',
          'flex flex-col',
          'z-50 lg:z-auto',
          'transition-transform duration-300 ease-in-out',
          widthClasses[width],
          // Mobile: slide in/out
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
        aria-label="Sidebar navigation"
        {...props}
      >
        {/* Header */}
        {header && (
          <div className="flex items-center justify-between p-4 border-b border-border-primary-light dark:border-border-primary-dark">
            {header}
            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-md hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 transition-colors"
              aria-label="Close sidebar"
            >
              <svg
                className="w-6 h-6 text-text-primary-light dark:text-text-primary-dark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
                width="24"
                height="24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto p-4">
          <NavMenu
            items={items}
            orientation="vertical"
            showActiveIndicator={true}
            collapsible={collapsible}
            size="md"
          />
        </nav>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-border-primary-light dark:border-border-primary-dark">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
