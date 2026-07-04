import type { Request } from 'express';
import { adminAuth } from './admin';
import type { UserRole, OrganizationalAssignment } from '@countcard/core/types/auth';
import type { Permission } from '@countcard/core/permissions/types';
import { hasPermission, canAccessOrganizationByRole, isAdminRole } from '@countcard/core/permissions/roles';

export interface DecodedToken {
  uid: string;
  role?: UserRole;
  organizationalAssignment?: OrganizationalAssignment;
  [key: string]: unknown;
}

export async function verifyAuthToken(req: Request): Promise<DecodedToken | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const idToken = authHeader.slice(7);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return {
      ...decodedToken,
      uid: decodedToken.uid,
      role: decodedToken.role as UserRole | undefined,
      organizationalAssignment: decodedToken.organizationalAssignment as
        | OrganizationalAssignment
        | undefined,
    };
  } catch {
    return null;
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await adminAuth.getUser(userId);
    const customClaims = user.customClaims || {};
    if (customClaims.role && isAdminRole(customClaims.role as UserRole)) return true;
    if (customClaims.admin === true) return true;
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];
    return adminUserIds.includes(userId);
  } catch {
    return false;
  }
}

export function verifyPermission(token: DecodedToken | null, permission: Permission): boolean {
  if (!token?.role) return false;
  return hasPermission(token.role, permission);
}

export function verifyOrganizationAccess(
  token: DecodedToken | null,
  targetOrg: OrganizationalAssignment
): boolean {
  if (!token?.role || !token.organizationalAssignment) return false;
  return canAccessOrganizationByRole(token.role, token.organizationalAssignment, targetOrg);
}
