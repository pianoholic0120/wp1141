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

/**
 * 生成助手回應（帶元數據）
 */
export async function generateAssistantReply(
  recent: { role: 'user' | 'assistant' | 'system'; content: string }[],
  message: string,
  options?: { opentixSearchUrl?: string; foundEvents?: any[]; parsedQuery?: any; userLocale?: Locale }
): Promise<string> {
  const startTime = Date.now();
  let latency: number | undefined;
  let error: string | undefined;
  let llmProvider: string | undefined;

  try {
    const userLocale = options?.userLocale || 'zh-TW';
    const systemPrompt = getSystemPrompt(userLocale);
    
    const prompt = await buildUserPrompt(recent, message, {
      opentixSearchUrl: options?.opentixSearchUrl,
      foundEvents: options?.foundEvents,
      parsedQuery: options?.parsedQuery,
      userLocale: userLocale,
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
    llmProvider = process.env.LLM_PROVIDER || (process.env.GOOGLE_API_KEY ? 'gemini' : 'openai');

    logger.info('[LLM] LLM response received', {
      length: output.length,
      latency: `${latency}ms`,
      provider: llmProvider,
    });
    
    // 返回结果和元数据
    (output as any).__metadata = { latency, llmProvider };
    return output;
  } catch (err) {
    latency = Date.now() - startTime;
    error = err instanceof Error ? err.message : String(err);
    llmProvider = process.env.LLM_PROVIDER || (process.env.GOOGLE_API_KEY ? 'gemini' : 'openai');
    
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
  return (response as any).__metadata || {};
}
