/**
 * Conversation Service
 * 
 * Provides type-safe functions for conversation and message operations in Firestore.
 * Handles conversation creation, message sending, and org channel creation.
 * Adapted from AIChatModel reference implementation.
 */

import {
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../instance';
import {
  updateDocument,
  handleFirestoreError,
  addBaseEntityFields,
  updateBaseEntityFields,
} from './base';
import type {
  MessageStatus,
} from '@countcard/core/types/models';

/**
 * Collection name for conversations
 */
const CONVERSATIONS_COLLECTION = 'conversations';

/**
 * Subcollection name for messages
 */
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Conversation Input (for creation)
 */
export interface ConversationInput {
  conversationId: string;
  participants: string[];
  lastMessageAt?: Date | Timestamp;
  lastMessageContent?: string;
  lastMessageSenderId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Conversation Update (for updates)
 */
export interface ConversationUpdate {
  conversationId: string;
  lastMessageAt?: Date | Timestamp;
  lastMessageContent?: string;
  lastMessageSenderId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Message Input (for creation)
 */
export interface MessageInput {
  messageId: string;
  conversationId: string;
  senderId: string;
  content: string;
  status?: MessageStatus;
  sentAt?: Date | Timestamp;
  replyToMessageId?: string;
  attachments?: Array<{
    attachmentId: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    uploadedAt: Date | Timestamp;
  }>;
}

/**
 * Message Update (for updates)
 */
export interface MessageUpdate {
  messageId: string;
  conversationId: string;
  status?: MessageStatus;
  deliveredAt?: Date | Timestamp;
  readAt?: Date | Timestamp;
  reactions?: Array<{
    userId: string;
    reaction: string;
    reactedAt: Date | Timestamp;
  }>;
}

/**
 * Create conversation
 */
export async function createConversation(
  conversationId: string,
  data: ConversationInput,
  createdBy: string
): Promise<string> {
  try {
    const conversationData = addBaseEntityFields(data as unknown as Record<string, unknown>, createdBy);
    const docRef = doc(getDb(), CONVERSATIONS_COLLECTION, conversationId);
    await setDoc(docRef, conversationData);
    return conversationId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to create conversation ${conversationId}`);
  }
}

/**
 * Update conversation
 */
export async function updateConversation(
  conversationId: string,
  data: ConversationUpdate,
  updatedBy: string
): Promise<void> {
  try {
    const updateData = updateBaseEntityFields(data as unknown as Partial<Record<string, unknown>>, updatedBy);
    await updateDocument(CONVERSATIONS_COLLECTION, conversationId, updateData, updatedBy);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update conversation ${conversationId}`);
  }
}

/**
 * Send message
 * Creates a message in the conversation's messages subcollection
 */
export async function sendMessage(
  conversationId: string,
  messageId: string,
  data: MessageInput,
  createdBy: string
): Promise<string> {
  try {
    const now = Timestamp.now();
    const messageData = {
      ...data,
      messageId,
      conversationId,
      status: data.status || 'sent',
      sentAt: data.sentAt || now,
      ...addBaseEntityFields({}, createdBy),
    };

    // Create message in subcollection
    const messageRef = doc(
      getDb(),
      CONVERSATIONS_COLLECTION,
      conversationId,
      MESSAGES_SUBCOLLECTION,
      messageId
    );
    await setDoc(messageRef, messageData);

    // Update conversation with last message info
    await updateConversation(
      conversationId,
      {
        conversationId,
        lastMessageAt: now,
        lastMessageContent: data.content,
        lastMessageSenderId: data.senderId,
      },
      createdBy
    );

    return messageId;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to send message ${messageId} in conversation ${conversationId}`);
  }
}

/**
 * Create org-scoped channel (platoon, company, battalion broadcast)
 */
export async function createOrgChannelConversation(params: {
  conversationType: 'platoon_channel' | 'company_channel' | 'battalion_broadcast';
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
  const { getUsersByOrganization } = await import('./userProfiles');
  const scope = params.organizationalScope;
  const orgFilter = {
    regiment: scope.regiment as 'West' | 'East',
    battalion: scope.battalion as import('@countcard/core/validation/organizationSchemas').Battalion | undefined,
    company: scope.company as import('@countcard/core/validation/organizationSchemas').Company | undefined,
    series: scope.series as import('@countcard/core/validation/organizationSchemas').Series | undefined,
    platoon: scope.platoon,
  };

  const result = await getUsersByOrganization(orgFilter, { pageSize: 100 });
  const participantSet = new Set<string>([params.createdBy]);
  for (const profile of result.items) {
    if (profile.userId) participantSet.add(profile.userId);
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

  await createConversation(
    conversationId,
    {
      conversationId,
      participants,
      metadata: { title: params.title ?? params.conversationType },
    },
    params.createdBy
  );

  await updateConversation(
    conversationId,
    {
      conversationId,
      metadata: {
        title: params.title ?? params.conversationType,
        conversationType: params.conversationType,
        organizationalScope: scope,
        membershipRule: 'org_role_expansion',
      },
    },
    params.createdBy
  );

  const docRef = doc(getDb(), CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(docRef, {
    conversationType: params.conversationType,
    organizationalScope: scope,
    membershipRule: 'org_role_expansion',
  });

  return conversationId;
}
