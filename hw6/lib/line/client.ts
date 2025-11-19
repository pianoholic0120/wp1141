export type LineTextMessage = {
  type: 'text';
  text: string;
  quickReply?: {
    items: Array<{
      type: 'action';
      action:
        | { type: 'message'; label: string; text: string }
        | { type: 'uri'; label: string; uri: string };
    }>;
  };
};

export type LineFlexMessage = {
  type: 'flex';
  altText: string;
  contents: any; // Flex JSON 結構
};

export type LineTemplateMessage = {
  type: 'template';
  altText: string;
  template: {
    type: 'buttons';
    text: string;
    actions: Array<{
      type: 'message' | 'uri';
      label: string;
      text?: string;
      uri?: string;
    }>;
  };
};

export type ReplyMessage = LineTextMessage | LineFlexMessage | LineTemplateMessage;

export class LineClient {
  private accessToken: string;

  constructor() {
    this.accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
  }

  async replyMessage(replyToken: string, messages: ReplyMessage[]) {
    if (!this.accessToken) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN missing');
    }
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 429) {
        console.error('[LINE Reply Error] 429 Rate Limit:', text);
        throw new Error('LINE_API_RATE_LIMIT');
      } else if (res.status === 503) {
        console.error('[LINE Reply Error] 503 Service Unavailable:', text);
        throw new Error('LINE_API_SERVICE_UNAVAILABLE');
      }
      console.error('[LINE Reply Error]', res.status, text);
      throw new Error(`LINE_API_ERROR_${res.status}`);
    }
  }

  /**
   * 發送 Push Message（不需要 replyToken）
   * 用於發送「正在處理中」等狀態訊息
   */
  async pushMessage(userId: string, messages: ReplyMessage[]): Promise<void> {
    if (!this.accessToken) {
      return; // 靜默失敗
    }
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({ to: userId, messages }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 429) {
          console.warn('[LINE Push Error] 429 Rate Limit:', text);
          throw new Error('LINE_API_RATE_LIMIT');
        } else if (res.status === 503) {
          console.warn('[LINE Push Error] 503 Service Unavailable:', text);
          throw new Error('LINE_API_SERVICE_UNAVAILABLE');
        }
        console.warn('[LINE Push Error]', res.status, text);
        throw new Error(`LINE_API_ERROR_${res.status}`);
      }
    } catch (err) {
      // 如果是 429 或 503，重新拋出以便上層處理
      if (err instanceof Error && (err.message === 'LINE_API_RATE_LIMIT' || err.message === 'LINE_API_SERVICE_UNAVAILABLE')) {
        throw err;
      }
      console.warn('[LINE Push Error]', err);
    }
  }

  /**
   * 發送 Typing Indicator（顯示「正在輸入...」）
   * 這是企業級應用中常用的 UX 優化，讓用戶知道系統正在處理
   */
  async pushTypingIndicator(userId: string): Promise<void> {
    if (!this.accessToken) {
      return; // 靜默失敗，不影響主要流程
    }
    try {
      await fetch(`https://api.line.me/v2/bot/chat/${userId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({}),
      });
    } catch (err) {
      // 靜默失敗，不影響主要流程
      console.warn('[LINE Typing Indicator] Failed to send:', err);
    }
  }

  /**
   * 停止 Typing Indicator
   * 通常不需要手動調用，LINE 會在收到回覆後自動停止
   * 但對於長時間處理的情況，可以手動停止
   */
  async stopTypingIndicator(userId: string): Promise<void> {
    if (!this.accessToken) {
      return;
    }
    try {
      await fetch(`https://api.line.me/v2/bot/chat/${userId}/typing`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
    } catch (err) {
      // 靜默失敗
      console.warn('[LINE Typing Indicator] Failed to stop:', err);
    }
  }
}

export const lineClient = new LineClient();
