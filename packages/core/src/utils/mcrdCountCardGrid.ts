/**
 * MCRD grid count card row seeding (Depot Order 1513.6).
 */

import { KILO_3RD_BATTALION_PICKUP_CYCLE } from '../constants/rtrPlatoonNumbering';
import type { UserRole } from '../types/auth';
import type { CountCardGridRow } from '../types/models';
import { emptyGridRow } from './countCardGrid';

const GRID_ROW_COUNT = 6;

/** Roles that edit the full company grid (all platoon rows). */
const COMPANY_GRID_ROLES = new Set<UserRole>([
  'senior_drill_instructor',
  'chief_drill_instructor',
  'company_commander',
  'company_xo',
  'company_first_sgt',
  'series_commander',
]);

export function isMcrdCountCardCompanyGridRole(role?: UserRole): boolean {
  return role != null && COMPANY_GRID_ROLES.has(role);
}

function companyPlatoonsForKilo(series?: string): string[] {
  const wantFollow = series?.toLowerCase().includes('follow');
  const filtered = KILO_3RD_BATTALION_PICKUP_CYCLE.filter((record) =>
    wantFollow ? record.series === 'Follow' : record.series === 'Lead'
  );
  return filtered.map((record) => record.platoon);
}

/**
 * Seed six grid rows based on role and org assignment.
 * - DI: single platoon from profile (read-only PLT), padded to six rows.
 * - SDI/CDI/company leadership: company platoons when known (Kilo cycle), else empty rows.
 */
export function seedMcrdCountCardRows(params: {
  company?: string;
  userPlatoon?: string;
  role?: UserRole;
  series?: string;
}): CountCardGridRow[] {
  const { company, userPlatoon, role, series } = params;

  let platoons: string[];

  if (role === 'drill_instructor') {
    platoons = userPlatoon ? [userPlatoon] : [''];
  } else if (isMcrdCountCardCompanyGridRole(role) && company === 'Kilo') {
    platoons = companyPlatoonsForKilo(series);
  } else if (isMcrdCountCardCompanyGridRole(role)) {
    platoons = userPlatoon ? [userPlatoon] : [''];
  } else {
    platoons = userPlatoon ? [userPlatoon] : [''];
  }

  while (platoons.length < GRID_ROW_COUNT) {
    platoons.push('');
  }

  return platoons.slice(0, GRID_ROW_COUNT).map((platoon) => emptyGridRow(platoon));
}
