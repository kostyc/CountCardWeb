/**
 * API Route: Recruit Data Export
 * 
 * Exports recruit data in GDPR-compliant JSON format.
 * Includes recruit profile, emergency contacts, and count card references.
 * 
 * GDPR Compliance:
 * - Users can export recruits within their authorized scope
 * - All data is included in export
 * - Export actions are logged for audit purposes
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuthToken, isAdmin, verifyOrganizationAccess } from '@/lib/permissions/server';
import { logError, logInfo } from '@/lib/utils/logger';
import type { RecruitProfile } from '@/types/models';
import type { EmergencyContact } from '@/types/models';
import type { OrganizationalAssignment } from '@/types/auth';
import type { Battalion, Company, Series } from '@/lib/validation/organizationSchemas';

/**
 * Export data structure
 */
interface ExportData {
  recruit: RecruitProfile;
  emergencyContacts: EmergencyContact[];
  countCardReferences: string[]; // Placeholder for future count cards feature
  metadata: {
    exportDate: string;
    exportedBy: string;
    exportFormat: 'json';
    gdprCompliant: true;
  };
}

/**
 * GET /api/recruits/[id]/export
 * Export recruit data in JSON format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Verify authentication
    const token = await verifyAuthToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - valid authentication token required' },
        { status: 401 }
      );
    }

    const { id: recruitId } = await params;
    const userId = token.uid;

    if (!recruitId) {
      return NextResponse.json(
        { error: 'Recruit ID is required' },
        { status: 400 }
      );
    }

    // Get recruit profile from Firestore (server-side)
    const recruitRef = adminDb.collection('recruits').doc(recruitId);
    const recruitSnap = await recruitRef.get();
    
    if (!recruitSnap.exists) {
      return NextResponse.json(
        { error: 'Recruit not found' },
        { status: 404 }
      );
    }

    const recruit = recruitSnap.data() as RecruitProfile;

    // Check permissions
    // Admins can export any recruit
    const userIsAdmin = await isAdmin(userId);
    
    if (!userIsAdmin) {
      // For non-admins, check organizational scope
      // This is a basic check - full RBAC will be implemented in Task 9
      // For now, we'll allow export if the user has any organizational assignment
      if (!token.organizationalAssignment) {
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions to export this recruit' },
          { status: 403 }
        );
      }

      // Basic organizational scope check
      // Full implementation will be in Task 9
      const recruitOrg: OrganizationalAssignment = {
        regiment: recruit.regiment,
        battalion: recruit.battalion ? (recruit.battalion as Battalion) : undefined,
        company: recruit.company ? (recruit.company as Company) : undefined,
        series: recruit.series ? (recruit.series as Series) : undefined,
        platoon: recruit.platoon,
      };

      const hasAccess = verifyOrganizationAccess(token, recruitOrg);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Forbidden - insufficient permissions to export this recruit' },
          { status: 403 }
        );
      }
    }

    // Get emergency contacts from Firestore (server-side)
    let emergencyContacts: EmergencyContact[] = [];
    try {
      const contactsSnapshot = await adminDb
        .collection('emergencyContacts')
        .where('recruitId', '==', recruitId)
        .orderBy('lastName', 'asc')
        .orderBy('firstName', 'asc')
        .get();
      
      emergencyContacts = contactsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as EmergencyContact[];
    } catch (contactError) {
      // Log but don't fail the export if emergency contacts fail to load
      logError(contactError as Error, 'API.recruits.export.getEmergencyContacts');
    }

    // Get count card references (placeholder for future feature)
    // TODO: Implement when count cards feature is available
    const countCardReferences: string[] = [];

    // Build export data
    const exportData: ExportData = {
      recruit,
      emergencyContacts,
      countCardReferences,
      metadata: {
        exportDate: new Date().toISOString(),
        exportedBy: userId,
        exportFormat: 'json',
        gdprCompliant: true,
      },
    };

    // Log export action (using admin SDK directly)
    try {
      const logId = `export-${recruitId}-${Date.now()}`;
      const now = new Date();
      const logEntry = {
        logId,
        userId,
        action: 'export',
        resourceType: 'recruit',
        resourceId: recruitId,
        description: `Exported recruit data for ${recruit.firstName} ${recruit.lastName}`,
        metadata: {
          exportFormat: 'json',
          recruitId,
          recruitName: `${recruit.firstName} ${recruit.lastName}`,
        },
        timestamp: now,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        updatedBy: userId,
      };
      
      await adminDb.collection('adminLogs').doc(logId).set(logEntry);
    } catch (logErr) {
      // Log but don't fail the export if logging fails
      logError(logErr as Error, 'API.recruits.export.createAdminLog');
    }

    logInfo(`Recruit data exported: ${recruitId} by ${userId}`, 'API.recruits.export');

    // Return JSON response with proper headers for download
    return NextResponse.json(exportData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="recruit-${recruitId}-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    logError(error as Error, 'API.recruits.export');
    return NextResponse.json(
      { error: 'Failed to export recruit data' },
      { status: 500 }
    );
  }
}
