'use client';

/**
 * UnderConstructionPlaceholder
 *
 * Shows a consistent "under construction" state with route title,
 * sprint reference (or "unknown sprint"), and what needs to be added.
 * Use on placeholder pages so users never see raw errors.
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { getRoutePlaceholder, type RoutePlaceholderConfig } from '@/lib/constants/routePlaceholders';

export interface UnderConstructionPlaceholderProps {
  /** Override title (default from route config or path) */
  title?: string;
  /** Override sprint ref (default from route config) */
  sprintRef?: string;
  /** Override needs-added list (default from route config) */
  needsAdded?: string[];
  /** Show back to dashboard link */
  showBackLink?: boolean;
}

const defaultNeedsAdded = [
  'This area is not fully built yet.',
  'Check sprint docs in .cursor/plans and sprints/ for what to add.',
];

export default function UnderConstructionPlaceholder({
  title: titleOverride,
  sprintRef: sprintRefOverride,
  needsAdded: needsAddedOverride,
  showBackLink = true,
}: UnderConstructionPlaceholderProps): JSX.Element {
  const pathname = usePathname() ?? '';
  const config = getRoutePlaceholder(pathname);
  const title = titleOverride ?? config?.title ?? (pathname || 'Page');
  const sprintRef = sprintRefOverride ?? config?.sprintRef;
  const needsAdded = needsAddedOverride ?? config?.needsAdded ?? defaultNeedsAdded;

  return (
    <Container maxWidth="md" className="py-12">
      <div
        className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 p-8"
        role="status"
        aria-live="polite"
      >
        <h1 className="text-2xl font-bold text-text-heading-light dark:text-text-heading-dark mb-2">
          {title}
        </h1>
        <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark mb-6">
          {sprintRef ? (
            <>Under construction · {sprintRef}</>
          ) : (
            <>Under construction · Unknown sprint</>
          )}
        </p>
        <section aria-label="What needs to be added">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-tertiary-light dark:text-text-tertiary-dark mb-3">
            What needs to be added
          </h2>
          <ul className="list-disc list-inside space-y-2 text-text-secondary-light dark:text-text-secondary-dark">
            {needsAdded.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>
        {showBackLink && (
          <p className="mt-8">
            <Link
              href="/dashboard"
              className="text-marine-red dark:text-marine-red-light font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-marine-red focus:ring-offset-2 rounded"
            >
              ← Back to Dashboard
            </Link>
          </p>
        )}
      </div>
    </Container>
  );
}
