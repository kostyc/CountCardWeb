/**
 * Route placeholder configuration for under-construction or incomplete features.
 * Used by UnderConstructionPlaceholder to show what needs to be added and which sprint.
 * If sprintRef is missing, UI shows "Under construction, unknown sprint".
 */

export interface RoutePlaceholderConfig {
  /** Display title for the route */
  title: string;
  /** Sprint reference (e.g. "Sprint 6", "Sprint 7") or undefined for unknown */
  sprintRef?: string;
  /** What needs to be added (bulleted list); empty = generic message */
  needsAdded: string[];
}

export const ROUTE_PLACEHOLDERS: Record<string, RoutePlaceholderConfig> = {
  '/share': {
    title: 'Share App',
    sprintRef: 'Sprint 7',
    needsAdded: [
      'Share App UI and flow (placeholder in UserMenu per Sprint 2).',
      'Define share target (link, email, etc.) and permissions.',
    ],
  },
  '/privacy-policy': {
    title: 'Privacy Policy',
    sprintRef: 'Sprint 2',
    needsAdded: [
      'Full privacy policy document content.',
      'Version tracking and acceptance storage (Sprint 2 acceptance flow exists).',
    ],
  },
  '/terms-of-service': {
    title: 'Terms of Service',
    sprintRef: 'Sprint 2',
    needsAdded: [
      'Full terms of service document content.',
      'Version tracking and acceptance storage (Sprint 2 acceptance flow exists).',
    ],
  },
  '/recruits': {
    title: 'Recruits',
    sprintRef: 'Sprint 6',
    needsAdded: [
      'Recruit list import (Sprint 6 Task 10 – future build placeholder).',
      'Import API endpoint, UI placeholder, schema (CSV/Excel/JSON), import history.',
    ],
  },
  '/recruits/create': {
    title: 'Create Recruit',
    sprintRef: 'Sprint 6',
    needsAdded: ['All core create flows complete (Sprint 6). Import placeholder only.'],
  },
  '/recruits/[id]': {
    title: 'Recruit Detail',
    sprintRef: 'Sprint 6',
    needsAdded: ['All core detail flows complete (Sprint 6).'],
  },
  '/recruits/[id]/edit': {
    title: 'Edit Recruit',
    sprintRef: 'Sprint 6',
    needsAdded: ['All core edit flows complete (Sprint 6).'],
  },
  '/count-cards': {
    title: 'Count Cards',
    sprintRef: 'Sprint 7',
    needsAdded: [
      'Export filtered results to CSV/PDF (Sprint 7 Task 4 – deferred to Sprint 12).',
      'Audit trail and reporting (Sprint 7 Tasks 8 & 9 – deferred).',
    ],
  },
  '/count-cards/new': {
    title: 'New Count Card',
    sprintRef: 'Sprint 7',
    needsAdded: ['Core creation complete. Notifications deferred to Sprint 19.'],
  },
  '/count-cards/[id]': {
    title: 'Count Card Detail',
    sprintRef: 'Sprint 7',
    needsAdded: ['Individual recruit list in detail (data model enhancement).'],
  },
  '/dashboard': {
    title: 'Dashboard',
    sprintRef: 'Sprint 1–6',
    needsAdded: ['Dashboard content and widgets per product backlog.'],
  },
  '/settings': {
    title: 'Settings',
    sprintRef: 'Sprint 8',
    needsAdded: [
      'Settings export/import (Sprint 10).',
      'Phone auth UI complete (Sprint 2 deferred).',
    ],
  },
  '/profile': {
    title: 'Profile',
    sprintRef: 'Sprint 2, 5',
    needsAdded: ['Profile view/edit page content if not yet complete.'],
  },
  '/profile/create': {
    title: 'Create Profile',
    sprintRef: 'Sprint 5',
    needsAdded: ['Profile wizard complete. Block app access until minimum fields (optional).'],
  },
  '/admin': {
    title: 'Admin Panel',
    sprintRef: 'Sprint 10',
    needsAdded: ['Phase 2: analytics, settings, notifications, org structure.'],
  },
  '/dashboard/admin': {
    title: 'Admin Dashboard',
    sprintRef: 'Sprint 10',
    needsAdded: ['Phase 2: analytics, settings, notifications, org structure.'],
  },
};

/**
 * Get placeholder config for a path (exact or dynamic segment match).
 */
export function getRoutePlaceholder(pathname: string): RoutePlaceholderConfig | undefined {
  const normalized = pathname.replace(/\/$/, '') || '/';
  // Exact match
  if (ROUTE_PLACEHOLDERS[normalized]) return ROUTE_PLACEHOLDERS[normalized];
  // Dynamic segment match (e.g. /recruits/abc123 -> /recruits/[id])
  for (const [path, config] of Object.entries(ROUTE_PLACEHOLDERS)) {
    if (!path.includes('[')) continue;
    const parts = path.split('/').filter(Boolean);
    const normParts = normalized.split('/').filter(Boolean);
    if (parts.length !== normParts.length) continue;
    const match = parts.every((p, i) => p.startsWith('[') || p === normParts[i]);
    if (match) return config;
  }
  return undefined;
}
