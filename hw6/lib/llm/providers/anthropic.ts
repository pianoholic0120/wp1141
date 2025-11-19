import Anthropic from '@anthropic-ai/sdk';

export class AnthropicProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async chat(messages: { role: 'system' | 'user' | 'assistant'; content: string }[]) {
    const system = messages.find((m) => m.role === 'system')?.content ?? '';
    const content = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));
    const res = await this.client.messages.create({
      model: 'claude-3-5-sonnet-latest',
      system,
      messages: content as any,
      max_tokens: 512,
    });
    const text = res.content[0] && 'text' in res.content[0] ? (res.content[0] as any).text : '';
    return text ?? '';
  }
}
