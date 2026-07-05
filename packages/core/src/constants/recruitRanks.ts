/**
 * Recruit pay grades — E-1 through E-3 only.
 */

import { z } from 'zod';

export const RECRUIT_RANKS = ['E-1', 'E-2', 'E-3'] as const;

export type RecruitRank = (typeof RECRUIT_RANKS)[number];

export const DEFAULT_RECRUIT_RANK: RecruitRank = 'E-1';

export interface RecruitRankMetadata {
  payGrade: RecruitRank;
  fullName: string;
  abbreviation: string;
}

export const RECRUIT_RANK_METADATA: Record<RecruitRank, RecruitRankMetadata> = {
  'E-1': { payGrade: 'E-1', fullName: 'Private', abbreviation: 'Pvt' },
  'E-2': { payGrade: 'E-2', fullName: 'Private First Class', abbreviation: 'PFC' },
  'E-3': { payGrade: 'E-3', fullName: 'Lance Corporal', abbreviation: 'LCpl' },
};

export const recruitRankSchema = z.enum(RECRUIT_RANKS);

export function isRecruitRank(value: string): value is RecruitRank {
  return (RECRUIT_RANKS as readonly string[]).includes(value);
}

export function getRecruitRankLabel(rank: RecruitRank): string {
  const meta = RECRUIT_RANK_METADATA[rank];
  return `${rank} (${meta.fullName})`;
}

export function getRecruitRankSelectOptions(): { value: RecruitRank; label: string }[] {
  return RECRUIT_RANKS.map((rank) => ({
    value: rank,
    label: getRecruitRankLabel(rank),
  }));
}

/** Map spreadsheet / OCR rank text to E-1, E-2, or E-3. */
export function normalizeRecruitRank(raw: string): RecruitRank | null {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!normalized) return null;

  if (isRecruitRank(normalized)) return normalized;

  if (normalized === 'E1' || normalized === 'PVT' || normalized === 'PRIVATE') return 'E-1';
  if (
    normalized === 'E2' ||
    normalized === 'PFC' ||
    normalized.includes('PRIVATE FIRST') ||
    normalized.includes('PRIVATE 1ST')
  ) {
    return 'E-2';
  }
  if (normalized === 'E3' || normalized === 'LCPL' || normalized.includes('LANCE CORP')) {
    return 'E-3';
  }

  return null;
}
