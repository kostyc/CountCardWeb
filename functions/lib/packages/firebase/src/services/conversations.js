"use strict";
/**
 * Conversation Service
 *
 * Provides type-safe functions for conversation and message operations in Firestore.
 * Handles conversation creation, message sending, retrieval, and status updates.
 * Adapted from AIChatModel reference implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversation = createConversation;
exports.updateConversation = updateConversation;
exports.getConversationById = getConversationById;
exports.listConversationsForUser = listConversationsForUser;
exports.sendMessage = sendMessage;
exports.getMessagesForConversation = getMessagesForConversation;
exports.updateMessageStatus = updateMessageStatus;
exports.getMessageById = getMessageById;
const firestore_1 = require("firebase/firestore");
const instance_1 = require("../instance");
const base_1 = require("./base");
/**
 * Collection name for conversations
 */
const CONVERSATIONS_COLLECTION = 'conversations';
/**
 * Subcollection name for messages
 */
const MESSAGES_SUBCOLLECTION = 'messages';
/**
 * Create conversation
 */
async function createConversation(conversationId, data, createdBy) {
    try {
        const conversationData = (0, base_1.addBaseEntityFields)(data, createdBy);
        const docRef = (0, firestore_1.doc)(instance_1.db, CONVERSATIONS_COLLECTION, conversationId);
        await (0, firestore_1.setDoc)(docRef, conversationData);
        return conversationId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to create conversation ${conversationId}`);
    }
}
/**
 * Update conversation
 */
async function updateConversation(conversationId, data, updatedBy) {
    try {
        const updateData = (0, base_1.updateBaseEntityFields)(data, updatedBy);
        await (0, base_1.updateDocument)(CONVERSATIONS_COLLECTION, conversationId, updateData, updatedBy);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update conversation ${conversationId}`);
    }
}
/**
 * Get conversation by ID
 */
async function getConversationById(conversationId) {
    try {
        return await (0, base_1.getDocumentById)(CONVERSATIONS_COLLECTION, conversationId);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get conversation ${conversationId}`);
    }
}
/**
 * List conversations for user
 * Returns all conversations where the user is a participant
 */
async function listConversationsForUser(userId, pagination) {
    try {
        const constraints = [];
        // Filter by participant
        constraints.push((0, firestore_1.where)('participants', 'array-contains', userId));
        // Order by last message timestamp (most recent first)
        constraints.push((0, firestore_1.orderBy)('lastMessageAt', 'desc'));
        return await (0, base_1.queryDocuments)(CONVERSATIONS_COLLECTION, constraints, pagination);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to list conversations for user ${userId}`);
    }
}
/**
 * Send message
 * Creates a message in the conversation's messages subcollection
 */
async function sendMessage(conversationId, messageId, data, createdBy) {
    try {
        const now = firestore_1.Timestamp.now();
        const messageData = {
            ...data,
            messageId,
            conversationId,
            status: data.status || 'sent',
            sentAt: data.sentAt || now,
            ...(0, base_1.addBaseEntityFields)({}, createdBy),
        };
        // Create message in subcollection
        const messageRef = (0, firestore_1.doc)(instance_1.db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
        await (0, firestore_1.setDoc)(messageRef, messageData);
        // Update conversation with last message info
        await updateConversation(conversationId, {
            conversationId,
            lastMessageAt: now,
            lastMessageContent: data.content,
            lastMessageSenderId: data.senderId,
        }, createdBy);
        return messageId;
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to send message ${messageId} in conversation ${conversationId}`);
    }
}
/**
 * Get messages for conversation
 * Retrieves messages from the conversation's messages subcollection
 */
async function getMessagesForConversation(conversationId, pagination) {
    try {
        const messagesRef = (0, firestore_1.collection)(instance_1.db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
        let q = (0, firestore_1.query)(messagesRef, (0, firestore_1.orderBy)('sentAt', 'desc'));
        // Add pagination
        if (pagination?.pageSize) {
            q = (0, firestore_1.query)(q, (0, firestore_1.limit)(pagination.pageSize + 1)); // Fetch one extra to check if there's more
        }
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        const items = [];
        let lastDoc;
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
                sentAt: (0, base_1.timestampToDate)(data.sentAt),
                deliveredAt: data.deliveredAt ? (0, base_1.timestampToDate)(data.deliveredAt) : undefined,
                readAt: data.readAt ? (0, base_1.timestampToDate)(data.readAt) : undefined,
                attachments: data.attachments,
                reactions: data.reactions,
                replyToMessageId: data.replyToMessageId,
            });
            if (index === querySnapshot.docs.length - 1) {
                lastDoc = docSnap;
            }
        });
        // If we fetched exactly pageSize items and there's no extra, check if there are more
        if (pagination?.pageSize && items.length === pagination.pageSize) {
            // We fetched one extra, so if we have pageSize items, there might be more
            // The hasMore flag is already set above if we found the extra document
        }
        else if (pagination?.pageSize && items.length < pagination.pageSize) {
            hasMore = false;
        }
        return {
            items,
            lastDoc,
            hasMore,
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get messages for conversation ${conversationId}`);
    }
}
/**
 * Update message status
 * Updates a message's status (sent, delivered, read) in the subcollection
 */
async function updateMessageStatus(conversationId, messageId, status, updatedBy, deliveredAt, readAt) {
    try {
        const messageRef = (0, firestore_1.doc)(instance_1.db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
        const updateData = {
            status,
            ...(0, base_1.updateBaseEntityFields)({}, updatedBy),
        };
        if (deliveredAt) {
            updateData.deliveredAt = deliveredAt instanceof Date ? firestore_1.Timestamp.fromDate(deliveredAt) : deliveredAt;
        }
        if (readAt) {
            updateData.readAt = readAt instanceof Date ? firestore_1.Timestamp.fromDate(readAt) : readAt;
        }
        await (0, firestore_1.updateDoc)(messageRef, updateData);
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to update message status for ${messageId} in conversation ${conversationId}`);
    }
}
/**
 * Get message by ID
 * Retrieves a specific message from a conversation's messages subcollection
 */
async function getMessageById(conversationId, messageId) {
    try {
        const messageRef = (0, firestore_1.doc)(instance_1.db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
        const messageSnap = await (0, firestore_1.getDoc)(messageRef);
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
            sentAt: (0, base_1.timestampToDate)(data.sentAt),
            deliveredAt: data.deliveredAt ? (0, base_1.timestampToDate)(data.deliveredAt) : undefined,
            readAt: data.readAt ? (0, base_1.timestampToDate)(data.readAt) : undefined,
            attachments: data.attachments,
            reactions: data.reactions,
            replyToMessageId: data.replyToMessageId,
        };
    }
    catch (error) {
        throw (0, base_1.handleFirestoreError)(error, `Failed to get message ${messageId} from conversation ${conversationId}`);
    }
}
//# sourceMappingURL=conversations.js.map