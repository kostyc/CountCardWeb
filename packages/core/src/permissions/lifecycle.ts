import type { AppUser } from '../types/auth';
import type { RecruitProfile } from '../types/models';
import { isTrainingCustodyPhase } from '../constants/custodyPhase';
import { canEditRecruit } from './recruits';

export function canEditRecruitProgress(user: AppUser | null, recruit: RecruitProfile): boolean {
  if (!user) return false;
  const editCheck = canEditRecruit(user, recruit);
  if (!editCheck.allowed) return false;
  return recruit.custodyPhase == null || isTrainingCustodyPhase(recruit.custodyPhase);
}
