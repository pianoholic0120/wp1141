import { GoogleGenerativeAI } from '@google/generative-ai';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export class GeminiProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    // 1.5-flash is fast and generally available
    this.modelName = process.env.GOOGLE_MODEL || 'gemini-1.5-flash';
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: this.modelName });
      const system = messages.find((m) => m.role === 'system')?.content ?? '';
      const parts = messages
        .filter((m) => m.role !== 'system')
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');
      const prompt = system ? `${system}\n\n${parts}` : parts;
      
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      
      if (!text) {
        throw new Error('Gemini returned empty response');
      }
      
      return text;
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // 檢測 429 (rate limit) 錯誤
      if (err?.status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        console.error('[Gemini Provider Error] 429 Rate Limit:', errorMessage);
        throw new Error('LLM_RATE_LIMIT');
      }
      
      // 檢測 503 (service unavailable) 錯誤
      if (err?.status === 503 || errorMessage.includes('service unavailable') || errorMessage.includes('503') || errorMessage.includes('UNAVAILABLE')) {
        console.error('[Gemini Provider Error] 503 Service Unavailable:', errorMessage);
        throw new Error('LLM_SERVICE_UNAVAILABLE');
      }
      
      // 檢測 quota exceeded 錯誤
      if (errorMessage.includes('quota') || errorMessage.includes('QUOTA_EXCEEDED')) {
        console.error('[Gemini Provider Error] Quota Exceeded:', errorMessage);
        throw new Error('LLM_QUOTA_EXCEEDED');
      }
      
      console.error('[Gemini Provider Error]', {
        model: this.modelName,
        error: errorMessage,
        status: err?.status,
        hasApiKey: !!process.env.GOOGLE_API_KEY,
      });
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  }
}
