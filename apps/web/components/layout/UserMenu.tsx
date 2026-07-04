'use client';

/**
 * User Menu Component
 * Dropdown menu accessible from all authenticated pages with profile access, settings, and sign out
 */

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { debugLog } from '@/lib/utils/debugLogger';

/**
 * UserMenu Component
 * Displays user avatar/icon with dropdown menu for profile, settings, and sign out
 */
export default function UserMenu(): JSX.Element | null {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Calculate menu position to stay within viewport using fixed positioning
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = (): void => {
        if (!buttonRef.current) return;
        
        const button = buttonRef.current;
        const buttonRect = button.getBoundingClientRect();
        const menuWidth = 224; // w-56 = 14rem = 224px
        const menuHeight = 350; // Approximate height with all items
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 16; // 1rem padding from edges
        
        // Calculate position - align right edge of menu with right edge of button
        let top = buttonRect.bottom + 8; // 8px gap
        let right = viewportWidth - buttonRect.right;
        
        // Ensure menu doesn't go off bottom of screen
        if (top + menuHeight > viewportHeight - padding) {
          top = buttonRect.top - menuHeight - 8; // Position above button
          // If still doesn't fit above, position at top with padding
          if (top < padding) {
            top = padding;
          }
        }
        
        // Ensure menu doesn't go off right edge - align to button's right edge
        if (right < padding) {
          right = padding;
        }
        
        // Ensure menu doesn't go off left edge
        const leftPosition = viewportWidth - right;
        if (leftPosition < menuWidth + padding) {
          right = viewportWidth - menuWidth - padding;
        }
        
        setMenuStyle({
          position: 'fixed',
          top: `${Math.max(padding, top)}px`,
          right: `${Math.max(padding, right)}px`,
          zIndex: 9999,
          minWidth: '224px',
        });
      };
      
      // Calculate position immediately
      updatePosition();
      
      // Recalculate on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  /**
   * Toggle menu open/closed
   */
  const toggleMenu = (): void => {
    setIsOpen(!isOpen);
  };

  /**
   * Handle menu item click
   */
  const handleMenuItemClick = (path: string): void => {
    setIsOpen(false);
    router.push(path);
  };

  /**
   * Handle sign out
   */
  const handleSignOut = async (): Promise<void> => {
    setIsOpen(false);
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      debugLog.error('Error signing out', 'UserMenu', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  /**
   * Check if user has admin role
   */
  const isAdmin = (): boolean => {
    const role = user.customClaims?.role || user.profile?.role;
    if (!role) return false;

    // Admin roles: Company 1stSgt and above
    const adminRoles: UserRole[] = [
      'company_first_sgt',
      'series_commander',
      'company_xo',
      'company_commander',
      'battalion_sgt_maj',
      'battalion_xo',
      'battalion_commander',
    ];

    return adminRoles.includes(role);
  };

  /**
   * Get user display name or email
   */
  const getDisplayName = (): string => {
    if (user.profile?.displayName) {
      return user.profile.displayName;
    }
    if (user.displayName) {
      return user.displayName;
    }
    if (user.email) {
      return user.email;
    }
    return 'User';
  };

  /**
   * Get user avatar/initials
   */
  const getAvatarContent = (): string => {
    if (user.profile?.displayName) {
      // Extract initials from display name (e.g., "Sgt. Smith" -> "SS")
      const parts = user.profile.displayName.split(' ');
      if (parts.length >= 2) {
        return parts[parts.length - 1].charAt(0).toUpperCase();
      }
    }
    if (user.profile?.firstName && user.profile?.lastName) {
      return user.profile.lastName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  /**
   * Get user photo URL
   */
  const getPhotoUrl = (): string | null => {
    return user.profile?.profilePictureUrl || user.profile?.photoURL || user.photoURL || null;
  };

  return (
    <div className="relative">
      {/* User Menu Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
        className="flex items-center justify-center min-w-[44px] min-h-[44px] gap-2 p-2 rounded-full hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 transition-colors"
      >
        {/* Avatar */}
        {getPhotoUrl() ? (
          <img
            src={getPhotoUrl()!}
            alt={getDisplayName()}
            className="w-8 h-8 rounded-full object-cover border-2 border-border-primary-light dark:border-border-primary-dark"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-marine-red text-white flex items-center justify-center font-semibold text-sm border-2 border-border-primary-light dark:border-border-primary-dark">
            {getAvatarContent()}
          </div>
        )}
        {/* Dropdown Icon */}
        <svg
          className={`w-4 h-4 text-text-primary-light dark:text-text-primary-dark transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
          width="16"
          height="16"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu - Using React Portal for proper positioning */}
      {isOpen && typeof window !== 'undefined' && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          {/* Menu */}
          <div
            ref={menuRef}
            className="fixed w-56 rounded-lg shadow-2xl bg-background-card-light dark:bg-background-card-dark border-2 border-border-primary-light dark:border-border-primary-dark"
            style={menuStyle}
            role="menu"
            aria-orientation="vertical"
          >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-border-primary-light dark:border-border-primary-dark">
            <p className="text-sm font-medium text-text-heading-light dark:text-text-heading-dark">
              {getDisplayName()}
            </p>
            {user.email && (
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">
                {user.email}
              </p>
            )}
            {user.customClaims?.role && (
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {user.customClaims.role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1" role="none">
            {/* Profile */}
            <button
              type="button"
              onClick={() => handleMenuItemClick('/profile')}
              className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark focus:outline-none focus:bg-background-secondary-light dark:focus:bg-background-secondary-dark transition-colors flex items-center"
              role="menuitem"
            >
              Profile
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => handleMenuItemClick('/settings')}
              className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark focus:outline-none focus:bg-background-secondary-light dark:focus:bg-background-secondary-dark transition-colors flex items-center"
              role="menuitem"
            >
              Settings
            </button>

            {/* Share App (Placeholder for Sprint 7) */}
            <button
              type="button"
              onClick={() => handleMenuItemClick('/share')}
              className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark focus:outline-none focus:bg-background-secondary-light dark:focus:bg-background-secondary-dark transition-colors flex items-center"
              role="menuitem"
            >
              Share App
            </button>

            {/* Admin Menu Items */}
            {isAdmin() && (
              <>
                <div className="border-t border-border-primary-light dark:border-border-primary-dark my-1" />
                <button
                  type="button"
                  onClick={() => handleMenuItemClick('/dashboard/admin')}
                  className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark focus:outline-none focus:bg-background-secondary-light dark:focus:bg-background-secondary-dark transition-colors flex items-center"
                  role="menuitem"
                >
                  Admin Panel
                </button>
              </>
            )}

            {/* Sign Out */}
            <div className="border-t border-border-primary-light dark:border-border-primary-dark my-1" />
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 min-h-[44px] text-sm text-marine-red hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20 transition-colors flex items-center"
              role="menuitem"
            >
              Sign Out
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
