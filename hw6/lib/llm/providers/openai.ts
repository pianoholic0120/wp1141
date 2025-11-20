import OpenAI from 'openai';

export class OpenAIProvider {
  private client: OpenAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.client = new OpenAI({ apiKey });
    // Use gpt-4o-mini as default (fast and cost-effective), or allow override via env
    this.modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
    try {
      const res = await this.client.chat.completions.create({
        model: this.modelName,
        messages,
      });
      
      const content = res.choices[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned empty response');
      }
      
      return content;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // 檢測 429 (rate limit) 錯誤
      if (err?.status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        console.error('[OpenAI Provider Error] 429 Rate Limit:', errorMessage);
        throw new Error('LLM_RATE_LIMIT');
      }
      
      // 檢測 503 (service unavailable) 錯誤
      if (err?.status === 503 || errorMessage.includes('service unavailable') || errorMessage.includes('503')) {
        console.error('[OpenAI Provider Error] 503 Service Unavailable:', errorMessage);
        throw new Error('LLM_SERVICE_UNAVAILABLE');
      }
      
      // 檢測 quota exceeded 錯誤
      if (errorMessage.includes('quota') || errorMessage.includes('insufficient_quota')) {
        console.error('[OpenAI Provider Error] Quota Exceeded:', errorMessage);
        throw new Error('LLM_QUOTA_EXCEEDED');
      }
      
      console.error('[OpenAI Provider Error]', {
        model: this.modelName,
        error: errorMessage,
        status: err?.status,
        hasApiKey: !!process.env.OPENAI_API_KEY,
      });
      throw new Error(`OpenAI API error: ${errorMessage}`);
    }
  }
}
