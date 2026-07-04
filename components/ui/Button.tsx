'use client';

/**
 * Button Component
 * 
 * A comprehensive button component with multiple variants, sizes, states, and accessibility features.
 * Supports icons, loading states, and full-width layouts.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 * 
 * <Button variant="secondary" size="lg" icon={<Icon />} iconPosition="left" loading>
 *   Submit
 * </Button>
 * 
 * <Button variant="ghost" size="sm" icon={<Icon />} iconOnly aria-label="Close" />
 * ```
 */

import React, { forwardRef } from 'react';
import { cn, getSizeClasses, getStateClasses } from '@/lib/components/utils';
import type { ButtonVariant, ComponentSize } from '@/types/components';

/**
 * Button component props
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant style
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Button size
   * @default 'md'
   */
  size?: ComponentSize;
  /**
   * Icon element to display
   */
  icon?: React.ReactNode;
  /**
   * Position of the icon relative to text
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
  /**
   * If true, button displays only the icon (icon-only button)
   * Requires aria-label for accessibility
   */
  iconOnly?: boolean;
  /**
   * Show loading state with spinner
   * @default false
   */
  loading?: boolean;
  /**
   * Loading text to display (replaces button text when loading)
   */
  loadingText?: string;
  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;
  /**
   * Button content (children)
   */
  children?: React.ReactNode;
}

/**
 * Spinner component for loading state
 */
const Spinner: React.FC<{ size?: ComponentSize }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3 border-2',
    md: 'w-4 h-4 border-2',
    lg: 'w-5 h-5 border-2',
    xl: 'w-6 h-6 border-3',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-solid border-current border-t-transparent',
        sizeClasses[size]
      )}
      aria-hidden="true"
    />
  );
};

/**
 * Button component
 * 
 * Supports multiple variants, sizes, states, and accessibility features.
 * All interactive states (hover, active, focus, disabled) are properly styled.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      iconOnly = false,
      loading = false,
      loadingText,
      fullWidth = false,
      disabled,
      className,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    // Size classes (mobile: 44px min touch target; desktop uses size variant)
    const sizeClasses = {
      sm: 'text-sm px-3 py-2.5 min-h-[44px] md:min-h-[32px]',
      md: 'text-base px-4 py-2 min-h-[44px] md:min-h-[40px]',
      lg: 'text-lg px-6 py-3 min-h-[48px]',
      xl: 'text-xl px-8 py-4 min-h-[56px]',
    };

    // Icon-only size classes (mobile: 44px; desktop uses size variant)
    const iconOnlySizeClasses = {
      sm: 'min-w-[44px] min-h-[44px] md:w-8 md:h-8 md:min-w-0 md:min-h-0',
      md: 'min-w-[44px] min-h-[44px] md:w-10 md:h-10 md:min-w-0 md:min-h-0',
      lg: 'w-12 h-12 p-0',
      xl: 'w-14 h-14 p-0',
    };

    // Variant classes
    const variantClasses: Record<ButtonVariant, string> = {
      primary: cn(
        'bg-button-primary-bg-light dark:bg-button-primary-bg-dark',
        'text-button-text',
        'hover:bg-button-primary-hover-light dark:hover:bg-button-primary-hover-dark',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-button-primary-bg-light dark:disabled:hover:bg-button-primary-bg-dark'
      ),
      secondary: cn(
        'bg-button-secondary-bg-light dark:bg-button-secondary-bg-dark',
        'text-button-text',
        'hover:bg-button-secondary-hover-light dark:hover:bg-button-secondary-hover-dark',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-button-secondary-bg-light dark:disabled:hover:bg-button-secondary-bg-dark'
      ),
      tertiary: cn(
        'bg-button-tertiary-bg-light dark:bg-button-tertiary-bg-dark',
        'text-button-tertiary-text-light dark:text-button-tertiary-text-dark',
        'hover:bg-button-tertiary-hover-light dark:hover:bg-button-tertiary-hover-dark',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-button-tertiary-bg-light dark:disabled:hover:bg-button-tertiary-bg-dark'
      ),
      ghost: cn(
        'bg-transparent',
        'text-text-link-light dark:text-text-link-dark',
        'hover:bg-background-secondary-light dark:hover:bg-background-secondary-dark',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-border-focus-light dark:focus:ring-border-focus-dark focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent'
      ),
      destructive: cn(
        'bg-error-light dark:bg-error-dark',
        'text-white',
        'hover:bg-error-light/90 dark:hover:bg-error-dark/90',
        'active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-error-light dark:focus:ring-error-dark focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-error-light dark:disabled:hover:bg-error-dark'
      ),
    };

    // Determine if button is effectively disabled (disabled or loading)
    const isDisabled = disabled || loading;

    // Get button content
    const buttonContent = loading ? (
      <>
        <Spinner size={size} />
        {loadingText && <span className="ml-2">{loadingText}</span>}
        {!loadingText && !iconOnly && children && <span className="ml-2">{children}</span>}
      </>
    ) : (
      <>
        {icon && iconPosition === 'left' && !iconOnly && (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        {children}
        {icon && iconPosition === 'right' && !iconOnly && (
          <span className="ml-2 flex-shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        {icon && iconOnly && icon}
      </>
    );

    // Base classes
    const baseClasses = cn(
      'inline-flex items-center justify-center',
      'font-semibold',
      'rounded-lg',
      'transition-all duration-200',
      'cursor-pointer',
      'z-10', // Ensure button is clickable
      'focus-visible:outline-none',
      // Size classes
      iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
      // Variant classes
      variantClasses[variant],
      // Full width
      fullWidth && 'w-full',
      // Disabled state
      isDisabled && 'pointer-events-none',
      className
    );

    // Accessibility: Ensure icon-only buttons have aria-label
    const defaultAriaLabel = iconOnly && !ariaLabel && typeof children === 'string' 
      ? children 
      : iconOnly && !ariaLabel 
        ? 'Button' 
        : undefined;

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        disabled={isDisabled}
        className={baseClasses}
        aria-label={ariaLabel || defaultAriaLabel}
        aria-busy={loading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';
