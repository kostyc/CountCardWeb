import type { RecruitWeightEntry } from '../types/models';

export interface WeightChartPoint {
  entryId: string;
  weightPounds: number;
  recordedAtMs: number;
  label: string;
}

export interface RecruitWeightAnalytics {
  latest?: number;
  first?: number;
  min?: number;
  max?: number;
  changeFromFirst?: number;
  entryCount: number;
  points: WeightChartPoint[];
}

function toMillis(value: Date | { toMillis(): number } | undefined): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return value.toMillis();
}

function formatShortDate(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Build chart points from stored entries, optionally seeding a legacy profile weight.
 */
export function buildWeightChartPoints(
  entries: RecruitWeightEntry[],
  legacy?: { weightPounds: number; recordedAtMs: number }
): WeightChartPoint[] {
  const sorted = [...entries].sort((a, b) => toMillis(a.recordedAt) - toMillis(b.recordedAt));
  const points = sorted.map((entry) => {
    const recordedAtMs = toMillis(entry.recordedAt);
    return {
      entryId: entry.entryId,
      weightPounds: entry.weightPounds,
      recordedAtMs,
      label: formatShortDate(recordedAtMs),
    };
  });

  if (points.length === 0 && legacy?.weightPounds != null) {
    return [
      {
        entryId: 'legacy-profile',
        weightPounds: legacy.weightPounds,
        recordedAtMs: legacy.recordedAtMs,
        label: formatShortDate(legacy.recordedAtMs),
      },
    ];
  }

  return points;
}

export function computeRecruitWeightAnalytics(
  entries: RecruitWeightEntry[],
  legacy?: { weightPounds: number; recordedAtMs: number }
): RecruitWeightAnalytics {
  const points = buildWeightChartPoints(entries, legacy);
  if (points.length === 0) {
    return { entryCount: entries.length, points: [] };
  }

  const weights = points.map((point) => point.weightPounds);
  const first = weights[0];
  const latest = weights[weights.length - 1];

  return {
    latest,
    first,
    min: Math.min(...weights),
    max: Math.max(...weights),
    changeFromFirst: latest - first,
    entryCount: entries.length || (legacy ? 1 : 0),
    points,
  };
}

export function isAppendOnlyRecruitColumn(columnId: string): boolean {
  return columnId === 'weightPounds';
}
