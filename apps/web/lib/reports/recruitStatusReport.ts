/**
 * Server-side recruit status report builder.
 * Lists recruits with status, rank, org; filters by scope, status, rank.
 * PII: names masked for report (e.g. "Last, F.").
 */

import { adminDb } from '@/lib/firebase/admin';
import type { ReportScope } from './scope';

export interface RecruitStatusReportRow {
  recruitId: string;
  displayName: string;
  rank: string;
  status: string;
  platoon: string;
  company: string;
  battalion: string;
  regiment: string;
  series: string;
}

export interface RecruitStatusReportFilters extends ReportScope {
  status?: string;
  rank?: string;
}

function maskName(firstName: string | undefined, lastName: string | undefined): string {
  const last = (lastName ?? '').trim();
  const first = (firstName ?? '').trim();
  if (!last && !first) return '—';
  if (!first) return `${last}, —`;
  return `${last}, ${first.charAt(0)}.`;
}

export async function buildRecruitStatusReport(
  filters: RecruitStatusReportFilters
): Promise<RecruitStatusReportRow[]> {
  let ref = adminDb.collection('recruits').orderBy('platoon', 'asc').orderBy('status', 'asc');

  const snapshot = await ref.limit(2000).get();
  const matchScope = (d: Record<string, unknown>) => {
    if (filters.regiment && d.regiment !== filters.regiment) return false;
    if (filters.battalion && d.battalion !== filters.battalion) return false;
    if (filters.company && d.company !== filters.company) return false;
    if (filters.series && d.series !== filters.series) return false;
    if (filters.platoon && d.platoon !== filters.platoon) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (filters.rank && d.rank !== filters.rank) return false;
    return true;
  };

  const rows: RecruitStatusReportRow[] = [];
  snapshot.docs.forEach((docSnap) => {
    const d = docSnap.data() as Record<string, unknown>;
    if (!matchScope(d)) return;
    const firstName = d.firstName as string | undefined;
    const lastName = d.lastName as string | undefined;
    rows.push({
      recruitId: docSnap.id,
      displayName: maskName(firstName, lastName),
      rank: (d.rank as string) ?? '',
      status: (d.status as string) ?? '',
      platoon: (d.platoon as string) ?? '',
      company: (d.company as string) ?? '',
      battalion: (d.battalion as string) ?? '',
      regiment: (d.regiment as string) ?? '',
      series: (d.series as string) ?? '',
    });
  });

  return rows;
}

/**
 * Aggregate recruit count by status for distribution chart.
 */
export async function buildRecruitStatusDistribution(
  filters: RecruitStatusReportFilters
): Promise<{ status: string; count: number }[]> {
  const rows = await buildRecruitStatusReport(filters);
  const byStatus = new Map<string, number>();
  rows.forEach((r) => {
    const s = r.status || 'Unknown';
    byStatus.set(s, (byStatus.get(s) ?? 0) + 1);
  });
  return Array.from(byStatus.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}
