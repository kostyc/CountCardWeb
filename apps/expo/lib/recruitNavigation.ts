import type { Router } from 'expo-router';

/** Return to recruit profile — reliable on web where router.back() can no-op between sibling routes. */
export function returnToRecruitProfile(router: Router, recruitId?: string): void {
  if (recruitId) {
    router.replace(`/recruits/${recruitId}`);
    return;
  }
  router.replace('/(tabs)/recruits');
}
