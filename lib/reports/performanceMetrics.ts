/**
 * Server-side performance metrics: platoon/series comparison from accountability, attendance, recruit status.
 */

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ReportScope } from './scope';

export interface PerformanceMetricsRow {
  platoon: string;
  series?: string;
  company: string;
  battalion: string;
  regiment: string;
  countCardCount: number;
  totalPresent: number;
  totalAbsent: number;
  totalExcused: number;
  avgPresentRate: number;
  recruitCount: number;
  recruitActiveCount: number;
}

export interface PerformanceMetricsFilters extends ReportScope {
  startDate: string;
  endDate: string;
}

function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export async function buildPerformanceMetrics(
  filters: PerformanceMetricsFilters
): Promise<PerformanceMetricsRow[]> {
  const startDate = new Date(filters.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(filters.endDate);
  endDate.setHours(23, 59, 59, 999);

  const matchScope = (d: Record<string, unknown>) => {
    if (filters.regiment && d.regiment !== filters.regiment) return false;
    if (filters.battalion && d.battalion !== filters.battalion) return false;
    if (filters.company && d.company !== filters.company) return false;
    if (filters.series && d.series !== filters.series) return false;
    if (filters.platoon && d.platoon !== filters.platoon) return false;
    return true;
  };

  const countCardRef = adminDb
    .collection('countCards')
    .where('timestamp', '>=', toTimestamp(startDate))
    .where('timestamp', '<=', toTimestamp(endDate))
    .orderBy('timestamp', 'desc');
  const ccSnapshot = await countCardRef.limit(1000).get();

  type Key = string;
  const byPlatoon: Map<
    Key,
    {
      platoon: string;
      company: string;
      battalion: string;
      regiment: string;
      series?: string;
      countCardCount: number;
      totalPresent: number;
      totalAbsent: number;
      totalExcused: number;
      totalTotal: number;
    }
  > = new Map();

  ccSnapshot.docs.forEach((docSnap) => {
    const d = docSnap.data() as Record<string, unknown>;
    if (!matchScope(d)) return;
    const platoon = (d.platoon as string) ?? '';
    const key: Key = platoon;
    const rc = (d.recruitCounts as Record<string, number>) ?? {};
    const present = rc.present ?? 0;
    const absent = rc.absent ?? 0;
    const excused = rc.excused ?? 0;
    const total = present + absent + excused + (rc.medical ?? 0) + (rc.other ?? 0) || 1;
    const existing = byPlatoon.get(key);
    if (existing) {
      existing.countCardCount += 1;
      existing.totalPresent += present;
      existing.totalAbsent += absent;
      existing.totalExcused += excused;
      existing.totalTotal += total;
    } else {
      byPlatoon.set(key, {
        platoon,
        company: (d.company as string) ?? '',
        battalion: (d.battalion as string) ?? '',
        regiment: (d.regiment as string) ?? '',
        series: (d.series as string) ?? undefined,
        countCardCount: 1,
        totalPresent: present,
        totalAbsent: absent,
        totalExcused: excused,
        totalTotal: total,
      });
    }
  });

  const recruitsRef = adminDb.collection('recruits').orderBy('platoon', 'asc');
  const recSnapshot = await recruitsRef.limit(2000).get();
  const recruitCountByPlatoon = new Map<string, { total: number; active: number }>();
  recSnapshot.docs.forEach((docSnap) => {
    const d = docSnap.data() as Record<string, unknown>;
    if (!matchScope(d)) return;
    const platoon = (d.platoon as string) ?? '';
    const status = (d.status as string) ?? '';
    const existing = recruitCountByPlatoon.get(platoon) ?? { total: 0, active: 0 };
    existing.total += 1;
    if (status === 'active') existing.active += 1;
    recruitCountByPlatoon.set(platoon, existing);
  });

  const rows: PerformanceMetricsRow[] = [];
  byPlatoon.forEach((agg) => {
    const rec = recruitCountByPlatoon.get(agg.platoon) ?? { total: 0, active: 0 };
    const totalCount = agg.totalTotal || 1;
    const avgPresentRate = Math.round((agg.totalPresent / totalCount) * 1000) / 10;
    rows.push({
      platoon: agg.platoon,
      series: agg.series,
      company: agg.company,
      battalion: agg.battalion,
      regiment: agg.regiment,
      countCardCount: agg.countCardCount,
      totalPresent: agg.totalPresent,
      totalAbsent: agg.totalAbsent,
      totalExcused: agg.totalExcused,
      avgPresentRate,
      recruitCount: rec.total,
      recruitActiveCount: rec.active,
    });
  });

  recruitCountByPlatoon.forEach((rec, platoon) => {
    if (byPlatoon.has(platoon)) return;
    const doc = recSnapshot.docs.find((d) => (d.data() as Record<string, unknown>).platoon === platoon);
    const d = doc?.data() as Record<string, unknown> | undefined;
    rows.push({
      platoon,
      series: (d?.series as string) ?? undefined,
      company: (d?.company as string) ?? '',
      battalion: (d?.battalion as string) ?? '',
      regiment: (d?.regiment as string) ?? '',
      countCardCount: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalExcused: 0,
      avgPresentRate: 0,
      recruitCount: rec.total,
      recruitActiveCount: rec.active,
    });
  });

  rows.sort((a, b) => a.platoon.localeCompare(b.platoon));
  return rows;
}
