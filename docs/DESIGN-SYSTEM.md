# Design System Documentation

## Overview

The CountCard design system provides a comprehensive set of design tokens, components, and guidelines to ensure consistency, accessibility, and maintainability across the application. This document outlines the design principles, token usage, and component guidelines.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing](#spacing)
5. [Border Radius](#border-radius)
6. [Shadows & Elevation](#shadows--elevation)
7. [Animation](#animation)
8. [Z-Index Scale](#z-index-scale)
9. [Breakpoints](#breakpoints)
10. [Component Guidelines](#component-guidelines)
11. [Accessibility](#accessibility)
12. [Dark Mode](#dark-mode)

---

## Design Principles

### 1. Marine Corps Theme
The design system is built around Marine Corps colors and aesthetics:
- **Marine Red** (#940000): Primary brand color, used for headings, links, and primary actions
- **Navy Blue** (#001e2e): Secondary brand color, used for backgrounds and secondary elements
- **Tan** (#84754E): Accent color, used for tertiary elements

### 2. Consistency
- All design decisions follow the established token system
- Components use consistent spacing, typography, and color values
- Patterns are reusable across the application

### 3. Accessibility
- WCAG 2.1 AA compliance required for all components
- Minimum color contrast ratios: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation support for all interactive elements
- Screen reader compatibility

### 4. Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Flexible layouts that adapt to all screen sizes

### 5. Performance
- Minimal CSS bundle size
- Efficient animations (hardware-accelerated when possible)
- Optimized component rendering

---

## Color System

### Primary Colors

#### Marine Red
- **Default**: `#940000`
- **Dark**: `#660000`
- **Usage**: Primary actions, headings, links, error states

#### Navy Blue
- **Default**: `#001e2e`
- **Dark**: `#002a3f`
- **Light**: `#003a56`
- **Usage**: Backgrounds, headers, secondary elements

#### Tan
- **Default**: `#84754E`
- **Dark**: `#6B5F3F`
- **Light**: `#B8A082`
- **Usage**: Accents, tertiary elements

### Semantic Colors

#### Status Colors
- **Success**: `#10B981` (Green)
- **Warning**: `#F59E0B` (Amber)
- **Error**: `#940000` (Marine Red) / `#FF8E8E` (Dark mode)
- **Info**: `#001e2e` (Navy Blue) / `#4A9EFF` (Dark mode)

### Background Colors

#### Light Mode
- **Primary**: `#FFFFFF`
- **Secondary**: `#F5F5F5`
- **Tertiary**: `#E8E8E8`
- **Header**: `#001e2e`
- **Card**: `#FFFFFF`
- **Input**: `#FFFFFF`

#### Dark Mode
- **Primary**: `#001e2e`
- **Secondary**: `#002a3f`
- **Tertiary**: `#003a56`
- **Header**: `#000000`
- **Card**: `#002a3f`
- **Input**: `#003a56`

### Text Colors

#### Light Mode
- **Primary**: `#000000`
- **Secondary**: `#4A5568`
- **Heading**: `#940000`
- **Link**: `#940000`
- **Link Hover**: `#660000`

#### Dark Mode
- **Primary**: `#FFFFFF`
- **Secondary**: `#CBD5E0`
- **Heading**: `#FF8E8E`
- **Link**: `#FF8E8E`
- **Link Hover**: `#FFB3B3`

### Border Colors

#### Light Mode
- **Primary**: `#CBD5E0`
- **Secondary**: `#E2E8F0`
- **Focus**: `#940000`
- **Error**: `#940000`

#### Dark Mode
- **Primary**: `#4A5568`
- **Secondary**: `#2D3748`
- **Focus**: `#FF8E8E`
- **Error**: `#FF8E8E`

### Usage Guidelines

1. **Primary Actions**: Use Marine Red for primary buttons and important actions
2. **Secondary Actions**: Use Navy Blue for secondary buttons
3. **Tertiary Actions**: Use Tan for tertiary buttons
4. **Text Contrast**: Ensure all text meets WCAG 2.1 AA contrast requirements
5. **Focus States**: Always use focus colors for keyboard navigation
6. **Error States**: Use error color for validation errors and destructive actions

---

## Typography

### Font Families

- **Headings**: `'Colossalis', Georgia, serif`
- **Body**: `Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 12px | Caption text |
| `sm` | 14px | Small text |
| `base` | 16px | Body text |
| `lg` | 18px | Body large |
| `xl` | 20px | Large text |
| `2xl` | 24px | H5 headings |
| `3xl` | 30px | H4 headings |
| `4xl` | 36px | H3 headings |
| `5xl` | 48px | H2 headings |
| `6xl` | 80px | H1 headings |

### Line Heights

- **Tight**: 1.2 (for headings)
- **Normal**: 1.5 (for body text)
- **Relaxed**: 1.75 (for readable content)
- **Loose**: 2 (for spacious layouts)

### Font Weights

- **Light**: 300
- **Normal**: 400 (default)
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

### Letter Spacing

- **Tighter**: -0.05em
- **Tight**: -0.025em
- **Normal**: 0em (default)
- **Wide**: 0.025em
- **Wider**: 0.05em
- **Widest**: 0.1em

### Usage Guidelines

1. **Headings**: Use Colossalis font family for all headings (H1-H5)
2. **Body Text**: Use Arial/sans-serif for body text
3. **Hierarchy**: Maintain clear visual hierarchy with size and weight
4. **Readability**: Use appropriate line heights for readability
5. **Contrast**: Ensure text meets contrast requirements

---

## Spacing

### Spacing Scale

Based on 4px base unit for consistent spacing:

| Token | Size | Usage |
|-------|------|-------|
| `xs` | 4px | Tight spacing, icon padding |
| `sm` | 8px | Small spacing, compact layouts |
| `md` | 12px | Medium spacing |
| `base` | 16px | Default spacing |
| `lg` | 24px | Large spacing, section gaps |
| `xl` | 32px | Extra large spacing |
| `2xl` | 48px | Section spacing |
| `3xl` | 64px | Large section spacing |
| `4xl` | 96px | Maximum spacing |

### Usage Guidelines

1. **Consistency**: Use spacing tokens consistently throughout the application
2. **Padding**: Use spacing tokens for component padding
3. **Margins**: Use spacing tokens for component margins
4. **Gaps**: Use spacing tokens for flex/grid gaps
5. **Responsive**: Adjust spacing for mobile vs desktop when needed

---

## Border Radius

### Border Radius Scale

| Token | Size | Usage |
|-------|------|-------|
| `none` | 0px | Sharp corners |
| `sm` | 4px | Small rounded corners |
| `base` | 8px | Default rounded corners |
| `md` | 12px | Medium rounded corners |
| `lg` | 16px | Large rounded corners |
| `xl` | 24px | Extra large rounded corners |
| `2xl` | 32px | Very large rounded corners |
| `full` | 9999px | Fully rounded (pills, circles) |

### Usage Guidelines

1. **Buttons**: Use `base` (8px) or `md` (12px) for buttons
2. **Cards**: Use `lg` (16px) or `xl` (24px) for cards
3. **Inputs**: Use `base` (8px) for form inputs
4. **Badges**: Use `full` for pill-shaped badges
5. **Consistency**: Maintain consistent border radius within component types

---

## Shadows & Elevation

### Shadow Scale

| Token | Shadow | Usage |
|-------|--------|-------|
| `none` | none | No shadow |
| `sm` | 0 1px 2px 0 rgba(0, 0, 0, 0.05) | Subtle elevation |
| `base` | 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) | Default elevation |
| `md` | 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) | Medium elevation |
| `lg` | 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) | Large elevation |
| `xl` | 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) | Extra large elevation |
| `2xl` | 0 25px 50px -12px rgba(0, 0, 0, 0.25) | Maximum elevation |
| `inner` | inset 0 2px 4px 0 rgba(0, 0, 0, 0.06) | Inset shadow (inputs, pressed states) |

### Usage Guidelines

1. **Cards**: Use `lg` or `xl` for card elevation
2. **Modals**: Use `2xl` for modal dialogs
3. **Buttons**: Use `base` or `md` for button elevation (hover states)
4. **Inputs**: Use `inner` for pressed/active input states
5. **Depth**: Use shadows to create visual hierarchy and depth

---

## Animation

### Duration

| Token | Duration | Usage |
|-------|----------|-------|
| `fast` | 150ms | Quick transitions |
| `base` | 200ms | Default transitions |
| `slow` | 300ms | Smooth transitions |
| `slower` | 500ms | Deliberate transitions |
| `slowest` | 1000ms | Long transitions |

### Timing Functions

| Token | Function | Usage |
|-------|----------|-------|
| `linear` | linear | Constant speed |
| `easeIn` | cubic-bezier(0.4, 0, 1, 1) | Slow start |
| `easeOut` | cubic-bezier(0, 0, 0.2, 1) | Slow end (recommended) |
| `easeInOut` | cubic-bezier(0.4, 0, 0.2, 1) | Slow start and end |
| `bounce` | cubic-bezier(0.68, -0.55, 0.265, 1.55) | Bouncy effect |

### Delay

| Token | Delay | Usage |
|-------|-------|-------|
| `none` | 0ms | No delay |
| `fast` | 50ms | Quick delay |
| `base` | 100ms | Default delay |
| `slow` | 200ms | Longer delay |

### Usage Guidelines

1. **Transitions**: Use `base` (200ms) with `easeOut` for most transitions
2. **Hover States**: Use `fast` (150ms) for hover effects
3. **Loading**: Use `slow` (300ms) for loading animations
4. **Performance**: Prefer transform and opacity for animations (GPU-accelerated)
5. **Accessibility**: Respect `prefers-reduced-motion` media query

---

## Z-Index Scale

### Z-Index Values

| Token | Value | Usage |
|-------|-------|-------|
| `base` | 0 | Default stacking |
| `dropdown` | 1000 | Dropdown menus |
| `sticky` | 1020 | Sticky headers |
| `fixed` | 1030 | Fixed elements |
| `modalBackdrop` | 1040 | Modal backdrop |
| `modal` | 1050 | Modal dialogs |
| `popover` | 1060 | Popovers |
| `tooltip` | 1070 | Tooltips |
| `notification` | 1080 | Notifications/toasts |

### Usage Guidelines

1. **Layering**: Use z-index tokens to maintain consistent layering
2. **Modals**: Always use `modalBackdrop` and `modal` together
3. **Tooltips**: Use highest z-index (`tooltip`) for tooltips
4. **Avoid**: Don't create custom z-index values outside the scale

---

## Breakpoints

### Responsive Breakpoints

| Token | Size | Usage |
|-------|------|-------|
| `sm` | 640px | Small devices (mobile) |
| `md` | 768px | Medium devices (tablet) |
| `lg` | 1024px | Large devices (desktop) |
| `xl` | 1280px | Extra large devices |
| `2xl` | 1536px | Maximum width |

### Usage Guidelines

1. **Mobile-First**: Design for mobile first, then enhance for larger screens
2. **Tailwind Classes**: Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, etc.)
3. **Content Width**: Limit content width on large screens for readability
4. **Touch Targets**: Ensure minimum 44x44px touch targets on mobile

---

## Component Guidelines

### General Principles

1. **Consistency**: All components should follow the design system tokens
2. **Accessibility**: All components must meet WCAG 2.1 AA requirements
3. **Responsive**: Components should work on all screen sizes
4. **Dark Mode**: Components must support both light and dark modes
5. **Documentation**: All components should have JSDoc comments

### Component Structure

```
components/
  ui/          # Base UI components (buttons, inputs, cards)
  layout/      # Layout components (header, footer, sidebar)
  forms/       # Form-specific components
  feedback/    # Feedback components (toasts, alerts, loading)
  navigation/  # Navigation components
  data-display/ # Data display components (tables, lists)
```

### Component Props

- Use TypeScript for all component props
- Provide default values where appropriate
- Document all props with JSDoc comments
- Use consistent naming conventions

### Component States

All interactive components should support:
- **Default**: Normal state
- **Hover**: Mouse hover state
- **Active**: Click/press state
- **Focus**: Keyboard focus state
- **Disabled**: Disabled state
- **Loading**: Loading state (when applicable)

---

## Accessibility

### WCAG 2.1 AA Compliance

1. **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
2. **Keyboard Navigation**: All interactive elements must be keyboard accessible
3. **Focus Indicators**: Visible focus rings on all focusable elements
4. **Screen Readers**: Proper ARIA labels and semantic HTML
5. **Alt Text**: All images must have descriptive alt text
6. **Form Labels**: All form inputs must have associated labels

### Best Practices

1. Use semantic HTML elements
2. Provide ARIA labels when needed
3. Ensure proper heading hierarchy
4. Test with screen readers
5. Support keyboard-only navigation
6. Respect `prefers-reduced-motion`

---

## Dark Mode

### Implementation

Dark mode is implemented using CSS custom properties and the `dark` class on the root element.

### Color Adaptation

- Colors automatically adapt based on the `dark` class
- Use CSS custom properties for all colors
- Test components in both light and dark modes

### Usage

```css
/* Light mode (default) */
.element {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

/* Dark mode automatically applied when .dark class is present */
```

### Guidelines

1. Always use CSS custom properties for colors
2. Test all components in both modes
3. Ensure contrast ratios are maintained in dark mode
4. Provide manual toggle option for users

---

## Design Token Usage

### In TypeScript/JavaScript

```typescript
import { spacing, typography, borderRadius } from '@/lib/design/tokens';

// Use tokens in component styles
const cardStyle = {
  padding: spacing.lg,
  borderRadius: borderRadius.lg,
  fontSize: typography.fontSizes.base,
};
```

### In CSS

```css
.card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
}
```

### In Tailwind Classes

```tsx
<div className="p-lg rounded-lg text-base">
  Content
</div>
```

---

## Resources

- **Design Tokens**: `lib/design/tokens.ts`
- **CSS Variables**: `app/globals.css`
- **Tailwind Config**: `tailwind.config.ts`
- **Component Library**: `components/`

---

## Updates and Maintenance

This design system is a living document and should be updated as the application evolves. When making changes:

1. Update design tokens in `lib/design/tokens.ts`
2. Update CSS custom properties in `app/globals.css`
3. Update Tailwind config if needed
4. Update this documentation
5. Test all components with changes
6. Ensure accessibility compliance is maintained

---

**Last Updated**: January 17, 2026  
**Version**: 1.0.0
