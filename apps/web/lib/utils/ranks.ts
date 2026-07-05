/**
 * USMC Rank Utilities
 * 
 * Provides rank-related utilities including rank options, rank display names,
 * rank grouping (Enlisted vs Officer), and rank sorting.
 */

import type { SelectOption } from '@/components/forms/Select';
import type { RecruitRank } from '@countcard/core/constants/recruitRanks';
import {
  getRecruitRankLabel,
  getRecruitRankSelectOptions,
  isRecruitRank,
  RECRUIT_RANK_METADATA,
} from '@countcard/core/constants/recruitRanks';
import type { USMCRank } from '@/types/auth';

/**
 * Rank metadata
 */
export interface RankMetadata {
  abbreviation: USMCRank;
  fullName: string;
  payGrade: string;
  type: 'enlisted' | 'officer';
}

/**
 * Rank metadata map
 */
export const RANK_METADATA: Record<USMCRank, RankMetadata> = {
  // Enlisted Ranks (E-5 through E-9)
  Sgt: { abbreviation: 'Sgt', fullName: 'Sergeant', payGrade: 'E-5', type: 'enlisted' },
  SSgt: { abbreviation: 'SSgt', fullName: 'Staff Sergeant', payGrade: 'E-6', type: 'enlisted' },
  GySgt: { abbreviation: 'GySgt', fullName: 'Gunnery Sergeant', payGrade: 'E-7', type: 'enlisted' },
  MSgt: { abbreviation: 'MSgt', fullName: 'Master Sergeant', payGrade: 'E-8', type: 'enlisted' },
  '1stSgt': { abbreviation: '1stSgt', fullName: 'First Sergeant', payGrade: 'E-8', type: 'enlisted' },
  MGySgt: { abbreviation: 'MGySgt', fullName: 'Master Gunnery Sergeant', payGrade: 'E-9', type: 'enlisted' },
  SgtMaj: { abbreviation: 'SgtMaj', fullName: 'Sergeant Major', payGrade: 'E-9', type: 'enlisted' },
  SgtMajMC: { abbreviation: 'SgtMajMC', fullName: 'Sergeant Major of the Marine Corps', payGrade: 'E-9', type: 'enlisted' },
  // Officer Ranks (O-1 through O-6)
  '2ndLt': { abbreviation: '2ndLt', fullName: 'Second Lieutenant', payGrade: 'O-1', type: 'officer' },
  '1stLt': { abbreviation: '1stLt', fullName: 'First Lieutenant', payGrade: 'O-2', type: 'officer' },
  Capt: { abbreviation: 'Capt', fullName: 'Captain', payGrade: 'O-3', type: 'officer' },
  Maj: { abbreviation: 'Maj', fullName: 'Major', payGrade: 'O-4', type: 'officer' },
  LtCol: { abbreviation: 'LtCol', fullName: 'Lieutenant Colonel', payGrade: 'O-5', type: 'officer' },
  Col: { abbreviation: 'Col', fullName: 'Colonel', payGrade: 'O-6', type: 'officer' },
};

/**
 * Enlisted ranks (E-5 through E-9)
 */
export const ENLISTED_RANKS: USMCRank[] = [
  'Sgt',
  'SSgt',
  'GySgt',
  'MSgt',
  '1stSgt',
  'MGySgt',
  'SgtMaj',
  'SgtMajMC',
];

/**
 * Officer ranks (O-1 through O-6)
 */
export const OFFICER_RANKS: USMCRank[] = [
  '2ndLt',
  '1stLt',
  'Capt',
  'Maj',
  'LtCol',
  'Col',
];

/**
 * All ranks
 */
export const ALL_RANKS: USMCRank[] = [...ENLISTED_RANKS, ...OFFICER_RANKS];

/**
 * Get rank metadata
 */
export function getRankMetadata(rank: USMCRank): RankMetadata {
  return RANK_METADATA[rank];
}

/**
 * Get full rank name from abbreviation
 */
export function getFullRankName(rank: USMCRank): string {
  return RANK_METADATA[rank]?.fullName || rank;
}

/**
 * Get rank abbreviation from full name
 */
export function getRankAbbreviation(fullName: string): USMCRank | null {
  const entry = Object.values(RANK_METADATA).find((meta) => meta.fullName === fullName);
  return entry ? entry.abbreviation : null;
}

/**
 * Get rank options for select component (grouped by type)
 */
export function getRankOptionsGrouped(): { label: string; options: SelectOption[] }[] {
  return [
    {
      label: 'Enlisted Ranks',
      options: ENLISTED_RANKS.map((rank) => ({
        value: rank,
        label: `${rank} - ${getFullRankName(rank)}`,
      })),
    },
    {
      label: 'Officer Ranks',
      options: OFFICER_RANKS.map((rank) => ({
        value: rank,
        label: `${rank} - ${getFullRankName(rank)}`,
      })),
    },
  ];
}

/**
 * Get rank options for select component (flat list)
 */
export function getRankOptions(): SelectOption[] {
  return ALL_RANKS.map((rank) => ({
    value: rank,
    label: `${rank} - ${getFullRankName(rank)}`,
  }));
}

/**
 * Sort ranks by pay grade
 */
export function sortRanksByPayGrade(ranks: USMCRank[]): USMCRank[] {
  return [...ranks].sort((a, b) => {
    const aPayGrade = RANK_METADATA[a]?.payGrade || '';
    const bPayGrade = RANK_METADATA[b]?.payGrade || '';
    return aPayGrade.localeCompare(bPayGrade);
  });
}

/**
 * Check if rank is enlisted
 */
export function isEnlistedRank(rank: USMCRank): boolean {
  return RANK_METADATA[rank]?.type === 'enlisted';
}

/**
 * Check if rank is officer
 */
export function isOfficerRank(rank: USMCRank): boolean {
  return RANK_METADATA[rank]?.type === 'officer';
}

/**
 * Select options for recruit pay grades (E-1, E-2, E-3).
 */
export function getRecruitRankOptions(): SelectOption[] {
  return getRecruitRankSelectOptions().map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

export { isRecruitRank, getRecruitRankLabel, RECRUIT_RANK_METADATA };
export type { RecruitRank };
