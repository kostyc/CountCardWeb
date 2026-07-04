"use strict";
/**
 * Real-time Firestore subscriptions for conversations and messages.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeConversationsForUser = subscribeConversationsForUser;
exports.subscribeMessages = subscribeMessages;
const firestore_1 = require("firebase/firestore");
const instance_1 = require("../instance");
const base_1 = require("./base");
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';
function subscribeConversationsForUser(userId, onUpdate) {
    const q = (0, firestore_1.query)((0, firestore_1.collection)(instance_1.db, CONVERSATIONS_COLLECTION), (0, firestore_1.where)('participants', 'array-contains', userId), (0, firestore_1.orderBy)('lastMessageAt', 'desc'));
    return (0, firestore_1.onSnapshot)(q, (snapshot) => {
        const conversations = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                conversationId: docSnap.id,
                participants: data.participants ?? [],
                lastMessageAt: data.lastMessageAt ? (0, base_1.timestampToDate)(data.lastMessageAt) : undefined,
                lastMessageContent: data.lastMessageContent,
                lastMessageSenderId: data.lastMessageSenderId,
                metadata: data.metadata,
            };
        });
        onUpdate(conversations);
    });
}
function subscribeMessages(conversationId, onUpdate) {
    const messagesRef = (0, firestore_1.collection)(instance_1.db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
    const q = (0, firestore_1.query)(messagesRef, (0, firestore_1.orderBy)('sentAt', 'asc'));
    return (0, firestore_1.onSnapshot)(q, (snapshot) => {
        const messages = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                messageId: docSnap.id,
                conversationId,
                senderId: data.senderId,
                content: data.content,
                status: data.status || 'sent',
                sentAt: (0, base_1.timestampToDate)(data.sentAt),
                deliveredAt: data.deliveredAt ? (0, base_1.timestampToDate)(data.deliveredAt) : undefined,
                readAt: data.readAt ? (0, base_1.timestampToDate)(data.readAt) : undefined,
                attachments: data.attachments,
                reactions: data.reactions,
                replyToMessageId: data.replyToMessageId,
            };
        });
        onUpdate(messages);
    });
}
//# sourceMappingURL=conversationRealtime.js.map