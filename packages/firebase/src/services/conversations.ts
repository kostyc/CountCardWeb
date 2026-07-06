/**
 * Conversation Service
 * 
 * Provides type-safe functions for conversation and message operations in Firestore.
 * Handles conversation creation, message sending, retrieval, and status updates.
 * Adapted from AIChatModel reference implementation.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../instance';
import {
  getDocumentById,
  createDocument,
  updateDocument,
  queryDocuments,
  handleFirestoreError,
  timestampToDate,
  addBaseEntityFields,
  updateBaseEntityFields,
  type PaginationOptions,
  type PaginationResult,
} from './base';
import type {
  Conversation,
  Message,
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
 * Get conversation by ID
 */
export async function getConversationById(
  conversationId: string
): Promise<Conversation | null> {
  try {
    return await getDocumentById<Conversation>(CONVERSATIONS_COLLECTION, conversationId);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get conversation ${conversationId}`);
  }
}

/**
 * List conversations for user
 * Returns all conversations where the user is a participant
 */
export async function listConversationsForUser(
  userId: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<Conversation>> {
  try {
    const constraints: Parameters<typeof queryDocuments>[1] = [];

    // Filter by participant
    constraints.push(where('participants', 'array-contains', userId));

    // Order by last message timestamp (most recent first)
    constraints.push(orderBy('lastMessageAt', 'desc'));

    return await queryDocuments<Conversation>(
      CONVERSATIONS_COLLECTION,
      constraints,
      pagination
    );
  } catch (error) {
    throw handleFirestoreError(error, `Failed to list conversations for user ${userId}`);
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
 * Get messages for conversation
 * Retrieves messages from the conversation's messages subcollection
 */
export async function getMessagesForConversation(
  conversationId: string,
  pagination?: PaginationOptions
): Promise<PaginationResult<Message>> {
  try {
    const messagesRef = collection(
      getDb(),
      CONVERSATIONS_COLLECTION,
      conversationId,
      MESSAGES_SUBCOLLECTION
    );

    let q = query(messagesRef, orderBy('sentAt', 'desc'));

    // Add pagination
    if (pagination?.pageSize) {
      q = query(q, firestoreLimit(pagination.pageSize + 1)); // Fetch one extra to check if there's more
    }

    const querySnapshot = await getDocs(q);
    const items: Message[] = [];
    let lastDoc: any;
    let hasMore = false;

    querySnapshot.docs.forEach((docSnap, index) => {
      if (pagination?.pageSize && index === pagination.pageSize) {
        // This is the extra document, indicating there are more
        hasMore = true;
        lastDoc = querySnapshot.docs[index - 1];
        return;
      }

      const data = docSnap.data();
      items.push({
        messageId: docSnap.id,
        conversationId,
        senderId: data.senderId,
        content: data.content,
        status: data.status || 'sent',
        sentAt: timestampToDate(data.sentAt),
        deliveredAt: data.deliveredAt ? timestampToDate(data.deliveredAt) : undefined,
        readAt: data.readAt ? timestampToDate(data.readAt) : undefined,
        attachments: data.attachments,
        reactions: data.reactions,
        replyToMessageId: data.replyToMessageId,
      } as Message);

      if (index === querySnapshot.docs.length - 1) {
        lastDoc = docSnap;
      }
    });

    // If we fetched exactly pageSize items and there's no extra, check if there are more
    if (pagination?.pageSize && items.length === pagination.pageSize) {
      // We fetched one extra, so if we have pageSize items, there might be more
      // The hasMore flag is already set above if we found the extra document
    } else if (pagination?.pageSize && items.length < pagination.pageSize) {
      hasMore = false;
    }

    return {
      items,
      lastDoc,
      hasMore,
    };
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get messages for conversation ${conversationId}`);
  }
}

/**
 * Update message status
 * Updates a message's status (sent, delivered, read) in the subcollection
 */
export async function updateMessageStatus(
  conversationId: string,
  messageId: string,
  status: MessageStatus,
  updatedBy: string,
  deliveredAt?: Date | Timestamp,
  readAt?: Date | Timestamp
): Promise<void> {
  try {
    const messageRef = doc(
      getDb(),
      CONVERSATIONS_COLLECTION,
      conversationId,
      MESSAGES_SUBCOLLECTION,
      messageId
    );

    const updateData: any = {
      status,
      ...updateBaseEntityFields({}, updatedBy),
    };

    if (deliveredAt) {
      updateData.deliveredAt = deliveredAt instanceof Date ? Timestamp.fromDate(deliveredAt) : deliveredAt;
    }

    if (readAt) {
      updateData.readAt = readAt instanceof Date ? Timestamp.fromDate(readAt) : readAt;
    }

    await updateDoc(messageRef, updateData);
  } catch (error) {
    throw handleFirestoreError(error, `Failed to update message status for ${messageId} in conversation ${conversationId}`);
  }
}

/**
 * Get message by ID
 * Retrieves a specific message from a conversation's messages subcollection
 */
export async function getMessageById(
  conversationId: string,
  messageId: string
): Promise<Message | null> {
  try {
    const messageRef = doc(
      getDb(),
      CONVERSATIONS_COLLECTION,
      conversationId,
      MESSAGES_SUBCOLLECTION,
      messageId
    );

    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return null;
    }

    const data = messageSnap.data();
    return {
      messageId: messageSnap.id,
      conversationId,
      senderId: data.senderId,
      content: data.content,
      status: data.status || 'sent',
      sentAt: timestampToDate(data.sentAt),
      deliveredAt: data.deliveredAt ? timestampToDate(data.deliveredAt) : undefined,
      readAt: data.readAt ? timestampToDate(data.readAt) : undefined,
      attachments: data.attachments,
      reactions: data.reactions,
      replyToMessageId: data.replyToMessageId,
    } as Message;
  } catch (error) {
    throw handleFirestoreError(error, `Failed to get message ${messageId} from conversation ${conversationId}`);
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
