/**
 * Server-side attendance report builder.
 * Derives attendance from count cards: aggregate recruitCounts by (platoon, date).
 * Uses final_approval or consolidated count cards; one row per platoon per day.
 */

import { adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ReportScope } from './scope';

export interface AttendanceReportRow {
  platoon: string;
  date: string;
  company: string;
  battalion: string;
  regiment: string;
  present: number;
  absent: number;
  excused: number;
  medical: number;
  other: number;
  total: number;
  presentRate: number;
  absentRate: number;
  excusedRate: number;
  countCardCount: number;
}

export interface AttendanceReportFilters extends ReportScope {
  startDate: string;
  endDate: string;
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

export async function buildAttendanceReport(
  filters: AttendanceReportFilters
): Promise<AttendanceReportRow[]> {
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
  const matchScope = (d: Record<string, unknown>) => {
    if (filters.regiment && d.regiment !== filters.regiment) return false;
    if (filters.battalion && d.battalion !== filters.battalion) return false;
    if (filters.company && d.company !== filters.company) return false;
    if (filters.series && d.series !== filters.series) return false;
    if (filters.platoon && d.platoon !== filters.platoon) return false;
    if (filters.workflowState && d.workflowState !== filters.workflowState) return false;
    return true;
  };

  type Key = string;
  const byPlatoonDate: Map<Key, { present: number; absent: number; excused: number; medical: number; other: number; total: number; count: number; company: string; battalion: string; regiment: string }> = new Map();

  snapshot.docs.forEach((docSnap) => {
    const d = docSnap.data() as Record<string, unknown>;
    if (!matchScope(d)) return;
    const platoon = (d.platoon as string) ?? '';
    const ts = d.timestamp as Timestamp | undefined;
    const dateStr = ts && typeof (ts as Timestamp).toDate === 'function'
      ? (ts as Timestamp).toDate().toISOString().slice(0, 10)
      : filters.startDate;
    const key: Key = `${platoon}|${dateStr}`;
    const counts = sumRecruitCounts(d.recruitCounts as Record<string, number> | undefined);
    const existing = byPlatoonDate.get(key);
    if (existing) {
      existing.present += counts.present;
      existing.absent += counts.absent;
      existing.excused += counts.excused;
      existing.medical += counts.medical;
      existing.other += counts.other;
      existing.total += counts.total;
      existing.count += 1;
    } else {
      byPlatoonDate.set(key, {
        present: counts.present,
        absent: counts.absent,
        excused: counts.excused,
        medical: counts.medical,
        other: counts.other,
        total: counts.total,
        count: 1,
        company: (d.company as string) ?? '',
        battalion: (d.battalion as string) ?? '',
        regiment: (d.regiment as string) ?? '',
      });
    }
  });

  const rows: AttendanceReportRow[] = [];
  byPlatoonDate.forEach((agg, key) => {
    const [platoon, date] = key.split('|');
    const total = agg.total || 1;
    rows.push({
      platoon,
      date,
      company: agg.company,
      battalion: agg.battalion,
      regiment: agg.regiment,
      present: agg.present,
      absent: agg.absent,
      excused: agg.excused,
      medical: agg.medical,
      other: agg.other,
      total: agg.total,
      presentRate: Math.round((agg.present / total) * 1000) / 10,
      absentRate: Math.round((agg.absent / total) * 1000) / 10,
      excusedRate: Math.round((agg.excused / total) * 1000) / 10,
      countCardCount: agg.count,
    });
  });

  rows.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return a.platoon.localeCompare(b.platoon);
  });
  return rows;
}
