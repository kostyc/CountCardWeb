/**
 * Organizational Hierarchy Validation
 *
 * Validates parent-child relationships for org entities using constants.
 * Reused by API and services on create/update.
 */

import type { Regiment } from '@countcard/core/types/auth';
import type { Battalion, Company, Series } from '@countcard/core/validation/organizationSchemas';
import { BATTALION_COMPANIES } from '@countcard/core/constants/organizations';

export interface HierarchyValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that a company name belongs to the given battalion per constants.
 */
export function validateCompanyForBattalion(
  company: Company,
  battalion: Battalion
): HierarchyValidationResult {
  const allowed = BATTALION_COMPANIES[battalion];
  if (!allowed || !allowed.includes(company)) {
    return {
      valid: false,
      error: `Company ${company} does not belong to ${battalion} Battalion`,
    };
  }
  return { valid: true };
}

/**
 * Validate that a battalion name is valid for a regiment.
 * All battalions exist in both West and East.
 */
export function validateBattalionForRegiment(
  _battalion: Battalion,
  _regiment: Regiment
): HierarchyValidationResult {
  return { valid: true };
}

/**
 * Validate series name (Lead | Follow). No parent-based constraint.
 */
export function validateSeriesName(_series: Series): HierarchyValidationResult {
  return { valid: true };
}

/**
 * Validate platoon format (4-digit string).
 */
export function validatePlatoonFormat(platoonId: string): HierarchyValidationResult {
  if (!/^\d{4}$/.test(platoonId)) {
    return {
      valid: false,
      error: 'Platoon must be a 4-digit string',
    };
  }
  return { valid: true };
}

/**
 * Validate denormalized platoon fields match the expected hierarchy.
 * Used when creating/updating a platoon to ensure regiment/battalion/company/series
 * are consistent with the parent series chain.
 */
export function validatePlatoonDenormalizedChain(
  platoon: {
    regiment: Regiment;
    battalion: Battalion;
    company: Company;
    series?: Series;
  }
): HierarchyValidationResult {
  const companyResult = validateCompanyForBattalion(platoon.company, platoon.battalion);
  if (!companyResult.valid) return companyResult;
  return { valid: true };
}
