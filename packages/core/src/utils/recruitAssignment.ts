import type { Company } from '../validation/organizationSchemas';
import type { RecruitProfile } from '../types/models';

/**
 * True when a recruit lacks company/platoon assignment or company is outside the battalion roster.
 */
export function isRecruitOrgUnassigned(
  recruit: RecruitProfile,
  battalionCompanies?: Company[]
): boolean {
  const company = recruit.company?.trim();
  const platoon = recruit.platoon?.trim();
  if (!company || !platoon) return true;
  if (
    battalionCompanies &&
    battalionCompanies.length > 0 &&
    !battalionCompanies.includes(company as Company)
  ) {
    return true;
  }
  return false;
}

/**
 * Place unassigned recruits before assigned recruits while preserving relative order within each group.
 */
export function prioritizeUnassignedRecruits<T extends RecruitProfile>(
  recruits: T[],
  battalionCompanies?: Company[]
): T[] {
  const unassigned: T[] = [];
  const assigned: T[] = [];
  for (const recruit of recruits) {
    if (isRecruitOrgUnassigned(recruit, battalionCompanies)) {
      unassigned.push(recruit);
    } else {
      assigned.push(recruit);
    }
  }
  return [...unassigned, ...assigned];
}
