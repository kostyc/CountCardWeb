import { normalizeEdipiDigits } from './recruitEdipi';

type RecruitSearchFields = {
  firstName?: string;
  lastName?: string;
  edipi?: string;
  recruitId?: string;
};

function getRecruitEdipiDigits(recruit: RecruitSearchFields): string {
  if (recruit.edipi?.trim()) {
    return normalizeEdipiDigits(recruit.edipi);
  }
  const id = recruit.recruitId ?? '';
  if (id.startsWith('edipi-')) {
    return id.slice(5);
  }
  return '';
}

/** Match recruit list search by name prefix or EDIPI prefix (digits only). */
export function matchesRecruitSearch(recruit: RecruitSearchFields, searchTerm: string): boolean {
  const term = searchTerm.trim();
  if (!term) return true;

  const termLower = term.toLowerCase();
  const firstName = (recruit.firstName ?? '').toLowerCase();
  const lastName = (recruit.lastName ?? '').toLowerCase();

  if (lastName.startsWith(termLower) || firstName.startsWith(termLower)) {
    return true;
  }

  const fullName = `${firstName} ${lastName}`.trim();
  if (fullName.includes(termLower)) {
    return true;
  }

  const termDigits = normalizeEdipiDigits(term);
  if (termDigits.length === 0) {
    return false;
  }

  const edipiDigits = getRecruitEdipiDigits(recruit);
  return edipiDigits.startsWith(termDigits);
}
