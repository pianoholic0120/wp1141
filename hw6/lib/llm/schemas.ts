/**
 * LLM Structured Output Schemas
 * 使用 Zod 定義 LLM 的結構化輸出格式
 */

import { z } from 'zod';

/**
 * 演出一覽輸出 Schema
 */
export const EventListResponseSchema = z.object({
  events: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      artists: z.array(z.string()),
      venue: z.string().optional(),
      venueAddress: z.string().optional(),
      category: z.string().optional(),
      opentixUrl: z.string(),
      description: z.string().optional(),
    })
  ),
  summary: z.string().optional(), // 簡短摘要
});

export type EventListResponse = z.infer<typeof EventListResponseSchema>;

/**
 * FAQ 回答輸出 Schema
 */
export const FAQResponseSchema = z.object({
  answer: z.string(),
  relatedFAQs: z.array(
    z.object({
      question: z.string(),
      category: z.string(),
    })
  ).optional(),
  hasAction: z.boolean().optional(), // 是否需要進一步動作
  actionType: z.enum(['link', 'contact', 'none']).optional(),
  actionData: z.object({
    url: z.string().optional(),
    contact: z.string().optional(),
  }).optional(),
});

export type FAQResponse = z.infer<typeof FAQResponseSchema>;

/**
 * 一般對話輸出 Schema
 */
export const GeneralResponseSchema = z.object({
  response: z.string(),
  intent: z.enum([
    'search',
    'faq',
    'follow_up',
    'help',
    'unknown'
  ]).optional(),
  suggestions: z.array(z.string()).optional(), // 建議的下一步動作
});

export type GeneralResponse = z.infer<typeof GeneralResponseSchema>;

/**
 * 統一回應輸出 Schema（用於所有類型的回應）
 */
export const UnifiedResponseSchema = z.object({
  type: z.enum(['event_list', 'event_detail', 'faq', 'general', 'help']),
  content: z.string(), // 主要回應內容
  metadata: z.object({
    hasEvents: z.boolean().optional(),
    eventCount: z.number().optional(),
    faqCategory: z.string().optional(),
    confidence: z.number().optional(), // 信心度 0-1
  }).optional(),
  suggestions: z.array(
    z.object({
      text: z.string(),
      action: z.enum(['search', 'faq', 'help', 'none']).optional(),
    })
  ).optional(),
});

export type UnifiedResponse = z.infer<typeof UnifiedResponseSchema>;

