import type { RecruitProfile } from '../types/models';

/** Standard recruit name for lists (matches Expo recruits screen). */
export function formatRecruitListName(
  recruit: Pick<RecruitProfile, 'rank' | 'lastName' | 'firstName'>
): string {
  return `${recruit.rank} ${recruit.lastName}, ${recruit.firstName}`;
}

export function countRecruitsWithWeapons(recruits: Pick<RecruitProfile, 'weaponsSerialNumber'>[]): number {
  return recruits.filter((r) => r.weaponsSerialNumber?.trim()).length;
}
