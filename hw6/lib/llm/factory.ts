import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type LLMOptions = { provider?: 'openai' | 'gemini' };

export class LLMFactory {
  private openai = process.env.OPENAI_API_KEY ? new OpenAIProvider() : null;
  private gemini = process.env.GOOGLE_API_KEY ? new GeminiProvider() : null;

  async chat(messages: ChatMessage[], options: LLMOptions = {}): Promise<string> {
    // Preferred order: explicit option → env default → fallback
    const preferred =
      options.provider || (process.env.LLM_PROVIDER as 'openai' | 'gemini' | undefined);
    
    // Try preferred provider first, with automatic fallback on error
    if (preferred === 'gemini' && this.gemini) {
      try {
        return await this.gemini.chat(messages);
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Check for location/geography errors - Gemini not available in some regions
        if (errorMessage.includes('location is not supported') || 
            errorMessage.includes('User location is not supported') ||
            errorMessage.includes('400 Bad Request') && errorMessage.includes('location')) {
          console.warn('[LLM Factory] Gemini unavailable due to location restriction, falling back to OpenAI');
          if (this.openai) {
            return await this.openai.chat(messages);
          }
        }
        // For other errors, still try to fallback to OpenAI if available
        if (this.openai && (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit'))) {
          console.warn('[LLM Factory] Gemini error, falling back to OpenAI:', errorMessage);
          return await this.openai.chat(messages);
        }
        throw error; // Re-throw if no fallback available or error is not recoverable
      }
    }
    
    if (preferred === 'openai' && this.openai) {
      try {
        return await this.openai.chat(messages);
      } catch (error: any) {
        // Try Gemini as fallback if OpenAI fails
        if (this.gemini) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn('[LLM Factory] OpenAI error, falling back to Gemini:', errorMessage);
          try {
            return await this.gemini.chat(messages);
          } catch (geminiError) {
            // If both fail, throw the original error
            throw error;
          }
        }
        throw error;
      }
    }
    
    // Auto-pick based on available keys, with automatic fallback
    if (this.gemini) {
      try {
        return await this.gemini.chat(messages);
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        // Check for location errors
        if (errorMessage.includes('location is not supported') || 
            errorMessage.includes('User location is not supported') ||
            (errorMessage.includes('400 Bad Request') && errorMessage.includes('location'))) {
          console.warn('[LLM Factory] Gemini unavailable due to location restriction, falling back to OpenAI');
          if (this.openai) {
            return await this.openai.chat(messages);
          }
        }
        // Try OpenAI as fallback
        if (this.openai) {
          console.warn('[LLM Factory] Gemini error, falling back to OpenAI:', errorMessage);
          return await this.openai.chat(messages);
        }
        throw error;
      }
    }
    
    if (this.openai) {
      return await this.openai.chat(messages);
    }
    
    throw new Error('No LLM provider configured. Set GOOGLE_API_KEY or OPENAI_API_KEY.');
  }
}

export const llmFactory = new LLMFactory();
