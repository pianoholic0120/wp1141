import { z } from 'zod';

/**
 * API Response Schemas
 */

/**
 * Success Response Schema
 */
export const SuccessResponseSchema = z.object({
  ok: z.literal(true),
});

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
});

/**
 * Conversations List Response Schema
 */
export const ConversationsListResponseSchema = z.object({
  items: z.array(z.any()), // Conversation objects
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  totalPages: z.number().int().nonnegative().optional(),
  hasNextPage: z.boolean().optional(),
  hasPrevPage: z.boolean().optional(),
});

/**
 * Conversation Detail Response Schema
 */
export const ConversationDetailResponseSchema = z.object({
  conversation: z.any(), // Conversation object
  messages: z.array(z.any()), // Message objects
});

/**
 * Database Status Response Schema
 */
export const DatabaseStatusResponseSchema = z.object({
  connected: z.boolean(),
  status: z.string(),
  message: z.string().optional(),
});

/**
 * Type exports
 */
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ConversationsListResponse = z.infer<typeof ConversationsListResponseSchema>;
export type ConversationDetailResponse = z.infer<typeof ConversationDetailResponseSchema>;
export type DatabaseStatusResponse = z.infer<typeof DatabaseStatusResponseSchema>;

