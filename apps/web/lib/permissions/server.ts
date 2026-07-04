/**
 * Server-Side Permission Verification
 * Utilities for verifying roles and permissions in API routes
 */

import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { UserRole, OrganizationalAssignment } from '@/types/auth';
import { Permission } from '@countcard/core/permissions/types';
import { hasPermission, canAccessOrganizationByRole, isAdminRole } from '@countcard/core/permissions/roles';
import { logError } from '@/lib/utils/logger';

/**
 * Decoded token with custom claims
 */
export interface DecodedToken {
  uid: string;
  role?: UserRole;
  organizationalAssignment?: OrganizationalAssignment;
  [key: string]: unknown;
}

/**
 * Verify Firebase ID token from Authorization header
 * Returns decoded token with custom claims
 */
export async function verifyAuthToken(request: NextRequest): Promise<DecodedToken | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    return {
      ...decodedToken,
      role: decodedToken.role as UserRole | undefined,
      organizationalAssignment: decodedToken.organizationalAssignment as OrganizationalAssignment | undefined,
    };
  } catch (error) {
    logError(error as Error, 'lib.permissions.server.verifyAuthToken');
    return null;
  }
}

/**
 * Check if user is admin (has admin role or is in ADMIN_USER_IDS)
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(userId);
    const customClaims = user.customClaims || {};
    
    // Check if user has admin role in custom claims
    if (customClaims.role && isAdminRole(customClaims.role as UserRole)) {
      return true;
    }
    
    if (customClaims.admin === true) {
      return true;
    }

    // Check if user is in ADMIN_USER_IDS environment variable
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) || [];
    if (adminUserIds.includes(userId)) {
      return true;
    }

    return false;
  } catch (error) {
    logError(error as Error, 'lib.permissions.server.isAdmin');
    return false;
  }
}

/**
 * Verify user has a specific role
 */
export function verifyRole(token: DecodedToken | null, requiredRole: UserRole): boolean {
  if (!token || !token.role) {
    return false;
  }
  return token.role === requiredRole;
}

/**
 * Verify user has a specific permission
 */
export function verifyPermission(token: DecodedToken | null, permission: Permission): boolean {
  if (!token || !token.role) {
    return false;
  }
  return hasPermission(token.role, permission);
}

/**
 * Verify user can access a specific organization
 */
export function verifyOrganizationAccess(
  token: DecodedToken | null,
  targetOrg: OrganizationalAssignment
): boolean {
  if (!token || !token.role || !token.organizationalAssignment) {
    return false;
  }
  return canAccessOrganizationByRole(token.role, token.organizationalAssignment, targetOrg);
}

/**
 * Get user's role from token
 */
export function getTokenRole(token: DecodedToken | null): UserRole | null {
  if (!token || !token.role) {
    return null;
  }
  return token.role;
}

/**
 * Get user's organizational assignment from token
 */
export function getTokenOrganization(token: DecodedToken | null): OrganizationalAssignment | null {
  if (!token || !token.organizationalAssignment) {
    return null;
  }
  return token.organizationalAssignment;
}
