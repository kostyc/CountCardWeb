import type { Regiment, USMCRank, UserRole } from '@countcard/core/types/auth';
import { getRecruitRankSelectOptions } from '@countcard/core/constants/recruitRanks';
import { REGIMENTS, BATTALIONS, BATTALION_COMPANIES, SERIES } from '@countcard/core/constants/organizations';

export { REGIMENTS, BATTALIONS, BATTALION_COMPANIES, SERIES };

/** Recruit pay grades — E-1, E-2, E-3 only. */
export const RECRUIT_RANKS = getRecruitRankSelectOptions();

export const ENLISTED_RANKS: { value: USMCRank; label: string }[] = [
  { value: 'Sgt', label: 'Sergeant (Sgt)' },
  { value: 'SSgt', label: 'Staff Sergeant (SSgt)' },
  { value: 'GySgt', label: 'Gunnery Sergeant (GySgt)' },
  { value: 'MSgt', label: 'Master Sergeant (MSgt)' },
  { value: '1stSgt', label: 'First Sergeant (1stSgt)' },
  { value: 'MGySgt', label: 'Master Gunnery Sergeant (MGySgt)' },
  { value: 'SgtMaj', label: 'Sergeant Major (SgtMaj)' },
  { value: 'SgtMajMC', label: 'Sergeant Major of the Marine Corps (SgtMajMC)' },
];

export const OFFICER_RANKS: { value: USMCRank; label: string }[] = [
  { value: '2ndLt', label: 'Second Lieutenant (2ndLt)' },
  { value: '1stLt', label: 'First Lieutenant (1stLt)' },
  { value: 'Capt', label: 'Captain (Capt)' },
  { value: 'Maj', label: 'Major (Maj)' },
  { value: 'LtCol', label: 'Lieutenant Colonel (LtCol)' },
  { value: 'Col', label: 'Colonel (Col)' },
];

export const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'drill_instructor', label: 'Drill Instructor' },
  { value: 'senior_drill_instructor', label: 'Senior Drill Instructor' },
  { value: 'chief_drill_instructor', label: 'Chief Drill Instructor' },
  { value: 'company_first_sgt', label: 'Company 1stSgt' },
  { value: 'series_commander', label: 'Series Commander' },
  { value: 'company_xo', label: 'Company XO' },
  { value: 'company_commander', label: 'Company Commander' },
  { value: 'battalion_sgt_maj', label: 'Battalion SgtMaj' },
  { value: 'battalion_xo', label: 'Battalion XO' },
  { value: 'battalion_commander', label: 'Battalion Commander' },
];

export const REGIMENT_OPTIONS: { value: Regiment; label: string }[] = REGIMENTS.map((r) => ({
  value: r,
  label: r,
}));
