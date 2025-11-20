import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type LLMOptions = { provider?: 'openai' | 'gemini' };

export class LLMFactory {
  private openai = process.env.OPENAI_API_KEY ? new OpenAIProvider() : null;
  private gemini = process.env.GOOGLE_API_KEY ? new GeminiProvider() : null;

  async chat(messages: ChatMessage[], options: LLMOptions = {}): Promise<string> {
    // Preferred order: explicit option → env default → fallback
    // Default to OpenAI if LLM_PROVIDER is not set
    const preferred =
      options.provider || (process.env.LLM_PROVIDER as 'openai' | 'gemini' | undefined) || 'openai';
    if (preferred === 'openai' && this.openai) {
      return await this.openai.chat(messages);
    }
    if (preferred === 'gemini' && this.gemini) {
      return await this.gemini.chat(messages);
    }
    // Auto-pick based on available keys (OpenAI first, then Gemini)
    if (this.openai) return await this.openai.chat(messages);
    if (this.gemini) return await this.gemini.chat(messages);
    throw new Error('No LLM provider configured. Set OPENAI_API_KEY or GOOGLE_API_KEY.');
  }
}

export const llmFactory = new LLMFactory();
