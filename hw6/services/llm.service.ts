import { llmFactory } from '@/lib/llm/factory';
import { getSystemPrompt, buildUserPrompt } from '@/lib/llm/prompts';
import { logger } from '@/lib/utils/logger';
import { Locale } from '@/lib/i18n';

export interface LLMResponseMetadata {
  latency?: number;
  error?: string;
  llmProvider?: string;
}

export interface LLMResponse {
  content: string;
  metadata: LLMResponseMetadata;
}

// 使用 Map 存储字符串响应和元数据的关联
// 使用 WeakMap 不可行，因为字符串是原始类型
// 这里使用响应内容的前100个字符作为键（避免重复）
const responseMetadataMap = new Map<string, LLMResponseMetadata>();

/**
 * 生成助手回應（帶元數據）
 */
export async function generateAssistantReply(
  recent: { role: 'user' | 'assistant' | 'system'; content: string }[],
  message: string,
  options?: { opentixSearchUrl?: string; foundEvents?: any[]; parsedQuery?: any; userLocale?: Locale; faqResults?: any[] }
): Promise<string> {
  const startTime = Date.now();
  let latency: number | undefined;
  let error: string | undefined;
  let llmProvider: string | undefined;

  try {
    const userLocale = options?.userLocale || 'zh-TW';
    const systemPrompt = getSystemPrompt(userLocale);
    
    // 檢測是否需要 FAQ 知識庫（如果不是演出演員搜尋相關問題）
    let faqResults: any[] | undefined;
    const { searchFAQ, isFAQQuery } = await import('@/services/opentix-faq.service');
    if (isFAQQuery(message) && !options?.foundEvents?.length) {
      // 如果是 FAQ 相關問題且沒有找到演出，嘗試從 FAQ 知識庫搜尋
      faqResults = await searchFAQ(message, 3);
    }
    
    const prompt = await buildUserPrompt(recent, message, {
      opentixSearchUrl: options?.opentixSearchUrl,
      foundEvents: options?.foundEvents,
      parsedQuery: options?.parsedQuery,
      userLocale: userLocale,
      faqResults: faqResults || options?.faqResults,
    });
    
    logger.info('[LLM] Calling LLM with:', {
      messageLength: message.length,
      foundEventsCount: options?.foundEvents?.length || 0,
      recentMessagesCount: recent.length,
      userLocale,
    });

    const output = await llmFactory.chat([
      { role: 'system', content: systemPrompt },
      ...recent,
      { role: 'user', content: prompt },
    ]);

    latency = Date.now() - startTime;
    llmProvider = process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : (process.env.GOOGLE_API_KEY ? 'gemini' : 'openai'));

    logger.info('[LLM] LLM response received', {
      length: output.length,
      latency: `${latency}ms`,
      provider: llmProvider,
    });
    
    // 使用 Map 存储元数据（字符串是原始类型，不能添加属性）
    // 使用响应内容的前100个字符作为键，确保唯一性
    const metadataKey = output.substring(0, 100) + output.length.toString();
    responseMetadataMap.set(metadataKey, { latency, llmProvider });
    
    // 将元数据键附加到响应字符串（使用特殊分隔符）
    // 注意：这里我们仍然返回原始字符串，元数据通过 extractLLMMetadata 提取
    // 但为了兼容现有代码，我们使用一个临时方案：将元数据存储到 Map 中
    // 在实际使用时，通过响应内容查找元数据
    
    return output;
  } catch (err) {
    latency = Date.now() - startTime;
    error = err instanceof Error ? err.message : String(err);
    llmProvider = process.env.LLM_PROVIDER || (process.env.OPENAI_API_KEY ? 'openai' : (process.env.GOOGLE_API_KEY ? 'gemini' : 'openai'));
    
    logger.error('[LLM] Failed to generate reply:', {
      error,
      stack: err instanceof Error ? err.stack : undefined,
      hasFoundEvents: !!options?.foundEvents,
      foundEventsCount: options?.foundEvents?.length || 0,
      latency: `${latency}ms`,
      provider: llmProvider,
    });
    
    // 将错误信息附加到错误对象，以便上層記錄
    if (err instanceof Error) {
      (err as any).__metadata = { latency, error, llmProvider };
    }
    throw err; // 重新拋出錯誤，讓上層處理
  }
}

/**
 * 提取 LLM 回應的元數據
 */
export function extractLLMMetadata(response: string | Error): LLMResponseMetadata {
  if (response instanceof Error) {
    return (response as any).__metadata || {};
  }
  
  // 从 Map 中查找元数据（使用响应内容的前100个字符作为键）
  const metadataKey = response.substring(0, 100) + response.length.toString();
  const metadata = responseMetadataMap.get(metadataKey);
  
  if (metadata) {
    // 找到后删除，避免内存泄漏
    responseMetadataMap.delete(metadataKey);
    return metadata;
  }
  
  // 如果找不到，返回空对象（向后兼容）
  return {};
}
