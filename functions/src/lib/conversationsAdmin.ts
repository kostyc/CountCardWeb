/**
 * Admin SDK — org channel conversations (Cloud Functions API)
 */

import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '../admin';
import type { ConversationType } from '@countcard/core/validation/lifecycleSchemas';

export async function createOrgChannelConversationAdmin(params: {
  conversationType: Exclude<ConversationType, 'direct'>;
  organizationalScope: {
    regiment: string;
    battalion?: string;
    company?: string;
    series?: string;
    platoon?: string;
  };
  createdBy: string;
  title?: string;
}): Promise<string> {
  const scope = params.organizationalScope;
  let query = adminDb.collection('userProfiles').limit(100);

  if (scope.regiment) {
    query = query.where('organizationalAssignment.regiment', '==', scope.regiment);
  }
  if (scope.battalion) {
    query = query.where('organizationalAssignment.battalion', '==', scope.battalion);
  }
  if (scope.company) {
    query = query.where('organizationalAssignment.company', '==', scope.company);
  }
  if (scope.series) {
    query = query.where('organizationalAssignment.series', '==', scope.series);
  }
  if (scope.platoon) {
    query = query.where('organizationalAssignment.platoon', '==', scope.platoon);
  }

  const profiles = await query.get();
  const participantSet = new Set<string>([params.createdBy]);
  for (const doc of profiles.docs) {
    const userId = doc.data().userId ?? doc.id;
    if (userId) participantSet.add(userId);
  }
  const participants = Array.from(participantSet).slice(0, 100);

  const slug = [
    params.conversationType,
    scope.regiment,
    scope.battalion,
    scope.company,
    scope.platoon,
  ]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  const conversationId = `org-${slug}-${Date.now()}`;
  const now = Timestamp.now();
  const title = params.title ?? params.conversationType;

  await adminDb.collection('conversations').doc(conversationId).set({
    conversationId,
    conversationType: params.conversationType,
    organizationalScope: scope,
    membershipRule: 'org_role_expansion',
    participants,
    metadata: { title, conversationType: params.conversationType, organizationalScope: scope },
    createdBy: params.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  return conversationId;
}
