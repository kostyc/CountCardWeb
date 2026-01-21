# Responsive Design Guide

## Overview

CountCard uses a mobile-first responsive design approach with breakpoints defined in the design tokens. All components are designed to work seamlessly across mobile, tablet, and desktop devices.

## Breakpoints

The application uses the following breakpoints (defined in `lib/design/tokens.ts`):

| Breakpoint | Width | Description |
|------------|-------|-------------|
| `sm` | 640px | Small devices (mobile landscape) |
| `md` | 768px | Medium devices (tablets) |
| `lg` | 1024px | Large devices (desktops) |
| `xl` | 1280px | Extra large devices (large desktops) |
| `2xl` | 1536px | 2X large devices (very large desktops) |

## Responsive Utilities

### Hooks

#### `useBreakpoint()`

Returns the current breakpoint name.

```tsx
import { useBreakpoint } from '@/lib/utils/responsive';

function MyComponent() {
  const breakpoint = useBreakpoint();
  
  if (breakpoint === 'lg') {
    // Desktop layout
  }
}
```

#### `useMediaQuery(minBreakpoint)`

Checks if the viewport matches a specific breakpoint or larger.

```tsx
import { useMediaQuery } from '@/lib/utils/responsive';

function MyComponent() {
  const isDesktop = useMediaQuery('lg');
  
  return isDesktop ? <DesktopLayout /> : <MobileLayout />;
}
```

#### `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`

Convenience hooks for common device types.

```tsx
import { useIsMobile, useIsTablet, useIsDesktop } from '@/lib/utils/responsive';

function MyComponent() {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
}
```

#### `useResponsiveValue(values, defaultValue)`

Returns different values based on the current breakpoint.

```tsx
import { useResponsiveValue } from '@/lib/utils/responsive';

function MyComponent() {
  const columns = useResponsiveValue({
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  }, 1);
  
  return <Grid cols={columns}>...</Grid>;
}
```

### Utilities

#### `getResponsiveClasses(classes, baseClasses)`

Generates Tailwind CSS classes for different breakpoints.

```tsx
import { getResponsiveClasses } from '@/lib/utils/responsive';

const classes = getResponsiveClasses({
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}, 'font-semibold');
```

## Responsive Layout Components

### Grid Component

The `Grid` component provides a responsive CSS Grid layout.

```tsx
import { Grid } from '@/components/layout';

<Grid 
  cols={{ sm: 1, md: 2, lg: 3 }} 
  gap={4}
  align="center"
>
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

**Props:**
- `cols`: Number of columns at each breakpoint
- `gap`: Gap between grid items (Tailwind spacing value)
- `rowGap`: Row gap (if different from gap)
- `colGap`: Column gap (if different from gap)
- `align`: Grid alignment (`start`, `center`, `end`, `stretch`)
- `justify`: Grid justify (`start`, `center`, `end`, `stretch`, `between`, `around`, `evenly`)

### Flex Component

The `Flex` component provides a responsive Flexbox layout.

```tsx
import { Flex } from '@/components/layout';

<Flex 
  direction={{ sm: 'col', md: 'row' }} 
  gap={4}
  align="center"
  justify="between"
>
  <div>Item 1</div>
  <div>Item 2</div>
</Flex>
```

**Props:**
- `direction`: Flex direction at each breakpoint or single value
- `wrap`: Whether to wrap items
- `gap`: Gap between flex items
- `align`: Align items (`start`, `center`, `end`, `stretch`, `baseline`)
- `justify`: Justify content (`start`, `center`, `end`, `between`, `around`, `evenly`)
- `grow`: Grow items to fill available space
- `shrink`: Shrink items when space is limited

## Responsive Component Patterns

### Mobile-First Approach

All components use Tailwind's mobile-first approach. Base styles apply to mobile, and larger breakpoints override as needed.

```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

### Responsive Typography

Use Tailwind's responsive typography utilities:

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl">
  Responsive Heading
</h1>
```

### Responsive Spacing

Use Tailwind's responsive spacing utilities:

```tsx
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>
```

### Responsive Images

Use Next.js `Image` component with responsive sizing:

```tsx
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  className="w-full h-auto"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

## Component Variants by Device

### Mobile Optimizations

- **Touch Targets**: Minimum 44x44px for interactive elements
- **Spacing**: Increased padding for thumb-friendly zones
- **Typography**: Slightly larger text for readability
- **Navigation**: Collapsible menus, hamburger menu
- **Forms**: Full-width inputs, stacked layouts

### Tablet Optimizations

- **Layout**: 2-column grids, side-by-side forms
- **Navigation**: Horizontal navigation with dropdowns
- **Typography**: Standard sizes
- **Spacing**: Moderate padding

### Desktop Optimizations

- **Layout**: Multi-column grids, complex layouts
- **Navigation**: Full horizontal navigation
- **Typography**: Standard to large sizes
- **Spacing**: Generous padding
- **Hover States**: Enhanced hover effects

## Best Practices

1. **Mobile-First**: Always design for mobile first, then enhance for larger screens
2. **Touch Targets**: Ensure all interactive elements are at least 44x44px on mobile
3. **Readable Text**: Maintain minimum font sizes (12px on mobile, 14px+ on desktop)
4. **Performance**: Use responsive images and lazy loading
5. **Testing**: Test on real devices, not just browser dev tools
6. **Progressive Enhancement**: Add features for larger screens, don't remove for smaller
7. **Flexible Layouts**: Use Grid and Flex components for flexible, responsive layouts
8. **Breakpoint Consistency**: Use design token breakpoints consistently

## Examples

### Responsive Card Grid

```tsx
import { Grid } from '@/components/layout';
import { Card } from '@/components/ui';

<Grid cols={{ sm: 1, md: 2, lg: 3, xl: 4 }} gap={6}>
  {items.map(item => (
    <Card key={item.id}>
      {item.content}
    </Card>
  ))}
</Grid>
```

### Responsive Form Layout

```tsx
import { Flex } from '@/components/layout';

<Flex direction={{ sm: 'col', md: 'row' }} gap={4}>
  <Input label="First Name" className="flex-1" />
  <Input label="Last Name" className="flex-1" />
</Flex>
```

### Conditional Rendering by Breakpoint

```tsx
import { useIsMobile, useIsDesktop } from '@/lib/utils/responsive';

function MyComponent() {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  
  return (
    <>
      {isMobile && <MobileNavigation />}
      {isDesktop && <DesktopNavigation />}
    </>
  );
}
```

## Testing

### Browser Dev Tools

Test responsive behavior using browser dev tools:
- Chrome DevTools: Device toolbar (Cmd/Ctrl + Shift + M)
- Firefox: Responsive Design Mode (Cmd/Ctrl + Shift + M)
- Safari: Responsive Design Mode (Develop > Enter Responsive Design Mode)

### Real Device Testing

Test on actual devices:
- **Mobile**: iPhone (Safari), Android (Chrome)
- **Tablet**: iPad (Safari), Android tablets (Chrome)
- **Desktop**: Chrome, Safari, Edge, Firefox

### Breakpoint Testing Checklist

- [ ] Test at each breakpoint (sm, md, lg, xl, 2xl)
- [ ] Test transitions between breakpoints
- [ ] Verify touch targets on mobile
- [ ] Check text readability at all sizes
- [ ] Test navigation on all devices
- [ ] Verify images load correctly
- [ ] Check form usability on mobile
- [ ] Test horizontal scrolling (should not occur)

## Related Documentation

- [Design System](./DESIGN-SYSTEM.md) - Design tokens and system guidelines
- [Component Library](../components/README.md) - Component documentation
- [Tailwind CSS Documentation](https://tailwindcss.com/docs/responsive-design) - Tailwind responsive utilities
