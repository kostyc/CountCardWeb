/**
 * Company Training Day — any member assigned to the same company may set/advance T-DAY.
 */

import type { AppUser } from '../types/auth';
import { getEffectiveOrganizationalAssignment } from '../utils/effectiveOrgAssignment';

export interface CompanyScope {
  regiment?: string;
  battalion?: string;
  company?: string;
}

export function canSetCompanyTrainingDay(
  user: AppUser | null | undefined,
  target: CompanyScope
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'You must be signed in.' };
  }

  const org = getEffectiveOrganizationalAssignment(user);
  if (!org?.company || !org?.battalion || !org?.regiment) {
    return { allowed: false, reason: 'You must be assigned to a company.' };
  }

  if (
    org.regiment !== target.regiment ||
    org.battalion !== target.battalion ||
    org.company !== target.company
  ) {
    return {
      allowed: false,
      reason: 'Training Day can only be set for your assigned company.',
    };
  }

  return { allowed: true };
}
