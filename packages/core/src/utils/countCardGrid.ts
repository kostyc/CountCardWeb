/**
 * MCRD grid count card row calculations (Depot Order 1513.6).
 */

import type { CountCardDispositionAssignments, CountCardGridRow } from '../types/models';

export const COUNT_CARD_GRID_COLUMNS = [
  'PLT',
  'T/S',
  'T/P',
  'WPN',
  'BR',
  'LD',
  'SB',
  'DENT',
  'GG',
  'OTH',
  'TOTAL',
] as const;

export type CountCardGridColumn = (typeof COUNT_CARD_GRID_COLUMNS)[number];

export const DISPOSITION_FIELDS = [
  'bedRest',
  'lightDuty',
  'sickBay',
  'dental',
  'gearGuard',
  'other',
] as const;

export type DispositionField = (typeof DISPOSITION_FIELDS)[number];

export const DISPOSITION_LABELS: Record<DispositionField, string> = {
  bedRest: 'BR',
  lightDuty: 'LD',
  sickBay: 'SB',
  dental: 'DENT',
  gearGuard: 'GG',
  other: 'OTH',
};

const ACCOUNTED_KEYS = [
  'totalPresent',
  'bedRest',
  'lightDuty',
  'sickBay',
  'dental',
  'gearGuard',
  'other',
] as const;

/** Sum of BR + LD + SB + DENT + GG + OTH (TOTAL column). */
export function computeRowTotal(row: Pick<
  CountCardGridRow,
  'bedRest' | 'lightDuty' | 'sickBay' | 'dental' | 'gearGuard' | 'other'
>): number {
  return DISPOSITION_FIELDS.reduce((sum, key) => sum + (row[key] ?? 0), 0);
}

/** T/P + BR + LD + SB + DENT + GG + OTH — must equal T/S. */
export function computeAccountedStrength(row: Pick<CountCardGridRow, (typeof ACCOUNTED_KEYS)[number]>): number {
  return ACCOUNTED_KEYS.reduce((sum, key) => sum + (row[key] ?? 0), 0);
}

export function getDispositionRecruitIds(
  assignments: CountCardDispositionAssignments | undefined
): Set<string> {
  const ids = new Set<string>();
  for (const field of DISPOSITION_FIELDS) {
    for (const id of assignments?.[field] ?? []) {
      ids.add(id);
    }
  }
  return ids;
}

export function getRecruitDispositionField(
  assignments: CountCardDispositionAssignments | undefined,
  recruitId: string
): DispositionField | null {
  if (!assignments) return null;
  for (const field of DISPOSITION_FIELDS) {
    if (assignments[field]?.includes(recruitId)) return field;
  }
  return null;
}

/** Recompute numeric columns from roster + disposition recruit selections. */
export function syncRowFromRoster(
  row: CountCardGridRow,
  rosterIds: string[],
  weaponsCount?: number | null
): CountCardGridRow {
  const assignments = row.dispositionAssignments ?? {};
  const assigned = getDispositionRecruitIds(assignments);
  const presentCount = rosterIds.filter((id) => !assigned.has(id)).length;

  const counts = Object.fromEntries(
    DISPOSITION_FIELDS.map((field) => [field, assignments[field]?.length ?? 0])
  ) as Record<DispositionField, number>;

  return withComputedRowTotal({
    ...row,
    dispositionAssignments: assignments,
    totalStrength: rosterIds.length,
    totalPresent: presentCount,
    weapons: weaponsCount ?? row.weapons,
    bedRest: counts.bedRest,
    lightDuty: counts.lightDuty,
    sickBay: counts.sickBay,
    dental: counts.dental,
    gearGuard: counts.gearGuard,
    other: counts.other,
  });
}

export function setDispositionRecruits(
  row: CountCardGridRow,
  field: DispositionField,
  recruitIds: string[],
  rosterIds: string[]
): CountCardGridRow {
  const assignments: CountCardDispositionAssignments = {
    ...row.dispositionAssignments,
  };

  for (const f of DISPOSITION_FIELDS) {
    const existing = assignments[f] ?? [];
    if (f === field) {
      assignments[f] = recruitIds;
    } else {
      assignments[f] = existing.filter((id) => !recruitIds.includes(id));
    }
  }

  return syncRowFromRoster({ ...row, dispositionAssignments: assignments }, rosterIds);
}

export function initializeRowFromRoster(
  row: CountCardGridRow,
  rosterIds: string[],
  weaponsCount?: number | null
): CountCardGridRow {
  return syncRowFromRoster(
    {
      ...row,
      dispositionAssignments: row.dispositionAssignments ?? {},
    },
    rosterIds,
    weaponsCount
  );
}

export function isDispositionField(key: string): key is DispositionField {
  return (DISPOSITION_FIELDS as readonly string[]).includes(key);
}

export function withComputedRowTotal(row: CountCardGridRow): CountCardGridRow {
  return { ...row, total: computeRowTotal(row) };
}

export function computeFooterTotals(rows: CountCardGridRow[]): CountCardGridRow {
  const sum = (fn: (r: CountCardGridRow) => number | null) =>
    rows.reduce((acc, r) => acc + (fn(r) ?? 0), 0);

  const footer: CountCardGridRow = {
    platoon: 'TOTAL',
    totalStrength: sum((r) => r.totalStrength),
    totalPresent: sum((r) => r.totalPresent),
    weapons: sum((r) => r.weapons),
    bedRest: sum((r) => r.bedRest),
    lightDuty: sum((r) => r.lightDuty),
    sickBay: sum((r) => r.sickBay),
    dental: sum((r) => r.dental),
    gearGuard: sum((r) => r.gearGuard),
    other: sum((r) => r.other),
    total: sum((r) => r.total),
  };
  return footer;
}

export function emptyGridRow(platoon = ''): CountCardGridRow {
  return {
    platoon,
    totalStrength: null,
    totalPresent: null,
    weapons: null,
    bedRest: null,
    lightDuty: null,
    sickBay: null,
    dental: null,
    gearGuard: null,
    other: null,
    total: null,
    dispositionAssignments: {},
  };
}

export function hasActiveDispositionAssignments(
  assignments: CountCardDispositionAssignments | undefined
): boolean {
  if (!assignments) return false;
  return DISPOSITION_FIELDS.some((field) => (assignments[field]?.length ?? 0) > 0);
}

export function hasDispositionAssignmentMismatch(row: CountCardGridRow): boolean {
  if (!row.dispositionAssignments) return false;
  return DISPOSITION_FIELDS.some((field) => {
    const count = row[field] ?? 0;
    const assigned = row.dispositionAssignments?.[field]?.length ?? 0;
    return count !== assigned;
  });
}

export function isGridRowEmpty(row: CountCardGridRow): boolean {
  if (row.platoon?.trim()) return false;
  const numericKeys = [
    'totalStrength',
    'totalPresent',
    'weapons',
    ...DISPOSITION_FIELDS,
  ] as const;
  const hasAssignments = DISPOSITION_FIELDS.some(
    (field) => (row.dispositionAssignments?.[field]?.length ?? 0) > 0
  );
  if (hasAssignments) return false;
  return numericKeys.every((key) => row[key] == null);
}

export interface ValidateGridRowOptions {
  /** When > 0, disposition counts must match roster recruit selections. */
  rosterSize?: number;
}

export function validateGridRow(
  row: CountCardGridRow,
  options?: ValidateGridRowOptions
): string[] {
  if (isGridRowEmpty(row)) return [];

  const errors: string[] = [];
  const label = row.platoon || '?';
  const ts = row.totalStrength ?? 0;
  const accounted = computeAccountedStrength(row);
  const rosterActive = (options?.rosterSize ?? 0) > 0;

  if (ts !== accounted) {
    errors.push(
      `Platoon ${label}: T/P+BR+LD+SB+DENT+GG+OTH (${accounted}) must total T/S (${ts})`
    );
  }

  const computedTotal = computeRowTotal(row);
  if (row.total != null && row.total !== computedTotal) {
    errors.push(`Platoon ${label}: TOTAL must equal BR+LD+SB+DENT+GG+OTH`);
  }

  if (rosterActive && row.dispositionAssignments) {
    for (const field of DISPOSITION_FIELDS) {
      const ids = row.dispositionAssignments[field] ?? [];
      const count = row[field] ?? 0;
      if (ids.length !== count) {
        errors.push(
          `Platoon ${label}: ${DISPOSITION_LABELS[field]} count (${count}) must match roster selections (${ids.length})`
        );
      }
    }

    const seen = new Set<string>();
    for (const field of DISPOSITION_FIELDS) {
      for (const id of row.dispositionAssignments[field] ?? []) {
        if (seen.has(id)) {
          errors.push(`Platoon ${label}: recruit assigned to multiple dispositions`);
          break;
        }
        seen.add(id);
      }
    }
  }

  if ((row.other ?? 0) > 0 && !row.otherComments?.trim()) {
    errors.push(`Platoon ${label}: OTH comment required when OTH > 0`);
  }

  return errors;
}
