import type { Company } from '../validation/organizationSchemas';
import type { RecruitProfile } from '../types/models';

/** Section title for recruits missing or with unknown company (battalion column view). */
export const UNASSIGNED_RECRUIT_COMPANY = 'Unassigned';

export interface RecruitCompanySection<T extends RecruitProfile = RecruitProfile> {
  title: string;
  company: string;
  data: T[];
}

/**
 * Group recruits under battalion companies. Recruits without a matching company
 * land in an "Unassigned" section so imports are not invisible in column view.
 */
export function buildRecruitCompanySections<T extends RecruitProfile>(
  recruits: T[],
  battalionCompanies: Company[]
): RecruitCompanySection<T>[] {
  const grouped: Record<string, T[]> = {};
  for (const company of battalionCompanies) {
    grouped[company] = [];
  }

  const unassigned: T[] = [];
  for (const recruit of recruits) {
    const company = recruit.company;
    if (company && grouped[company]) {
      grouped[company].push(recruit);
    } else {
      unassigned.push(recruit);
    }
  }

  const sectionCompanies: string[] = [];
  if (unassigned.length > 0) {
    sectionCompanies.push(UNASSIGNED_RECRUIT_COMPANY);
    grouped[UNASSIGNED_RECRUIT_COMPANY] = unassigned;
  }
  sectionCompanies.push(...battalionCompanies);

  return sectionCompanies.map((company) => ({
    title: company,
    company,
    data: grouped[company] ?? [],
  }));
}
