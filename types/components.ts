/**
 * Component Type Definitions
 * 
 * Centralized TypeScript type definitions for all UI components.
 * These types ensure consistency across the component library.
 */

import { ReactNode } from 'react';

/**
 * Base component props interface
 * All components should extend this interface
 */
export interface BaseComponentProps {
  /**
   * Additional CSS class names to apply to the component
   */
  className?: string;
  /**
   * Additional inline styles
   */
  style?: React.CSSProperties;
  /**
   * Test ID for testing purposes
   */
  'data-testid'?: string;
}

/**
 * Component size variants
 */
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component color variants
 */
export type ComponentColor = 
  | 'primary' 
  | 'secondary' 
  | 'tertiary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info'
  | 'ghost'
  | 'destructive';

/**
 * Component variant types
 */
export type ComponentVariant = 
  | 'solid' 
  | 'outline' 
  | 'ghost' 
  | 'soft';

/**
 * Button-specific variants
 */
export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'tertiary' 
  | 'ghost' 
  | 'destructive';

/**
 * Form input state variants
 */
export type InputState = 'default' | 'error' | 'success' | 'disabled';

/**
 * Alert/Toast variant types
 */
export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

/**
 * Card elevation variants
 */
export type CardElevation = 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Component with children
 */
export interface ComponentWithChildren extends BaseComponentProps {
  children: ReactNode;
}

/**
 * Component with optional children
 */
export interface ComponentWithOptionalChildren extends BaseComponentProps {
  children?: ReactNode;
}

/**
 * Component with label
 */
export interface ComponentWithLabel extends BaseComponentProps {
  label: string;
  labelId?: string;
  required?: boolean;
}

/**
 * Component with helper text
 */
export interface ComponentWithHelperText extends BaseComponentProps {
  helperText?: string;
  errorText?: string;
}

/**
 * Component with icon
 */
export interface ComponentWithIcon extends BaseComponentProps {
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * Component with loading state
 */
export interface ComponentWithLoading extends BaseComponentProps {
  loading?: boolean;
  loadingText?: string;
}

/**
 * Component with disabled state
 */
export interface ComponentWithDisabled extends BaseComponentProps {
  disabled?: boolean;
}

/**
 * Component with full width option
 */
export interface ComponentWithFullWidth extends BaseComponentProps {
  fullWidth?: boolean;
}

/**
 * Component with onClick handler
 */
export interface ComponentWithOnClick extends BaseComponentProps {
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Component with href (for link-like components)
 */
export interface ComponentWithHref extends BaseComponentProps {
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;
}

/**
 * Component with id
 */
export interface ComponentWithId extends BaseComponentProps {
  id?: string;
}

/**
 * Component with name (for form inputs)
 */
export interface ComponentWithName extends BaseComponentProps {
  name?: string;
}

/**
 * Component with value (for form inputs)
 */
export interface ComponentWithValue<T = string> extends BaseComponentProps {
  value?: T;
  defaultValue?: T;
}

/**
 * Component with placeholder
 */
export interface ComponentWithPlaceholder extends BaseComponentProps {
  placeholder?: string;
}

/**
 * Component with aria-label
 */
export interface ComponentWithAriaLabel extends BaseComponentProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

/**
 * Component with role
 */
export interface ComponentWithRole extends BaseComponentProps {
  role?: string;
}

/**
 * Component with tabIndex
 */
export interface ComponentWithTabIndex extends BaseComponentProps {
  tabIndex?: number;
}

/**
 * Polymorphic component props
 * Allows a component to render as different HTML elements
 */
export type PolymorphicComponentProps<
  T extends React.ElementType,
  Props = {}
> = {
  as?: T;
} & Props &
  Omit<React.ComponentPropsWithoutRef<T>, keyof Props | 'as'>;

/**
 * Utility type to extract component props
 */
export type ComponentProps<T extends React.ComponentType<any>> = 
  React.ComponentProps<T>;

/**
 * Utility type for component ref forwarding
 */
export type ComponentRef<T extends React.ElementType> = 
  React.ComponentPropsWithRef<T>['ref'];
