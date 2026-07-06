/**
 * Organizational Structure Service
 * 
 * Provides type-safe functions for organizational structure operations in Firestore.
 * Handles queries for platoons, companies, battalions, and regiments, as well as
 * organizational assignment validation and scope determination.
 */

import {
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import {
  getDocumentById,
  queryDocuments,
  handleFirestoreError,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import type {
  Platoon,
  OrganizationalAssignment,
} from '@countcard/core/types/models';
import type { Regiment } from '@countcard/core/types/auth';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';

/**
 * Collection name for platoons
 */
const PLATOONS_COLLECTION = 'platoons';

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
 * Get platoon by ID
 */
export async function getPlatoonById(
  platoonId: string
): Promise<Platoon | null> {
  try {
    return await getDocumentById<Platoon>(PLATOONS_COLLECTION, platoonId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get platoon ${platoonId}`);
  }
}

/**
 * Get platoons by organization
 */
export async function getPlatoonsByOrganization(
  organization: {
    regiment?: Regiment;
    battalion?: Battalion | string;
    company?: Company | string;
    series?: Series | string;
    platoon?: string;
  },
  pagination?: PaginationOptions
): Promise<PaginationResult<Platoon>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];

    // Add filters
    if (organization.regiment) {
      constraints.push(where('regiment', '==', organization.regiment));
    }
    if (organization.battalion) {
      constraints.push(where('battalion', '==', organization.battalion));
    }
    if (organization.company) {
      constraints.push(where('company', '==', organization.company));
    }
    if (organization.series) {
      constraints.push(where('series', '==', organization.series));
    }
    if (organization.platoon) {
      constraints.push(where('platoon', '==', organization.platoon));
    }

    // Add ordering
    constraints.push(orderBy('regiment', 'asc'));
    constraints.push(orderBy('battalion', 'asc'));
    constraints.push(orderBy('company', 'asc'));
    constraints.push(orderBy('series', 'asc'));
    constraints.push(orderBy('platoon', 'asc'));

    return await queryDocuments<Platoon>(
      PLATOONS_COLLECTION,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, 'Failed to get platoons by organization');
  }
}

/**
 * Get companies by battalion
 * Returns the list of companies that belong to a specific battalion
 */
export function getCompaniesByBattalion(battalion: Battalion): Company[] {
  return BATTALION_COMPANIES[battalion] || [];
}

/**
 * Get battalions by regiment
 * Returns all battalions (1st, 2nd, 3rd, Support) for a given regiment
 * Note: All battalions exist in both West and East regiments
 */
export function getBattalionsByRegiment(_regiment: Regiment): Battalion[] {
  // All battalions exist in both regiments
  return ['1st', '2nd', '3rd', 'Support'];
}

/**
 * Get all battalions
 */
export function getAllBattalions(): Battalion[] {
  return ['1st', '2nd', '3rd', 'Support'];
}

/**
 * Get all companies
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

/**
 * Get organizational scope for user
 * Returns the organizational hierarchy that a user has access to based on their role
 * and organizational assignment. This is used for filtering queries and determining
 * what data a user can access.
 */
export function getOrganizationalScopeForUser(
  userRole: string,
  userAssignment?: OrganizationalAssignment
): {
  regiment?: Regiment;
  battalion?: Battalion | string;
  company?: Company | string;
  series?: Series | string;
  platoon?: string;
} {
  // If no assignment, return empty scope (no access)
  if (!userAssignment) {
    return {};
  }

  // Base scope from user's assignment
  const scope: {
    regiment?: Regiment;
    battalion?: Battalion | string;
    company?: Company | string;
    series?: Series | string;
    platoon?: string;
  } = {
    regiment: userAssignment.regiment,
    battalion: userAssignment.battalion,
    company: userAssignment.company,
    series: userAssignment.series,
    platoon: userAssignment.platoon,
  };

  // Role-based scope expansion
  // Higher roles can see more of the organizational structure
  switch (userRole) {
    case 'battalion_commander':
    case 'battalion_xo':
    case 'battalion_sgt_maj':
      // Battalion-level roles can see entire battalion
      // Remove company/series/platoon restrictions
      delete scope.company;
      delete scope.series;
      delete scope.platoon;
      break;

    case 'company_commander':
    case 'company_xo':
    case 'company_first_sgt':
      // Company-level roles can see entire company
      // Remove series/platoon restrictions
      delete scope.series;
      delete scope.platoon;
      break;

    case 'series_commander':
      // Series-level roles can see entire series
      // Remove platoon restrictions
      delete scope.platoon;
      break;

    case 'chief_drill_instructor':
    case 'senior_drill_instructor':
    case 'drill_instructor':
      // Platoon-level roles see only their platoon
      // Keep all restrictions
      break;

    default:
      // Unknown role - return base scope
      break;
  }

  return scope;
}

/**
 * Get organizational hierarchy
 * Returns the complete organizational structure for a given assignment
 */
export function getOrganizationalHierarchy(
  assignment: OrganizationalAssignment
): {
  regiment?: Regiment;
  battalion?: Battalion | string;
  company?: Company | string;
  series?: Series | string;
  platoon?: string;
  companies?: Company[];
  battalions?: Battalion[];
} {
  const hierarchy: {
    regiment?: Regiment;
    battalion?: Battalion | string;
    company?: Company | string;
    series?: Series | string;
    platoon?: string;
    companies?: Company[];
    battalions?: Battalion[];
  } = {
    regiment: assignment.regiment,
    battalion: assignment.battalion,
    company: assignment.company,
    series: assignment.series,
    platoon: assignment.platoon,
  };

  // Add available companies if battalion is specified
  if (assignment.battalion) {
    const battalion = assignment.battalion as Battalion;
    hierarchy.companies = getCompaniesByBattalion(battalion);
  }

  // Add available battalions if regiment is specified
  if (assignment.regiment) {
    hierarchy.battalions = getBattalionsByRegiment(assignment.regiment);
  }

  return hierarchy;
}
