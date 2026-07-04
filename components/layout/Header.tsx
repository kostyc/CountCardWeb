'use client';

/**
 * Header Component
 * 
 * A responsive header component with logo/branding, primary navigation,
 * user menu, and mobile menu toggle.
 * 
 * @example
 * ```tsx
 * <Header
 *   logo={<Logo />}
 *   title="CountCard"
 *   navItems={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Recruits', href: '/recruits' },
 *   ]}
 *   userMenu={<UserMenu />}
 *   onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
 * />
 * ```
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/components/utils';
import { NavMenu, type NavMenuItem } from '@/components/navigation';
import type { BaseComponentProps } from '@/types/components';

/**
 * Header component props
 */
export interface HeaderProps extends BaseComponentProps {
  /**
   * Logo element or image
   */
  logo?: React.ReactNode;
  /**
   * Application title
   */
  title?: string;
  /**
   * Title href (defaults to '/')
   */
  titleHref?: string;
  /**
   * Primary navigation items
   */
  navItems?: NavMenuItem[];
  /**
   * User menu component
   */
  userMenu?: React.ReactNode;
  /**
   * Callback when mobile menu toggle is clicked
   */
  onMobileMenuToggle?: () => void;
  /**
   * Whether mobile menu is open
   */
  isMobileMenuOpen?: boolean;
  /**
   * Whether header is sticky
   * @default true
   */
  sticky?: boolean;
  /**
   * Header height variant
   * @default 'md'
   */
  height?: 'sm' | 'md' | 'lg';
  /**
   * Optional actions (buttons, etc.) to display in header
   */
  actions?: React.ReactNode;
}

/**
 * Header Component
 * 
 * Provides a responsive header with logo, navigation, user menu, and
 * mobile menu toggle. Supports sticky positioning and customizable height.
 * 
 * @param props - Header component props
 * @returns Header element
 */
export default function Header({
  logo,
  title = 'CountCard',
  titleHref = '/',
  navItems = [],
  userMenu,
  onMobileMenuToggle,
  isMobileMenuOpen = false,
  sticky = true,
  height = 'md',
  actions,
  className,
  ...props
}: HeaderProps): JSX.Element {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Track scroll position for styling
  useEffect(() => {
    const handleScroll = (): void => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Height classes
  const heightClasses = {
    sm: 'h-14',
    md: 'h-16',
    lg: 'h-20',
  };

  return (
    <header
      ref={headerRef}
      className={cn(
        'w-full',
        'bg-background-header-light dark:bg-background-header-dark',
        'border-b border-border-primary-light dark:border-border-primary-dark',
        'text-white',
        '[&_a]:text-white [&_a:hover]:text-tan-light [&_a:focus]:text-tan-light',
        '[&_a[aria-current=page]]:text-tan-light [&_a[aria-current=page]]:font-semibold',
        '[&_button]:text-white [&_button:hover]:bg-white/10 [&_button:hover]:text-white',
        '[&_button]:focus-visible:ring-white/50',
        heightClasses[height],
        sticky && 'sticky top-0 z-40',
        isScrolled && 'shadow-lg',
        'transition-all duration-200',
        'overflow-visible',
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full max-w-full">
        <div className="flex items-center justify-between h-full relative">
          {/* Left: Logo/Title and Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            {onMobileMenuToggle && (
              <button
                type="button"
                onClick={onMobileMenuToggle}
                className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-background-header-light dark:focus:ring-offset-background-header-dark transition-colors"
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <svg
                    className="w-6 h-6 text-white"
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
                ) : (
                  <svg
                    className="w-6 h-6 text-white"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            )}

            {/* Logo */}
            {logo ? (
              <Link
                href={titleHref}
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 focus:rounded"
              >
                {logo}
              </Link>
            ) : (
              <Link
                href={titleHref}
                className={cn(
                  'text-xl font-bold',
                  'text-white hover:text-tan-light',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-background-header-light dark:focus:ring-offset-background-header-dark focus:rounded'
                )}
              >
                {title}
              </Link>
            )}
          </div>

          {/* Center: Primary Navigation (Desktop) */}
          {navItems.length > 0 && (
            <nav className="hidden lg:flex items-center">
              <NavMenu
                items={navItems}
                orientation="horizontal"
                showActiveIndicator={true}
                size="md"
              />
            </nav>
          )}

          {/* Right: Actions and User Menu */}
          <div className="flex items-center gap-4 relative">
            {/* Actions */}
            {actions && <div className="flex items-center gap-2">{actions}</div>}

            {/* User Menu */}
            {userMenu && <div className="flex items-center relative">{userMenu}</div>}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && navItems.length > 0 && (
        <div className="lg:hidden border-t border-border-primary-light dark:border-border-primary-dark bg-background-card-light dark:bg-background-card-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <NavMenu
              items={navItems}
              orientation="vertical"
              showActiveIndicator={true}
              size="md"
            />
          </div>
        </div>
      )}
    </header>
  );
}
