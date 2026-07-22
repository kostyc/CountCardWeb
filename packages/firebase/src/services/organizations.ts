/**
 * Organizational Structure Service
 * 
 * Provides organizational assignment validation for recruit/user org fields.
 */

import type {
  OrganizationalAssignment,
} from '@countcard/core/types/models';
import type { Battalion, Company } from '@countcard/core/validation/organizationSchemas';

/**
 * Company assignments by battalion
 * Used for validation and organizational hierarchy queries
 */
const BATTALION_COMPANIES: Record<Battalion, Company[]> = {
  '1st': ['Alpha', 'Bravo', 'Charlie', 'Delta'],
  '2nd': ['Echo', 'Foxtrot', 'Golf', 'Hotel'],
  '3rd': ['India', 'Kilo', 'Lima', 'Mike'],
  'Support': ['STC', 'MRP', 'BMP', 'Receiving'],
};

/**
 * Validate organizational assignment
 * Ensures that the company belongs to the specified battalion
 */
export function validateOrganizationalAssignment(
  assignment: OrganizationalAssignment
): { valid: boolean; error?: string } {
  if (!assignment.battalion || !assignment.company) {
    return { valid: true }; // Partial assignments are valid
  }

  const battalion = assignment.battalion as Battalion;
  const company = assignment.company as Company;

  // Check if company belongs to battalion
  const validCompanies = BATTALION_COMPANIES[battalion];
  if (!validCompanies || !validCompanies.includes(company)) {
    return {
      valid: false,
      error: `Company ${company} does not belong to ${battalion} Battalion`,
    };
  }

  return { valid: true };
}
