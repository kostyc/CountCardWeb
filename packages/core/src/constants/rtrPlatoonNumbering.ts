/**
 * RTR Platoon Numbering — United States Marine Corps Recruit Training Regiment
 *
 * Canonical platoon identity model for MCRD San Diego (West) and MCRD Parris Island (East).
 *
 * Numbering rules (standard training companies):
 * - Platoons are identified by a four-digit string (e.g. "3076").
 * - The leading digit encodes the Training Battalion: 1 = 1st RTBn, 2 = 2nd RTBn, 3 = 3rd RTBn.
 * - At MCRD Parris Island only, the 4th RTBn (female) uses the 4xxx block.
 * - Within a battalion block, each Training Company owns a contiguous sub-range.
 * - Each company runs two staggered training cycles: Lead Series and Follow Series.
 *
 * Special Training Company (STC) platoons use non-numeric designators (MRP, PCP, BMP).
 *
 * @see https://www.mcrdsd.marines.mil/graduation/graduation/public-event-schedule/
 */

import type { Regiment } from '../types/auth';
import type { Battalion, Company, Series } from '../validation/organizationSchemas';

// ---------------------------------------------------------------------------
// Enums & core types
// ---------------------------------------------------------------------------

/** MCRD installation — maps 1:1 to Recruit Training Regiment (West / East). */
export enum McrdDepot {
  SanDiego = 'SanDiego',
  ParrisIsland = 'ParrisIsland',
}

export const MCRD_DEPOT_REGIMENT: Record<McrdDepot, Regiment> = {
  [McrdDepot.SanDiego]: 'West',
  [McrdDepot.ParrisIsland]: 'East',
};

/**
 * Training company guidon color by company ordinal within a battalion.
 * 1st company = Red, 2nd = Yellow, 3rd = Blue, 4th = Green.
 */
export enum TrainingCompanyColor {
  Red = 'Red',
  Yellow = 'Yellow',
  Blue = 'Blue',
  Green = 'Green',
}

/** Lead vs Follow series — two overlapping 13-week cycles within one company. */
export enum SeriesType {
  Lead = 'Lead',
  Follow = 'Follow',
}

/**
 * STC (Special Training Company) non-numeric platoon designators.
 * Recruits in these platoons are not in a standard numbered training pipeline.
 */
export enum SpecialConditionDesignator {
  /** Medical Rehabilitation Platoon */
  MRP = 'MRP',
  /** Physical Conditioning Platoon */
  PCP = 'PCP',
  /** Behavioral Motivation Platoon */
  BMP = 'BMP',
}

export type StandardPlatoonNumber = `${number}${number}${number}${number}`;

export interface PlatoonNumberBounds {
  /** Inclusive lower bound (e.g. 1000). */
  min: number;
  /** Inclusive upper bound (e.g. 1999). */
  max: number;
}

export interface TrainingBattalionDefinition {
  battalion: Exclude<Battalion, 'Support'>;
  /** Leading digit of four-digit platoon numbers (1, 2, 3, or 4). */
  leadingDigit: 1 | 2 | 3 | 4;
  /** Full thousand-block used for battalion-level validation. */
  block: PlatoonNumberBounds;
  /**
   * Operational sub-block published on MCRD graduation schedules.
   * Platoons outside this range may still parse but are flagged as non-operational.
   */
  operationalBlock: PlatoonNumberBounds;
  /** Training companies in parade / administrative order for this depot. */
  companies: readonly Company[];
  /** Depots where this battalion exists. */
  depots: readonly McrdDepot[];
}

export interface TrainingCompanyDefinition {
  company: Company;
  battalion: Exclude<Battalion, 'Support'>;
  depot: McrdDepot | 'Both';
  /** 1-based position within the battalion (drives guidon color). */
  ordinal: 1 | 2 | 3 | 4;
  color: TrainingCompanyColor;
  /** Contiguous platoon number sub-range inside the battalion block. */
  platoonRange: PlatoonNumberBounds;
  /** Lead series occupies the lower half; Follow series the upper half. */
  seriesSplit: {
    lead: PlatoonNumberBounds;
    follow: PlatoonNumberBounds;
  };
}

export interface RtrPlatoonRecord {
  platoon: StandardPlatoonNumber;
  depot: McrdDepot;
  regiment: Regiment;
  battalion: Exclude<Battalion, 'Support'>;
  company: Company;
  color: TrainingCompanyColor;
  series: SeriesType;
  /** Pickup / training cycle label (e.g. FY26 pickup week). */
  cycleLabel: string;
  /** Typical recruit capacity for the platoon in this cycle. */
  recruitCapacity: number;
}

export interface SpecialConditionPlatoonRecord {
  designator: SpecialConditionDesignator;
  battalion: 'Support';
  company: 'STC' | 'MRP' | 'BMP';
  depot: McrdDepot | 'Both';
  description: string;
}

export type PlatoonValidationCode =
  | 'OK'
  | 'INVALID_FORMAT'
  | 'OUT_OF_BATTALION_BLOCK'
  | 'OUT_OF_COMPANY_RANGE'
  | 'BATTALION_MISMATCH'
  | 'COMPANY_MISMATCH'
  | 'SERIES_MISMATCH'
  | 'SPECIAL_CONDITION';

export interface PlatoonValidationResult {
  valid: boolean;
  code: PlatoonValidationCode;
  message?: string;
}

// ---------------------------------------------------------------------------
// Battalion blocks — leading digit = battalion
// ---------------------------------------------------------------------------

export const TRAINING_BATTALIONS: readonly TrainingBattalionDefinition[] = [
  {
    battalion: '1st',
    leadingDigit: 1,
    block: { min: 1000, max: 1999 },
    operationalBlock: { min: 1000, max: 1200 },
    companies: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    depots: [McrdDepot.SanDiego, McrdDepot.ParrisIsland],
  },
  {
    battalion: '2nd',
    leadingDigit: 2,
    block: { min: 2000, max: 2999 },
    operationalBlock: { min: 2000, max: 2300 },
    companies: ['Echo', 'Foxtrot', 'Golf', 'Hotel'],
    depots: [McrdDepot.SanDiego, McrdDepot.ParrisIsland],
  },
  {
    battalion: '3rd',
    leadingDigit: 3,
    block: { min: 3000, max: 3999 },
    operationalBlock: { min: 3000, max: 3300 },
    companies: ['India', 'Kilo', 'Lima', 'Mike'],
    depots: [McrdDepot.SanDiego, McrdDepot.ParrisIsland],
  },
] as const;

/**
 * MCRD Parris Island 4th RTBn (female) — 4xxx platoon block.
 * Companies: Oscar, November, Papa (not yet in shared `Company` enum).
 */
export const PARIS_ISLAND_FOURTH_BATTALION = {
  leadingDigit: 4 as const,
  block: { min: 4000, max: 4999 },
  operationalBlock: { min: 4000, max: 4300 },
  depot: McrdDepot.ParrisIsland,
} as const;

/** Guidon color by company ordinal within any standard training battalion. */
export const COMPANY_ORDINAL_COLOR: Record<1 | 2 | 3 | 4, TrainingCompanyColor> = {
  1: TrainingCompanyColor.Red,
  2: TrainingCompanyColor.Yellow,
  3: TrainingCompanyColor.Blue,
  4: TrainingCompanyColor.Green,
};

// ---------------------------------------------------------------------------
// Company platoon sub-ranges (equal quarters of each battalion operational block)
// ---------------------------------------------------------------------------

function splitOperationalBlock(
  battalion: Exclude<Battalion, 'Support'>,
  companies: readonly Company[],
  operational: PlatoonNumberBounds
): TrainingCompanyDefinition[] {
  const span = operational.max - operational.min + 1;
  const quarter = Math.floor(span / companies.length);

  return companies.map((company, index) => {
    const ordinal = (index + 1) as 1 | 2 | 3 | 4;
    const min = operational.min + index * quarter;
    const max = index === companies.length - 1 ? operational.max : min + quarter - 1;
    const midpoint = min + Math.floor((max - min) / 2);

    return {
      company,
      battalion,
      depot: 'Both' as const,
      ordinal,
      color: COMPANY_ORDINAL_COLOR[ordinal],
      platoonRange: { min, max },
      seriesSplit: {
        lead: { min, max: midpoint },
        follow: { min: midpoint + 1, max },
      },
    };
  });
}

/** All standard training company definitions for both depots (1st–3rd RTBn). */
export const TRAINING_COMPANIES: readonly TrainingCompanyDefinition[] = [
  ...splitOperationalBlock('1st', ['Alpha', 'Bravo', 'Charlie', 'Delta'], {
    min: 1000,
    max: 1200,
  }),
  ...splitOperationalBlock('2nd', ['Echo', 'Foxtrot', 'Golf', 'Hotel'], {
    min: 2000,
    max: 2300,
  }),
  ...splitOperationalBlock('3rd', ['India', 'Kilo', 'Lima', 'Mike'], {
    min: 3000,
    max: 3300,
  }),
];

const COMPANY_BY_KEY = new Map<string, TrainingCompanyDefinition>(
  TRAINING_COMPANIES.map((definition) => [
    `${definition.battalion}:${definition.company}`,
    definition,
  ])
);

// ---------------------------------------------------------------------------
// Regex & format constraints
// ---------------------------------------------------------------------------

/** Any valid four-digit training platoon number. */
export const STANDARD_PLATOON_REGEX = /^\d{4}$/;

/**
 * Battalion-thousand-block regex factory.
 * Alpha Company (1st RTBn) must match /^1\d{3}$/ and fall in [1000, 1999].
 */
export function battalionPlatoonRegex(leadingDigit: 1 | 2 | 3 | 4): RegExp {
  return new RegExp(`^${leadingDigit}\\d{3}$`);
}

/** Alpha Company — 1st RTBn — must be 1xxx (1000–1999). */
export const ALPHA_COMPANY_PLATOON_REGEX = battalionPlatoonRegex(1);

export const SPECIAL_CONDITION_REGEX = /^(MRP|PCP|BMP)$/;

export const ALL_SPECIAL_CONDITION_DESIGNATORS: readonly SpecialConditionDesignator[] = [
  SpecialConditionDesignator.MRP,
  SpecialConditionDesignator.PCP,
  SpecialConditionDesignator.BMP,
];

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

export function isStandardPlatoonNumber(value: string): value is StandardPlatoonNumber {
  return STANDARD_PLATOON_REGEX.test(value);
}

export function isSpecialConditionDesignator(
  value: string
): value is SpecialConditionDesignator {
  return SPECIAL_CONDITION_REGEX.test(value);
}

export function parsePlatoonNumber(value: string): number | null {
  if (!isStandardPlatoonNumber(value)) return null;
  return Number.parseInt(value, 10);
}

export function getBattalionDefinition(
  battalion: Exclude<Battalion, 'Support'>
): TrainingBattalionDefinition | undefined {
  return TRAINING_BATTALIONS.find((definition) => definition.battalion === battalion);
}

export function getTrainingCompanyDefinition(
  battalion: Exclude<Battalion, 'Support'>,
  company: Company
): TrainingCompanyDefinition | undefined {
  return COMPANY_BY_KEY.get(`${battalion}:${company}`);
}

export function getCompanyColor(
  battalion: Exclude<Battalion, 'Support'>,
  company: Company
): TrainingCompanyColor | undefined {
  return getTrainingCompanyDefinition(battalion, company)?.color;
}

/**
 * Validates that a platoon number's leading digit matches its Training Battalion.
 * Example: Alpha Company platoons must satisfy 1000 ≤ n ≤ 1999.
 */
export function validateBattalionBlock(
  platoon: string,
  battalion: Exclude<Battalion, 'Support'>
): PlatoonValidationResult {
  if (isSpecialConditionDesignator(platoon)) {
    return { valid: false, code: 'SPECIAL_CONDITION', message: 'Non-numeric STC designator' };
  }

  const definition = getBattalionDefinition(battalion);
  if (!definition) {
    return { valid: false, code: 'BATTALION_MISMATCH', message: 'Unknown battalion' };
  }

  if (!battalionPlatoonRegex(definition.leadingDigit).test(platoon)) {
    return {
      valid: false,
      code: 'INVALID_FORMAT',
      message: `Platoon must match ${definition.leadingDigit}xxx`,
    };
  }

  const numeric = parsePlatoonNumber(platoon);
  if (numeric === null) {
    return { valid: false, code: 'INVALID_FORMAT', message: 'Platoon must be four digits' };
  }

  if (numeric < definition.block.min || numeric > definition.block.max) {
    return {
      valid: false,
      code: 'OUT_OF_BATTALION_BLOCK',
      message: `Platoon must be within ${definition.block.min}-${definition.block.max}`,
    };
  }

  return { valid: true, code: 'OK' };
}

/**
 * Full assignment validator — battalion block, company sub-range, and optional series.
 */
export function validatePlatoonAssignment(input: {
  platoon: string;
  battalion: Battalion;
  company: Company;
  series?: Series | SeriesType;
}): PlatoonValidationResult {
  if (input.battalion === 'Support' || isSpecialConditionDesignator(input.platoon)) {
    if (!isSpecialConditionDesignator(input.platoon)) {
      return {
        valid: false,
        code: 'INVALID_FORMAT',
        message: 'Support/STC platoons must use MRP, PCP, or BMP',
      };
    }
    return { valid: true, code: 'OK' };
  }

  const battalionResult = validateBattalionBlock(input.platoon, input.battalion);
  if (!battalionResult.valid) return battalionResult;

  const companyDef = getTrainingCompanyDefinition(input.battalion, input.company);
  if (!companyDef) {
    return {
      valid: false,
      code: 'COMPANY_MISMATCH',
      message: `${input.company} is not a standard training company in ${input.battalion} RTBn`,
    };
  }

  const numeric = parsePlatoonNumber(input.platoon)!;
  const { min, max } = companyDef.platoonRange;
  if (numeric < min || numeric > max) {
    return {
      valid: false,
      code: 'OUT_OF_COMPANY_RANGE',
      message: `${input.company} platoons must be within ${min}-${max}`,
    };
  }

  if (input.series) {
    const series = input.series as SeriesType;
    const seriesBounds =
      series === SeriesType.Lead ? companyDef.seriesSplit.lead : companyDef.seriesSplit.follow;
    if (numeric < seriesBounds.min || numeric > seriesBounds.max) {
      return {
        valid: false,
        code: 'SERIES_MISMATCH',
        message: `${series} series platoons for ${input.company} must be within ${seriesBounds.min}-${seriesBounds.max}`,
      };
    }
  }

  return { valid: true, code: 'OK' };
}

/** Convenience: Alpha Company platoons must fall in the 1st RTBn thousand-block (1000–1999). */
export function validateAlphaCompanyPlatoon(platoon: string): PlatoonValidationResult {
  return validatePlatoonAssignment({
    platoon,
    battalion: '1st',
    company: 'Alpha',
  });
}

export function inferSeriesForPlatoon(
  platoon: string,
  battalion: Exclude<Battalion, 'Support'>,
  company: Company
): SeriesType | null {
  const companyDef = getTrainingCompanyDefinition(battalion, company);
  const numeric = parsePlatoonNumber(platoon);
  if (!companyDef || numeric === null) return null;

  if (numeric >= companyDef.seriesSplit.lead.min && numeric <= companyDef.seriesSplit.lead.max) {
    return SeriesType.Lead;
  }
  if (numeric >= companyDef.seriesSplit.follow.min && numeric <= companyDef.seriesSplit.follow.max) {
    return SeriesType.Follow;
  }
  return null;
}

export function resolveCompanyFromPlatoon(
  platoon: string,
  battalion: Exclude<Battalion, 'Support'>
): Company | null {
  const numeric = parsePlatoonNumber(platoon);
  if (numeric === null) return null;

  for (const definition of TRAINING_COMPANIES) {
    if (
      definition.battalion === battalion &&
      numeric >= definition.platoonRange.min &&
      numeric <= definition.platoonRange.max
    ) {
      return definition.company;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// STC special-condition platoons
// ---------------------------------------------------------------------------

export const SPECIAL_CONDITION_PLATOONS: readonly SpecialConditionPlatoonRecord[] = [
  {
    designator: SpecialConditionDesignator.MRP,
    battalion: 'Support',
    company: 'MRP',
    depot: 'Both',
    description: 'Medical Rehabilitation Platoon — recruits recovering from injury or illness.',
  },
  {
    designator: SpecialConditionDesignator.PCP,
    battalion: 'Support',
    company: 'STC',
    depot: 'Both',
    description: 'Physical Conditioning Platoon — recruits requiring additional PT remediation.',
  },
  {
    designator: SpecialConditionDesignator.BMP,
    battalion: 'Support',
    company: 'BMP',
    depot: 'Both',
    description: 'Behavioral Motivation Platoon — recruits requiring motivational remediation.',
  },
];

// ---------------------------------------------------------------------------
// Mock dataset — Kilo Company, 3rd RTBn, standard pickup cycle (Lead + Follow)
// ---------------------------------------------------------------------------

/**
 * Representative FY26 pickup cycle for Kilo Company (Yellow, 2nd company, 3rd RTBn).
 *
 * Platoon numbers sit in the Kilo sub-range (3075–3149) with Lead/Follow split at the midpoint.
 * Three Lead platoons and two Follow platoons mirror a typical 5-platoon company cycle.
 */
export const KILO_3RD_BATTALION_PICKUP_CYCLE: readonly RtrPlatoonRecord[] = [
  {
    platoon: '3076',
    depot: McrdDepot.SanDiego,
    regiment: 'West',
    battalion: '3rd',
    company: 'Kilo',
    color: TrainingCompanyColor.Yellow,
    series: SeriesType.Lead,
    cycleLabel: 'FY26-Pickup-W07',
    recruitCapacity: 60,
  },
  {
    platoon: '3077',
    depot: McrdDepot.SanDiego,
    regiment: 'West',
    battalion: '3rd',
    company: 'Kilo',
    color: TrainingCompanyColor.Yellow,
    series: SeriesType.Lead,
    cycleLabel: 'FY26-Pickup-W07',
    recruitCapacity: 60,
  },
  {
    platoon: '3078',
    depot: McrdDepot.SanDiego,
    regiment: 'West',
    battalion: '3rd',
    company: 'Kilo',
    color: TrainingCompanyColor.Yellow,
    series: SeriesType.Lead,
    cycleLabel: 'FY26-Pickup-W07',
    recruitCapacity: 60,
  },
  {
    platoon: '3114',
    depot: McrdDepot.SanDiego,
    regiment: 'West',
    battalion: '3rd',
    company: 'Kilo',
    color: TrainingCompanyColor.Yellow,
    series: SeriesType.Follow,
    cycleLabel: 'FY26-Pickup-W09',
    recruitCapacity: 60,
  },
  {
    platoon: '3115',
    depot: McrdDepot.SanDiego,
    regiment: 'West',
    battalion: '3rd',
    company: 'Kilo',
    color: TrainingCompanyColor.Yellow,
    series: SeriesType.Follow,
    cycleLabel: 'FY26-Pickup-W09',
    recruitCapacity: 60,
  },
] as const;

/** Assert every mock platoon satisfies the full RTR validation rules. */
export function assertKiloPickupCycleIntegrity(): boolean {
  return KILO_3RD_BATTALION_PICKUP_CYCLE.every((record) => {
    const result = validatePlatoonAssignment({
      platoon: record.platoon,
      battalion: record.battalion,
      company: record.company,
      series: record.series,
    });
    return result.valid;
  });
}
