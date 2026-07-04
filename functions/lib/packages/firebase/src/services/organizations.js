"use strict";
/**
 * Organizational Structure Service
 *
 * Provides type-safe functions for organizational structure operations in Firestore.
 * Handles queries for platoons, companies, battalions, and regiments, as well as
 * organizational assignment validation and scope determination.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatoonById = getPlatoonById;
exports.getPlatoonsByOrganization = getPlatoonsByOrganization;
exports.getCompaniesByBattalion = getCompaniesByBattalion;
exports.getBattalionsByRegiment = getBattalionsByRegiment;
exports.getAllBattalions = getAllBattalions;
exports.getAllCompanies = getAllCompanies;
exports.validateOrganizationalAssignment = validateOrganizationalAssignment;
exports.getOrganizationalScopeForUser = getOrganizationalScopeForUser;
exports.getOrganizationalHierarchy = getOrganizationalHierarchy;
const firestore_1 = require("firebase/firestore");
const base_1 = require("./base");
/**
 * Collection name for platoons
 */
const PLATOONS_COLLECTION = 'platoons';
/**
 * Company assignments by battalion
 * Used for validation and organizational hierarchy queries
 */
const BATTALION_COMPANIES = {
    '1st': ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    '2nd': ['Echo', 'Foxtrot', 'Golf', 'Hotel'],
    '3rd': ['India', 'Juliet', 'Kilo', 'Mike'],
    'Support': ['STC', 'MRP', 'BMP'],
};
/**
 * Get platoon by ID
 */
async function getPlatoonById(platoonId) {
    try {
        return await (0, base_1.getDocumentById)(PLATOONS_COLLECTION, platoonId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get platoon ${platoonId}`);
    }
}
/**
 * Get platoons by organization
 */
async function getPlatoonsByOrganization(organization, pagination) {
    try {
        const constraints = [];
        // Add filters
        if (organization.regiment) {
            constraints.push((0, firestore_1.where)('regiment', '==', organization.regiment));
        }
        if (organization.battalion) {
            constraints.push((0, firestore_1.where)('battalion', '==', organization.battalion));
        }
        if (organization.company) {
            constraints.push((0, firestore_1.where)('company', '==', organization.company));
        }
        if (organization.series) {
            constraints.push((0, firestore_1.where)('series', '==', organization.series));
        }
        if (organization.platoon) {
            constraints.push((0, firestore_1.where)('platoon', '==', organization.platoon));
        }
        // Add ordering
        constraints.push((0, firestore_1.orderBy)('regiment', 'asc'));
        constraints.push((0, firestore_1.orderBy)('battalion', 'asc'));
        constraints.push((0, firestore_1.orderBy)('company', 'asc'));
        constraints.push((0, firestore_1.orderBy)('series', 'asc'));
        constraints.push((0, firestore_1.orderBy)('platoon', 'asc'));
        return await (0, base_1.queryDocuments)(PLATOONS_COLLECTION, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, 'Failed to get platoons by organization');
    }
}
/**
 * Get companies by battalion
 * Returns the list of companies that belong to a specific battalion
 */
function getCompaniesByBattalion(battalion) {
    return BATTALION_COMPANIES[battalion] || [];
}
/**
 * Get battalions by regiment
 * Returns all battalions (1st, 2nd, 3rd, Support) for a given regiment
 * Note: All battalions exist in both West and East regiments
 */
function getBattalionsByRegiment(_regiment) {
    // All battalions exist in both regiments
    return ['1st', '2nd', '3rd', 'Support'];
}
/**
 * Get all battalions
 */
function getAllBattalions() {
    return ['1st', '2nd', '3rd', 'Support'];
}
/**
 * Get all companies
 */
function getAllCompanies() {
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
function validateOrganizationalAssignment(assignment) {
    if (!assignment.battalion || !assignment.company) {
        return { valid: true }; // Partial assignments are valid
    }
    const battalion = assignment.battalion;
    const company = assignment.company;
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
function getOrganizationalScopeForUser(userRole, userAssignment) {
    // If no assignment, return empty scope (no access)
    if (!userAssignment) {
        return {};
    }
    // Base scope from user's assignment
    const scope = {
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
function getOrganizationalHierarchy(assignment) {
    const hierarchy = {
        regiment: assignment.regiment,
        battalion: assignment.battalion,
        company: assignment.company,
        series: assignment.series,
        platoon: assignment.platoon,
    };
    // Add available companies if battalion is specified
    if (assignment.battalion) {
        const battalion = assignment.battalion;
        hierarchy.companies = getCompaniesByBattalion(battalion);
    }
    // Add available battalions if regiment is specified
    if (assignment.regiment) {
        hierarchy.battalions = getBattalionsByRegiment(assignment.regiment);
    }
    return hierarchy;
}
//# sourceMappingURL=organizations.js.map