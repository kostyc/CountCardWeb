/**
 * Organizational Constants
 * 
 * Defines organizational structure constants including regiments, battalions,
 * companies, series, and validation rules for the USMC recruit training structure.
 */

import type { Regiment } from '@/types/auth';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';

/**
 * Regiment options
 */
export const REGIMENTS: Regiment[] = ['West', 'East'];

/**
 * Battalion options
 */
export const BATTALIONS: Battalion[] = ['1st', '2nd', '3rd', 'Support'];

/**
 * Company assignments by battalion
 * 
 * Standard USMC Recruit Training Battalion structure:
 * - 1st Battalion: Alpha, Bravo, Charlie, Delta Companies
 * - 2nd Battalion: Echo, Foxtrot, Golf, Hotel Companies
 * - 3rd Battalion: India, Juliet, Kilo, Mike Companies
 * - Support Battalion: STC, MRP, BMP Companies
 */
export const BATTALION_COMPANIES: Record<Battalion, Company[]> = {
  '1st': ['Alpha', 'Bravo', 'Charlie', 'Delta'],
  '2nd': ['Echo', 'Foxtrot', 'Golf', 'Hotel'],
  '3rd': ['India', 'Juliet', 'Kilo', 'Mike'],
  'Support': ['STC', 'MRP', 'BMP'],
};

/**
 * Series options
 */
export const SERIES: Series[] = ['Lead', 'Follow'];

/**
 * Platoon format validation regex
 * Platoon must be a 4-digit string (e.g., "2001")
 */
export const PLATOON_FORMAT_REGEX = /^\d{4}$/;

/**
 * Platoon format validation function
 * @param platoon - Platoon string to validate
 * @returns true if platoon format is valid
 */
export function isValidPlatoonFormat(platoon: string): boolean {
  return PLATOON_FORMAT_REGEX.test(platoon);
}

/**
 * Get companies for a specific battalion
 * @param battalion - Battalion identifier
 * @returns Array of companies for the battalion
 */
export function getCompaniesByBattalion(battalion: Battalion): Company[] {
  return BATTALION_COMPANIES[battalion] || [];
}

/**
 * Get battalion for a specific company
 * @param company - Company identifier
 * @returns Battalion that the company belongs to, or null if not found
 */
export function getBattalionForCompany(company: Company): Battalion | null {
  for (const [battalion, companies] of Object.entries(BATTALION_COMPANIES)) {
    if (companies.includes(company)) {
      return battalion as Battalion;
    }
  }
  return null;
}

/**
 * Validate that a company belongs to a battalion
 * @param company - Company identifier
 * @param battalion - Battalion identifier
 * @returns true if company belongs to battalion
 */
export function validateCompanyBattalion(company: Company, battalion: Battalion): boolean {
  const companies = BATTALION_COMPANIES[battalion];
  return companies ? companies.includes(company) : false;
}

/**
 * Get all companies across all battalions
 * @returns Array of all companies
 */
export function getAllCompanies(): Company[] {
  return [
    ...BATTALION_COMPANIES['1st'],
    ...BATTALION_COMPANIES['2nd'],
    ...BATTALION_COMPANIES['3rd'],
    ...BATTALION_COMPANIES['Support'],
  ];
}

/**
 * East Coast battalion logo paths (public assets).
 * Keys match Battalion type; paths are under /BattalionLogos/EastCoast/.
 */
export const BATTALION_LOGO_PATHS: Record<Battalion, string> = {
  '1st': '/BattalionLogos/EastCoast/1stRtbn.jpg',
  '2nd': '/BattalionLogos/EastCoast/2ndRtbn.jpg',
  '3rd': '/BattalionLogos/EastCoast/3rdRtBn.jpg',
  Support: '/BattalionLogos/EastCoast/SptBn.PNG',
};

/**
 * Get battalion logo path for a given battalion.
 * @param battalion - Battalion identifier
 * @returns Public URL path for the logo, or undefined if not found
 */
export function getBattalionLogoPath(battalion: Battalion | string | undefined): string | undefined {
  if (!battalion || !isBattalion(battalion)) return undefined;
  return BATTALION_LOGO_PATHS[battalion as Battalion];
}

/** Type guard for Battalion */
function isBattalion(s: string): s is Battalion {
  return BATTALIONS.includes(s as Battalion);
}
