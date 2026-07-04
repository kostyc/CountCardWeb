/**
 * Real-time Firestore subscriptions for conversations and messages.
 */

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Conversation, Message } from '@/types/models';
import { timestampToDate } from './base';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

export function subscribeConversationsForUser(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
): Unsubscribe {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        conversationId: docSnap.id,
        participants: data.participants ?? [],
        lastMessageAt: data.lastMessageAt ? timestampToDate(data.lastMessageAt) : undefined,
        lastMessageContent: data.lastMessageContent,
        lastMessageSenderId: data.lastMessageSenderId,
        metadata: data.metadata,
      } as Conversation;
    });
    onUpdate(conversations);
  });
}

export function subscribeMessages(
  conversationId: string,
  onUpdate: (messages: Message[]) => void
): Unsubscribe {
  const messagesRef = collection(
    db,
    CONVERSATIONS_COLLECTION,
    conversationId,
    MESSAGES_SUBCOLLECTION
  );
  const q = query(messagesRef, orderBy('sentAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
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
      } as Message;
    });
    onUpdate(messages);
  });
}
