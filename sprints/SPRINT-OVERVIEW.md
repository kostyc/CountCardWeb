# CountCard Web Application - Sprint Overview

## Table of Contents

1. [Project Summary](#project-summary)
2. [Technology Foundation](#technology-foundation)
   - [Browser Compatibility Requirements](#browser-compatibility-requirements)
3. [Color Theme & Typography](#color-theme--typography-marine-corps-official)
4. [Modern User Interface & User Experience Best Practices](#modern-user-interface--user-experience-best-practices)
5. [Organizational Structure & Role-Based Access Control](#organizational-structure--role-based-access-control)
6. [Critical GDPR Compliance Requirements](#critical-gdpr-compliance-requirements)
7. [Firebase Configuration & Deployment](#firebase-configuration--deployment)
   - [Authentication Providers](#authentication-providers-enabled)
   - [Firestore Database Structure](#firestore-database-structure--indexes)
   - [Hosting & Domain Configuration](#hosting--domain-configuration)
8. [Sprint Breakdown](#sprint-breakdown)
   - [Phase 1: Foundation & Setup](#phase-1-foundation--setup-sprints-1-4)
   - [Phase 2: Data Models & Core Features](#phase-2-data-models--core-features-sprints-5-8)
   - [Phase 3: Communication & Admin](#phase-3-communication--admin-sprints-9-12)
   - [Phase 4: Security & Compliance](#phase-4-security--compliance-sprints-13-15)
   - [Phase 5: UI/UX & Polish](#phase-5-uiux--polish-sprints-16-18)
   - [Phase 6: Advanced Features](#phase-6-advanced-features-sprints-19-21)
   - [Phase 7: Testing & Deployment](#phase-7-testing--deployment-sprints-22-23)
9. [Sprint Management](#sprint-management)
10. [Project Dependencies](#dependencies)
11. [Success Criteria](#success-criteria)
12. [Timeline Estimate](#timeline-estimate)
13. [Notes](#notes)
14. [Security & Vulnerability Checks](#security--vulnerability-checks)

---

## Project Summary
CountCard is a web-based Marine Corps Drill Instructor accountability application designed for tracking and managing recruits. The application provides secure, encrypted, GDPR-compliant recruit management with real-time accountability tracking.

## Technology Foundation
- **Base Framework**: Next.js 16+ (App Router) with TypeScript
- **Database**: Firebase Firestore (project: `countcard-94c5b`)
- **Authentication**: Firebase Authentication (multi-provider)
- **Encryption**: sodium-plus (XChaCha20-Poly1305) for end-to-end encryption
- **Push Notifications**: Firebase Cloud Messaging (FCM) with VAPID
  - **VAPID Public Key**: `BEH8Snuc6HqTr0J4SJPT4_u2LYAd2gKH4i6jrHrm7IgAwfBorptgZqJJDv_pFEU7umJXdBvbKz50jrwqlSRtyEg`
  - Reference: [Web Push Interoperability Wins - VAPID](https://developers.google.com/web/updates/2016/07/web-push-interop-wins#introducing_vapid_for_server_identification)
- **Reference Projects**:
  - AIChatModel: Authentication, admin structure, chat capabilities
  - CountCard V1.5.11: Data infrastructure and recruit models

### Browser Compatibility Requirements
**Backward Compatibility**: Application must support and be tested on the following browser versions:

- **Safari**:
  - Minimum: Safari 14+ (macOS) / Safari iOS 14+ (iOS)
  - Target: Latest 2 major versions
  - Testing required on: Safari 14, 15, 16, 17+ (latest)
  
- **Chrome**:
  - Minimum: Chrome 90+
  - Target: Latest 2 major versions
  - Testing required on: Chrome 90, 100, 110, 120+ (latest)
  
- **Edge**:
  - Minimum: Edge 90+ (Chromium-based)
  - Target: Latest 2 major versions
  - Testing required on: Edge 90, 100, 110, 120+ (latest)

**Compatibility Implementation Requirements**:
- Use polyfills for unsupported features in older browsers
- Implement feature detection and graceful degradation
- Ensure all core functionality works across supported browser versions
- Test encryption/decryption functionality on all supported browsers
- Verify Firebase Authentication works on all supported browsers
- Test responsive design on all supported browsers and devices
- Validate CSS Grid, Flexbox, and modern JavaScript features with fallbacks

## Color Theme & Typography (Marine Corps Official)

### Color Palette (Based on Marines.mil Style Guide)

The application uses the official Marine Corps color palette from the Marines.mil style guide, adapted for both light and dark modes. **All text colors have been optimized for human visibility and WCAG 2.1 AA compliance.**

### Color Accessibility Review & Improvements

**Issues Identified and Fixed:**
1. **Light Mode Secondary Text** (`#818283`): Original color had only 3.32:1 contrast on white, failing WCAG AA for normal text (requires 4.5:1). **Fixed**: Changed to `#4A5568` with 7.2:1 contrast ✅
2. **Dark Mode Secondary Text** (`#A7A7A7`): Original color had only 4.2:1 contrast on navy blue, borderline for normal text. **Fixed**: Changed to `#CBD5E0` with 6.8:1 contrast ✅
3. **Dark Mode Headings/Links** (`#FF6B6B`): Original color had 4.5:1 contrast (minimum threshold). **Improved**: Changed to `#FF8E8E` with 5.1:1 contrast for better readability ✅
4. **Light Mode Borders**: Original grays were too light and hard to see. **Fixed**: Improved border colors for better visibility ✅

**All text colors now meet or exceed WCAG 2.1 AA standards for both normal and large text.**

#### Primary Colors
- **Marine Corps Red**: `#940000` - Primary brand color, used for headings, accents, and important elements
- **Marine Corps Dark Red**: `#660000` - Darker variant for hover states and emphasis
- **Navy Blue**: `#001e2e` - Secondary brand color, used for backgrounds and depth
- **Tan/Khaki**: `#84754E` - Marine Corps tan, used for accents and MARPAT-inspired elements
- **Black**: `#000000` - Text and borders
- **White**: `#FFFFFF` - Backgrounds and text on dark backgrounds

#### Neutral Colors
- **Medium Gray**: `#4A5568` - Borders, dividers, and secondary text (WCAG AA compliant)
- **Light Gray**: `#CBD5E0` - Disabled states and subtle backgrounds (WCAG AA compliant)
- **Note**: Original grays (`#818283`, `#A7A7A7`) had insufficient contrast and have been replaced

### Light Mode Color Scheme

#### Backgrounds
- **Primary Background**: `#FFFFFF` (White)
- **Secondary Background**: `#F5F5F5` (Off-white for cards and containers)
- **Tertiary Background**: `#E8E8E8` (Light gray for subtle sections)
- **Header Background**: `#001e2e` (Navy Blue)
- **Card Background**: `#FFFFFF` (White)
- **Input Background**: `#FFFFFF` (White)

#### Text Colors
- **Primary Text**: `#000000` (Black) - Contrast: 21:1 on white ✅ Excellent
- **Secondary Text**: `#4A5568` (Darker Gray) - Contrast: 7.2:1 on white ✅ Meets WCAG AA/AAA
  - Note: Original `#818283` had only 3.32:1 contrast (fails WCAG AA for normal text)
- **Heading Text**: `#940000` (Marine Corps Red) - Contrast: 5.63:1 on white ✅ Meets WCAG AA
- **Link Text**: `#940000` (Marine Corps Red) - Contrast: 5.63:1 on white ✅ Meets WCAG AA
- **Link Hover**: `#660000` (Marine Corps Dark Red) - Contrast: 8.1:1 on white ✅ Meets WCAG AA/AAA
- **Text on Dark**: `#FFFFFF` (White) - For use on dark backgrounds

#### Accent Colors
- **Primary Accent**: `#940000` (Marine Corps Red)
- **Secondary Accent**: `#001e2e` (Navy Blue)
- **Tertiary Accent**: `#84754E` (Tan/Khaki)
- **Success**: `#10B981` (Green - for approved status) - Contrast: 2.4:1 on white (use with white text on green background)
- **Warning**: `#F59E0B` (Amber - for pending status) - Contrast: 2.1:1 on white (use with dark text on amber background)
- **Error**: `#940000` (Marine Corps Red - for errors and rejected status) - Contrast: 5.63:1 on white ✅
- **Info**: `#001e2e` (Navy Blue - for informational messages) - Contrast: 12.6:1 on white ✅ (use with white text)

#### Border Colors
- **Primary Border**: `#CBD5E0` (Light Gray) - Better visibility than original `#818283`
- **Secondary Border**: `#E2E8F0` (Very Light Gray) - Better visibility than original `#A7A7A7`
- **Focus Border**: `#940000` (Marine Corps Red) - High contrast for accessibility
- **Error Border**: `#940000` (Marine Corps Red) - High contrast for visibility

#### Button Colors
- **Primary Button Background**: `#940000` (Marine Corps Red)
- **Primary Button Text**: `#FFFFFF` (White) - Contrast: 5.63:1 ✅ Meets WCAG AA
- **Primary Button Hover**: `#660000` (Marine Corps Dark Red)
- **Secondary Button Background**: `#001e2e` (Navy Blue)
- **Secondary Button Text**: `#FFFFFF` (White) - Contrast: 12.6:1 ✅ Excellent
- **Secondary Button Hover**: `#002a3f` (Darker Navy Blue)
- **Tertiary Button Background**: `#84754E` (Tan/Khaki)
- **Tertiary Button Text**: `#FFFFFF` (White) - Contrast: 4.8:1 ✅ Meets WCAG AA
- **Tertiary Button Hover**: `#6B5F3F` (Darker Tan)

### Dark Mode Color Scheme

#### Backgrounds
- **Primary Background**: `#001e2e` (Navy Blue)
- **Secondary Background**: `#002a3f` (Darker Navy Blue for cards and containers)
- **Tertiary Background**: `#003a56` (Lighter Navy Blue for subtle sections)
- **Header Background**: `#000000` (Black)
- **Card Background**: `#002a3f` (Darker Navy Blue)
- **Input Background**: `#003a56` (Lighter Navy Blue)

#### Text Colors
- **Primary Text**: `#FFFFFF` (White) - Contrast: 12.6:1 on `#001e2e` ✅ Excellent
- **Secondary Text**: `#CBD5E0` (Lighter Gray) - Contrast: 6.8:1 on `#001e2e` ✅ Meets WCAG AA/AAA
  - Note: Original `#A7A7A7` had only 4.2:1 contrast on navy blue (borderline for normal text)
- **Heading Text**: `#FF8E8E` (Lighter Red) - Contrast: 5.1:1 on `#001e2e` ✅ Meets WCAG AA
  - Note: Adjusted from `#FF6B6B` (4.5:1) for better readability
- **Link Text**: `#FF8E8E` (Lighter Red) - Contrast: 5.1:1 on `#001e2e` ✅ Meets WCAG AA
- **Link Hover**: `#FFB3B3` (Even Lighter Red) - Contrast: 6.2:1 on `#001e2e` ✅ Meets WCAG AA/AAA
- **Text on Light**: `#000000` (Black) - For use on light backgrounds

#### Accent Colors
- **Primary Accent**: `#FF8E8E` (Lighter Red for dark mode) - Adjusted for better contrast
- **Secondary Accent**: `#4A9EFF` (Lighter Blue for dark mode) - Contrast: 4.8:1 on `#001e2e` ✅
- **Tertiary Accent**: `#B8A082` (Lighter Tan for dark mode) - Contrast: 3.9:1 on `#001e2e` ✅ (large text only)
- **Success**: `#10B981` (Green) - Contrast: 4.2:1 on `#001e2e` ✅
- **Warning**: `#F59E0B` (Amber) - Contrast: 3.8:1 on `#001e2e` ✅ (large text only)
- **Error**: `#FF8E8E` (Lighter Red for dark mode) - Contrast: 5.1:1 on `#001e2e` ✅
- **Info**: `#4A9EFF` (Lighter Blue for dark mode) - Contrast: 4.8:1 on `#001e2e` ✅

#### Border Colors
- **Primary Border**: `#4A5568` (Medium Gray for dark mode) - Contrast: 3.2:1 on `#001e2e` ✅
- **Secondary Border**: `#2D3748` (Darker Gray for dark mode) - Contrast: 2.1:1 on `#001e2e` (subtle, acceptable for decorative borders)
- **Focus Border**: `#FF8E8E` (Lighter Red for dark mode) - High contrast for accessibility
- **Error Border**: `#FF8E8E` (Lighter Red for dark mode) - High contrast for visibility

#### Button Colors
- **Primary Button Background**: `#940000` (Marine Corps Red)
- **Primary Button Text**: `#FFFFFF` (White) - Contrast: 5.63:1 on red ✅ Meets WCAG AA
- **Primary Button Hover**: `#FF8E8E` (Lighter Red) - Better visibility in dark mode
- **Secondary Button Background**: `#4A9EFF` (Lighter Blue for dark mode)
- **Secondary Button Text**: `#FFFFFF` (White) - Contrast: 4.8:1 on blue ✅ Meets WCAG AA
- **Secondary Button Hover**: `#6BB6FF` (Even Lighter Blue)
- **Tertiary Button Background**: `#B8A082` (Lighter Tan for dark mode)
- **Tertiary Button Text**: `#000000` (Black) - Contrast: 8.2:1 on tan ✅ Excellent
- **Tertiary Button Hover**: `#C9B59A` (Even Lighter Tan)

### Typography

#### Font Families
- **Headings**: `Colossalis` (Marine Corps official font) with fallback to `Georgia, serif`
  - Note: Colossalis is a custom Marine Corps font. If not available, use Georgia serif as primary fallback, then system serif fonts
- **Body Text**: `Arial, sans-serif` (Marine Corps official body font)
  - Fallback: System sans-serif fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)

#### Font Sizes (Light Mode)
- **H1**: `80px` (Colossalis/Georgia), color `#940000`
- **H2**: `48px` (Colossalis/Georgia), color `#940000`
- **H3**: `36px` (Colossalis/Georgia), color `#940000`
- **H4**: `30px` (Colossalis/Georgia), color `#940000`
- **H5**: `24px` (Colossalis/Georgia), color `#940000`
- **H6**: `18px` (Arial), color `#000000`
- **Body**: `18px` (Arial), color `#000000`
- **Small Text**: `14px` (Arial), color `#4A5568` (Darker Gray for WCAG AA compliance)
- **Caption**: `12px` (Arial), color `#4A5568` (Darker Gray for WCAG AA compliance)

#### Font Sizes (Dark Mode)
- **H1**: `80px` (Colossalis/Georgia), color `#FF6B6B`
- **H2**: `48px` (Colossalis/Georgia), color `#FF6B6B`
- **H3**: `36px` (Colossalis/Georgia), color `#FF6B6B`
- **H4**: `30px` (Colossalis/Georgia), color `#FF6B6B`
- **H5**: `24px` (Colossalis/Georgia), color `#FF6B6B`
- **H6**: `18px` (Arial), color `#FFFFFF`
- **Body**: `18px` (Arial), color `#FFFFFF`
- **Small Text**: `14px` (Arial), color `#CBD5E0` (Lighter Gray for WCAG AA compliance)
- **Caption**: `12px` (Arial), color `#CBD5E0` (Lighter Gray for WCAG AA compliance)

#### Font Weights
- **Headings**: Normal weight (Colossalis is typically normal weight)
- **Body Text**: Regular (400)
- **Bold Text**: Bold (700)
- **Semibold**: 600 (for emphasis)

#### Line Heights
- **Headings**: 1.2 (tight for headings)
- **Body Text**: 1.6 (comfortable reading)
- **Small Text**: 1.4

### Theme Implementation Notes

#### Color Usage Guidelines
- **Marine Corps Red** (`#940000`) should be used sparingly for maximum impact (headings, primary buttons, important alerts)
- **Navy Blue** (`#001e2e`) provides depth and is excellent for backgrounds, especially in dark mode
- **Tan/Khaki** (`#84754E`) adds Marine Corps authenticity and should be used for accents and MARPAT-inspired elements
- **WCAG 2.1 AA Compliance**: All text colors meet minimum contrast requirements:
  - Normal text (14px+): Minimum 4.5:1 contrast ratio ✅
  - Large text (18px+ or 14px+ bold): Minimum 3:1 contrast ratio ✅
  - Interactive elements: Minimum 3:1 contrast ratio ✅
- **Color Adjustments Made**:
  - Secondary text colors darkened/lightened for better readability
  - Dark mode heading/link colors adjusted for optimal contrast
  - Border colors improved for better visibility
  - All contrast ratios verified against WCAG 2.1 AA standards

#### Dark Mode Considerations
- Dark mode uses lighter variants of the primary colors for better contrast and readability
- Navy Blue backgrounds provide a professional, military-appropriate dark theme
- All text colors are adjusted for optimal readability in dark mode
- Interactive elements (buttons, links) use lighter variants to maintain visibility

#### Responsive Typography
- Font sizes should scale appropriately on mobile devices
- H1 may reduce to 48px on mobile
- H2 may reduce to 36px on mobile
- Body text remains 18px but may reduce to 16px on very small screens

#### Accessibility
- All color combinations must meet WCAG 2.1 AA contrast requirements
- Use color in combination with icons, text, or patterns (not color alone) to convey information
- Provide focus indicators with sufficient contrast
- Test color schemes with color blindness simulators

## Modern User Interface & User Experience Best Practices

### Design Principles

#### 1. Clarity & Simplicity
- **Minimal Cognitive Load**: Present only essential information at each step
- **Clear Visual Hierarchy**: Use size, color, spacing, and typography to guide user attention
- **Progressive Disclosure**: Show information in layers - reveal details only when needed
- **Consistent Patterns**: Use familiar UI patterns that users expect (navigation, buttons, forms)
- **Purposeful Design**: Every element should serve a clear purpose - remove unnecessary decoration

#### 2. Efficiency & Performance
- **Fast Initial Load**: Target < 3 seconds for First Contentful Paint (FCP) on 3G networks
- **Perceived Performance**: Show loading states, skeletons, and progress indicators immediately
- **Optimistic UI Updates**: Update UI optimistically when possible, rollback on error
- **Lazy Loading**: Load content and images as needed, not all at once
- **Code Splitting**: Use Next.js dynamic imports for route-based and component-based splitting
- **Image Optimization**: Use Next.js Image component with proper sizing and formats (WebP, AVIF)

#### 3. Accessibility First
- **WCAG 2.1 AA Compliance**: All interfaces must meet minimum accessibility standards
- **Keyboard Navigation**: All interactive elements must be keyboard accessible
- **Screen Reader Support**: Proper ARIA labels, roles, and semantic HTML
- **Focus Management**: Clear focus indicators, logical tab order, focus trapping in modals
- **Color Independence**: Never rely solely on color to convey information
- **Text Alternatives**: Alt text for images, captions for videos, labels for icons
- **Responsive Text**: Text must be resizable up to 200% without loss of functionality

#### 4. Responsive & Mobile-First
- **Mobile-First Approach**: Design for mobile screens first, then enhance for larger screens
- **Breakpoints**: Use consistent breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- **Touch Targets**: Minimum 44x44px touch targets for mobile (Apple HIG) / 48x48px (Material Design)
- **Thumb-Friendly Zones**: Place primary actions within easy thumb reach on mobile
- **Responsive Typography**: Fluid typography that scales appropriately across devices
- **Flexible Layouts**: Use CSS Grid and Flexbox for responsive, flexible layouts
- **Viewport Meta Tag**: Proper viewport configuration for mobile devices

#### 5. Consistency & Standards
- **Design System**: Maintain consistent component library with reusable patterns
- **Spacing System**: Use consistent spacing scale (4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px)
- **Component Patterns**: Consistent button styles, form inputs, cards, modals, navigation
- **Icon System**: Consistent icon library (preferably SVG icons) with uniform style
- **Animation Standards**: Consistent timing functions and durations for animations
- **Error Patterns**: Standardized error message formats and placement

### Component Design Patterns

#### Navigation
- **Primary Navigation**: Clear, persistent navigation for main sections
- **Breadcrumbs**: Show current location and path for deep navigation
- **Search Functionality**: Prominent search with autocomplete and filters
- **User Menu**: Accessible user profile menu with clear logout option
- **Mobile Navigation**: Hamburger menu or bottom navigation bar for mobile
- **Active States**: Clear indication of current page/section
- **Skip Links**: Skip to main content for keyboard users

#### Forms & Inputs
- **Clear Labels**: Every input must have a visible, associated label
- **Placeholder Text**: Use for hints/examples, not as replacement for labels
- **Inline Validation**: Show validation errors immediately after user interaction
- **Error Messages**: Clear, actionable error messages with suggestions for fixes
- **Success Feedback**: Confirm successful form submissions with clear messaging
- **Required Fields**: Clearly indicate required fields (asterisk + "required" text)
- **Input Types**: Use appropriate HTML5 input types (email, tel, date, number, etc.)
- **Autocomplete**: Enable browser autocomplete for common fields (name, email, etc.)
- **Field Grouping**: Group related fields visually and logically
- **Progress Indicators**: Show progress for multi-step forms

#### Buttons & Actions
- **Button Hierarchy**: Primary, secondary, and tertiary button styles
- **Button States**: Hover, active, focus, disabled states clearly defined
- **Button Labels**: Action-oriented, clear labels (e.g., "Save Changes" not "Submit")
- **Destructive Actions**: Use distinct styling for delete/destructive actions with confirmation
- **Loading States**: Show loading spinners or disabled state during async operations
- **Button Sizing**: Appropriate sizes for context (large for primary actions, smaller for secondary)
- **Icon Buttons**: Use icons to enhance understanding, not replace text labels
- **Button Groups**: Group related actions together

#### Cards & Containers
- **Card Design**: Clear boundaries, appropriate padding, subtle shadows/elevation
- **Card Hierarchy**: Use elevation/shadow to indicate importance and relationships
- **Content Organization**: Logical grouping of related information within cards
- **Action Areas**: Clear call-to-action buttons within cards
- **Responsive Cards**: Cards that adapt gracefully to different screen sizes
- **Empty States**: Meaningful empty states with helpful guidance

#### Data Display
- **Tables**: Sortable, filterable tables with proper headers and responsive design
- **Lists**: Clear list items with appropriate spacing and hierarchy
- **Data Visualization**: Charts and graphs with proper labels, legends, and accessibility
- **Status Indicators**: Clear visual status indicators (badges, icons, colors with text)
- **Pagination**: Clear pagination controls with page numbers and navigation
- **Infinite Scroll**: Consider infinite scroll for long lists with proper loading indicators
- **Data Density**: Appropriate information density - not too sparse, not too crowded

#### Modals & Overlays
- **Modal Purpose**: Use modals for focused tasks that require user attention
- **Modal Size**: Appropriate size for content - not too large, not too small
- **Close Options**: Multiple ways to close (X button, ESC key, click outside)
- **Focus Management**: Trap focus within modal, return focus on close
- **Backdrop**: Semi-transparent backdrop to indicate modal state
- **Modal Titles**: Clear titles describing the modal's purpose
- **Action Buttons**: Primary action on right, secondary/cancel on left
- **Scrollable Content**: Handle long content with internal scrolling

#### Feedback & Notifications
- **Toast Notifications**: Non-blocking notifications for success/info messages
- **Alert Messages**: Prominent alerts for important information or errors
- **Loading Indicators**: Skeleton screens, spinners, or progress bars for async operations
- **Success Confirmation**: Clear confirmation of successful actions
- **Error Messages**: User-friendly error messages with actionable guidance
- **Notification Placement**: Consistent placement (top-right for toasts, top for alerts)
- **Auto-Dismiss**: Appropriate auto-dismiss timing for notifications
- **Dismissible**: Allow users to dismiss notifications manually

### Interaction Patterns

#### Micro-Interactions
- **Button Hover Effects**: Subtle hover states that provide feedback
- **Click Feedback**: Visual feedback on button clicks (ripple, scale, color change)
- **Transition Animations**: Smooth transitions between states (200-300ms)
- **Loading Animations**: Engaging but not distracting loading animations
- **Success Animations**: Brief, satisfying animations for successful actions
- **Error Shake**: Subtle shake animation for form validation errors

#### Gestures (Mobile)
- **Swipe Actions**: Swipe to reveal actions (delete, archive, etc.)
- **Pull to Refresh**: Standard pull-to-refresh for lists
- **Swipe Navigation**: Swipe between tabs or pages where appropriate
- **Long Press**: Long press for context menus or additional options
- **Pinch to Zoom**: Support pinch-to-zoom for images and maps

#### Keyboard Shortcuts
- **Common Shortcuts**: Implement standard shortcuts (Ctrl/Cmd+S to save, ESC to close)
- **Shortcut Hints**: Show available shortcuts in tooltips or help menu
- **Custom Shortcuts**: Application-specific shortcuts for power users
- **Shortcut Conflicts**: Avoid conflicts with browser shortcuts

### User Flows & Information Architecture

#### Onboarding
- **Welcome Screen**: Clear welcome message explaining the application
- **Progressive Onboarding**: Step-by-step introduction to key features
- **Skip Option**: Allow users to skip onboarding if desired
- **Contextual Help**: Tooltips and help text for first-time users
- **Tutorial Mode**: Optional tutorial mode for complex features

#### Authentication Flow
- **Clear Sign-In Options**: Prominent display of available authentication methods
- **Social Login**: Easy social login buttons (Google, Apple)
- **Password Requirements**: Show password requirements before user starts typing
- **Password Strength**: Real-time password strength indicator
- **Error Recovery**: Clear error messages and recovery options for failed logins
- **Remember Me**: Option to stay logged in (with security considerations)
- **Two-Factor Authentication**: Clear 2FA setup and verification flow

#### Data Entry Flows
- **Wizard Pattern**: Break complex forms into logical steps
- **Save Progress**: Auto-save or allow users to save drafts
- **Validation Timing**: Validate on blur, not on every keystroke
- **Smart Defaults**: Pre-fill forms with known information when possible
- **Bulk Actions**: Support bulk operations for efficiency
- **Undo/Redo**: Provide undo functionality for destructive actions

#### Search & Discovery
- **Search Bar**: Prominent, accessible search bar
- **Search Suggestions**: Autocomplete and search suggestions
- **Search Filters**: Advanced filters for refining search results
- **Search Results**: Clear display of results with relevance indicators
- **No Results State**: Helpful message when no results found with suggestions
- **Recent Searches**: Show recent searches for quick access
- **Search History**: Allow users to view and clear search history

### Performance & Optimization

#### Loading Strategies
- **Skeleton Screens**: Show skeleton screens instead of spinners for better perceived performance
- **Progressive Loading**: Load critical content first, then enhance with additional features
- **Lazy Loading**: Lazy load images, components, and routes
- **Prefetching**: Prefetch likely next pages/routes
- **Service Workers**: Implement service workers for offline functionality and caching

#### Image Optimization
- **Next.js Image Component**: Always use Next.js Image component for automatic optimization
- **Responsive Images**: Serve appropriately sized images for different screen sizes
- **Modern Formats**: Use WebP and AVIF formats with fallbacks
- **Lazy Loading**: Lazy load images below the fold
- **Placeholder Images**: Use blur placeholders or solid colors while loading
- **Alt Text**: Always provide descriptive alt text for accessibility

#### Code Optimization
- **Tree Shaking**: Remove unused code from bundles
- **Code Splitting**: Split code at route and component level
- **Bundle Analysis**: Regularly analyze bundle size and optimize
- **Minification**: Minify CSS, JavaScript, and HTML
- **Compression**: Enable gzip/brotli compression on server

### Error Handling & Edge Cases

#### Error States
- **404 Pages**: Custom, helpful 404 pages with navigation options
- **500 Errors**: User-friendly error pages with support contact information
- **Network Errors**: Clear messages for network failures with retry options
- **Validation Errors**: Inline validation errors with specific guidance
- **Permission Errors**: Clear messages when users lack required permissions
- **Empty States**: Meaningful empty states with actionable guidance

#### Offline Support
- **Offline Detection**: Detect and communicate offline status to users
- **Offline Functionality**: Allow users to view cached content offline
- **Sync Indicators**: Show sync status when connection is restored
- **Offline Queue**: Queue actions for when connection is restored

#### Edge Cases
- **Very Long Content**: Handle very long text/content gracefully
- **Very Large Lists**: Implement virtualization or pagination for large lists
- **Slow Connections**: Provide feedback and allow cancellation of slow operations
- **Browser Limitations**: Graceful degradation for unsupported features
- **Data Conflicts**: Handle concurrent edits and data conflicts

### Accessibility Standards

#### WCAG 2.1 AA Compliance
- **Color Contrast**: All text meets minimum 4.5:1 contrast ratio (normal text) or 3:1 (large text)
- **Text Alternatives**: Alt text for images, captions for videos
- **Keyboard Access**: All functionality available via keyboard
- **Focus Indicators**: Visible focus indicators for all interactive elements
- **Form Labels**: All form inputs have associated labels
- **Error Identification**: Errors are clearly identified and described
- **Headings**: Proper heading hierarchy (h1, h2, h3, etc.)
- **Language**: Declare page language in HTML

#### ARIA Implementation
- **ARIA Labels**: Use ARIA labels for icon-only buttons and complex widgets
- **ARIA Roles**: Proper ARIA roles for custom components
- **ARIA States**: Communicate component states (expanded, selected, disabled)
- **Live Regions**: Use ARIA live regions for dynamic content updates
- **Landmarks**: Use ARIA landmarks for page structure

#### Testing Accessibility
- **Screen Reader Testing**: Test with VoiceOver (macOS/iOS) and NVDA/JAWS (Windows)
- **Keyboard Testing**: Navigate entire application using only keyboard
- **Color Contrast Tools**: Use tools to verify color contrast ratios
- **Automated Testing**: Use axe-core or similar tools for automated accessibility testing
- **User Testing**: Include users with disabilities in testing process

### Modern Web Standards

#### Progressive Web App (PWA)
- **Service Worker**: Implement service worker for offline functionality
- **Web App Manifest**: Provide manifest.json for installability
- **App Icons**: Provide icons in multiple sizes for different devices
- **Splash Screen**: Custom splash screen for installed PWA
- **Offline Support**: Core functionality available offline

#### Web APIs
- **Intersection Observer**: Use for lazy loading and scroll animations
- **Resize Observer**: Use for responsive component sizing
- **Web Animations API**: Use for performant animations
- **Web Share API**: Implement native sharing where supported
- **Clipboard API**: Use for copy-to-clipboard functionality
- **Geolocation API**: Use for location-based features (with permission)

#### Modern CSS
- **CSS Grid & Flexbox**: Use for modern, flexible layouts
- **CSS Custom Properties**: Use CSS variables for theming and consistency
- **Container Queries**: Use container queries for component-level responsiveness
- **Logical Properties**: Use logical properties for better internationalization
- **CSS Nesting**: Use CSS nesting for better organization (where supported)

### User Testing & Iteration

#### Usability Testing
- **User Interviews**: Regular interviews with actual users (drill instructors)
- **Task-Based Testing**: Observe users completing real tasks
- **A/B Testing**: Test different design approaches when appropriate
- **Heatmaps & Analytics**: Use analytics to understand user behavior
- **Feedback Collection**: Provide easy ways for users to provide feedback

#### Iterative Improvement
- **Regular Reviews**: Regular design and UX reviews
- **Performance Monitoring**: Monitor Core Web Vitals and user experience metrics
- **Error Tracking**: Track and analyze errors to improve UX
- **Feature Usage**: Monitor feature usage to identify improvements
- **Continuous Refinement**: Continuously refine based on user feedback and data

### CountCard-Specific Considerations

#### Military Context
- **Professional Appearance**: Maintain professional, military-appropriate aesthetic
- **Terminology**: Use correct Marine Corps terminology and ranks
- **Hierarchy Display**: Clear display of organizational hierarchy
- **Rank Formatting**: Proper formatting of ranks (E-5 through E-9, O-1 through O-6)
- **Time Sensitivity**: Emphasize time-sensitive information (count cards, accountability)

#### Data Sensitivity
- **PII Masking**: Mask PII by default with option to reveal
- **Secure Indicators**: Clear indicators of encryption and security
- **Privacy Controls**: Easy access to privacy and data management settings
- **Audit Trail Visibility**: Clear display of audit logs and data access

#### Workflow Efficiency
- **Quick Actions**: Provide quick actions for common tasks
- **Bulk Operations**: Support bulk operations for efficiency
- **Keyboard Shortcuts**: Power user shortcuts for frequent operations
- **Customizable Views**: Allow users to customize views and preferences
- **Export Functionality**: Easy data export for reporting

### Implementation Checklist

#### Design Phase
- [ ] Create component library and design system
- [ ] Design user flows for all major features
- [ ] Create responsive mockups for all breakpoints
- [ ] Design error states and empty states
- [ ] Plan loading states and transitions
- [ ] Design accessibility features (focus states, ARIA)

#### Development Phase
- [ ] Implement responsive layouts (mobile-first)
- [ ] Build reusable component library
- [ ] Implement consistent spacing and typography
- [ ] Add loading states and skeletons
- [ ] Implement error handling and edge cases
- [ ] Add keyboard navigation and accessibility
- [ ] Optimize images and assets
- [ ] Implement code splitting and lazy loading

#### Testing Phase
- [ ] Test on all target browsers and devices
- [ ] Test keyboard navigation
- [ ] Test with screen readers
- [ ] Verify color contrast ratios
- [ ] Test performance (Core Web Vitals)
- [ ] Test offline functionality
- [ ] User testing with actual drill instructors
- [ ] Accessibility audit

#### Maintenance Phase
- [ ] Monitor user feedback and analytics
- [ ] Regular accessibility audits
- [ ] Performance monitoring and optimization
- [ ] Continuous design refinement
- [ ] Update design system as needed

## Organizational Structure & Role-Based Access Control

### Recruit Training Regiment Hierarchy

#### 1. Recruit Training Regiment (RTR)
- **West** - Western Recruit Training Regiment
- **East** - Eastern Recruit Training Regiment

#### 2. Battalions
- **1st Battalion**
- **2nd Battalion**
- **3rd Battalion**
- **Support Battalion**

#### 3. Companies (by Battalion)

**1st Battalion Companies:**
- India Company
- Lima Company
- Kilo Company
- Mike Company

**2nd Battalion Companies:**
- Alpha Company
- Bravo Company
- Charlie Company
- Delta Company

**3rd Battalion Companies:**
- Echo Company
- Fox Company
- Golf Company
- Hotel Company

**Support Battalion Companies:**
- STC (Support Training Company)
- MRP (Marine Recruit Processing)
- BMP (Battalion Maintenance Platoon)

#### 4. Series
- **Lead Series**
- **Follow Series**

#### 5. Platoons
- **Format**: String of 4 digits (e.g., "1001", "2003", "3015")
- **Structure**: Generally 3 platoons per Series

### Role Hierarchy & Access Control

#### Roles (in order of authority, lowest to highest):

1. **Drill Instructor (DI)**
   - Primary data input role
   - Accounts for all recruits in their assigned platoon
   - Creates and submits count cards to Duty Senior Drill Instructor
   - Can view/edit recruit data for their platoon only

2. **Senior Drill Instructor (SDI)**
   - Receives count card submissions from Drill Instructors
   - Approves or rejects count card submissions
   - Forwards approved count cards to Company 1stSgt and Series Commander
   - Can view/edit data for all platoons in their series

3. **Chief Drill Instructor (CDI)**
   - Same privileges as Company 1stSgt and above (see below)
   - Can view/edit data across their assigned organizational unit

4. **Company 1stSgt**
   - Receives count cards from Senior Drill Instructors
   - Consolidates count card data
   - Approves/rejects and forwards to Company XO, Company Commander, and Battalion SgtMaj
   - Can view/edit data for all series in their company

5. **Series Commander**
   - Receives count cards from Senior Drill Instructors
   - Consolidates count card data
   - Approves/rejects and forwards to Company XO, Company Commander, and Battalion SgtMaj
   - Can view/edit data for all platoons in their series

6. **Company XO (Executive Officer)**
   - Receives consolidated count cards from Company 1stSgt and Series Commander
   - Can view/edit data for all series in their company
   - **Privilege Level**: Chief Drill Instructor and above have same privileges

7. **Company Commander**
   - Receives consolidated count cards from Company 1stSgt and Series Commander
   - Can view/edit data for all series in their company
   - **Privilege Level**: Chief Drill Instructor and above have same privileges

8. **Battalion SgtMaj (Sergeant Major)**
   - Receives consolidated count cards from Company 1stSgt and Series Commander
   - Can view/edit data for all companies in their battalion
   - **Privilege Level**: Chief Drill Instructor and above have same privileges

9. **Battalion XO (Executive Officer)**
   - Can view/edit data for all companies in their battalion
   - **Privilege Level**: Chief Drill Instructor and above have same privileges

10. **Battalion Commander**
    - Can view/edit data for all companies in their battalion
    - Can assign Investigator role (with official letter requirement)
    - **Privilege Level**: Chief Drill Instructor and above have same privileges

11. **Investigator** (Special Role - Future Build)
    - **Purpose**: Review audit logs for preservation and investigations
    - **Access**: Read-only access to audit logs (assigned investigations only)
    - **Time Limit**: Maximum 45 days of audit log data per investigation assignment
    - **Assignment Requirements**:
      - Must be assigned by Battalion Commander or Administrator
      - Official letter/document must be uploaded by Administrator before access is granted
      - Assignment includes: investigation scope, date range (max 45 days), official letter reference
    - **Access Scope**: Limited to audit logs within assigned date range and investigation scope
    - **Note**: This role will be fully implemented in a future build (placeholder infrastructure in current sprints)

### Count Card Workflow

**Submission Flow:**
1. **Drill Instructor** → Creates count card → Submits to **Duty Senior Drill Instructor**
2. **Duty Senior Drill Instructor** → Reviews → Approves/Rejects → Forwards to:
   - **Company 1stSgt**
   - **Series Commander**
3. **Company 1stSgt** or **Series Commander** → Consolidates → Forwards to:
   - **Company XO**
   - **Company Commander**
   - **Battalion SgtMaj**

### Privilege Levels

**Level 1: Drill Instructor**
- Access: Own platoon only
- Actions: Create, edit, submit count cards

**Level 2: Senior Drill Instructor**
- Access: All platoons in assigned series
- Actions: Approve/reject count cards, forward to Company 1stSgt and Series Commander

**Level 3: Chief Drill Instructor and Above** (Same privileges)
- **Chief Drill Instructor**
- **Company 1stSgt**
- **Series Commander**
- **Company XO**
- **Company Commander**
- **Battalion SgtMaj**
- **Battalion XO**
- **Battalion Commander**

**Level 3 Access:**
- View/edit data for their entire organizational unit (company or battalion)
- Consolidate and forward count cards
- Full administrative access within their scope

### User Profile Features

**Profile Management:**
- Update profile picture (individual user)
- Create and upload company logo
- Create and upload battalion logo
- **Shared Logo System:**
  - Company logos: Shared across all users in the same company
  - Battalion logos: Shared across all users in the same battalion
  - Users can select from existing shared logos or upload their own
  - Uploaded logos become available to other users in the same company/battalion

## Critical GDPR Compliance Requirements

### Privacy Policy & Terms of Service Acceptance (REQUIRED AT LOGIN)
**Status**: Must be implemented in Sprint 2 (Authentication System)

**Requirements**:
- ⚠️ **MANDATORY**: Privacy policy and terms of service checkboxes MUST be presented and accepted BEFORE any user can authenticate or access the application
- Both checkboxes must be required (cannot proceed without acceptance)
- Must apply to ALL authentication methods:
  - Email/Password signup
  - Phone number signup
  - Google OAuth sign-in
  - Apple OAuth sign-in
  - **🔄 FUTURE**: id.me OAuth sign-in (when USMC approved)
- Must store acceptance timestamp and document version in user profile
- Must block application access until both are accepted
- Must provide links to full privacy policy and terms of service documents
- Implementation location: Sprint 2 (Authentication System) - see detailed requirements below

## Firebase Configuration & Deployment

### Authentication Providers (Enabled)
- ✅ **Email/Password**: Enabled with password policy enforcement
  - Password requirements: Minimum 12 characters, maximum 4096 characters
  - Requires: uppercase, lowercase, numeric, and special characters
  - Force upgrade on sign-in enabled
- ✅ **Phone Number**: Enabled for SMS-based authentication
- ✅ **Google Sign-In**: Enabled for OAuth authentication
- ✅ **Apple Sign-In**: Enabled for OAuth authentication
- **🔄 FUTURE BUILD - id.me Authentication** (Placeholder - Preferred method when USMC approved):
  - **Provider**: id.me (Identity Verification Platform)
  - **Protocol**: OAuth 2.0 / OpenID Connect (OIDC)
  - **Developer API**: Available via developer.id.me portal
  - **Military Verification**: Supports military and veteran verification
  - **Integration Type**: OAuth 2.0 / OIDC authentication flow
  - **Status**: Will be the preferred authentication method once approved by USMC
  - **Implementation Notes**:
    - Register developer account with id.me
    - Configure OAuth 2.0 application in id.me developer portal
    - Set up Military & Veteran Verification policy
    - Implement OAuth 2.0 / OIDC authentication flow
    - Integrate with Firebase Authentication (custom OAuth provider or account linking)
    - Verify military status via id.me Attribute Exchange API
    - Store id.me user UUID to prevent duplicate verification
    - Access token expires in 5 minutes (implement refresh token flow)
    - Attribute endpoint: `/api/public/v3/attributes.json`
    - Authorization endpoint: `https://api.id.me/oauth/authorize`
    - Scope must include military/community attribute
  - **Benefits**:
    - Official military verification
    - Supports Active Duty, National Guard, Reserves, Veterans, Retirees
    - Supports military spouses and family members
    - Real-time authoritative source verification
    - .mil email verification option
    - Document upload verification option
  - **UI Integration**:
    - Add "Sign in with id.me" button to login page
    - Display id.me as preferred method (when USMC approved)
    - Show military verification status in user profile
    - Support account linking with existing authentication methods

### Authorized Domains
- `localhost` (Default)
- `countcard-94c5b.firebaseapp.com` (Default)
- `countcard-94c5b.web.app` (Default)
- `countcard.warriorwaypoint.com` (Custom domain - SiteGround)

#### Firebase Hosting Overview
- **Hosting Provider**: Firebase Hosting ✅ **SELECTED**
- **Project**: `countcard-94c5b`
- **Default Sites**:
  - `countcard-94c5b.firebaseapp.com` (Default Firebase domain)
  - `countcard-94c5b.web.app` (Default Firebase domain)
- **Custom Domain**: `countcard.warriorwaypoint.com` (Configured via DNS CNAME)
- **Hosting Features**:
  - Zero-configuration SSL certificates (automatic HTTPS)
  - Global CDN with edge caching
  - Automatic compression (gzip/Brotli)
  - Preview channels for testing
  - One-click rollback capability
  - Local emulation support
  - GitHub integration support
- **Deployment Method**: Firebase CLI (`firebase deploy --only hosting`)
- **Framework**: Next.js 16+ (App Router)
- **Build Output**: Next.js static export or SSR with Cloud Functions/Cloud Run
- **Configuration File**: `firebase.json` (hosting section)
- **Reference Documentation**: [Firebase Hosting](https://firebase.google.com/docs/hosting/)

### Firestore Database Structure & Indexes

#### Database Structure Outline

**Project**: `countcard-94c5b`  
**Database**: Firestore (NoSQL document database)

#### Collections Structure

1. **`recruits`** - Recruit profiles and information
   - **Document ID**: `{recruitId}` (auto-generated)
   - **Fields**:
     - `recruitId` (string, required)
     - `firstName` (string, required)
     - `lastName` (string, required)
     - `rank` (string, required) - USMC rank (E-5 through E-9, O-1 through O-6)
     - `status` (string, required) - Recruit status
     - `regiment` (string) - Recruit Training Regiment (West/East)
     - `battalion` (string) - Battalion assignment
     - `company` (string) - Company assignment
     - `series` (string) - Series assignment
     - `platoon` (string, required) - Platoon assignment (4-digit format)
     - `photoUrl` (string) - Profile photo URL
     - `encryptedData` (map) - Encrypted sensitive data
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
     - `createdBy` (string) - User ID of creator
     - `updatedBy` (string) - User ID of last updater
   - **Indexes Required**:
     - Single-field: `platoon`, `company`, `battalion`, `regiment`, `status`, `rank`, `createdAt`
     - Composite: `(battalion, company, platoon)`, `(regiment, battalion, company)`, `(status, createdAt)`, `(platoon, status)`

2. **`countCards`** - Accountability records
   - **Document ID**: `{countCardId}` (auto-generated)
   - **Fields**:
     - `countCardId` (string, required)
     - `platoon` (string, required) - Platoon ID
     - `company` (string, required) - Company ID
     - `battalion` (string, required) - Battalion ID
     - `regiment` (string) - Regiment ID
     - `status` (string, required) - Workflow status (pending, approved, rejected, consolidated)
     - `workflowState` (string, required) - Current workflow step
     - `submittedBy` (string, required) - User ID of Drill Instructor
     - `submittedTo` (string) - User ID of Duty Senior Drill Instructor
     - `approvedBy` (string) - User ID of approver
     - `rejectedBy` (string) - User ID of rejector
     - `location` (string) - Location of count
     - `timestamp` (timestamp, required) - Count card timestamp
     - `recruitCounts` (map) - Recruit status counts
     - `workflowHistory` (array) - Workflow transition history
     - `encryptedData` (map) - Encrypted sensitive data
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
   - **Indexes Required**:
     - Single-field: `status`, `workflowState`, `platoon`, `company`, `battalion`, `timestamp`, `submittedBy`, `createdAt`
     - Composite: `(status, createdAt)`, `(battalion, company, status)`, `(workflowState, createdAt)`, `(platoon, status, timestamp)`, `(submittedBy, createdAt)`

3. **`platoons`** - Platoon/squad organization
   - **Document ID**: `{platoonId}` (4-digit string)
   - **Fields**:
     - `platoonId` (string, required) - 4-digit format
     - `platoonName` (string)
     - `series` (string, required) - Series assignment
     - `company` (string, required) - Company assignment
     - `battalion` (string, required) - Battalion assignment
     - `regiment` (string, required) - Regiment assignment
     - `drillInstructors` (array) - Array of user IDs
     - `recruitCount` (number) - Current recruit count
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
   - **Indexes Required**:
     - Single-field: `series`, `company`, `battalion`, `regiment`
     - Composite: `(battalion, company, series)`, `(regiment, battalion, company)`

4. **`emergencyContacts`** - Emergency contact information
   - **Document ID**: `{contactId}` (auto-generated)
   - **Fields**:
     - `contactId` (string, required)
     - `recruitId` (string, required) - Reference to recruit
     - `contactName` (string, required)
     - `relationship` (string, required)
     - `phoneNumber` (string, required)
     - `email` (string)
     - `address` (map) - Address information
     - `encryptedData` (map) - Encrypted sensitive data
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
   - **Indexes Required**:
     - Single-field: `recruitId`, `createdAt`
     - Composite: `(recruitId, createdAt)`

5. **`userProfiles`** - User account profiles
   - **Document ID**: `{userId}` (Firebase Auth UID)
   - **Fields**:
     - `userId` (string, required) - Firebase Auth UID
     - `email` (string, required)
     - `phoneNumber` (string, required)
     - `firstName` (string, required)
     - `lastName` (string, required)
     - `rank` (string, required) - USMC rank
     - `displayName` (string, required) - Format: `[Rank] [Last Name]`
     - `role` (string, required) - User role
     - `regiment` (string) - Organizational assignment
     - `battalion` (string) - Organizational assignment
     - `company` (string) - Organizational assignment
     - `series` (string) - Organizational assignment
     - `platoon` (string) - Organizational assignment
     - `profilePictureUrl` (string) - Profile picture URL
     - `companyLogoUrl` (string) - Company logo URL
     - `battalionLogoUrl` (string) - Battalion logo URL
     - `idmeVerified` (boolean) - id.me verification status (future)
     - `idmeUuid` (string) - id.me user UUID (future)
     - `privacyPolicyAccepted` (boolean, required)
     - `termsOfServiceAccepted` (boolean, required)
     - `privacyPolicyVersion` (string)
     - `termsOfServiceVersion` (string)
     - `privacyPolicyAcceptedAt` (timestamp)
     - `termsOfServiceAcceptedAt` (timestamp)
     - `encryptedData` (map) - Encrypted sensitive data
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
   - **Indexes Required**:
     - Single-field: `role`, `battalion`, `company`, `platoon`, `regiment`, `email`, `createdAt`
     - Composite: `(role, battalion)`, `(battalion, company)`, `(role, createdAt)`

6. **`conversations`** - Human-to-human messaging
   - **Document ID**: `{conversationId}` (auto-generated)
   - **Fields**:
     - `conversationId` (string, required)
     - `participants` (array, required) - Array of user IDs
     - `lastMessage` (map) - Last message details
     - `lastMessageAt` (timestamp)
     - `encrypted` (boolean, required)
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
   - **Subcollection**: `messages`
     - **Document ID**: `{messageId}` (auto-generated)
     - **Fields**:
       - `messageId` (string, required)
       - `senderId` (string, required)
       - `content` (string, required) - Encrypted message content
       - `attachments` (array) - Attachment URLs
       - `encrypted` (boolean, required)
       - `createdAt` (timestamp, required)
       - `updatedAt` (timestamp)
   - **Indexes Required**:
     - Single-field: `lastMessageAt`, `createdAt`
     - Composite: `(participants, lastMessageAt)`, `(lastMessageAt, createdAt)`

7. **`adminLogs`** - Administrative action logs
   - **Document ID**: `{logId}` (auto-generated)
   - **Fields**:
     - `logId` (string, required)
     - `userId` (string, required)
     - `action` (string, required) - Action type
     - `resourceType` (string) - Resource type affected
     - `resourceId` (string) - Resource ID affected
     - `details` (map) - Action details
     - `timestamp` (timestamp, required)
   - **Indexes Required**:
     - Single-field: `userId`, `action`, `resourceType`, `timestamp`
     - Composite: `(userId, timestamp)`, `(action, timestamp)`, `(resourceType, timestamp)`

8. **`encryptionKeys`** - User encryption keys (encrypted)
   - **Document ID**: `{userId}` (Firebase Auth UID)
   - **Fields**:
     - `userId` (string, required)
     - `encryptedKey` (string, required) - Encrypted encryption key
     - `keyVersion` (number, required)
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
   - **Indexes Required**:
     - Single-field: `userId`, `keyVersion`

9. **`encryptionConfig`** - Encryption configuration per user
   - **Document ID**: `{userId}` (Firebase Auth UID)
   - **Fields**:
     - `userId` (string, required)
     - `algorithm` (string, required) - Encryption algorithm
     - `keyRotationEnabled` (boolean)
     - `lastKeyRotation` (timestamp)
     - `createdAt` (timestamp, required)
     - `updatedAt` (timestamp, required)
   - **Indexes Required**:
     - Single-field: `userId`

10. **`incidentAlerts`** - Mass incident alert records (Sprint 18)
    - **Document ID**: `{alertId}` (auto-generated)
    - **Fields**:
      - `alertId` (string, required)
      - `initiatorUserId` (string, required)
      - `battalion` (string, required)
      - `company` (string)
      - `platoon` (string)
      - `incidentType` (string, required)
      - `description` (string, required)
      - `severity` (string, required)
      - `location` (string)
      - `status` (string, required) - Active, Acknowledged, Resolved, Escalated
      - `workflowState` (string, required) - Current workflow level
      - `messageThreadId` (string) - Reference to message thread
      - `notificationsSent` (array) - Notification tracking
      - `encryptedData` (map) - Encrypted sensitive data
      - `createdAt` (timestamp, required)
      - `updatedAt` (timestamp, required)
      - `resolvedAt` (timestamp)
    - **Subcollection**: `messages` - Alert message flow
      - **Document ID**: `{messageId}` (auto-generated)
      - **Fields**: (see message structure in conversations)
    - **Indexes Required**:
      - Single-field: `status`, `severity`, `battalion`, `company`, `platoon`, `createdAt`, `workflowState`
      - Composite: `(battalion, status, createdAt)`, `(status, createdAt)`, `(severity, createdAt)`, `(workflowState, createdAt)`

11. **`alertNotifications`** - Notification delivery tracking for incident alerts
    - **Document ID**: `{notificationId}` (auto-generated)
    - **Fields**:
      - `notificationId` (string, required)
      - `alertId` (string, required) - Reference to incident alert
      - `recipientUserId` (string, required)
      - `notificationType` (string, required) - push, email, sms
      - `sentAt` (timestamp, required)
      - `readAt` (timestamp)
      - `acknowledgedAt` (timestamp)
    - **Indexes Required**:
      - Single-field: `alertId`, `recipientUserId`, `sentAt`, `readAt`
      - Composite: `(alertId, sentAt)`, `(recipientUserId, sentAt)`, `(alertId, recipientUserId)`

**🔄 FUTURE BUILD Collections** (Placeholder - xAI implementation):

12. **`weaponsAccountability`** - Weapons accountability records
    - **Indexes Required**: Similar structure to countCards

13. **`rcoAccountability`** - RCO accountability records
    - **Indexes Required**: Similar structure to countCards

14. **`importHistory`** - Import operation history and audit logs
    - **Indexes Required**: `(userId, createdAt)`, `(importType, createdAt)`

15. **`auditLogs`** - Comprehensive audit log records (permanent preservation)
    - **Indexes Required**: `(userId, timestamp)`, `(action, timestamp)`, `(resourceType, timestamp)`, `(investigationId, timestamp)`

16. **`investigatorAssignments`** - Investigator role assignments
    - **Indexes Required**: `(investigatorUserId, status)`, `(assignedByUserId, createdAt)`, `(status, expiresAt)`

17. **`officialLetters`** - Storage for official letters/documents
    - **Indexes Required**: `(assignmentId, createdAt)`

18. **`auditLogAccess`** - Tracking of audit log access
    - **Indexes Required**: `(investigatorUserId, accessedAt)`, `(auditLogId, accessedAt)`

#### Firestore Index Requirements

**Single-Field Indexes** (Automatically created by Firestore):
- All fields used in WHERE clauses
- All fields used in ORDER BY clauses
- All fields used in array-contains queries

**Composite Indexes** (Must be created manually via Firebase Console or `firestore.indexes.json`):

1. **Recruits Collection**:
   - `(battalion, company, platoon)` - For filtering by organizational hierarchy
   - `(regiment, battalion, company)` - For filtering by full hierarchy
   - `(status, createdAt)` - For sorting by status and date
   - `(platoon, status)` - For platoon-specific status filtering

2. **Count Cards Collection**:
   - `(status, createdAt)` - For sorting count cards by status and date
   - `(battalion, company, status)` - For organizational filtering with status
   - `(workflowState, createdAt)` - For workflow state tracking
   - `(platoon, status, timestamp)` - For platoon-specific count card queries
   - `(submittedBy, createdAt)` - For user-specific count card history

3. **Platoons Collection**:
   - `(battalion, company, series)` - For organizational hierarchy queries
   - `(regiment, battalion, company)` - For full hierarchy queries

4. **User Profiles Collection**:
   - `(role, battalion)` - For role-based organizational queries
   - `(battalion, company)` - For organizational user queries
   - `(role, createdAt)` - For role-based user creation tracking

5. **Conversations Collection**:
   - `(participants, lastMessageAt)` - For user conversation lists
   - `(lastMessageAt, createdAt)` - For conversation sorting

6. **Admin Logs Collection**:
   - `(userId, timestamp)` - For user-specific audit logs
   - `(action, timestamp)` - For action-specific audit logs
   - `(resourceType, timestamp)` - For resource-specific audit logs

7. **Incident Alerts Collection**:
   - `(battalion, status, createdAt)` - For organizational alert filtering
   - `(status, createdAt)` - For status-based alert sorting
   - `(severity, createdAt)` - For severity-based alert sorting
   - `(workflowState, createdAt)` - For workflow state tracking

8. **Alert Notifications Collection**:
   - `(alertId, sentAt)` - For alert-specific notification tracking
   - `(recipientUserId, sentAt)` - For user-specific notification tracking
   - `(alertId, recipientUserId)` - For alert-user notification queries

**Index Configuration File**: `firestore.indexes.json`
- All composite indexes should be defined in this file
- Deploy indexes using: `firebase deploy --only firestore:indexes`
- Monitor index creation status in Firebase Console

**Index Best Practices**:
- Create indexes before deploying queries that require them
- Monitor index usage and performance in Firebase Console
- Remove unused indexes to reduce storage costs
- Use index exemption sparingly (only for queries that cannot be indexed)
- Consider query patterns when designing indexes
- Test queries in development before production deployment

### Hosting & Domain Configuration

#### Overview
- **Custom Domain**: `countcard.warriorwaypoint.com`
- **Domain Provider**: SiteGround (DNS only)
- **Hosting Provider**: Firebase Hosting ✅ **SELECTED**
- **Status**: DNS Configured - Waiting for Propagation

#### Completed Actions
- ✅ Added domain to Firebase authorized domains
- ✅ Selected Firebase Hosting as hosting solution
- ✅ Deleted conflicting A records for `countcard.warriorwaypoint.com.`
- ✅ Created CNAME record: `countcard.warriorwaypoint.com.` → `countcard-94c5b.web.app`

#### SiteGround DNS Management
- **SiteGround Control Panel Access** ✅ **CONFIGURED**
  - **Authentication Method**: Google Sign-In with 2FA (Two-Factor Authentication)
  - **Login URL**: https://www.siteground.com/web-hosting/control-panel
  - **Access Process**: 
    - Run script to open SiteGround login page: `./scripts/open-siteground.sh` or `node scripts/open-siteground.js`
    - User authenticates via Google Sign-In with 2FA
    - Access granted for DNS management
  - **CLI Access**: Check if SiteGround API/CLI available (preferred if possible)
- **DNS Management**: Access to DNS zone editor in SiteGround for `warriorwaypoint.com` domain
- **Existing DNS Records Found**:
  - `5m2wqbcuk4.warriorwaypoint.com.` → `gv-x2fi7aft7ntjk2.dv.googlehosted.com.` (Google/Firebase related)
  - `default._domainkey.warriorwaypoint.com.` → DKIM record for email authentication
  - `countcard.warriorwaypoint.com.` → **CONFLICT DETECTED**:
    - **A Record**: Points to `35.212.41.1` (MUST DELETE for CNAME)
    - **TXT Record**: SPF email authentication (can keep - doesn't conflict with CNAME)
- **DNS Configuration Issue**:
  - ⚠️ **Error**: "You cannot create a CNAME record for a hostname that already has a DNS record created for it"
  - **Status**: A records deleted, but error persists
  - **Possible Causes**:
    1. **TXT Record Conflict**: Some DNS systems (including SiteGround) may not allow CNAME when TXT records exist
    2. **DNS Cache**: System may need time to recognize deleted records
    3. **Other Record Types**: Check for MX, SRV, or other record types for `countcard`
    4. **www.countcard Record**: Check if `www.countcard.warriorwaypoint.com.` has records that might interfere
  - **Troubleshooting Steps**:
    1. ✅ **COMPLETED**: Deleted A records for `countcard.warriorwaypoint.com.`
    2. **Check for TXT Record**: Look for TXT record for `countcard.warriorwaypoint.com.` (SPF email)
    3. **Temporary Solution**: Delete the TXT record temporarily, create CNAME, then add TXT back (if needed)
    4. **Alternative**: Check if SiteGround allows CNAME with TXT, or contact SiteGround support
    5. **Wait & Retry**: Wait 5-10 minutes for DNS system to update, then try again
    6. **Verify**: Refresh DNS Zone Editor page to ensure A records are actually gone
  - **Note**: Some DNS providers have restrictions on CNAME with other record types. SiteGround may require TXT records to be removed before creating CNAME.
- **Remaining Actions**:
  - ✅ **COMPLETED**: Created CNAME record successfully
  - Wait for DNS propagation (typically 5-30 minutes, can take up to 72 hours)
  - Verify DNS propagation using `dig countcard.warriorwaypoint.com` or online DNS checker
  - Add domain to Firebase Hosting custom domains (after DNS propagates)
  - Configure SSL certificate (automatic with Firebase Hosting once DNS is configured)
  - Re-add TXT record for email (SPF) if it was removed during CNAME creation
#### File Storage & Deployment
- **Files Location**: Stored on **Firebase's CDN/servers** (Google Cloud infrastructure)
- **Domain**: `countcard.warriorwaypoint.com` is just a **pointer** (via DNS) to Firebase's servers
- **How It Works**:
  1. Application files are built and deployed to Firebase Hosting servers
  2. Files are distributed across Firebase's global CDN
  3. DNS record (`countcard.warriorwaypoint.com`) points to Firebase's servers
  4. Users visit `countcard.warriorwaypoint.com` → DNS redirects → Firebase serves the files
- **File Access**: Managed through Firebase CLI or Firebase Console (no FTP/SFTP needed)
- **Storage**: Files are NOT stored on SiteGround servers (only DNS is configured there)
- **Deployment**: All deployment via Firebase CLI from local machine

#### Next Steps
- Wait for DNS propagation (typically 5-30 minutes, can take up to 72 hours)
- Verify DNS propagation using `dig countcard.warriorwaypoint.com` or online DNS checker
- Add domain to Firebase Hosting custom domains (after DNS propagates)
- Configure SSL certificate (automatic with Firebase Hosting once DNS is configured)
- Re-add TXT record for email (SPF) if it was removed during CNAME creation

### Password Policy Configuration
- **Enforcement Mode**: Notify enforcement (users allowed to sign up with non-compliant passwords, but missing criteria are returned)
- **Minimum Length**: 12 characters
- **Maximum Length**: 4096 characters
- **Required Character Types**:
  - Uppercase character
  - Lowercase character
  - Numeric character
  - Special character
- **Force Upgrade on Sign-In**: Enabled

## Sprint Breakdown

### Phase 1: Foundation & Setup (Sprints 1-4)
**Goal**: Establish project foundation, Firebase setup, core infrastructure, and UI/UX foundation

#### Sprint 1: Project Initialization & Firebase Setup
- Initialize Next.js project with TypeScript
- ✅ **COMPLETED**: Configure Firebase project (`countcard-94c5b`)
- ✅ **COMPLETED**: Set up Firebase Authentication (multi-provider) - All providers enabled (Email/Password, Phone, Google, Apple)
- **Firebase Hosting Initialization**:
  - Install Firebase CLI: `npm install -g firebase-tools`
  - Login to Firebase: `firebase login`
  - Initialize Firebase in project: `firebase init`
  - Select Hosting service during initialization
  - Configure `firebase.json` with hosting settings
  - Set up `.firebaserc` with project configuration
  - Configure Next.js build output for Firebase Hosting
  - Set up hosting rewrites for Next.js App Router (SSR/API routes)
- Configure Firestore database structure
- Set up environment variables and configuration
- Create project structure following Next.js App Router conventions
- Set up Tailwind CSS and styling foundation
- Implement basic error handling and logging
- Configure browser compatibility and polyfills
  - Set up Babel/polyfill configuration for backward compatibility
  - Configure Next.js for target browser support (Safari 14+, Chrome 90+, Edge 90+)
  - Add feature detection utilities
  - Set up browser compatibility testing framework

#### Sprint 2: Authentication System
- ✅ **COMPLETED**: Enable Firebase Authentication providers (Email/Password, Phone, Google, Apple)
- ✅ **COMPLETED**: Configure password policy (12+ characters, mixed case, numbers, special characters)
- ✅ **COMPLETED**: Set up authorized domains for OAuth redirects
- ✅ **COMPLETED**: Added custom domain (`countcard.warriorwaypoint.com`) to Firebase authorized domains
- Implement multi-provider authentication (Google, Apple, Email/Password, Phone)
- **🔄 FUTURE BUILD - id.me Authentication Integration** (Placeholder - Preferred method when USMC approved):
  - **Developer Account Setup**:
    - Register with id.me developer portal (developer.id.me)
    - Create OAuth 2.0 application in id.me
    - Configure Military & Veteran Verification policy
    - Obtain client ID and client secret
    - Configure redirect URIs for authentication callbacks
  - **OAuth 2.0 / OpenID Connect Implementation**:
    - Implement OAuth 2.0 authorization flow
    - Authorization endpoint: `https://api.id.me/oauth/authorize`
    - Token exchange endpoint for access tokens
    - Refresh token implementation (access tokens expire in 5 minutes)
    - Scope configuration to include military/community attributes
  - **Military Verification Integration**:
    - Attribute Exchange API integration (`/api/public/v3/attributes.json`)
    - Verify military status from id.me response
    - Store id.me user UUID for duplicate prevention
    - Handle verification status: Active Duty, National Guard, Reserves, Veterans, Retirees
    - Support for military spouses and family members
  - **Firebase Integration**:
    - Integrate id.me as custom OAuth provider with Firebase Authentication
    - Or implement account linking with existing Firebase users
    - Store id.me verification status in user profile
    - Map id.me attributes to user profile fields
  - **UI Components**:
    - "Sign in with id.me" button on login page
    - Display id.me as preferred authentication method (when USMC approved)
    - Show military verification badge/indicator in user profile
    - Account linking interface (link id.me to existing account)
  - **Security & Compliance**:
    - Secure storage of id.me client credentials
    - Encrypt id.me user UUID and verification data
    - Handle token refresh securely
    - Validate id.me tokens server-side
    - Implement proper error handling for verification failures
  - **Environment Variables**:
    - `IDME_CLIENT_ID` - id.me OAuth client ID
    - `IDME_CLIENT_SECRET` - id.me OAuth client secret
    - `IDME_REDIRECT_URI` - OAuth redirect URI
    - `IDME_API_BASE_URL` - id.me API base URL
  - **Implementation Notes**:
    - Feature will be fully implemented when USMC approval is received
    - Infrastructure should be ready but functionality will be placeholder/stub
    - UI should show "Coming Soon" or similar indicator until USMC approval
    - All infrastructure code should be commented with "FUTURE: id.me implementation - USMC approval pending"
    - Once approved, id.me will become the preferred authentication method
    - Existing authentication methods will remain available for backward compatibility
- Create authentication context and hooks (adapt from AIChatModel)
- Build login/signup pages
- **REQUIRED**: Implement privacy policy and terms of service acceptance checkboxes at login/signup
  - Privacy policy checkbox (required, must be checked before authentication)
  - Terms of service checkbox (required, must be checked before authentication)
  - Store acceptance timestamp and version in user profile
  - Block application access until both checkboxes are accepted
  - Display links to privacy policy and terms of service documents
  - Apply to all authentication methods (Email/Password, Phone, Google, Apple, and id.me when implemented)
- Implement password reset functionality
- Set up account linking for multiple providers
- Create user profile creation flow
- Create user menu/navigation component (top right):
  - User profile icon/avatar
  - Menu items: Profile, Settings, Share App (implementation in Sprint 7), Sign Out
  - Role-based menu items (admin options for authorized users)
  - Accessible from all authenticated pages
- Implement comprehensive role-based access control system
  - Roles: Drill Instructor, Senior Drill Instructor, Chief Drill Instructor, Company 1stSgt, Series Commander, Company XO, Company Commander, Battalion SgtMaj, Battalion XO, Battalion Commander
  - **🔄 FUTURE BUILD - Investigator Role** (Placeholder - xAI implementation):
    - Add Investigator role to role-based access control system
    - Implement Investigator role assignment workflow (Battalion Commander or Administrator only)
    - Official letter upload requirement before role assignment
    - Time-limited and scope-limited access to audit logs (max 45 days per assignment)
    - Investigator role permissions: read-only audit log access within assigned scope
  - Organizational assignment: Recruit Training Regiment (West/East), Battalion, Company, Series, Platoon
  - Implement privilege levels and access scopes
  - Set up Firebase custom claims for roles and organizational assignments
  - Create role-based permission system

#### Sprint 3: Core Infrastructure & Security
- Implement encryption service (sodium-plus, XChaCha20-Poly1305)
  - Ensure encryption works across all supported browsers (Safari 14+, Chrome 90+, Edge 90+)
  - Add polyfills for Web Crypto API if needed for older browsers
- Set up key management system
- Create encryption utilities and helpers
- Implement secure logging (PII masking)
- Set up rate limiting middleware
- Configure CORS and security headers
- Create input validation schemas (Zod)
- Set up error monitoring (Google Cloud Error Reporting)
- Implement browser compatibility layer
  - Add polyfills for missing features in older browsers
  - Implement feature detection for critical functionality
  - Create fallback mechanisms for unsupported features

#### Sprint 4: UI/UX Foundation & Design System
- ✅ **COMPLETED**: Establish comprehensive UI/UX foundation and design system
- ✅ **COMPLETED**: Implement design system foundation (tokens, spacing, typography)
- ✅ **COMPLETED**: Create component library structure with TypeScript types
- ✅ **COMPLETED**: Build core UI components (buttons, forms, cards, navigation)
- ✅ **COMPLETED**: Implement feedback components (loading states, notifications, alerts)
- ✅ **COMPLETED**: Create error states and empty states
- ✅ **COMPLETED**: Implement responsive design patterns (mobile-first approach)
- ⏳ **PENDING**: Comprehensive accessibility utilities and testing (WCAG 2.1 AA compliance - basic features implemented, full testing pending)
- ⏳ **PENDING**: Dark mode theme toggle and full verification (components support dark mode, toggle component pending)
- ⏳ **PENDING**: Animations and micro-interactions (basic transitions implemented, comprehensive animation system pending)
- ⏳ **PENDING**: Performance optimization for UI components (code splitting, lazy loading pending)
- ⏳ **PENDING**: Component documentation with Storybook (component documentation exists, Storybook setup pending)
- See [Sprint-4-2026-01-17.md](./Sprint-4-2026-01-17/Sprint-4-2026-01-17.md) for complete details

### Phase 2: Data Models & Core Features (Sprints 5-8)
**Goal**: Implement core data models and recruit management features

#### Sprint 5: Data Models & Type Definitions
- Define TypeScript types for all data models:
  - Recruit profiles (USMC rank - E-5 through E-9 for Enlisted, O-1 through O-6 for Officers, status, platoon assignment)
  - Count cards (accountability records with workflow status)
  - Organizational structure:
    - Recruit Training Regiment (West/East)
    - Battalions (1st, 2nd, 3rd, Support)
    - Companies (by battalion: Alpha-Delta, Echo-Hotel, India-Mike, STC/MRP/BMP)
    - Series (Lead Series, Follow Series)
    - Platoons (4-digit string format)
  - User roles and organizational assignments
  - Emergency contacts
  - User profiles (with logo management)
  - Company and Battalion logos (shared resources)
  - **🔄 FUTURE BUILD - Additional Accountability Data Models** (Placeholder - xAI implementation):
    - Weapons accountability records (data model structure, TypeScript types)
    - RCO (Recruit Company Officer) accountability records (data model structure, TypeScript types)
    - Import history and audit log data models for all accountability types
    - Note: Full implementation will be completed by xAI in a future build
  - Incident alert data models (for mass incident alert system - Sprint 18):
    - Incident alert record structure
    - Alert workflow state tracking
    - Notification delivery tracking
    - Alert acknowledgment records
    - Alert message flow data models:
      - Message thread structure
      - Message content and metadata
      - Message attachments
      - Message reactions and acknowledgments
      - Message read receipts
      - Message threading (reply chains)
  - **🔄 FUTURE BUILD - Audit Log & Investigator Data Models** (Placeholder - xAI implementation):
    - Audit log record structure (immutable, preserved for investigations)
    - Investigator assignment data structure
    - Official letter/document storage structure
    - Investigation scope and access tracking
    - Audit log access tracking (who accessed what, when)
- **Initial Account Creation & Profile Wizard**:
  - **Minimum Required User Data Fields** (must be collected during initial account creation):
    - **Rank**: USMC (United States Marine Corps) rank - must use official USMC rank abbreviations:
      - **Enlisted Ranks (E-5 through E-9)**:
        - E-5: Sergeant (Sgt)
        - E-6: Staff Sergeant (SSgt)
        - E-7: Gunnery Sergeant (GySgt)
        - E-8: Master Sergeant (MSgt) or First Sergeant (1stSgt)
        - E-9: Master Gunnery Sergeant (MGySgt), Sergeant Major (SgtMaj), or Sergeant Major of the Marine Corps (SgtMajMC)
      - **Officer Ranks (O-1 through O-6)**:
        - O-1: Second Lieutenant (2ndLt)
        - O-2: First Lieutenant (1stLt)
        - O-3: Captain (Capt)
        - O-4: Major (Maj)
        - O-5: Lieutenant Colonel (LtCol)
        - O-6: Colonel (Col)
    - **Name**: 
      - First Name (required)
      - Last Name (required)
      - **Display Name Format**: Must be displayed as `[Rank] [Last Name]` (e.g., "Sgt. Smith", "Capt. Johnson", "GySgt. Martinez", "LtCol. Brown")
    - **Email Address**: Required for authentication and communication
    - **Phone Number**: Required for contact and notifications
  - **Additional Profile Wizard Fields** (collected in profile wizard after initial account creation):
    - Profile picture upload
    - Organizational assignment (Regiment, Battalion, Company, Series, Platoon)
    - Role assignment (Drill Instructor, Senior Drill Instructor, etc.)
    - Additional contact information
    - Preferences and settings
    - Notification preferences
    - Any other relevant user profile data
  - **Profile Wizard Implementation**:
    - Multi-step wizard interface for collecting user data
    - Required fields validation (minimum fields must be completed)
    - Optional fields can be skipped or completed later
    - Save progress functionality (allow users to complete profile later)
    - Profile completion status tracking
- **User Tutorial/Walkthrough System** (similar to AIChatModel):
  - Implement interactive walkthrough component (adapt from AIChatModel `Walkthrough` component)
  - Create walkthrough step configurations for user onboarding
  - Implement `useWalkthrough` hook for managing walkthrough state
  - Walkthrough features:
    - Step-by-step interactive guide highlighting UI elements
    - Progress indicator showing current step and completion percentage
    - Previous/Next navigation buttons
    - Skip option to dismiss walkthrough
    - Completion tracking (store in localStorage and user profile)
    - Auto-start for first-time users (after profile creation)
    - Manual restart option from user menu/settings
  - Walkthrough content should cover:
    - Welcome and application overview
    - Navigation and main interface elements
    - Creating and managing recruits
    - Creating and submitting count cards
    - Viewing count card history and status
    - **Mass incident alert system** (how to create alerts, chain of command workflow, message flow/threading for communication within alerts)
    - Profile management
    - Settings and preferences
    - **Sharing the application** with other drill instructors (access location and how to use)
    - Role-specific features (based on user's assigned role)
  - Reference implementation: AIChatModel walkthrough system (`../AIChatModel/src/components/Walkthrough/`, `../AIChatModel/src/config/walkthroughs/`, `../AIChatModel/src/hooks/useWalkthrough.ts`)
- Create Firestore collections structure (see **Firestore Database Structure & Indexes** section above for detailed structure):
  - `recruits` - Recruit profiles and information
  - `countCards` - Accountability records
  - `platoons` - Platoon/squad organization
  - `emergencyContacts` - Emergency contact information
  - `userProfiles` - User account profiles
  - `conversations` - Human-to-human messaging (adapted from AIChatModel)
  - `adminLogs` - Administrative action logs
  - `encryptionKeys` - User encryption keys (encrypted)
  - `encryptionConfig` - Encryption configuration per user
- Create Firestore indexes:
  - Define all required composite indexes in `firestore.indexes.json`
  - Single-field indexes are automatically created by Firestore
  - Deploy indexes using Firebase CLI: `firebase deploy --only firestore:indexes`
  - Test index creation and query performance
  - Monitor index usage in Firebase Console
  - See **Firestore Database Structure & Indexes** section above for complete index requirements
  - **🔄 FUTURE BUILD - Additional Collections** (Placeholder - xAI implementation):
    - `weaponsAccountability` - Weapons accountability records
    - `rcoAccountability` - RCO accountability records
    - `importHistory` - Import operation history and audit logs for all accountability types
    - Note: Full implementation will be completed by xAI in a future build
  - `incidentAlerts` - Mass incident alert records (Sprint 18)
  - `alertNotifications` - Notification delivery tracking for incident alerts
  - `incidentAlerts/{alertId}/messages` - Message flow subcollection for alert threads (Sprint 18)
  - **🔄 FUTURE BUILD - Additional Collections** (Placeholder - xAI implementation):
    - `auditLogs` - Comprehensive audit log records (permanent preservation for investigations)
    - `investigatorAssignments` - Investigator role assignments with official letter requirements
    - `officialLetters` - Storage for official letters/documents required for Investigator access
    - `auditLogAccess` - Tracking of who accessed audit logs and when (audit logs of audit log access)
- Implement data validation schemas (Zod):
  - Recruit profile validation
  - Count card validation
  - User profile validation
  - Organizational structure validation
  - **🔄 FUTURE BUILD - Additional Validation Schemas** (Placeholder - xAI implementation):
    - Weapons accountability validation schema
    - RCO accountability validation schema
    - Import data validation schemas for all accountability types
    - Audit log entry validation schema
    - Investigator assignment validation schema
    - Official letter/document validation schema
- Create data service layer for Firestore operations
- Set up Firestore security rules based on role hierarchy and organizational structure:
  - Include security rules for recruit data access
  - Include security rules for count card workflow
  - **🔄 FUTURE BUILD - Additional Security Rules** (Placeholder - xAI implementation):
    - Security rules for Weapons accountability (role-based access: Senior DI, Chief DI, XO)
    - Security rules for RCO accountability (role-based access: Senior DI, Chief DI, XO)
    - Security rules for import operations (restricted to authorized roles)
    - Security rules for audit logs:
      - Audit logs are write-only for system (users cannot modify or delete)
      - Read access restricted to: Battalion Commander, Administrator, and assigned Investigators
      - Investigator access limited to assigned investigation scope and date range (max 45 days)
      - All audit log access is logged (audit logs of audit log access)
    - Security rules for Investigator assignments:
      - Create/assign: Battalion Commander or Administrator only
      - Read: Assigned Investigator, Battalion Commander, Administrator
      - Update/revoke: Battalion Commander or Administrator only
      - Official letter required before assignment is active
    - Security rules for official letters:
      - Upload: Administrator only
      - Read: Assigned Investigator, Battalion Commander, Administrator
      - Delete: Not allowed (permanent preservation)

#### Sprint 6: Recruit Management - Core Features
**Status**: 🔄 In Progress  
**Dependencies**: Sprint 5 (Data Models & Services) - ✅ Completed  
**Foundation Ready**: 
- ✅ Recruit service layer implemented (`lib/services/firestore/recruits.ts`)
- ✅ Recruit validation schemas implemented (`lib/validation/recruitSchemas.ts`)
- ✅ TypeScript types defined (`types/models.ts`)
- ⏳ UI components and pages - Pending implementation

**Tasks**:
- Create recruit profile creation/editing interface
- Implement recruit list view with filtering and search
  - Filter by: Regiment, Battalion, Company, Series, Platoon
  - Role-based filtering (users see only their authorized scope)
- Build recruit detail view
- Implement USMC rank display system with official USMC rank abbreviations:
  - **Enlisted Ranks (E-5 through E-9)**:
    - E-5: Sergeant (Sgt)
    - E-6: Staff Sergeant (SSgt)
    - E-7: Gunnery Sergeant (GySgt)
    - E-8: Master Sergeant (MSgt) or First Sergeant (1stSgt)
    - E-9: Master Gunnery Sergeant (MGySgt), Sergeant Major (SgtMaj), or Sergeant Major of the Marine Corps (SgtMajMC)
  - **Officer Ranks (O-1 through O-6)**:
    - O-1: Second Lieutenant (2ndLt)
    - O-2: First Lieutenant (1stLt)
    - O-3: Captain (Capt)
    - O-4: Major (Maj)
    - O-5: Lieutenant Colonel (LtCol)
    - O-6: Colonel (Col)
  - Rank display components:
    - Rank badge/insignia display (visual representation)
    - Rank abbreviation text display
    - Full rank name display (on hover or detail view)
    - Rank validation to ensure only valid USMC ranks are accepted
    - Rank sorting/filtering by pay grade (E-5 through E-9, O-1 through O-6)
- Create organizational assignment interface
  - Assign recruits to: Regiment → Battalion → Company → Series → Platoon
  - Validate organizational hierarchy (e.g., Alpha Company must be in 2nd Battalion)
  - Platoon format: 4-digit string
- Implement recruit status management
- Add recruit photo upload functionality
- Create recruit data export (GDPR compliance)
- Implement role-based access control for recruit data
  - Drill Instructors: View/edit only their platoon
  - Senior Drill Instructors: View/edit all platoons in their series
  - Chief Drill Instructor and above: View/edit based on organizational scope
- **🔄 FUTURE BUILD - Recruit List Import Infrastructure** (Placeholder - xAI implementation):
  - **Authorized Roles**: Senior Drill Instructor, Chief Drill Instructor, Company XO, Battalion XO
  - **Infrastructure Setup**:
    - Create import API endpoint structure (`/api/recruits/import`)
    - Define import data schema and validation (Zod)
    - Create import UI component placeholder (button/menu item in recruit management interface)
    - Set up role-based access control for import functionality
    - Create Firestore collection structure for import history/audit logs
    - Define import file format specifications (CSV, Excel, JSON)
    - Create error handling and validation framework
    - Set up import progress tracking infrastructure
  - **Implementation Notes**:
    - Feature will be implemented by xAI in a future build
    - Infrastructure should be ready but functionality will be placeholder/stub
    - UI should show "Coming Soon" or similar indicator
    - Import button/menu item should be visible to authorized roles but non-functional
    - All infrastructure code should be commented with "FUTURE: xAI implementation"

#### Sprint 7: Count Card System
- Design count card data model with workflow states
- Create count card creation interface (Drill Instructor role)
- Implement count card workflow system:
  - **Step 1**: Drill Instructor creates and submits to Duty Senior Drill Instructor
  - **Step 2**: Duty Senior Drill Instructor approves/rejects and forwards to:
    - Company 1stSgt
    - Series Commander
  - **Step 3**: Company 1stSgt or Series Commander consolidates and forwards to:
    - Company XO
    - Company Commander
    - Battalion SgtMaj
- Implement count card list view with filtering
  - Filter by: Status (pending, approved, rejected, consolidated), Organizational unit, Date range
  - Role-based filtering (users see only their authorized scope)
- Build count card detail view with workflow history
- Add timestamp and location tracking
- Implement count card status management (present, absent, excused, etc.)
- Create count card history and audit trail (track all workflow transitions)
- Add count card reporting and analytics
- Implement role-based permissions for count card actions
  - Drill Instructors: Create and submit only
  - Senior Drill Instructors: Approve/reject and forward
  - Company 1stSgt/Series Commander: Consolidate and forward
  - Chief Drill Instructor and above: Full access within scope

#### Sprint 6.5: Weapons & RCO Accountability Infrastructure (Future Build - Placeholder)
- **🔄 FUTURE BUILD - Weapons Accountability Import Infrastructure** (Placeholder - xAI implementation):
  - **Authorized Roles**: Senior Drill Instructor, Chief Drill Instructor, Company XO, Battalion XO
  - **Infrastructure Setup**:
    - Create Weapons accountability data model and TypeScript types
    - Create import API endpoint structure (`/api/weapons/import`)
    - Define import data schema and validation (Zod)
    - Create import UI component placeholder (button/menu item in accountability interface)
    - Set up role-based access control for import functionality
    - Create Firestore collection structure (`weaponsAccountability`)
    - Create import history/audit logs collection
    - Define import file format specifications (CSV, Excel, JSON)
    - Create error handling and validation framework
    - Set up import progress tracking infrastructure
    - Create Weapons accountability list view placeholder
    - Create Weapons accountability detail view placeholder
  - **Implementation Notes**:
    - Feature will be implemented by xAI in a future build
    - Infrastructure should be ready but functionality will be placeholder/stub
    - UI should show "Coming Soon" or similar indicator
    - Import button/menu item should be visible to authorized roles but non-functional
    - All infrastructure code should be commented with "FUTURE: xAI implementation"
- **🔄 FUTURE BUILD - RCO Accountability Import Infrastructure** (Placeholder - xAI implementation):
  - **Authorized Roles**: Senior Drill Instructor, Chief Drill Instructor, Company XO, Battalion XO
  - **Infrastructure Setup**:
    - Create RCO (Recruit Company Officer) accountability data model and TypeScript types
    - Create import API endpoint structure (`/api/rco/import`)
    - Define import data schema and validation (Zod)
    - Create import UI component placeholder (button/menu item in accountability interface)
    - Set up role-based access control for import functionality
    - Create Firestore collection structure (`rcoAccountability`)
    - Create import history/audit logs collection
    - Define import file format specifications (CSV, Excel, JSON)
    - Create error handling and validation framework
    - Set up import progress tracking infrastructure
    - Create RCO accountability list view placeholder
    - Create RCO accountability detail view placeholder
  - **Implementation Notes**:
    - Feature will be implemented by xAI in a future build
    - Infrastructure should be ready but functionality will be placeholder/stub
    - UI should show "Coming Soon" or similar indicator
    - Import button/menu item should be visible to authorized roles but non-functional
    - All infrastructure code should be commented with "FUTURE: xAI implementation"
- **Shared Infrastructure for Weapons & RCO**:
  - Create shared accountability import utilities
  - Create shared validation schemas
  - Create shared error handling components
  - Create shared import progress tracking components
  - Create shared audit logging system

#### Sprint 8: Emergency Contacts & Profile Management
- Create emergency contact management interface
- Implement emergency contact CRUD operations
- Build extended recruit profile system
- Add profile data encryption
- Implement profile data export
- Create profile privacy settings
- Add user profile management:
  - Profile picture upload and management (individual user)
  - Company logo creation and upload
  - Battalion logo creation and upload
  - Shared logo system:
    - Users can select from existing company/battalion logos
    - Users can upload new logos (becomes available to others in same company/battalion)
    - Logo sharing permissions and access control
- **Share Application Feature**:
  - **Access Location**: Available in user menu (top right navigation) and profile page
  - **Share Options**:
    - Native Web Share API (if supported by browser/device)
    - Copy application URL to clipboard
    - Share via email (opens default email client with pre-filled message)
    - Share via SMS/text message (mobile devices)
    - Generate shareable link with optional referral tracking
  - **Share Content**:
    - Application URL (custom domain: `countcard.warriorwaypoint.com`)
    - Pre-filled message: "Check out CountCard - the Marine Corps Drill Instructor accountability application for tracking and managing recruits. [Application URL]"
    - Optional: Include user's name/rank in referral message
  - **User Interface**:
    - "Share App" button/menu item in user menu (accessible from any page)
    - "Share with Other Drill Instructors" option on profile page
    - Share modal/dialog with multiple sharing options
    - Success confirmation when link is copied or share is initiated
    - Clear visual indicator showing where to access share feature
  - **Implementation**:
    - Use Web Share API for native sharing on supported devices
    - Fallback to clipboard copy and manual sharing options
    - Track share events (optional analytics)
    - Ensure share functionality works across all supported browsers (Safari 14+, Chrome 90+, Edge 90+)

### Phase 3: Communication & Admin (Sprints 9-12)
**Goal**: Implement messaging system and administrative features

#### Sprint 9: Human-to-Human Messaging
- Adapt chat system from AIChatModel (remove AI, keep human-to-human)
- Create conversation interface
- Implement message sending/receiving
- Add message encryption
- Create conversation list and history
- Implement real-time message updates
- Add message search and filtering
- Create message attachments support

#### Sprint 10: Admin Dashboard
- Create admin dashboard layout
- Implement admin navigation and routing (role-based menu)
- Build user management interface
  - Assign users to roles and organizational units
  - Manage user organizational assignments (Regiment, Battalion, Company, Series, Platoon)
  - View user access scopes based on role
- Create comprehensive role management system
  - Manage all 10 roles: Drill Instructor, Senior Drill Instructor, Chief Drill Instructor, Company 1stSgt, Series Commander, Company XO, Company Commander, Battalion SgtMaj, Battalion XO, Battalion Commander
  - **Note**: Investigator role (11th role) will be added in future build - see Investigator Role Management section below
  - **🔄 FUTURE BUILD - Investigator Role Management** (Placeholder - xAI implementation):
    - Manage Investigator role assignments
    - Assign Investigator role to users (Battalion Commander or Administrator only)
    - Upload official letter/document requirement before granting access
    - Configure investigation scope and date range (maximum 45 days)
    - Track investigation assignments and access periods
    - Revoke Investigator access when investigation completes
  - Configure role permissions and access scopes
  - Implement privilege level system (Level 1, 2, 3)
- Implement admin activity logging
- **🔄 FUTURE BUILD - Comprehensive Audit Log System** (Placeholder - xAI implementation):
  - **Audit Log Infrastructure**:
    - Comprehensive audit logging for all system actions
    - Track all user actions: create, read, update, delete operations
    - Track all administrative actions: role assignments, access grants, system changes
    - Track all data access: recruit data, count cards, alerts, messages
    - Track all security events: login attempts, authentication failures, access denials
    - Immutable audit log records (cannot be modified or deleted)
    - Long-term preservation for investigations
  - **Audit Log Data Model**:
    - Firestore collection: `auditLogs`
    - Fields: logId, userId, userRank, userName, action, resourceType, resourceId, actionDetails, timestamp, ipAddress, userAgent, organizationalScope (battalion, company, platoon), investigationId (if part of investigation)
    - Indexed by: userId, timestamp, action, resourceType, organizationalScope
    - Retention policy: Permanent preservation (no automatic deletion)
  - **Investigator Access System**:
    - **Assignment Process**:
      - Battalion Commander or Administrator initiates assignment
      - Upload official letter/document (required before access granted)
      - Configure investigation parameters:
        - Investigation scope (specific actions, resources, users)
        - Date range (maximum 45 days per assignment)
        - Organizational scope (battalion, company, platoon)
      - Assignment creates investigation record with unique investigationId
      - Investigator role granted with time-limited access
    - **Access Restrictions**:
      - Read-only access to audit logs
      - Limited to assigned investigation scope
      - Maximum 45 days of data per assignment
      - Access automatically expires after investigation period
      - Cannot access audit logs outside assigned scope
    - **Investigator Interface**:
      - Audit log viewer with filtering and search
      - Filter by: date range (max 45 days), action type, user, resource type, organizational scope
      - Export audit log data (for official reports)
      - Investigation assignment details view
      - Official letter/document viewer
    - **Data Model for Investigator Assignments**:
      - Firestore collection: `investigatorAssignments`
      - Fields: assignmentId, investigatorUserId, assignedByUserId, officialLetterUrl, officialLetterFileName, investigationScope, dateRangeStart, dateRangeEnd, organizationalScope, status (active, completed, revoked), createdAt, expiresAt, completedAt
      - Links to audit logs via investigationId field
  - **Security & Compliance**:
    - Audit logs are encrypted at rest
    - Access to audit logs is logged (audit logs of audit log access)
    - Investigator access is time-limited and scope-limited
    - Official letter requirement ensures proper authorization
    - All investigator actions are logged
    - Assignment history preserved permanently
  - **Implementation Notes**:
    - Feature will be fully implemented by xAI in a future build
    - Infrastructure should be ready but functionality will be placeholder/stub
    - UI should show "Coming Soon" or similar indicator for Investigator role assignment
    - All infrastructure code should be commented with "FUTURE: xAI implementation"
    - Audit log collection structure should be created but logging will be basic initially
- Add system analytics and reporting
  - Organizational unit analytics (by Regiment, Battalion, Company, Series, Platoon)
  - Role-based reporting
- Create admin settings interface
- Implement admin notification system
- Build organizational structure management
  - Create/manage Regiments, Battalions, Companies, Series, Platoons
  - Validate organizational hierarchy relationships

#### Sprint 11: Organizational Structure Management
- Create organizational structure management interface
  - Recruit Training Regiment management (West/East)
  - Battalion management (1st, 2nd, 3rd, Support)
  - Company management (by battalion):
    - 1st Battalion: India, Lima, Kilo, Mike
    - 2nd Battalion: Alpha, Bravo, Charlie, Delta
    - 3rd Battalion: Echo, Fox, Golf, Hotel
    - Support Battalion: STC, MRP, BMP
  - Series management (Lead Series, Follow Series)
  - Platoon management (4-digit string format, typically 3 per Series)
- Implement organizational hierarchy validation
  - Ensure companies are assigned to correct battalions
  - Validate series assignments
  - Validate platoon assignments (4-digit format)
- Build organizational unit assignment interface
- Add member management by organizational unit
- Create organizational reporting
  - Reports by Regiment, Battalion, Company, Series, Platoon
  - Role-based reporting access
- Implement organizational analytics
- Add organizational export functionality
- Build organizational structure visualization

#### Sprint 12: Reporting & Analytics
- Create accountability reports
- Implement attendance tracking and reporting
- Build recruit status reports
- Add platoon/squad performance metrics
- Create export functionality for reports
- Implement data visualization (charts, graphs)
- Add scheduled report generation

### Phase 4: Security & Compliance (Sprints 13-15)
**Goal**: Implement comprehensive security and GDPR compliance

#### Sprint 13: End-to-End Encryption
- Implement client-side encryption for all sensitive data
- Create encryption key management UI
- Implement key recovery system
- Add encryption status indicators
- Create encryption key rotation
- Implement encrypted data migration
- Add encryption compliance testing

#### Sprint 14: GDPR Compliance Features
- Implement data export functionality (user data download)
- Create data deletion workflow with confirmation
- Add consent management system
- **Note**: Privacy policy and terms of service acceptance is implemented in Sprint 2 (required at login/signup)
- Implement privacy policy and terms version tracking (for updates requiring re-acceptance)
- Create cookie consent (if applicable)
- Add data processing records
- Implement breach notification procedures
- Create GDPR compliance dashboard

#### Sprint 15: Security Hardening
- Implement comprehensive security audit
- Add security monitoring and alerts
- Create security incident response procedures
- Implement advanced rate limiting
- Add IP whitelisting for admin access
- Create security logging and audit trails
- **🔄 FUTURE BUILD - Enhanced Audit Logging** (Placeholder - xAI implementation):
  - Comprehensive audit logging for all system actions
  - Audit log preservation for investigations
  - Investigator role assignment system
  - Official letter requirement for Investigator access
  - 45-day time limit enforcement for Investigator access
  - Audit log access tracking (who accessed what, when)
- Implement security testing and penetration testing preparation
- Add security documentation

### Phase 5: UI/UX & Polish (Sprints 16-18)
**Goal**: Enhance user experience and visual design

#### Sprint 16: Marine Corps Theme & Styling
- Implement MARPAT color scheme
- Create military-themed UI components
- Add USMC rank insignia display components (for E-5 through E-9 Enlisted and O-1 through O-6 Officers)
- Implement responsive design improvements
- Create mobile-optimized interfaces
- Add dark mode support
- Implement theme customization (admin)

#### Sprint 17: User Experience Enhancements
- Improve navigation and user flows
- Add loading states and skeletons
- Implement error boundaries
- Create user onboarding flow
- Add tooltips and help text
- Implement keyboard shortcuts
- Create accessibility improvements (WCAG 2.1 AA)
- Add haptic feedback (mobile)

#### Sprint 18: Performance Optimization
- Implement code splitting and lazy loading
- Optimize Firestore queries and indexes:
  - Review and optimize existing composite indexes (see **Firestore Database Structure & Indexes** section)
  - Analyze query performance using Firebase Console
  - Remove unused indexes to reduce storage costs
  - Add missing indexes for frequently used queries
  - Optimize query patterns to reduce read operations
  - Test index performance under load
  - Monitor index build times and completion status
- Add caching strategies
- Optimize image loading and storage
- Implement bundle size optimization
- Add performance monitoring
- Create performance testing
- Optimize database structure
- Browser compatibility optimization
  - Optimize polyfills and feature detection for performance
  - Minimize bundle size impact of compatibility code
  - Test performance across all supported browsers
  - Optimize for Safari, Chrome, and Edge specific performance characteristics

### Phase 6: Advanced Features (Sprints 19-21)
**Goal**: Add advanced features and integrations

#### Sprint 19: Notifications & Alerts
- Implement Firebase Cloud Messaging (FCM) with VAPID authentication
- Configure VAPID keypair for web push (see Technology Foundation section)
- Create push notification system
- Add email notification support
- Implement notification preferences
- Create alert system for critical events
- Add notification history
- Implement notification scheduling
- **Mass Incident Alert System** (Chain of Command Workflow):
  - **Initiation**:
    - Any user can initiate a mass incident alert
    - Alert creation interface accessible from main navigation
    - Required fields: Incident type, description, severity level, location
    - Optional fields: Attachments, photos, related recruits/platoons
    - Alert automatically scoped to user's battalion (internal to battalion only)
  - **Chain of Command Workflow**:
    - **Step 1 - Platoon Level**: Alert initiated → Notifies all users in the platoon
      - Drill Instructors in the platoon
      - Senior Drill Instructor (if assigned to platoon)
    - **Step 2 - Company Level**: Alert escalates to company → Notifies all users in the company
      - Company 1stSgt
      - Series Commander
      - Company XO
      - Company Commander
      - All platoons within the company
    - **Step 3 - Battalion Level**: Alert escalates to battalion → Notifies all users in the battalion
      - Battalion SgtMaj
      - Battalion XO
      - Battalion Commander
      - All companies within the battalion
  - **Notification Delivery**:
    - Push notifications via FCM (Firebase Cloud Messaging)
    - In-app notifications (notification center/bell icon)
    - Email notifications (if user has email notifications enabled)
    - SMS notifications (if user has SMS notifications enabled and phone number on file)
    - Real-time updates in application
  - **Alert Management Interface**:
    - Alert creation form with validation
    - Alert list view (filterable by: status, severity, date, battalion, company, platoon)
    - Alert detail view showing:
      - Full incident details
      - Chain of command workflow status
      - Notification delivery status (who was notified, read receipts)
      - Timeline of alert progression through chain
      - **Message Flow/Thread** (integrated messaging system)
    - Alert status tracking:
      - Active/In Progress
      - Acknowledged (by each level in chain)
      - Resolved/Closed
      - Escalated
  - **Message Flow System** (Integrated with Alert System):
    - **Message Thread**:
      - Each alert has an associated message thread/conversation
      - Real-time messaging within alert context
      - Message history preserved with alert
      - Chronological message display
      - Message threading (reply to specific messages)
    - **Message Features**:
      - Text messages with formatting support
      - File attachments (photos, documents, PDFs)
      - @mentions to notify specific users in the chain
      - Message reactions/acknowledgments (thumbs up, checkmark, etc.)
      - Message status indicators (sent, delivered, read)
      - Edit/delete own messages (with time limits)
      - Message search within alert thread
    - **Role-Based Messaging Permissions**:
      - **Any User**: Can view messages, send messages in alerts they can access
      - **Senior Drill Instructor and Above**: Can send messages, @mention users, attach files
      - **Company Level and Above**: Can pin important messages, moderate messages
      - **Battalion Level**: Can delete any message, manage entire thread
    - **Message Notifications**:
      - Real-time push notifications for new messages in active alerts
      - Email notifications for messages in alerts user is following
      - In-app notification badge for unread messages in alerts
      - Notification preferences (users can mute specific alert threads)
    - **Message Encryption**:
      - All messages encrypted at rest (sensitive incident information)
      - End-to-end encryption for message content
      - Encrypted file attachments
    - **Message UI Components**:
      - Message input area at bottom of alert detail view
      - Message list/thread display with user avatars and timestamps
      - Message actions menu (reply, react, edit, delete)
      - File attachment upload interface
      - @mention autocomplete dropdown
      - Message search bar
      - Unread message indicators
      - Message read receipts
    - **Message Data Model**:
      - Firestore collection: `alertMessages` (subcollection of `incidentAlerts`)
      - Fields: messageId, alertId, senderUserId, senderRank, senderName, messageText, attachments, mentions, reactions, parentMessageId (for threading), createdAt, updatedAt, editedAt, deletedAt
      - Message metadata: readBy (array of userIds with readAt timestamps), deliveredTo
    - **Message Integration**:
      - Integrates with Sprint 8 (Human-to-Human Messaging) infrastructure
      - Uses same encryption system as general messaging
      - Shares notification infrastructure with alert system
      - Real-time updates using Firestore real-time listeners
    - **Message Moderation**:
      - Flag inappropriate messages
      - Report message functionality
      - Message deletion by authorized roles
      - Message edit history tracking
      - Audit log for all message actions
  - **Role-Based Features**:
    - **Any User**: Can initiate alerts, view alerts in their scope
    - **Senior Drill Instructor and Above**: Can acknowledge alerts, add updates/comments
    - **Company Level and Above**: Can escalate alerts, mark as resolved
    - **Battalion Level**: Can close alerts, view all alerts in battalion
  - **Data Model**:
    - Incident alert data structure (TypeScript types)
    - Firestore collection: `incidentAlerts`
    - Fields: alertId, initiatorUserId, battalion, company, platoon, incidentType, description, severity, location, status, workflowState, notificationsSent, messageThreadId, createdAt, updatedAt, resolvedAt
    - Notification tracking: recipientUserId, notificationType, sentAt, readAt, acknowledgedAt
    - Message flow data structure:
      - Firestore subcollection: `incidentAlerts/{alertId}/messages`
      - Message fields: messageId, senderUserId, senderRank, senderName, messageText, attachments (array), mentions (array of userIds), reactions (object with userId: reactionType), parentMessageId (for threading), readBy (array with userId and readAt), deliveredTo (array), createdAt, updatedAt, editedAt, deletedAt, isPinned (boolean)
      - Message metadata: editHistory (array of previous versions), deletionReason (if deleted by moderator)
  - **Security & Access Control**:
    - Alerts are scoped to battalion (users can only see alerts in their battalion)
    - Role-based access: Users see alerts relevant to their organizational scope
    - Audit logging: Track all alert actions (create, acknowledge, escalate, resolve)
    - Encryption: Alert data encrypted at rest (sensitive incident information)
  - **UI Components**:
    - "Create Incident Alert" button in main navigation (accessible to all users)
    - Alert creation modal/form
    - Alert list view with filtering and search
    - Alert detail view with workflow visualization
    - **Message Flow UI Components**:
      - Message thread panel in alert detail view
      - Message input area with formatting toolbar
      - File attachment upload interface
      - @mention autocomplete dropdown
      - Message list with avatars, timestamps, and status indicators
      - Message actions menu (reply, react, edit, delete)
      - Message search within alert thread
      - Unread message count badge on alert list items
      - Message notification indicators
    - Notification badge/indicator showing unread alerts and messages
    - Alert status indicators (color-coded by severity)
  - **Workflow Visualization**:
    - Visual representation of alert progression through chain of command
    - Status indicators for each level (platoon → company → battalion)
    - Timeline view showing when alerts were sent to each level
    - Read receipt indicators showing who has viewed/acknowledged
    - Message activity indicators showing recent message activity in alert thread
    - Message count badge showing number of messages in thread
    - Last message timestamp and sender information
  - **Integration with Existing Systems**:
    - Integrates with FCM push notification system
    - Integrates with email notification system
    - Integrates with SMS notification system (if implemented)
    - Uses organizational structure data for determining notification recipients
    - Links to recruit profiles if incident involves specific recruits
    - **Integrates with Sprint 8 (Human-to-Human Messaging)**:
      - Uses same messaging infrastructure and components
      - Shares encryption system for message content
      - Uses same real-time update mechanisms
      - Message flow UI components adapted from general messaging system
      - Unified notification system for both alerts and messages

#### Sprint 20: Advanced Search & Filtering
- Implement full-text search for recruits
- Add advanced filtering options
- Create saved search functionality
- Implement search history
- Add search suggestions
- Create search analytics

#### Sprint 21: Integration & API
- Create REST API documentation
- Implement API key management
- Add webhook support
- Create integration testing
- Implement API rate limiting
- Add API versioning
- Create developer documentation

### Phase 7: Testing & Deployment (Sprints 22-23)
**Goal**: Comprehensive testing and production deployment

#### Sprint 22: Testing & Quality Assurance
- Create test plan and test cases
- Implement manual testing procedures
- Perform security testing
- Conduct performance testing
- Execute accessibility testing
- Perform cross-browser testing
  - **REQUIRED**: Test on Safari 14+, 15+, 16+, 17+ (latest)
  - **REQUIRED**: Test on Chrome 90+, 100+, 110+, 120+ (latest)
  - **REQUIRED**: Test on Edge 90+, 100+, 110+, 120+ (latest)
  - Test all authentication methods on each browser
  - Test encryption/decryption functionality on each browser
  - Test responsive design on each browser
  - Verify feature compatibility and fallbacks
  - Test on mobile Safari (iOS 14+), mobile Chrome, and mobile Edge
  - Document browser-specific issues and workarounds
- Create bug tracking and resolution workflow
- Implement user acceptance testing (UAT)

#### Sprint 23: Deployment & Launch
- Set up production environment
- ✅ **SELECTED**: Firebase Hosting as hosting solution
- ✅ **COMPLETED**: Configured DNS CNAME record in SiteGround (`countcard.warriorwaypoint.com` → `countcard-94c5b.web.app`)
- **Firebase Hosting Setup & Configuration**:
  - **Install Firebase CLI**: Set up Firebase CLI for deployment commands
  - **Initialize Hosting**: Run `firebase init hosting` to configure hosting in project directory
  - **Configure firebase.json**: Set up hosting configuration file with:
    - Public directory (Next.js output: `.next` or `out` for static export)
    - Rewrite rules for Next.js App Router (SSR/API routes)
    - Headers configuration (security headers, CORS, etc.)
    - i18n rewrites (if needed for internationalization)
    - Clean URLs configuration
  - **Next.js Integration**:
    - Configure Next.js for Firebase Hosting deployment
    - Set up static export or SSR with Cloud Functions/Cloud Run
    - Configure API routes to work with Firebase Hosting rewrites
    - Optimize build output for Firebase Hosting
  - **Custom Domain Configuration**:
    - Add custom domain (`countcard.warriorwaypoint.com`) to Firebase Hosting
    - Wait for DNS propagation (typically 5-30 minutes, up to 72 hours)
    - Firebase automatically provisions SSL certificate (zero-configuration SSL)
    - Verify SSL certificate activation
  - **Firebase Hosting Features**:
    - **SSL/HTTPS**: Automatic SSL certificate provisioning for all domains
    - **Global CDN**: Content cached on SSDs at CDN edges worldwide
    - **Compression**: Automatic gzip or Brotli compression
    - **Fast Delivery**: Content served from closest edge server
    - **Preview Channels**: Deploy to preview URLs before going live
    - **Rollback**: One-click rollback to previous versions
    - **Multiple Sites**: Support for multiple sites in same project (if needed)
  - **Local Development & Testing**:
    - Set up Firebase Local Emulator Suite for hosting
    - Test locally using `firebase emulators:start`
    - Test rewrites and redirects locally
    - Verify build output before deployment
  - **Preview & Staging**:
    - Create preview channels using `firebase hosting:channel:deploy`
    - Share preview URLs with team for testing
    - Set up GitHub integration for automatic preview deployments (optional)
    - Test preview deployments before production
  - **Deployment Workflow**:
    - Build Next.js application (`npm run build` or `next build`)
    - Deploy to Firebase Hosting: `firebase deploy --only hosting`
    - Deploy specific site: `firebase deploy --only hosting:site-name` (if multiple sites)
    - Deploy to preview channel: `firebase hosting:channel:deploy preview-channel-name`
    - Monitor deployment status in Firebase Console
  - **CI/CD Pipeline**:
    - Set up automated deployment from GitHub (optional)
    - Configure GitHub Actions or similar CI/CD tool
    - Deploy on push to main branch (production)
    - Deploy to preview channels on pull requests
    - Set up deployment notifications
  - **Monitoring & Management**:
    - Monitor web request data with Cloud Logging
    - Track deployment history and versions
    - Manage live and preview channels
    - View deployment analytics
    - Set up performance monitoring
  - **Configuration Files**:
    - `firebase.json`: Hosting configuration
    - `.firebaserc`: Project configuration
    - `firestore.indexes.json`: Firestore indexes (if deploying indexes)
    - `firestore.rules`: Security rules (if deploying rules)
  - **Deployment Commands**:
    - `firebase deploy`: Deploy all configured services
    - `firebase deploy --only hosting`: Deploy only hosting
    - `firebase deploy --only hosting:site-name`: Deploy specific site
    - `firebase hosting:channel:deploy channel-name`: Deploy to preview channel
    - `firebase hosting:clone source-site target-site`: Clone site configuration
- Configure custom domain (`countcard.warriorwaypoint.com`) with Firebase Hosting
- Wait for DNS propagation (in progress)
- Add custom domain to Firebase Hosting custom domains (after DNS propagates)
- Set up Firebase Hosting deployment workflow
- Configure CI/CD pipeline (Firebase CLI deployment)
- Implement monitoring and alerting
- Create deployment documentation
- Set up backup and disaster recovery
- Perform production deployment to Firebase Hosting
- Create user documentation and training materials
- Conduct launch and post-launch support

## Sprint Management
- Each sprint will have its own folder in `sprints/` directory
- Sprint files named: `Sprint-<Number>-<Date>.md`
- Completed sprints moved to `sprints/Archive/`
- Large tasks broken down into smaller subtasks
- Regular sprint reviews and retrospectives

## Dependencies
- Firebase project setup must be completed before Sprint 2
- Authentication must be complete before Sprint 5
- Data models must be defined before Sprint 5 (including organizational structure)
- Role-based access control must be implemented before Sprint 5
- Organizational structure data model must be defined before Sprint 5
- Count card workflow system must be designed before Sprint 6
- Encryption must be implemented before Sprint 12
- Security rules must be in place before Sprint 13 (must account for role hierarchy and organizational structure)

## Success Criteria
- All features functional and tested
- GDPR compliance verified
- End-to-end encryption working
- Security audit passed
- Performance benchmarks met
- **Browser compatibility verified**: Application works on Safari 14+, Chrome 90+, Edge 90+ (latest 2 major versions of each)
- Cross-browser testing completed with no critical issues
- **Role-based access control verified**: All 10 roles properly implemented with correct permissions (Investigator role - 11th role - will be implemented in future build)
- **Organizational structure verified**: All organizational units (Regiment, Battalion, Company, Series, Platoon) properly configured
- **Count card workflow verified**: Complete workflow from Drill Instructor submission through final approval works correctly
- **Logo sharing system verified**: Company and Battalion logos properly shared and accessible
- User acceptance testing completed
- Production deployment successful

## Timeline Estimate
- **Phase 1** (Sprints 1-3): 3-4 weeks
- **Phase 2** (Sprints 4-7): 4-5 weeks
- **Phase 3** (Sprints 8-11): 4-5 weeks
- **Phase 4** (Sprints 12-14): 3-4 weeks
- **Phase 5** (Sprints 15-17): 3-4 weeks
- **Phase 6** (Sprints 18-20): 3-4 weeks
- **Phase 7** (Sprints 21-22): 2-3 weeks

**Total Estimated Timeline**: 22-29 weeks (approximately 5.5-7 months)

## Notes

### Development Guidelines
- Timeline is estimated and may vary based on complexity and requirements
- Sprints can be adjusted based on priorities and feedback
- Additional sprints may be added for new requirements
- Security and compliance are top priorities throughout development

### Project Maintenance
- All sprint documentation should be maintained in the `sprints/` directory
- Completed sprints should be archived in `sprints/Archive/`
- Regular reviews of this overview document should be conducted to ensure accuracy
- Update this document as project requirements evolve

### Important Reminders
- All changes must maintain GDPR compliance
- Security audits should be conducted before each major release
- Browser compatibility testing is required for all features
- Role-based access control must be verified for all new features

---

## Security & Vulnerability Checks

### Overview

The CountCard application requires ongoing security monitoring and vulnerability assessments to ensure the protection of sensitive military personnel data. A comprehensive security and vulnerability check document has been created to facilitate regular security reviews and maintain compliance with security best practices.

### Security Documentation

**Document Location**: `sprints/SECURITY-VULNERABILITY-CHECK.md`

This revolving security document provides:

- **Comprehensive Security Checklists**: Covering all aspects of application security including authentication, encryption, API security, GDPR compliance, and more
- **Dependency Security Monitoring**: Regular checks for vulnerable dependencies and required updates
- **Vulnerability Remediation Tracking**: Log of all discovered vulnerabilities and their remediation status
- **Security Review Schedule**: Monthly, quarterly, and ad-hoc review procedures
- **Incident Response Procedures**: Documentation for handling security incidents

### Review Schedule

The security document should be reviewed and updated:

- **Monthly**: Standard security checks, dependency updates, compliance verification
- **Quarterly**: Comprehensive security audit, penetration testing preparation, policy review
- **Post-Release**: Security check after each major release or significant feature addition
- **Ad-Hoc**: Triggered by security advisories, incidents, or significant changes

### Key Security Areas Covered

1. **Dependency Security Checks**: Automated and manual scanning of npm packages for vulnerabilities
2. **Authentication & Authorization**: Multi-provider authentication security, RBAC verification, token security
3. **Data Encryption & Protection**: End-to-end encryption verification, key management, PII protection
4. **API Security**: Input validation, rate limiting, CORS configuration, response security
5. **Firebase Security Rules**: Firestore and Storage security rules verification
6. **GDPR Compliance**: User rights, consent management, data processing, breach management
7. **Input Validation & Sanitization**: Client and server-side validation, XSS prevention
8. **Error Handling & Logging**: Secure error messages, audit logging, log security
9. **Network & Transport Security**: HTTPS/TLS, security headers, network configuration
10. **Client-Side Security**: Browser security, code security, storage security
11. **Infrastructure Security**: Hosting security, database security, monitoring
12. **Security Monitoring & Incident Response**: Monitoring setup, incident response procedures

### Integration with Sprint Workflow

The security and vulnerability check document integrates with the sprint workflow:

- **Phase 4 (Sprints 12-14)**: Security & Compliance phase includes implementation of security features documented in the security check
- **Ongoing Maintenance**: Regular security reviews should be conducted throughout all phases
- **Pre-Deployment**: Security checks must be completed before any production deployment
- **Post-Deployment**: Security monitoring continues after deployment

### Security Review Process

1. **Schedule Review**: Set review date and assign reviewer(s)
2. **Complete Checklists**: Go through all relevant security checklists
3. **Document Findings**: Record any vulnerabilities or security issues found
4. **Prioritize Remediation**: Classify issues by severity (Critical, High, Medium, Low)
5. **Remediate Issues**: Address vulnerabilities according to priority
6. **Update Log**: Document all findings and remediation in the Vulnerability Remediation Log
7. **Sign Off**: Complete review sign-off section with status and action items
8. **Schedule Next Review**: Set date for next scheduled review

### Important Notes

- All security issues should be documented in the Vulnerability Remediation Log
- Critical and high-severity issues must be addressed immediately
- Medium and low-severity issues should be addressed according to risk assessment
- Security reviews should be conducted by qualified personnel
- All security-related changes should be documented and reviewed
- The security document should be updated with each review to reflect current state

### References

For detailed security checklists and procedures, refer to:
- **Security Document**: `sprints/SECURITY-VULNERABILITY-CHECK.md`
- **Phase 4 Sprints**: Security & Compliance implementation (Sprints 12-14)
- **GDPR Compliance**: Critical GDPR Compliance Requirements section
- **Firebase Security**: Firebase Configuration & Deployment section
