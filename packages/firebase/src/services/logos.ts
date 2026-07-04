/**
 * Logo Service
 * 
 * Provides type-safe functions for logo operations in Firestore.
 * Handles logo metadata storage and retrieval. Actual file uploads to Firebase Storage
 * should be handled separately (e.g., in API routes or utility functions).
 */

import {
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  handleFirestoreError,
  timestampToDate,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import type {
  CompanyLogo,
  BattalionLogo,
  LogoMetadata,
  BaseEntity,
} from '@countcard/core/types/models';
import type { Regiment } from '@countcard/core/types/auth';
import type { Battalion, Company } from '@countcard/core/validation/organizationSchemas';

/**
 * Collection name for company logos
 */
const COMPANY_LOGOS_COLLECTION = 'companyLogos';

/**
 * Collection name for battalion logos
 */
const BATTALION_LOGOS_COLLECTION = 'battalionLogos';

/**
 * Company Logo Input (for creation)
 */
export interface CompanyLogoInput {
  logoId: string;
  company: Company;
  battalion: Battalion;
  regiment: Regiment;
  logoUrl: string;
  metadata: LogoMetadata;
}

/**
 * Battalion Logo Input (for creation)
 */
export interface BattalionLogoInput {
  logoId: string;
  battalion: Battalion;
  regiment: Regiment;
  logoUrl: string;
  metadata: LogoMetadata;
}

/**
 * Create company logo
 */
export async function createCompanyLogo(
  logoId: string,
  data: CompanyLogoInput,
  createdBy: string
): Promise<string> {
  try {
    const logoData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy,
      updatedBy: createdBy,
    };

    await createDocument(COMPANY_LOGOS_COLLECTION, logoId, logoData, createdBy);
    return logoId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create company logo ${logoId}`);
  }
}

/**
 * Update company logo
 */
export async function updateCompanyLogo(
  logoId: string,
  data: Partial<CompanyLogoInput>,
  updatedBy: string
): Promise<void> {
  try {
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
      updatedBy,
    };

    await updateDocument(COMPANY_LOGOS_COLLECTION, logoId, updateData, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update company logo ${logoId}`);
  }
}

/**
 * Delete company logo
 * Note: This only deletes the Firestore document. The actual file in Firebase Storage
 * should be deleted separately.
 */
export async function deleteCompanyLogo(logoId: string): Promise<void> {
  try {
    await deleteDocument(COMPANY_LOGOS_COLLECTION, logoId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to delete company logo ${logoId}`);
  }
}

/**
 * Get company logo by ID
 */
export async function getCompanyLogoById(
  logoId: string
): Promise<CompanyLogo | null> {
  try {
    const logo = await getDocumentById<BaseEntity>(
      COMPANY_LOGOS_COLLECTION,
      logoId
    ) as (CompanyLogo & BaseEntity) | null;

    if (!logo) {
      return null;
    }

    return {
      ...logo,
      createdAt: timestampToDate(logo.createdAt),
      updatedAt: timestampToDate(logo.updatedAt),
      metadata: {
        ...logo.metadata,
        uploadedAt: timestampToDate(logo.metadata.uploadedAt),
      },
    } as CompanyLogo;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get company logo ${logoId}`);
  }
}

/**
 * Get company logo by organization
 */
export async function getCompanyLogoByOrganization(
  regiment: Regiment,
  battalion: Battalion,
  company: Company
): Promise<CompanyLogo | null> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [
      where('regiment', '==', regiment),
      where('battalion', '==', battalion),
      where('company', '==', company),
      orderBy('createdAt', 'desc'),
    ];

    const result = await queryDocuments<BaseEntity & CompanyLogo>(
      COMPANY_LOGOS_COLLECTION,
      constraints,
      { pageSize: 1 }
    );

    if (result.items.length === 0) {
      return null;
    }

    const logo = result.items[0];
    return {
      ...logo,
      createdAt: timestampToDate(logo.createdAt),
      updatedAt: timestampToDate(logo.updatedAt),
      metadata: {
        ...logo.metadata,
        uploadedAt: timestampToDate(logo.metadata.uploadedAt),
      },
    } as CompanyLogo;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get company logo for ${regiment}/${battalion}/${company}`);
  }
}

/**
 * Create battalion logo
 */
export async function createBattalionLogo(
  logoId: string,
  data: BattalionLogoInput,
  createdBy: string
): Promise<string> {
  try {
    const logoData = {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy,
      updatedBy: createdBy,
    };

    await createDocument(BATTALION_LOGOS_COLLECTION, logoId, logoData, createdBy);
    return logoId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create battalion logo ${logoId}`);
  }
}

/**
 * Update battalion logo
 */
export async function updateBattalionLogo(
  logoId: string,
  data: Partial<BattalionLogoInput>,
  updatedBy: string
): Promise<void> {
  try {
    const updateData = {
      ...data,
      updatedAt: Timestamp.now(),
      updatedBy,
    };

    await updateDocument(BATTALION_LOGOS_COLLECTION, logoId, updateData, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update battalion logo ${logoId}`);
  }
}

/**
 * Delete battalion logo
 * Note: This only deletes the Firestore document. The actual file in Firebase Storage
 * should be deleted separately.
 */
export async function deleteBattalionLogo(logoId: string): Promise<void> {
  try {
    await deleteDocument(BATTALION_LOGOS_COLLECTION, logoId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to delete battalion logo ${logoId}`);
  }
}

/**
 * Get battalion logo by ID
 */
export async function getBattalionLogoById(
  logoId: string
): Promise<BattalionLogo | null> {
  try {
    const logo = await getDocumentById<BaseEntity & BattalionLogo>(
      BATTALION_LOGOS_COLLECTION,
      logoId
    );

    if (!logo) {
      return null;
    }

    return {
      ...logo,
      createdAt: timestampToDate(logo.createdAt),
      updatedAt: timestampToDate(logo.updatedAt),
      metadata: {
        ...logo.metadata,
        uploadedAt: timestampToDate(logo.metadata.uploadedAt),
      },
    } as BattalionLogo;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get battalion logo ${logoId}`);
  }
}

/**
 * Get battalion logo by organization
 */
export async function getBattalionLogoByOrganization(
  regiment: Regiment,
  battalion: Battalion
): Promise<BattalionLogo | null> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [
      where('regiment', '==', regiment),
      where('battalion', '==', battalion),
      orderBy('createdAt', 'desc'),
    ];

    const result = await queryDocuments<BaseEntity & BattalionLogo>(
      BATTALION_LOGOS_COLLECTION,
      constraints,
      { pageSize: 1 }
    );

    if (result.items.length === 0) {
      return null;
    }

    const logo = result.items[0];
    return {
      ...logo,
      createdAt: timestampToDate(logo.createdAt),
      updatedAt: timestampToDate(logo.updatedAt),
      metadata: {
        ...logo.metadata,
        uploadedAt: timestampToDate(logo.metadata.uploadedAt),
      },
    } as BattalionLogo;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get battalion logo for ${regiment}/${battalion}`);
  }
}
