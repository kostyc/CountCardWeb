/**
 * API Route: Admin - List Users
 * Lists users for admin role assignment (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { logError, logInfo } from '@/lib/utils/logger';
import { verifyAuthToken, isAdmin } from '@/lib/permissions/server';

/**
 * GET /api/admin/users
 * List users for admin role assignment
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    // Verify admin access
    const userIsAdmin = await isAdmin(token.uid);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }

    // Get search query parameter
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get all user profiles from Firestore
    let profilesQuery = adminDb.collection('userProfiles').limit(limit);
    
    // If search query provided, filter by name or email
    if (searchQuery) {
      // Note: Firestore doesn't support full-text search, so we'll fetch and filter client-side
      // For production, consider using Algolia or similar for better search
      const allProfiles = await adminDb.collection('userProfiles').limit(100).get();
      const profiles: any[] = [];
      
      for (const doc of allProfiles.docs) {
        const data = doc.data();
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          data.firstName?.toLowerCase().includes(searchLower) ||
          data.lastName?.toLowerCase().includes(searchLower) ||
          data.displayName?.toLowerCase().includes(searchLower) ||
          data.email?.toLowerCase().includes(searchLower);
        
        if (matchesSearch) {
          profiles.push({
            userId: doc.id,
            ...data,
          });
        }
      }
      
      // Sort by display name
      profiles.sort((a, b) => {
        const nameA = a.displayName || `${a.firstName} ${a.lastName}` || '';
        const nameB = b.displayName || `${b.firstName} ${b.lastName}` || '';
        return nameA.localeCompare(nameB);
      });

      return NextResponse.json({
        success: true,
        users: profiles.slice(0, limit),
        total: profiles.length,
      });
    }

    // Get profiles without search
    const profilesSnapshot = await profilesQuery.get();
    const profiles: any[] = [];

    for (const doc of profilesSnapshot.docs) {
      const data = doc.data();
      profiles.push({
        userId: doc.id,
        ...data,
      });
    }

    // Sort by display name
    profiles.sort((a, b) => {
      const nameA = a.displayName || `${a.firstName} ${a.lastName}` || '';
      const nameB = b.displayName || `${b.firstName} ${b.lastName}` || '';
      return nameA.localeCompare(nameB);
    });

    logInfo(`Listed ${profiles.length} users for admin`, 'API.admin.users');

    return NextResponse.json({
      success: true,
      users: profiles,
      total: profiles.length,
    });
  } catch (error) {
    logError(error as Error, 'API.admin.users');
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    );
  }
}
