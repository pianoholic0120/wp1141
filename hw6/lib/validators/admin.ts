import { z } from 'zod';

/**
 * Admin API Query Parameters Schemas
 */

/**
 * Conversations List Query Schema
 */
export const ConversationsQuerySchema = z.object({
  status: z.enum(['all', 'active', 'resolved', 'archived']).optional().default('all'),
  search: z.string().optional(), // userId search
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD
  messageSearch: z.string().optional(), // message content search
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['lastMessageAt', 'startedAt', 'messageCount', 'userId']).optional().default('lastMessageAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Conversation ID Parameter Schema
 */
export const ConversationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format'),
});

/**
 * Stats Query Schema
 */
export const StatsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Type exports
 */
export type ConversationsQuery = z.infer<typeof ConversationsQuerySchema>;
export type ConversationIdParam = z.infer<typeof ConversationIdParamSchema>;
export type StatsQuery = z.infer<typeof StatsQuerySchema>;

