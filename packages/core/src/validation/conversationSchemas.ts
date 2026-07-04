/**
 * Conversation Validation Schemas
 * 
 * Zod schemas for validating conversation and message creation and updates.
 * Adapted from AIChatModel conversation system.
 */

import { z } from 'zod';

/**
 * Message status validation
 */
export const messageStatusSchema = z.enum([
  'sent',
  'delivered',
  'read',
  'failed',
]);

/**
 * Conversation ID validation
 */
export const conversationIdSchema = z
  .string()
  .min(1, 'Conversation ID is required')
  .max(100, 'Conversation ID must be 100 characters or less');

/**
 * Message ID validation
 */
export const messageIdSchema = z
  .string()
  .min(1, 'Message ID is required')
  .max(100, 'Message ID must be 100 characters or less');

/**
 * User ID validation
 */
export const userIdSchema = z
  .string()
  .min(1, 'User ID is required')
  .max(100, 'User ID must be 100 characters or less');

/**
 * Message content validation
 */
export const messageContentSchema = z
  .string()
  .min(1, 'Message content is required')
  .max(10000, 'Message content must be 10000 characters or less')
  .trim();

/**
 * Message attachment validation
 */
export const messageAttachmentSchema = z.object({
  attachmentId: z.string().min(1, 'Attachment ID is required'),
  fileName: z.string().min(1, 'File name is required').max(255, 'File name must be 255 characters or less'),
  fileUrl: z.string().url('File URL must be a valid URL'),
  fileSize: z.number().int().positive('File size must be a positive number').optional(),
  mimeType: z.string().min(1, 'MIME type is required').max(100, 'MIME type must be 100 characters or less').optional(),
});

/**
 * Message reaction validation
 */
export const messageReactionSchema = z.object({
  userId: userIdSchema,
  reaction: z.string().min(1, 'Reaction is required').max(10, 'Reaction must be 10 characters or less'),
  reactedAt: z.union([z.date(), z.string()]),
});

/**
 * Message Input Schema (for creation)
 */
export const messageInputSchema = z.object({
  messageId: messageIdSchema,
  conversationId: conversationIdSchema,
  senderId: userIdSchema,
  content: messageContentSchema,
  status: messageStatusSchema.optional().default('sent'),
  sentAt: z.union([z.date(), z.string()]).optional(),
  deliveredAt: z.union([z.date(), z.string()]).optional(),
  readAt: z.union([z.date(), z.string()]).optional(),
  attachments: z.array(messageAttachmentSchema).optional(),
  reactions: z.array(messageReactionSchema).optional(),
  replyToMessageId: messageIdSchema.optional(),
});

/**
 * Message Update Schema (for updates)
 */
export const messageUpdateSchema = z.object({
  messageId: messageIdSchema,
  conversationId: conversationIdSchema,
  status: messageStatusSchema.optional(),
  deliveredAt: z.union([z.date(), z.string()]).optional(),
  readAt: z.union([z.date(), z.string()]).optional(),
  reactions: z.array(messageReactionSchema).optional(),
});

/**
 * Conversation Input Schema (for creation)
 */
export const conversationInputSchema = z.object({
  conversationId: conversationIdSchema,
  participants: z
    .array(userIdSchema)
    .min(2, 'Conversation must have at least 2 participants')
    .max(100, 'Conversation cannot have more than 100 participants'),
  lastMessageAt: z.union([z.date(), z.string()]).optional(),
  lastMessageContent: z.string().max(500, 'Last message content must be 500 characters or less').optional(),
  lastMessageSenderId: userIdSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdBy: z.string().min(1, 'Created by user ID is required'),
  updatedBy: z.string().min(1, 'Updated by user ID is required').optional(),
});

/**
 * Conversation Update Schema (for updates)
 */
export const conversationUpdateSchema = z.object({
  conversationId: conversationIdSchema,
  participants: z
    .array(userIdSchema)
    .min(2, 'Conversation must have at least 2 participants')
    .max(100, 'Conversation cannot have more than 100 participants')
    .optional(),
  lastMessageAt: z.union([z.date(), z.string()]).optional(),
  lastMessageContent: z.string().max(500, 'Last message content must be 500 characters or less').optional(),
  lastMessageSenderId: userIdSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  updatedBy: z.string().min(1, 'Updated by user ID is required'),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

/**
 * Conversation Query Schema (for filtering)
 */
export const conversationQuerySchema = z.object({
  participantId: userIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

/**
 * Message Query Schema (for filtering messages in a conversation)
 */
export const messageQuerySchema = z.object({
  conversationId: conversationIdSchema,
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});

/**
 * Type exports
 */
export type MessageStatus = z.infer<typeof messageStatusSchema>;
export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;
export type MessageReaction = z.infer<typeof messageReactionSchema>;
export type MessageInput = z.infer<typeof messageInputSchema>;
export type MessageUpdate = z.infer<typeof messageUpdateSchema>;
export type ConversationInput = z.infer<typeof conversationInputSchema>;
export type ConversationUpdate = z.infer<typeof conversationUpdateSchema>;
export type ConversationQuery = z.infer<typeof conversationQuerySchema>;
export type MessageQuery = z.infer<typeof messageQuerySchema>;
