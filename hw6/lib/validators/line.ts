import { z } from 'zod';

/**
 * LINE Webhook Event Source Schema
 */
export const LineEventSourceSchema = z.object({
  type: z.enum(['user', 'group', 'room']),
  userId: z.string().optional(),
  groupId: z.string().optional(),
  roomId: z.string().optional(),
});

/**
 * LINE Webhook Message Schema
 */
export const LineMessageSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'audio', 'file', 'location', 'sticker']),
  id: z.string(),
  text: z.string().optional(),
  quoteToken: z.string().optional(),
});

/**
 * LINE Webhook Event Schema
 */
export const LineEventSchema = z.object({
  type: z.enum(['message', 'follow', 'unfollow', 'join', 'leave', 'memberJoined', 'memberLeft', 'postback', 'videoPlayComplete', 'beacon', 'accountLink', 'things']),
  replyToken: z.string().optional(),
  timestamp: z.number().optional(),
  source: LineEventSourceSchema,
  message: LineMessageSchema.optional(),
  postback: z.object({
    data: z.string(),
    params: z.record(z.any()).optional(),
  }).optional(),
  mode: z.enum(['active', 'standby']).optional(),
  webhookEventId: z.string().optional(),
  deliveryContext: z.object({
    isRedelivery: z.boolean().optional(),
  }).optional(),
});

/**
 * LINE Webhook Request Body Schema
 */
export const LineWebhookRequestSchema = z.object({
  destination: z.string(),
  events: z.array(LineEventSchema),
});

/**
 * Type exports
 */
export type LineEventSource = z.infer<typeof LineEventSourceSchema>;
export type LineMessage = z.infer<typeof LineMessageSchema>;
export type LineEvent = z.infer<typeof LineEventSchema>;
export type LineWebhookRequest = z.infer<typeof LineWebhookRequestSchema>;

