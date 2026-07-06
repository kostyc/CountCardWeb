import type { Request } from 'express';
import { adminAuth } from './admin';
import type { UserRole, OrganizationalAssignment } from '@countcard/core/types/auth';
import type { Permission } from '@countcard/core/permissions/types';
import { hasPermission, canAccessOrganizationByRole } from '@countcard/core/permissions/roles';
import { isFullAdminFromClaims } from '@countcard/core/permissions/adminAccess';

export interface DecodedToken {
  uid: string;
  email?: string;
  role?: UserRole;
  admin?: boolean;
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
      email: decodedToken.email,
      role: decodedToken.role as UserRole | undefined,
      admin: decodedToken.admin as boolean | undefined,
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
    if (
      isFullAdminFromClaims({
        email: user.email,
        role: customClaims.role as UserRole | undefined,
        admin: customClaims.admin as boolean | undefined,
      })
    ) {
      return true;
    }
    const adminUserIds = process.env.ADMIN_USER_IDS?.split(',').map((id) => id.trim()) || [];
    return adminUserIds.includes(userId);
  } catch {
    return false;
  }
}

export function verifyPermission(token: DecodedToken | null, permission: Permission): boolean {
  if (!token) return false;
  if (
    isFullAdminFromClaims({
      email: token.email,
      role: token.role,
      admin: token.admin,
    })
  ) {
    return true;
  }
  if (!token.role) return false;
  return hasPermission(token.role, permission);
}

export function verifyOrganizationAccess(
  token: DecodedToken | null,
  targetOrg: OrganizationalAssignment
): boolean {
  if (!token) return false;
  if (
    isFullAdminFromClaims({
      email: token.email,
      role: token.role,
      admin: token.admin,
    })
  ) {
    return true;
  }
  if (!token?.role || !token.organizationalAssignment) return false;
  return canAccessOrganizationByRole(token.role, token.organizationalAssignment, targetOrg);
}
