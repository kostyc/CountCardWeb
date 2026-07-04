/**
 * Server-side accountability report builder.
 * Aggregates count card data by date range and org for display/export.
 */

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ReportScope } from './scope';

export interface AccountabilityReportRow {
  countCardId: string;
  timestamp: string;
  platoon: string;
  company: string;
  battalion: string;
  regiment: string;
  status: string;
  workflowState: string;
  present: number;
  absent: number;
  excused: number;
  medical: number;
  other: number;
  total: number;
  location: string;
}

export interface AccountabilityReportFilters extends ReportScope {
  startDate: string;
  endDate: string;
  status?: string;
  workflowState?: string;
}

function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function sumRecruitCounts(recruitCounts: Record<string, number> | undefined): {
  present: number;
  absent: number;
  excused: number;
  medical: number;
  other: number;
  total: number;
} {
  const present = recruitCounts?.present ?? 0;
  const absent = recruitCounts?.absent ?? 0;
  const excused = recruitCounts?.excused ?? 0;
  const medical = recruitCounts?.medical ?? 0;
  const other = recruitCounts?.other ?? 0;
  const total = present + absent + excused + medical + other;
  return { present, absent, excused, medical, other, total };
}

export async function buildAccountabilityReport(
  filters: AccountabilityReportFilters
): Promise<AccountabilityReportRow[]> {
  const startDate = new Date(filters.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(filters.endDate);
  endDate.setHours(23, 59, 59, 999);

  let ref = adminDb
    .collection('countCards')
    .where('timestamp', '>=', toTimestamp(startDate))
    .where('timestamp', '<=', toTimestamp(endDate))
    .orderBy('timestamp', 'desc');

  const snapshot = await ref.limit(1000).get();
  const rows: AccountabilityReportRow[] = [];

  const matchScope = (d: Record<string, unknown>) => {
    if (filters.regiment && d.regiment !== filters.regiment) return false;
    if (filters.battalion && d.battalion !== filters.battalion) return false;
    if (filters.company && d.company !== filters.company) return false;
    if (filters.series && d.series !== filters.series) return false;
    if (filters.platoon && d.platoon !== filters.platoon) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (filters.workflowState && d.workflowState !== filters.workflowState) return false;
    return true;
  };

  snapshot.docs.forEach((docSnap) => {
    const d = docSnap.data() as Record<string, unknown>;
    if (!matchScope(d)) return;
    const ts = d.timestamp as Timestamp | undefined;
    const counts = sumRecruitCounts(d.recruitCounts as Record<string, number> | undefined);
    rows.push({
      countCardId: docSnap.id,
      timestamp: ts && typeof (ts as Timestamp).toDate === 'function' ? (ts as Timestamp).toDate().toISOString() : filters.startDate,
      platoon: (d.platoon as string) ?? '',
      company: (d.company as string) ?? '',
      battalion: (d.battalion as string) ?? '',
      regiment: (d.regiment as string) ?? '',
      status: (d.status as string) ?? '',
      workflowState: (d.workflowState as string) ?? '',
      present: counts.present,
      absent: counts.absent,
      excused: counts.excused,
      medical: counts.medical,
      other: counts.other,
      total: counts.total,
      location: (d.location as string) ?? '',
    });
  });

  return rows;
}
