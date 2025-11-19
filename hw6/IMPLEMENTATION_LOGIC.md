# OPENTIX LINE Chatbot 完整架構設計

## 一、核心問題分析與解決方案

### 問題 1: 爬蟲資料不穩定

**原因分析:**

* 直接爬網頁容易被反爬機制阻擋
* 動態載入的資料需要等待 JavaScript 執行
* 頁面結構變更會導致爬蟲失效

**解決方案:**

1. **使用 OPENTIX 內部 API** (最佳方案)
   * 反向工程 OPENTIX App/網站的 API 請求
   * 取得真實的 JSON 資料
   * 穩定且資料完整
2. **建立資料快取層**
   * 定期抓取熱門演出並快取
   * 減少即時爬蟲需求
   * 提供預設推薦內容

### 問題 2: 對話邏輯笨拙

**原因分析:**

* 後續問題判斷邏輯過於複雜且易出錯
* 上下文管理不完善
* Quick Reply 觸發不當的新搜尋

**解決方案:**
採用 **狀態機 + 會話管理** 架構

---

## 二、系統架構設計

### 2.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        LINE Platform                         │
└────────────────────────┬────────────────────────────────────┘
                         │ Webhook
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Webhook Handler (API Route)                │
│  - 驗證簽章                                                    │
│  - 事件路由 (text/postback/follow)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Session Manager                           │
│  - 儲存對話狀態                                                │
│  - 管理上下文 (最近搜尋的演出)                                  │
│  - 處理多輪對話                                                │
└────────┬───────────────────────────┬────────────────────────┘
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────────┐
│  Intent Detector │        │  Context Resolver    │
│  - 語言切換       │        │  - 從上下文提取資訊   │
│  - 預定義區塊     │        │  - 解析指代關係       │
│  - FAQ           │        │  - 判斷是否需要搜尋   │
│  - 後續問題       │        └──────────────────────┘
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                     State Machine                            │
│                                                              │
│  States:                                                     │
│  - IDLE: 等待使用者輸入                                        │
│  - SEARCHING: 正在搜尋演出                                     │
│  - EVENT_SELECTED: 已選擇單一演出                             │
│  - EVENT_LIST: 顯示多個演出                                   │
│  - FAQ_MODE: FAQ 互動模式                                     │
│                                                              │
│  Transitions:                                                │
│  - 基於使用者輸入和當前狀態決定下一步                           │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Action Handlers                            │
│  - SearchHandler: 搜尋演出                                    │
│  - EventDetailHandler: 顯示演出詳情                           │
│  - FAQHandler: 回答 FAQ                                      │
│  - RecommendationHandler: 推薦演出                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Sources                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ OPENTIX API  │  │  Cache Layer │  │   Database   │     │
│  │ (爬蟲/反向工程)│  │  (Redis)     │  │  (Supabase)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Response Generator                          │
│  - LLM (Gemini) for complex queries                         │
│  - Template-based for simple queries                        │
│  - Dynamic Quick Reply generation                           │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                  LINE Messaging API                          │
│  - Text messages                                            │
│  - Flex messages (卡片式呈現)                                 │
│  - Quick replies                                            │
│  - Rich menu                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 三、核心模組設計

### 3.1 Session Manager

```typescript
interface Session {
  userId: string;
  state: ConversationState;
  context: {
    lastQuery?: string;
    lastSearchResults?: Event[];
    selectedEvent?: Event;
    language: 'zh-TW' | 'en';
  };
  history: Message[];
  createdAt: Date;
  updatedAt: Date;
}

enum ConversationState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  EVENT_SELECTED = 'EVENT_SELECTED',
  EVENT_LIST = 'EVENT_LIST',
  FAQ_MODE = 'FAQ_MODE',
}

class SessionManager {
  // 取得或建立 session
  async getOrCreateSession(userId: string): Promise<Session>;
  
  // 更新 session 狀態
  async updateState(userId: string, state: ConversationState): Promise<void>;
  
  // 儲存搜尋結果到 context
  async saveSearchContext(userId: string, results: Event[]): Promise<void>;
  
  // 取得上下文中的演出資訊
  async getContextEvent(userId: string, reference: string): Promise<Event | null>;
  
  // 清除 session (回到主選單)
  async clearSession(userId: string): Promise<void>;
}
```

### 3.2 State Machine

```typescript
class ConversationStateMachine {
  async handleMessage(
    session: Session,
    message: string
  ): Promise<{
    nextState: ConversationState;
    action: Action;
  }> {
    const currentState = session.state;
  
    // 檢查全域指令 (優先權最高)
    if (this.isGlobalCommand(message)) {
      return this.handleGlobalCommand(message);
    }
  
    // 基於當前狀態處理
    switch (currentState) {
      case ConversationState.IDLE:
        return this.handleIdleState(message);
  
      case ConversationState.EVENT_SELECTED:
        return this.handleEventSelectedState(session, message);
  
      case ConversationState.EVENT_LIST:
        return this.handleEventListState(session, message);
  
      case ConversationState.FAQ_MODE:
        return this.handleFAQState(message);
  
      default:
        return this.handleIdleState(message);
    }
  }
  
  private handleEventSelectedState(
    session: Session,
    message: string
  ): StateTransition {
    // 在這個狀態下,所有問題都是關於已選擇的演出
    const event = session.context.selectedEvent;
  
    // 識別問題類型
    const intent = this.detectIntent(message);
  
    return {
      nextState: ConversationState.EVENT_SELECTED, // 保持狀態
      action: {
        type: 'ANSWER_EVENT_QUESTION',
        data: { event, question: message, intent }
      }
    };
  }
}
```

### 3.3 Intent Detector (改進版)

```typescript
class IntentDetector {
  detect(message: string, context: SessionContext): Intent {
    // 1. 檢查是否為全域指令
    if (this.isGlobalCommand(message)) {
      return { type: 'GLOBAL_COMMAND', command: this.parseCommand(message) };
    }
  
    // 2. 檢查是否為 Quick Reply 按鈕點擊
    if (this.isQuickReplyAction(message)) {
      return { type: 'QUICK_REPLY', action: this.parseQuickReply(message) };
    }
  
    // 3. 檢查是否為後續問題 (基於上下文)
    if (context.hasSelectedEvent || context.hasSearchResults) {
      // 只要有上下文,預設視為後續問題
      return this.detectFollowUpIntent(message, context);
    }
  
    // 4. 檢查是否為新搜尋
    if (this.hasSearchKeywords(message)) {
      return { type: 'SEARCH', query: message };
    }
  
    // 5. 檢查是否為 FAQ
    const faq = this.matchFAQ(message);
    if (faq) {
      return { type: 'FAQ', question: faq };
    }
  
    // 6. 一般對話
    return { type: 'GENERAL', message };
  }
  
  private detectFollowUpIntent(
    message: string,
    context: SessionContext
  ): Intent {
    // 檢查問題類型
    if (this.isAboutTime(message)) {
      return { type: 'ASK_TIME', contextType: 'FOLLOW_UP' };
    }
    if (this.isAboutPrice(message)) {
      return { type: 'ASK_PRICE', contextType: 'FOLLOW_UP' };
    }
    if (this.isAboutVenue(message)) {
      return { type: 'ASK_VENUE', contextType: 'FOLLOW_UP' };
    }
    if (this.isAboutArtist(message)) {
      return { type: 'ASK_ARTIST', contextType: 'FOLLOW_UP' };
    }
  
    // 預設為一般後續問題
    return { type: 'FOLLOW_UP_QUESTION', question: message };
  }
  
  // 關鍵改進:不再依賴複雜的文字分析
  private isQuickReplyAction(message: string): boolean {
    // Quick Reply 按鈕有特殊標記
    return message.startsWith('⏰') || 
           message.startsWith('👤') || 
           message.startsWith('💰') || 
           message.startsWith('📍') ||
           message.startsWith('🏠'); // 回到主選單
  }
}
```

### 3.4 OPENTIX Data Service (改進版)

```typescript
class OpentixDataService {
  private baseUrl = 'https://www.opentix.life';
  
  // 方案 A: 反向工程 API (推薦)
  async searchEventsViaAPI(query: string): Promise<Event[]> {
    // 觀察 OPENTIX App/網站的網路請求
    // 找到實際的 API endpoint
    const response = await fetch(`${this.baseUrl}/api/events/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OPENTIX/2.141.212 (Android)',
      },
      body: JSON.stringify({
        keyword: query,
        limit: 20
      })
    });
  
    return response.json();
  }
  
  // 方案 B: 智慧爬蟲 + 快取
  async searchEventsWithCrawler(query: string): Promise<Event[]> {
    // 先檢查快取
    const cached = await this.cache.get(`search:${query}`);
    if (cached) return cached;
  
    // 使用 Playwright 處理動態內容
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
  
    await page.goto(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
  
    // 等待資料載入
    await page.waitForSelector('.event-card', { timeout: 5000 });
  
    // 提取資料
    const events = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.event-card')).map(card => ({
        title: card.querySelector('.title')?.textContent,
        date: card.querySelector('.date')?.textContent,
        venue: card.querySelector('.venue')?.textContent,
        price: card.querySelector('.price')?.textContent,
        url: card.querySelector('a')?.href
      }));
    });
  
    await browser.close();
  
    // 快取結果 (1小時)
    await this.cache.set(`search:${query}`, events, 3600);
  
    return events;
  }
  
  // 取得演出詳情
  async getEventDetails(eventId: string): Promise<EventDetails> {
    // 先檢查快取
    const cached = await this.cache.get(`event:${eventId}`);
    if (cached) return cached;
  
    // 爬取或 API 呼叫
    const details = await this.fetchEventDetails(eventId);
  
    // 快取結果 (30分鐘)
    await this.cache.set(`event:${eventId}`, details, 1800);
  
    return details;
  }
  
  // 取得熱門演出 (預先快取)
  async getHotEvents(): Promise<Event[]> {
    const cached = await this.cache.get('hot:events');
    if (cached) return cached;
  
    const events = await this.fetchHotEvents();
  
    // 快取結果 (4小時)
    await this.cache.set('hot:events', events, 14400);
  
    return events;
  }
}
```

### 3.5 Response Generator with LINE Features

```typescript
class ResponseGenerator {
  // 產生 Flex Message 卡片
  generateEventCard(event: Event): FlexMessage {
    return {
      type: 'flex',
      altText: event.title,
      contents: {
        type: 'bubble',
        hero: {
          type: 'image',
          url: event.imageUrl,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover'
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: event.title,
              weight: 'bold',
              size: 'xl',
              wrap: true
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: '📅', size: 'sm', color: '#aaaaaa' },
                    { type: 'text', text: event.date, size: 'sm', color: '#666666', margin: 'sm', wrap: true }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: '📍', size: 'sm', color: '#aaaaaa' },
                    { type: 'text', text: event.venue, size: 'sm', color: '#666666', margin: 'sm', wrap: true }
                  ]
                },
                {
                  type: 'box',
                  layout: 'baseline',
                  contents: [
                    { type: 'text', text: '💰', size: 'sm', color: '#aaaaaa' },
                    { type: 'text', text: event.priceRange, size: 'sm', color: '#666666', margin: 'sm' }
                  ]
                }
              ]
            }
          ]
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '🎫 立即購票',
                uri: event.ticketUrl
              },
              style: 'primary',
              color: '#e74c3c'
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '💬 了解更多',
                data: `action=select_event&id=${event.id}`
              },
              style: 'link'
            }
          ]
        }
      }
    };
  }
  
  // 產生 Carousel (多個演出)
  generateEventCarousel(events: Event[]): FlexMessage {
    return {
      type: 'flex',
      altText: '搜尋結果',
      contents: {
        type: 'carousel',
        contents: events.slice(0, 10).map(event => this.generateEventCard(event).contents)
      }
    };
  }
  
  // 動態 Quick Reply 生成
  generateQuickReply(state: ConversationState, context: SessionContext): QuickReply {
    switch (state) {
      case ConversationState.IDLE:
        return {
          items: [
            { type: 'action', action: { type: 'message', label: '🔥 熱門演出', text: '熱門演出' } },
            { type: 'action', action: { type: 'message', label: '📅 本週演出', text: '本週演出' } },
            { type: 'action', action: { type: 'message', label: '❓ 如何購票', text: '如何購票' } },
            { type: 'action', action: { type: 'message', label: '🔄 退票政策', text: '退票政策' } },
            { type: 'action', action: { type: 'message', label: '🌐 語言', text: 'Language' } }
          ]
        };
  
      case ConversationState.EVENT_SELECTED:
        const event = context.selectedEvent;
        return {
          items: [
            { type: 'action', action: { type: 'message', label: '⏰ 演出時間', text: '⏰ 演出時間' } },
            { type: 'action', action: { type: 'message', label: '👤 演出者', text: '👤 演出者' } },
            { type: 'action', action: { type: 'message', label: '💰 票價', text: '💰 票價' } },
            { type: 'action', action: { type: 'message', label: '📍 地點', text: '📍 地點' } },
            { type: 'action', action: { type: 'uri', label: '🎫 購票', uri: event.ticketUrl } },
            { type: 'action', action: { type: 'message', label: '🏠 主選單', text: '🏠 回到主選單' } }
          ]
        };
  
      case ConversationState.EVENT_LIST:
        return {
          items: [
            { type: 'action', action: { type: 'message', label: '🔍 重新搜尋', text: '🔍 搜尋其他演出' } },
            { type: 'action', action: { type: 'message', label: '🔥 熱門演出', text: '熱門演出' } },
            { type: 'action', action: { type: 'message', label: '🏠 主選單', text: '🏠 回到主選單' } }
          ]
        };
  
      default:
        return this.generateQuickReply(ConversationState.IDLE, context);
    }
  }
}
```

### 3.6 Rich Menu 設計

```typescript
// Rich Menu 設定
const richMenu = {
  size: {
    width: 2500,
    height: 1686
  },
  selected: true,
  name: 'OPENTIX 主選單',
  chatBarText: '選單',
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: 'message', text: '🔥 熱門演出' }
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: 'message', text: '🔍 搜尋演出' }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: 'message', text: '📅 本週演出' }
    },
    {
      bounds: { x: 0, y: 843, width: 833, height: 843 },
      action: { type: 'uri', uri: 'https://www.opentix.life' }
    },
    {
      bounds: { x: 833, y: 843, width: 834, height: 843 },
      action: { type: 'message', text: '❓ 客服幫助' }
    },
    {
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: { type: 'message', text: '👤 我的帳戶' }
    }
  ]
};
```

---

## 四、實作重點

### 4.1 解決後續問題判斷

**核心原則:**

* 使用狀態而非複雜的文字分析
* 當用戶選擇/查看某個演出後,進入 `EVENT_SELECTED` 狀態
* 在此狀態下,**所有問題都自動視為關於該演出的後續問題**
* 不需要分析問題是否包含演出名稱

```typescript
async handleMessage(session: Session, message: string): Promise<Response> {
  // 檢查 Quick Reply 標記
  if (message.startsWith('⏰') || message.startsWith('👤') || message.startsWith('💰') || message.startsWith('📍')) {
    // 這是 Quick Reply 按鈕,從上下文回答
    return this.answerFromContext(session, message);
  }
  
  // 檢查全域指令
  if (message === '🏠 回到主選單') {
    await this.sessionManager.clearSession(session.userId);
    return this.generateMainMenu();
  }
  
  // 基於狀態處理
  if (session.state === ConversationState.EVENT_SELECTED) {
    // 直接從上下文回答,不進行新搜尋
    return this.answerAboutSelectedEvent(session, message);
  }
  
  // 其他狀態的處理...
}
```

### 4.2 LLM 整合最佳實踐class LLMService {

# Line Chatbot 回覆邏輯設計文件

## 🎯 系統架構概覽

```
使用者訊息 → Intent 識別 → 路由決策 → 回覆生成 → Line API 發送
                ↓
         [規則式] or [LLM]
                ↓
    [Quick Reply] / [Carousel] / [Flex Message]
```

---

## 📋 Intent 分類系統

### 核心 Intent 定義

```typescript
enum Intent {
  // 演唱會查詢類
  SEARCH_CONCERT = 'search_concert',
  VIEW_CONCERT_DETAIL = 'view_concert_detail',
  CHECK_SEAT_PRICE = 'check_seat_price',
  
  // 票務操作類
  HOW_TO_BUY = 'how_to_buy',
  REFUND_POLICY = 'refund_policy',
  PAYMENT_METHOD = 'payment_method',
  
  // 功能導航類
  SHOW_MENU = 'show_menu',
  GET_HELP = 'get_help',
  MY_FAVORITES = 'my_favorites',
  
  // 推薦類
  RECOMMEND_CONCERT = 'recommend_concert',
  TRENDING_EVENTS = 'trending_events',
  
  // 其他
  CHITCHAT = 'chitchat',
  UNKNOWN = 'unknown',
}

interface IntentDetectionRule {
  intent: Intent;
  keywords: string[];
  patterns?: RegExp[];
  priority: number;
}

const INTENT_RULES: IntentDetectionRule[] = [
  {
    intent: Intent.SEARCH_CONCERT,
    keywords: ['演唱會', '音樂會', '演出', '表演', '找', '搜尋', '查詢'],
    patterns: [/有.*演唱會/, /.*演出時間/],
    priority: 10,
  },
  {
    intent: Intent.HOW_TO_BUY,
    keywords: ['怎麼買', '如何購票', '購票流程', '買票'],
    priority: 9,
  },
  {
    intent: Intent.REFUND_POLICY,
    keywords: ['退票', '退款', '取消', '改期'],
    priority: 9,
  },
  {
    intent: Intent.SHOW_MENU,
    keywords: ['選單', '功能', '幫助', '開始'],
    priority: 8,
  },
  // ... 更多規則
];
```

---

## 🧠 Intent 識別流程

```typescript
// services/intent-detector.ts
export class IntentDetector {
  /**
   * 混合式 Intent 識別：規則優先 + LLM 輔助
   */
  async detectIntent(
    message: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    // Step 1: 規則式快速匹配（優先）
    const ruleBasedIntent = this.matchByRules(message);
    if (ruleBasedIntent.confidence > 0.8) {
      return ruleBasedIntent;
    }

    // Step 2: 檢查對話脈絡
    const contextIntent = this.inferFromContext(message, context);
    if (contextIntent) {
      return contextIntent;
    }

    // Step 3: LLM 語義理解（複雜查詢）
    if (this.needsLLMUnderstanding(message)) {
      return await this.detectByLLM(message, context);
    }

    return { intent: Intent.UNKNOWN, confidence: 0 };
  }

  private matchByRules(message: string): IntentResult {
    for (const rule of INTENT_RULES) {
      // 關鍵字匹配
      const keywordMatch = rule.keywords.some(kw => message.includes(kw));
    
      // 正則匹配
      const patternMatch = rule.patterns?.some(p => p.test(message));

      if (keywordMatch || patternMatch) {
        return {
          intent: rule.intent,
          confidence: 0.9,
          matchedBy: 'rule',
        };
      }
    }
    return { intent: Intent.UNKNOWN, confidence: 0 };
  }

  private inferFromContext(
    message: string,
    context: ConversationContext
  ): IntentResult | null {
    const { currentTopic, lastIntent } = context;

    // 如果上一輪在討論某場演唱會，且使用者回覆「購票」
    if (lastIntent === Intent.VIEW_CONCERT_DETAIL) {
      if (['購票', '買票', '我要買'].some(kw => message.includes(kw))) {
        return {
          intent: Intent.HOW_TO_BUY,
          confidence: 0.85,
          matchedBy: 'context',
        };
      }
    }

    return null;
  }

  private needsLLMUnderstanding(message: string): boolean {
    // 複雜查詢需要 LLM
    return (
      message.length > 20 ||
      message.includes('?') ||
      message.includes('推薦') ||
      /有沒有.*適合/.test(message)
    );
  }

  private async detectByLLM(
    message: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    const prompt = `判斷使用者意圖，只回傳 JSON：

使用者訊息：「${message}」

對話歷史：
${context.recentMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

可能的意圖：
- search_concert: 搜尋演唱會
- how_to_buy: 詢問購票流程
- refund_policy: 詢問退票政策
- recommend_concert: 要求推薦
- chitchat: 閒聊
- unknown: 無法判斷

回傳格式：
{"intent": "search_concert", "confidence": 0.9, "entities": {"artist": "周杰倫"}}`;

    try {
      const response = await geminiClient.generateContent(prompt);
      const result = JSON.parse(response.text());
      return {
        ...result,
        matchedBy: 'llm',
      };
    } catch (error) {
      logger.error('LLM intent detection failed:', error);
      return { intent: Intent.UNKNOWN, confidence: 0 };
    }
  }
}
```

---

## 🎭 回覆生成策略

### 策略模式設計

```typescript
// services/response-generator.ts
export class ResponseGenerator {
  private strategies: Map<Intent, ResponseStrategy>;

  constructor() {
    this.strategies = new Map([
      [Intent.SEARCH_CONCERT, new SearchConcertStrategy()],
      [Intent.VIEW_CONCERT_DETAIL, new ConcertDetailStrategy()],
      [Intent.HOW_TO_BUY, new HowToBuyStrategy()],
      [Intent.SHOW_MENU, new MenuStrategy()],
      [Intent.RECOMMEND_CONCERT, new RecommendStrategy()],
      [Intent.CHITCHAT, new ChitchatStrategy()],
    ]);
  }

  async generate(
    intent: Intent,
    message: string,
    context: ConversationContext
  ): Promise<LineMessage[]> {
    const strategy = this.strategies.get(intent);
  
    if (!strategy) {
      return this.getFallbackResponse();
    }

    try {
      return await strategy.execute(message, context);
    } catch (error) {
      logger.error(`Strategy execution failed for ${intent}:`, error);
      return this.getErrorResponse(intent);
    }
  }
}
```

---

## 📱 各類 Intent 回覆模板

### 1. 選單 (SHOW_MENU)

```typescript
class MenuStrategy implements ResponseStrategy {
  execute(): LineMessage[] {
    return [
      {
        type: 'text',
        text: '🎵 演唱會購票小幫手\n\n請選擇您需要的服務：',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔍 搜尋演唱會',
                text: '搜尋演唱會',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔥 本週熱門',
                text: '本週熱門演出',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '💡 推薦給我',
                text: '推薦演唱會給我',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '❓ 如何購票',
                text: '如何購票',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '⭐ 我的收藏',
                text: '查看我的收藏',
              },
            },
          ],
        },
      },
    ];
  }
}
```

### 2. 搜尋演唱會 (SEARCH_CONCERT)

```typescript
class SearchConcertStrategy implements ResponseStrategy {
  async execute(message: string, context: ConversationContext): Promise<LineMessage[]> {
    // Step 1: 從訊息中提取實體
    const entities = await this.extractEntities(message, context);
  
    // Step 2: 查詢資料庫（模擬）
    const concerts = await this.searchConcerts(entities);

    if (concerts.length === 0) {
      return this.getNoResultsResponse(entities);
    }

    if (concerts.length === 1) {
      return this.getSingleResultResponse(concerts[0]);
    }

    return this.getMultipleResultsCarousel(concerts);
  }

  private async extractEntities(
    message: string,
    context: ConversationContext
  ): Promise<SearchEntities> {
    // 使用 LLM 提取結構化資訊
    const prompt = `從使用者查詢中提取演唱會搜尋條件，回傳 JSON：

查詢：「${message}」

需提取：
- artist: 藝人名稱
- genre: 音樂類型（流行/搖滾/古典/爵士）
- dateRange: 日期範圍（本週/本月/下月）
- location: 地點（台北/台中/高雄）

範例：
輸入："有沒有五月天的演唱會"
輸出：{"artist": "五月天", "genre": null, "dateRange": null, "location": null}

輸入："下個月台北有什麼流行音樂演唱會"
輸出：{"artist": null, "genre": "流行", "dateRange": "下月", "location": "台北"}`;

    try {
      const response = await geminiClient.generateContent(prompt);
      return JSON.parse(response.text());
    } catch (error) {
      // 降級：使用簡單關鍵字提取
      return this.extractEntitiesByKeywords(message);
    }
  }

  private getMultipleResultsCarousel(concerts: Concert[]): LineMessage[] {
    return [
      {
        type: 'text',
        text: `找到 ${concerts.length} 場演唱會：`,
      },
      {
        type: 'template',
        altText: '演唱會列表',
        template: {
          type: 'carousel',
          columns: concerts.slice(0, 10).map(concert => ({
            thumbnailImageUrl: concert.imageUrl,
            title: concert.artist,
            text: `${concert.date}\n${concert.venue}\n${concert.priceRange}`,
            actions: [
              {
                type: 'postback',
                label: '查看詳情',
                data: `action=view_detail&concertId=${concert.id}`,
                displayText: `查看 ${concert.artist} 詳情`,
              },
              {
                type: 'uri',
                label: '前往購票',
                uri: concert.ticketUrl,
              },
              {
                type: 'postback',
                label: '⭐ 加入收藏',
                data: `action=add_favorite&concertId=${concert.id}`,
                displayText: '已加入收藏',
              },
            ],
          })),
        },
      },
      {
        type: 'text',
        text: '需要更多資訊嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '看更多場次',
                text: '顯示更多演唱會',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '重新搜尋',
                text: '重新搜尋演唱會',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '篩選條件',
                text: '我想加入篩選條件',
              },
            },
          ],
        },
      },
    ];
  }
}
```

### 3. 演唱會詳情 (VIEW_CONCERT_DETAIL)

```typescript
class ConcertDetailStrategy implements ResponseStrategy {
  async execute(message: string, context: ConversationContext): Promise<LineMessage[]> {
    const concertId = this.extractConcertId(message, context);
    const concert = await this.getConcertDetail(concertId);

    return [
      this.buildFlexMessage(concert),
      {
        type: 'text',
        text: '還有什麼可以幫您的嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'uri',
                label: '🎫 立即購票',
                uri: concert.ticketUrl,
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🗺️ 場館資訊',
                text: `${concert.venue}怎麼去`,
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '💰 票價資訊',
                text: `${concert.artist}票價`,
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '↩️ 退票政策',
                text: '退票政策',
              },
            },
          ],
        },
      },
    ];
  }

  private buildFlexMessage(concert: Concert): LineMessage {
    return {
      type: 'flex',
      altText: `${concert.artist} 演唱會詳情`,
      contents: {
        type: 'bubble',
        hero: {
          type: 'image',
          url: concert.imageUrl,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: concert.artist,
              weight: 'bold',
              size: 'xl',
              color: '#1DB446',
            },
            {
              type: 'text',
              text: concert.title,
              size: 'md',
              margin: 'md',
              wrap: true,
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                this.createInfoRow('📅', '日期', concert.date),
                this.createInfoRow('🕐', '時間', concert.time),
                this.createInfoRow('📍', '地點', concert.venue),
                this.createInfoRow('💵', '票價', concert.priceRange),
                this.createInfoRow('🎟️', '販售狀態', concert.saleStatus),
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '前往 Opentix 購票',
                uri: concert.ticketUrl,
              },
            },
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'postback',
                label: '加入提醒',
                data: `action=add_reminder&concertId=${concert.id}`,
              },
            },
          ],
        },
      },
    };
  }

  private createInfoRow(icon: string, label: string, value: string) {
    return {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        {
          type: 'text',
          text: icon,
          flex: 0,
          size: 'sm',
        },
        {
          type: 'text',
          text: label,
          color: '#aaaaaa',
          size: 'sm',
          flex: 2,
        },
        {
          type: 'text',
          text: value,
          wrap: true,
          color: '#666666',
          size: 'sm',
          flex: 5,
        },
      ],
    };
  }
}
```

### 4. 購票流程說明 (HOW_TO_BUY)

```typescript
class HowToBuyStrategy implements ResponseStrategy {
  execute(): LineMessage[] {
    return [
      {
        type: 'flex',
        altText: '購票流程說明',
        contents: {
          type: 'carousel',
          contents: [
            this.createStepBubble(
              '步驟 1',
              '註冊 Opentix 會員',
              '前往官網完成會員註冊，建議先綁定信用卡以加快結帳速度。',
              'https://www.opentix.life/register',
              '#FF6B6B'
            ),
            this.createStepBubble(
              '步驟 2',
              '搜尋演唱會',
              '在首頁搜尋欄輸入藝人或演出名稱，查看詳細資訊。',
              'https://www.opentix.life/search',
              '#4ECDC4'
            ),
            this.createStepBubble(
              '步驟 3',
              '選擇座位與票種',
              '點擊「立即購票」，選擇場次、票種和座位（若為自由座則選數量）。',
              'https://www.opentix.life/guide',
              '#45B7D1'
            ),
            this.createStepBubble(
              '步驟 4',
              '完成付款',
              '確認訂單後進行付款，支援信用卡、ATM、超商付款等方式。',
              'https://www.opentix.life/payment',
              '#96CEB4'
            ),
            this.createStepBubble(
              '步驟 5',
              '取票入場',
              '選擇電子票券或超商取票，演出當天憑票入場即可！',
              'https://www.opentix.life/ticket',
              '#FFEAA7'
            ),
          ],
        },
      },
      {
        type: 'text',
        text: '💡 小提示：熱門演出建議提前登入、填好資料，開賣時才能快速搶票！',
      },
      {
        type: 'text',
        text: '還有其他問題嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '付款方式',
                text: '有哪些付款方式',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '退票規定',
                text: '退票政策',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '搶票技巧',
                text: '搶票有什麼技巧',
              },
            },
          ],
        },
      },
    ];
  }

  private createStepBubble(
    step: string,
    title: string,
    description: string,
    url: string,
    color: string
  ) {
    return {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: step,
            size: 'sm',
            color: '#999999',
          },
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'xl',
            margin: 'md',
            color: color,
          },
          {
            type: 'text',
            text: description,
            size: 'sm',
            wrap: true,
            margin: 'md',
            color: '#666666',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '了解更多',
              uri: url,
            },
            style: 'link',
            height: 'sm',
          },
        ],
      },
    };
  }
}
```

### 5. AI 推薦 (RECOMMEND_CONCERT)

```typescript
class RecommendStrategy implements ResponseStrategy {
  async execute(
    message: string,
    context: ConversationContext
  ): Promise<LineMessage[]> {
    // Step 1: 收集使用者偏好
    const userProfile = await this.getUserProfile(context.userId);
  
    // Step 2: LLM 生成推薦理由
    const recommendations = await this.generateRecommendations(
      message,
      userProfile,
      context
    );

    return [
      {
        type: 'text',
        text: '🎯 根據您的喜好，我推薦以下演唱會：',
      },
      ...this.buildRecommendationCards(recommendations),
      {
        type: 'text',
        text: '這些推薦符合您的期待嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '👍 很棒',
                text: '推薦很棒',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔄 換一批',
                text: '推薦其他的',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '✏️ 修改偏好',
                text: '我想修改音樂偏好',
              },
            },
          ],
        },
      },
    ];
  }

  private async generateRecommendations(
    message: string,
    userProfile: UserProfile,
    context: ConversationContext
  ): Promise<Recommendation[]> {
    const prompt = `你是演唱會推薦專家，根據使用者資訊推薦適合的演出。

使用者資訊：
- 歷史收藏：${userProfile.favorites.join(', ')}
- 偏好類型：${userProfile.preferredGenres.join(', ')}
- 年齡層：${userProfile.ageGroup}
- 地區：${userProfile.location}

使用者需求：「${message}」

可推薦的演唱會清單：
${this.getConcertList()}

請分析並推薦 3 場最適合的演唱會，並說明推薦理由。

回傳 JSON 格式：
[
  {
    "concertId": "123",
    "matchScore": 0.95,
    "reason": "您收藏過五月天，這是他們的最新巡演"
  },
  ...
]`;

    try {
      const response = await geminiClient.generateContent(prompt);
      return JSON.parse(response.text());
    } catch (error) {
      // 降級：使用協同過濾
      return this.getCollaborativeRecommendations(userProfile);
    }
  }
}
```

---

## 🔄 對話流程控制

### 狀態機設計

```typescript
// services/conversation-flow.ts
export class ConversationFlowManager {
  private states: Map<string, ConversationState>;

  async handleMessage(
    userId: string,
    message: string
  ): Promise<LineMessage[]> {
    const state = await this.getOrCreateState(userId);

    // 檢查是否在特定流程中
    if (state.currentFlow) {
      return this.continueFlow(state, message);
    }

    // 一般對話處理
    const intent = await intentDetector.detectIntent(message, state.context);
    const responses = await responseGenerator.generate(intent, message, state.context);

    // 更新狀態
    await this.updateState(userId, {
      lastIntent: intent,
      lastMessage: message,
      timestamp: new Date(),
    });

    return responses;
  }

  private async continueFlow(
    state: ConversationState,
    message: string
  ): Promise<LineMessage[]> {
    const flow = state.currentFlow;

    switch (flow.type) {
      case 'ticket_booking':
        return this.handleBookingFlow(state, message);
    
      case 'preference_setup':
        return this.handlePreferenceFlow(state, message);
    
      case 'multi_step_search':
        return this.handleSearchFlow(state, message);
    }
  }

  private async handleSearchFlow(
    state: ConversationState,
    message: string
  ): Promise<LineMessage[]> {
    const { step, data } = state.currentFlow;

    switch (step) {
      case 1: // 詢問音樂類型
        data.genre = message;
        state.currentFlow.step = 2;
        return [
          {
            type: 'text',
            text: `好的，${message}音樂！請問您想在哪個地區觀看演出呢？`,
            quickReply: {
              items: [
                { type: 'action', action: { type: 'message', label: '台北', text: '台北' } },
                { type: 'action', action: { type: 'message', label: '台中', text: '台中' } },
                { type: 'action', action: { type: 'message', label: '高雄', text: '高雄' } },
                { type: 'action', action: { type: 'message', label: '不限', text: '不限地區' } },
              ],
            },
          },
        ];

      case 2: // 詢問地點
        data.location = message;
        state.currentFlow.step = 3;
        return [
          {
            type: 'text',
            text: '最後，您的預算範圍是？',
            quickReply: {
              items: [
                { type: 'action', action: { type: 'message', label: '1000以下', text: '1000以下' } },
                { type: 'action', action: { type: 'message', label: '1000-3000', text: '1000-3000' } },
                { type: 'action', action: { type: 'message', label: '3000以上', text: '3000以上' } },
                { type: 'action', action: { type: 'message', label: '不限', text: '預算不限' } },
              ],
            },
          },
        ];

      case 3: // 完成搜尋
        data.budget = message;
        state.currentFlow = null; // 結束流程
      
        // 執行搜尋
        const concerts = await this.searchWithFilters(data);
        return new SearchConcertStrategy().getMultipleResultsCarousel(concerts);
    }
  }
}
```

---

## 🤖 Gemini LLM 整合

### Prompt 優化設計

```typescript
// lib/llm/gemini-client.ts
export class GeminiClient {
  private model: GenerativeModel;
  private systemPrompt: string;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: this.buildSystemPrompt(),
    });
  }

  private buildSystemPrompt(): string {
    return `# 角色定義
你是「演唱會購票小幫手」，專門協助使用者查詢與購買演唱會票券。

# 知識庫
- 票務平台：Opentix（台灣主要藝文票務平台）
- 服務範圍：演唱會、音樂會、戲
```


```typescript
  async generateResponse(
    query: string,
    context: {
      state: ConversationState;
      selectedEvent?: Event;
      searchResults?: Event[];
      history?: Message[];
    }
  ): Promise<string> {
    // 根據狀態構建不同的 prompt
    let systemPrompt = '';
    let contextInfo = '';
  
    if (context.state === ConversationState.EVENT_SELECTED && context.selectedEvent) {
      systemPrompt = `你是 OPENTIX 的客服助理。用戶正在詢問關於「${context.selectedEvent.title}」的問題。
請基於以下演出資訊回答用戶的問題,回答要簡潔、友善、專業。

演出資訊:
- 名稱: ${context.selectedEvent.title}
- 時間: ${context.selectedEvent.dateTime}
- 地點: ${context.selectedEvent.venue}
- 票價: ${context.selectedEvent.priceRange}
- 演出者: ${context.selectedEvent.artists?.join(', ')}
- 詳細說明: ${context.selectedEvent.description}`;
    } else {
      systemPrompt = `你是 OPENTIX 的客服助理。請友善、專業地回答用戶的問題。
如果問題不在你的知識範圍內,請引導用戶到 OPENTIX 網站或客服信箱。`;
  
      if (context.searchResults?.length > 0) {
        contextInfo = `\n\n搜尋結果:\n${context.searchResults.map((e, i) => 
          `${i+1}. ${e.title} - ${e.date} @ ${e.venue}`
        ).join('\n')}`;
      }
    }
  
    const response = await this.gemini.generate({
      model: 'gemini-pro',
      prompt: systemPrompt + '\n\n' + contextInfo + '\n\n用戶問題: ' + query,
      maxTokens: 500,
      temperature: 0.7
    });
  
    return response.text;
  }
}
```

### 4.3 錯誤處理與降級方案

```typescript
class RobustOpentixService {
  async searchEvents(query: string): Promise<Event[]> {
    try {
      // 方案 1: API 呼叫
      return await this.searchViaAPI(query);
    } catch (error) {
      console.error('API search failed:', error);
  
      try {
        // 方案 2: 爬蟲
        return await this.searchViaCrawler(query);
      } catch (crawlerError) {
        console.error('Crawler search failed:', crawlerError);
  
        // 方案 3: 從快取中搜尋
        return await this.searchFromCache(query);
      }
    }
  }
  
  private async searchFromCache(query: string): Promise<Event[]> {
    // 從預先快取的熱門演出中模糊搜尋
    const hotEvents = await this.cache.get('hot:events') || [];
    return hotEvents.filter(event => 
      event.title.includes(query) || 
      event.artists?.some(a => a.includes(query))
    );
  }
}
```

---

## 五、資料庫 Schema

```sql
-- 使用者 session
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL DEFAULT 'IDLE',
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 快取的演出資料
CREATE TABLE cached_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  data JSONB NOT NULL,
  cache_type TEXT NOT NULL, -- 'hot', 'search', 'detail'
  cache_key TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_cache_key (cache_type, cache_key),
  INDEX idx_expires (expires_at)
);

-- 對話歷史 (用於分析和改進)
CREATE TABLE conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'user', 'bot'
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_time (user_id, created_at)
);

-- FAQ 資料
CREATE TABLE faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[], -- 用於匹配
  language TEXT DEFAULT 'zh-TW',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 六、部署與監控

### 6.1 環境變數設定

```env
# Line Chatbot 回覆邏輯設計文件

## 🎯 系統架構概覽

```

使用者訊息 → Intent 識別 → 路由決策 → 回覆生成 → Line API 發送
                ↓
         [規則式] or [LLM]
                ↓
    [Quick Reply] / [Carousel] / [Flex Message]

```

---

## 📋 Intent 分類系統

### 核心 Intent 定義

```typescript
enum Intent {
  // 演唱會查詢類
  SEARCH_CONCERT = 'search_concert',
  VIEW_CONCERT_DETAIL = 'view_concert_detail',
  CHECK_SEAT_PRICE = 'check_seat_price',
  
  // 票務操作類
  HOW_TO_BUY = 'how_to_buy',
  REFUND_POLICY = 'refund_policy',
  PAYMENT_METHOD = 'payment_method',
  
  // 功能導航類
  SHOW_MENU = 'show_menu',
  GET_HELP = 'get_help',
  MY_FAVORITES = 'my_favorites',
  
  // 推薦類
  RECOMMEND_CONCERT = 'recommend_concert',
  TRENDING_EVENTS = 'trending_events',
  
  // 其他
  CHITCHAT = 'chitchat',
  UNKNOWN = 'unknown',
}

interface IntentDetectionRule {
  intent: Intent;
  keywords: string[];
  patterns?: RegExp[];
  priority: number;
}

const INTENT_RULES: IntentDetectionRule[] = [
  {
    intent: Intent.SEARCH_CONCERT,
    keywords: ['演唱會', '音樂會', '演出', '表演', '找', '搜尋', '查詢'],
    patterns: [/有.*演唱會/, /.*演出時間/],
    priority: 10,
  },
  {
    intent: Intent.HOW_TO_BUY,
    keywords: ['怎麼買', '如何購票', '購票流程', '買票'],
    priority: 9,
  },
  {
    intent: Intent.REFUND_POLICY,
    keywords: ['退票', '退款', '取消', '改期'],
    priority: 9,
  },
  {
    intent: Intent.SHOW_MENU,
    keywords: ['選單', '功能', '幫助', '開始'],
    priority: 8,
  },
  // ... 更多規則
];
```

---

## 🧠 Intent 識別流程

```typescript
// services/intent-detector.ts
export class IntentDetector {
  /**
   * 混合式 Intent 識別：規則優先 + LLM 輔助
   */
  async detectIntent(
    message: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    // Step 1: 規則式快速匹配（優先）
    const ruleBasedIntent = this.matchByRules(message);
    if (ruleBasedIntent.confidence > 0.8) {
      return ruleBasedIntent;
    }

    // Step 2: 檢查對話脈絡
    const contextIntent = this.inferFromContext(message, context);
    if (contextIntent) {
      return contextIntent;
    }

    // Step 3: LLM 語義理解（複雜查詢）
    if (this.needsLLMUnderstanding(message)) {
      return await this.detectByLLM(message, context);
    }

    return { intent: Intent.UNKNOWN, confidence: 0 };
  }

  private matchByRules(message: string): IntentResult {
    for (const rule of INTENT_RULES) {
      // 關鍵字匹配
      const keywordMatch = rule.keywords.some(kw => message.includes(kw));
  
      // 正則匹配
      const patternMatch = rule.patterns?.some(p => p.test(message));

      if (keywordMatch || patternMatch) {
        return {
          intent: rule.intent,
          confidence: 0.9,
          matchedBy: 'rule',
        };
      }
    }
    return { intent: Intent.UNKNOWN, confidence: 0 };
  }

  private inferFromContext(
    message: string,
    context: ConversationContext
  ): IntentResult | null {
    const { currentTopic, lastIntent } = context;

    // 如果上一輪在討論某場演唱會，且使用者回覆「購票」
    if (lastIntent === Intent.VIEW_CONCERT_DETAIL) {
      if (['購票', '買票', '我要買'].some(kw => message.includes(kw))) {
        return {
          intent: Intent.HOW_TO_BUY,
          confidence: 0.85,
          matchedBy: 'context',
        };
      }
    }

    return null;
  }

  private needsLLMUnderstanding(message: string): boolean {
    // 複雜查詢需要 LLM
    return (
      message.length > 20 ||
      message.includes('?') ||
      message.includes('推薦') ||
      /有沒有.*適合/.test(message)
    );
  }

  private async detectByLLM(
    message: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    const prompt = `判斷使用者意圖，只回傳 JSON：

使用者訊息：「${message}」

對話歷史：
${context.recentMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

可能的意圖：
- search_concert: 搜尋演唱會
- how_to_buy: 詢問購票流程
- refund_policy: 詢問退票政策
- recommend_concert: 要求推薦
- chitchat: 閒聊
- unknown: 無法判斷

回傳格式：
{"intent": "search_concert", "confidence": 0.9, "entities": {"artist": "周杰倫"}}`;

    try {
      const response = await geminiClient.generateContent(prompt);
      const result = JSON.parse(response.text());
      return {
        ...result,
        matchedBy: 'llm',
      };
    } catch (error) {
      logger.error('LLM intent detection failed:', error);
      return { intent: Intent.UNKNOWN, confidence: 0 };
    }
  }
}
```

---

## 🎭 回覆生成策略

### 策略模式設計

```typescript
// services/response-generator.ts
export class ResponseGenerator {
  private strategies: Map<Intent, ResponseStrategy>;

  constructor() {
    this.strategies = new Map([
      [Intent.SEARCH_CONCERT, new SearchConcertStrategy()],
      [Intent.VIEW_CONCERT_DETAIL, new ConcertDetailStrategy()],
      [Intent.HOW_TO_BUY, new HowToBuyStrategy()],
      [Intent.SHOW_MENU, new MenuStrategy()],
      [Intent.RECOMMEND_CONCERT, new RecommendStrategy()],
      [Intent.CHITCHAT, new ChitchatStrategy()],
    ]);
  }

  async generate(
    intent: Intent,
    message: string,
    context: ConversationContext
  ): Promise<LineMessage[]> {
    const strategy = this.strategies.get(intent);
  
    if (!strategy) {
      return this.getFallbackResponse();
    }

    try {
      return await strategy.execute(message, context);
    } catch (error) {
      logger.error(`Strategy execution failed for ${intent}:`, error);
      return this.getErrorResponse(intent);
    }
  }
}
```

---

## 📱 各類 Intent 回覆模板

### 1. 選單 (SHOW_MENU)

```typescript
class MenuStrategy implements ResponseStrategy {
  execute(): LineMessage[] {
    return [
      {
        type: 'text',
        text: '🎵 演唱會購票小幫手\n\n請選擇您需要的服務：',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔍 搜尋演唱會',
                text: '搜尋演唱會',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔥 本週熱門',
                text: '本週熱門演出',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '💡 推薦給我',
                text: '推薦演唱會給我',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '❓ 如何購票',
                text: '如何購票',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '⭐ 我的收藏',
                text: '查看我的收藏',
              },
            },
          ],
        },
      },
    ];
  }
}
```

### 2. 搜尋演唱會 (SEARCH_CONCERT)

```typescript
class SearchConcertStrategy implements ResponseStrategy {
  async execute(message: string, context: ConversationContext): Promise<LineMessage[]> {
    // Step 1: 從訊息中提取實體
    const entities = await this.extractEntities(message, context);
  
    // Step 2: 查詢資料庫（模擬）
    const concerts = await this.searchConcerts(entities);

    if (concerts.length === 0) {
      return this.getNoResultsResponse(entities);
    }

    if (concerts.length === 1) {
      return this.getSingleResultResponse(concerts[0]);
    }

    return this.getMultipleResultsCarousel(concerts);
  }

  private async extractEntities(
    message: string,
    context: ConversationContext
  ): Promise<SearchEntities> {
    // 使用 LLM 提取結構化資訊
    const prompt = `從使用者查詢中提取演唱會搜尋條件，回傳 JSON：

查詢：「${message}」

需提取：
- artist: 藝人名稱
- genre: 音樂類型（流行/搖滾/古典/爵士）
- dateRange: 日期範圍（本週/本月/下月）
- location: 地點（台北/台中/高雄）

範例：
輸入："有沒有五月天的演唱會"
輸出：{"artist": "五月天", "genre": null, "dateRange": null, "location": null}

輸入："下個月台北有什麼流行音樂演唱會"
輸出：{"artist": null, "genre": "流行", "dateRange": "下月", "location": "台北"}`;

    try {
      const response = await geminiClient.generateContent(prompt);
      return JSON.parse(response.text());
    } catch (error) {
      // 降級：使用簡單關鍵字提取
      return this.extractEntitiesByKeywords(message);
    }
  }

  private getMultipleResultsCarousel(concerts: Concert[]): LineMessage[] {
    return [
      {
        type: 'text',
        text: `找到 ${concerts.length} 場演唱會：`,
      },
      {
        type: 'template',
        altText: '演唱會列表',
        template: {
          type: 'carousel',
          columns: concerts.slice(0, 10).map(concert => ({
            thumbnailImageUrl: concert.imageUrl,
            title: concert.artist,
            text: `${concert.date}\n${concert.venue}\n${concert.priceRange}`,
            actions: [
              {
                type: 'postback',
                label: '查看詳情',
                data: `action=view_detail&concertId=${concert.id}`,
                displayText: `查看 ${concert.artist} 詳情`,
              },
              {
                type: 'uri',
                label: '前往購票',
                uri: concert.ticketUrl,
              },
              {
                type: 'postback',
                label: '⭐ 加入收藏',
                data: `action=add_favorite&concertId=${concert.id}`,
                displayText: '已加入收藏',
              },
            ],
          })),
        },
      },
      {
        type: 'text',
        text: '需要更多資訊嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '看更多場次',
                text: '顯示更多演唱會',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '重新搜尋',
                text: '重新搜尋演唱會',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '篩選條件',
                text: '我想加入篩選條件',
              },
            },
          ],
        },
      },
    ];
  }
}
```

### 3. 演唱會詳情 (VIEW_CONCERT_DETAIL)

```typescript
class ConcertDetailStrategy implements ResponseStrategy {
  async execute(message: string, context: ConversationContext): Promise<LineMessage[]> {
    const concertId = this.extractConcertId(message, context);
    const concert = await this.getConcertDetail(concertId);

    return [
      this.buildFlexMessage(concert),
      {
        type: 'text',
        text: '還有什麼可以幫您的嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'uri',
                label: '🎫 立即購票',
                uri: concert.ticketUrl,
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🗺️ 場館資訊',
                text: `${concert.venue}怎麼去`,
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '💰 票價資訊',
                text: `${concert.artist}票價`,
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '↩️ 退票政策',
                text: '退票政策',
              },
            },
          ],
        },
      },
    ];
  }

  private buildFlexMessage(concert: Concert): LineMessage {
    return {
      type: 'flex',
      altText: `${concert.artist} 演唱會詳情`,
      contents: {
        type: 'bubble',
        hero: {
          type: 'image',
          url: concert.imageUrl,
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: concert.artist,
              weight: 'bold',
              size: 'xl',
              color: '#1DB446',
            },
            {
              type: 'text',
              text: concert.title,
              size: 'md',
              margin: 'md',
              wrap: true,
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                this.createInfoRow('📅', '日期', concert.date),
                this.createInfoRow('🕐', '時間', concert.time),
                this.createInfoRow('📍', '地點', concert.venue),
                this.createInfoRow('💵', '票價', concert.priceRange),
                this.createInfoRow('🎟️', '販售狀態', concert.saleStatus),
              ],
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'primary',
              height: 'sm',
              action: {
                type: 'uri',
                label: '前往 Opentix 購票',
                uri: concert.ticketUrl,
              },
            },
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'postback',
                label: '加入提醒',
                data: `action=add_reminder&concertId=${concert.id}`,
              },
            },
          ],
        },
      },
    };
  }

  private createInfoRow(icon: string, label: string, value: string) {
    return {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        {
          type: 'text',
          text: icon,
          flex: 0,
          size: 'sm',
        },
        {
          type: 'text',
          text: label,
          color: '#aaaaaa',
          size: 'sm',
          flex: 2,
        },
        {
          type: 'text',
          text: value,
          wrap: true,
          color: '#666666',
          size: 'sm',
          flex: 5,
        },
      ],
    };
  }
}
```

### 4. 購票流程說明 (HOW_TO_BUY)

```typescript
class HowToBuyStrategy implements ResponseStrategy {
  execute(): LineMessage[] {
    return [
      {
        type: 'flex',
        altText: '購票流程說明',
        contents: {
          type: 'carousel',
          contents: [
            this.createStepBubble(
              '步驟 1',
              '註冊 Opentix 會員',
              '前往官網完成會員註冊，建議先綁定信用卡以加快結帳速度。',
              'https://www.opentix.life/register',
              '#FF6B6B'
            ),
            this.createStepBubble(
              '步驟 2',
              '搜尋演唱會',
              '在首頁搜尋欄輸入藝人或演出名稱，查看詳細資訊。',
              'https://www.opentix.life/search',
              '#4ECDC4'
            ),
            this.createStepBubble(
              '步驟 3',
              '選擇座位與票種',
              '點擊「立即購票」，選擇場次、票種和座位（若為自由座則選數量）。',
              'https://www.opentix.life/guide',
              '#45B7D1'
            ),
            this.createStepBubble(
              '步驟 4',
              '完成付款',
              '確認訂單後進行付款，支援信用卡、ATM、超商付款等方式。',
              'https://www.opentix.life/payment',
              '#96CEB4'
            ),
            this.createStepBubble(
              '步驟 5',
              '取票入場',
              '選擇電子票券或超商取票，演出當天憑票入場即可！',
              'https://www.opentix.life/ticket',
              '#FFEAA7'
            ),
          ],
        },
      },
      {
        type: 'text',
        text: '💡 小提示：熱門演出建議提前登入、填好資料，開賣時才能快速搶票！',
      },
      {
        type: 'text',
        text: '還有其他問題嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '付款方式',
                text: '有哪些付款方式',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '退票規定',
                text: '退票政策',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '搶票技巧',
                text: '搶票有什麼技巧',
              },
            },
          ],
        },
      },
    ];
  }

  private createStepBubble(
    step: string,
    title: string,
    description: string,
    url: string,
    color: string
  ) {
    return {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: step,
            size: 'sm',
            color: '#999999',
          },
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'xl',
            margin: 'md',
            color: color,
          },
          {
            type: 'text',
            text: description,
            size: 'sm',
            wrap: true,
            margin: 'md',
            color: '#666666',
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '了解更多',
              uri: url,
            },
            style: 'link',
            height: 'sm',
          },
        ],
      },
    };
  }
}
```

### 5. AI 推薦 (RECOMMEND_CONCERT)

```typescript
class RecommendStrategy implements ResponseStrategy {
  async execute(
    message: string,
    context: ConversationContext
  ): Promise<LineMessage[]> {
    // Step 1: 收集使用者偏好
    const userProfile = await this.getUserProfile(context.userId);
  
    // Step 2: LLM 生成推薦理由
    const recommendations = await this.generateRecommendations(
      message,
      userProfile,
      context
    );

    return [
      {
        type: 'text',
        text: '🎯 根據您的喜好，我推薦以下演唱會：',
      },
      ...this.buildRecommendationCards(recommendations),
      {
        type: 'text',
        text: '這些推薦符合您的期待嗎？',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '👍 很棒',
                text: '推薦很棒',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔄 換一批',
                text: '推薦其他的',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '✏️ 修改偏好',
                text: '我想修改音樂偏好',
              },
            },
          ],
        },
      },
    ];
  }

  private async generateRecommendations(
    message: string,
    userProfile: UserProfile,
    context: ConversationContext
  ): Promise<Recommendation[]> {
    const prompt = `你是演唱會推薦專家，根據使用者資訊推薦適合的演出。

使用者資訊：
- 歷史收藏：${userProfile.favorites.join(', ')}
- 偏好類型：${userProfile.preferredGenres.join(', ')}
- 年齡層：${userProfile.ageGroup}
- 地區：${userProfile.location}

使用者需求：「${message}」

可推薦的演唱會清單：
${this.getConcertList()}

請分析並推薦 3 場最適合的演唱會，並說明推薦理由。

回傳 JSON 格式：
[
  {
    "concertId": "123",
    "matchScore": 0.95,
    "reason": "您收藏過五月天，這是他們的最新巡演"
  },
  ...
]`;

    try {
      const response = await geminiClient.generateContent(prompt);
      return JSON.parse(response.text());
    } catch (error) {
      // 降級：使用協同過濾
      return this.getCollaborativeRecommendations(userProfile);
    }
  }
}
```

---

## 🔄 對話流程控制

### 狀態機設計

```typescript
// services/conversation-flow.ts
export class ConversationFlowManager {
  private states: Map<string, ConversationState>;

  async handleMessage(
    userId: string,
    message: string
  ): Promise<LineMessage[]> {
    const state = await this.getOrCreateState(userId);

    // 檢查是否在特定流程中
    if (state.currentFlow) {
      return this.continueFlow(state, message);
    }

    // 一般對話處理
    const intent = await intentDetector.detectIntent(message, state.context);
    const responses = await responseGenerator.generate(intent, message, state.context);

    // 更新狀態
    await this.updateState(userId, {
      lastIntent: intent,
      lastMessage: message,
      timestamp: new Date(),
    });

    return responses;
  }

  private async continueFlow(
    state: ConversationState,
    message: string
  ): Promise<LineMessage[]> {
    const flow = state.currentFlow;

    switch (flow.type) {
      case 'ticket_booking':
        return this.handleBookingFlow(state, message);
  
      case 'preference_setup':
        return this.handlePreferenceFlow(state, message);
  
      case 'multi_step_search':
        return this.handleSearchFlow(state, message);
    }
  }

  private async handleSearchFlow(
    state: ConversationState,
    message: string
  ): Promise<LineMessage[]> {
    const { step, data } = state.currentFlow;

    switch (step) {
      case 1: // 詢問音樂類型
        data.genre = message;
        state.currentFlow.step = 2;
        return [
          {
            type: 'text',
            text: `好的，${message}音樂！請問您想在哪個地區觀看演出呢？`,
            quickReply: {
              items: [
                { type: 'action', action: { type: 'message', label: '台北', text: '台北' } },
                { type: 'action', action: { type: 'message', label: '台中', text: '台中' } },
                { type: 'action', action: { type: 'message', label: '高雄', text: '高雄' } },
                { type: 'action', action: { type: 'message', label: '不限', text: '不限地區' } },
              ],
            },
          },
        ];

      case 2: // 詢問地點
        data.location = message;
        state.currentFlow.step = 3;
        return [
          {
            type: 'text',
            text: '最後，您的預算範圍是？',
            quickReply: {
              items: [
                { type: 'action', action: { type: 'message', label: '1000以下', text: '1000以下' } },
                { type: 'action', action: { type: 'message', label: '1000-3000', text: '1000-3000' } },
                { type: 'action', action: { type: 'message', label: '3000以上', text: '3000以上' } },
                { type: 'action', action: { type: 'message', label: '不限', text: '預算不限' } },
              ],
            },
          },
        ];

      case 3: // 完成搜尋
        data.budget = message;
        state.currentFlow = null; // 結束流程
    
        // 執行搜尋
        const concerts = await this.searchWithFilters(data);
        return new SearchConcertStrategy().getMultipleResultsCarousel(concerts);
    }
  }
}
```

---

## 🤖 Gemini LLM 整合

### Prompt 優化設計

```typescript
// lib/llm/gemini-client.ts
export class GeminiClient {
  private model: GenerativeModel;
  private systemPrompt: string;

  constructor() {
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      systemInstruction: this.buildSystemPrompt(),
    });
  }

  private buildSystemPrompt(): string {
    return `# 角色定義
你是「演唱會購票小幫手」，專門協助使用者查詢與購買演唱會票券。

# 知識庫
- 票務平台：Opentix（台灣主要藝文票務平台）
- 服務範圍：演唱會、音樂會、戲劇、展覽等藝文活動
- 購票流程：註冊 → 搜尋 → 選位 → 付款 → 取票
- 付款方式：信用卡、ATM、超商付款
- 取票方式：電子票券、超商取票、宅配

# 回答原則
1. **簡潔明瞭**：避免冗長說明，直接回答重點
2. **結構化輸出**：需要時使用 JSON 格式便於解析
3. **友善語氣**：使用繁體中文，適度加入 emoji
4. **引導行動**：主動提供下一步建議
5. **承認限制**：無法確定時建議聯繫官方

# 限制
- 不能代替使用者完成購票
- 不處理金流或個資
- 不提供未經證實的票價資訊
- 複雜問題建議轉介人工客服

# 輸出格式要求
當需要結構化資料時，只輸出純 JSON，不加任何其他文字或 Markdown 標記。`;
  }

  /**
   * 通用對話生成
   */
  async chat(
    messages: ChatMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'text' | 'json';
    } = {}
  ): Promise<string> {
    const chat = this.model.startChat({
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 1000,
        topP: 0.95,
      },
      history: this.formatHistory(messages),
    });

    try {
      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = result.response.text();

      // 驗證 JSON 格式
      if (options.responseFormat === 'json') {
        JSON.parse(response); // 驗證可解析
      }

      return response;
    } catch (error) {
      logger.error('Gemini API error:', error);
      throw new LLMError('Gemini generation failed', error);
    }
  }

  /**
   * 專門用於 Intent 識別
   */
  async detectIntent(
    message: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    const prompt = `分析使用者意圖並提取實體資訊。

使用者訊息：「${message}」

對話歷史（最近3則）：
${context.recentMessages.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}

當前主題：${context.currentTopic?.artistName || '無'}

回傳純 JSON（不要 markdown 標記）：
{
  "intent": "search_concert | view_concert_detail | how_to_buy | refund_policy | recommend_concert | chitchat | unknown",
  "confidence": 0.0-1.0,
  "entities": {
    "artist": "藝人名稱（如有）",
    "genre": "音樂類型（如有）",
    "location": "地點（如有）",
    "dateRange": "時間範圍（如有）"
  },
  "reasoning": "簡短說明判斷依據"
}`;

    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      { responseFormat: 'json', temperature: 0.3 }
    );

    return JSON.parse(this.cleanJsonResponse(response));
  }

  /**
   * 生成個性化推薦
   */
  async generateRecommendations(
    userProfile: UserProfile,
    availableConcerts: Concert[],
    message?: string
  ): Promise<Recommendation[]> {
    const prompt = `根據使用者資料推薦最適合的演唱會。

## 使用者資料
- 歷史收藏：${userProfile.favorites.join(', ') || '無'}
- 偏好類型：${userProfile.preferredGenres.join(', ') || '未設定'}
- 常看地區：${userProfile.location || '未指定'}
- 年齡層：${userProfile.ageGroup || '未知'}
${message ? `- 特殊需求：「${message}」` : ''}

## 可推薦演唱會
${availableConcerts.map((c, i) => 
  `${i+1}. ${c.artist} - ${c.title}
   類型：${c.genre}
   日期：${c.date}
   地點：${c.venue}
   票價：${c.priceRange}`
).join('\n\n')}

## 任務
從以上清單選出 3 場最適合的演唱會，並說明推薦理由。

## 輸出格式（純 JSON）
[
  {
    "concertId": "演唱會ID",
    "matchScore": 0.95,
    "reason": "推薦理由（一句話，例如：您收藏過五月天，這是他們的最新巡演）",
    "highlights": ["亮點1", "亮點2"]
  }
]

排序規則：matchScore 由高到低`;

    const response = await this.chat(
      [{ role: 'user', content: prompt }],
      { responseFormat: 'json', temperature: 0.6 }
    );

    return JSON.parse(this.cleanJsonResponse(response));
  }

  /**
   * 智能 FAQ 回答
   */
  async answerFAQ(
    question: string,
    context: ConversationContext
  ): Promise<string> {
    const prompt = `回答使用者關於演唱會購票的問題。

問題：「${question}」

對話脈絡：
${context.recentMessages.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')}

## 知識庫參考

### 購票流程
1. 註冊 Opentix 會員（https://www.opentix.life/register）
2. 搜尋想看的演出
3. 選擇場次、座位、票種
4. 填寫購票資訊
5. 選擇付款方式完成結帳
6. 取票（電子票券或超商）

### 退票政策
- 一般演出：演出日前 10 天可退票，收取 10% 手續費
- 特殊演出：依主辦單位規定
- 退票管道：Opentix 官網「訂單查詢」
- 注意：超商取票後無法退票

### 付款方式
- 信用卡：支援 Visa、MasterCard、JCB
- ATM 轉帳：3 天內完成轉帳
- 超商代碼繳費：7-11、全家、萊爾富

### 搶票技巧
- 提前登入並填好資料
- 使用信用卡付款最快
- 開多個分頁同時搶
- 手機 + 電腦雙管齊下
- 避開開賣前 5 分鐘登入（系統壅塞）

## 回答要求
- 直接回答問題，不要重複問題
- 若涉及政策，引用知識庫內容
- 無法確定時建議聯繫官方客服（客服專線：02-3393-9888）
- 回答長度：50-150 字
- 適度使用 emoji 增加親和力

直接輸出回答內容：`;

    return await this.chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.5, maxTokens: 300 }
    );
  }

  /**
   * 閒聊回應
   */
  async handleChitchat(
    message: string,
    context: ConversationContext
  ): Promise<string> {
    const prompt = `你是演唱會購票助手，使用者正在跟你閒聊。

使用者：「${message}」

## 回應原則
- 保持友善、專業的客服形象
- 自然地將話題導回演唱會相關
- 長度控制在 30 字內
- 適度使用 emoji

範例：
使用者：「今天天氣好好」
助手：「對呀！好天氣很適合去看演唱會呢 🎵 要不要我推薦近期的戶外音樂節？」

直接輸出回應：`;

    return await this.chat(
      [{ role: 'user', content: prompt }],
      { temperature: 0.8, maxTokens: 100 }
    );
  }

  /**
   * 清理 JSON 回應（移除 markdown 標記）
   */
  private cleanJsonResponse(response: string): string {
    return response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
  }

  /**
   * 格式化對話歷史
   */
  private formatHistory(messages: ChatMessage[]): any[] {
    return messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }
}
```

---

## 🎯 完整處理流程示例

### 範例 1：使用者搜尋演唱會

```typescript
// 使用者輸入："有沒有周杰倫的演唱會"

async function handleUserMessage(userId: string, text: string) {
  // 1. 載入對話狀態
  const context = await conversationManager.getContext(userId);

  // 2. Intent 識別
  const intentResult = await intentDetector.detectIntent(text, context);
  // Result: { intent: 'search_concert', confidence: 0.95, entities: { artist: '周杰倫' } }

  // 3. 提取實體（使用 LLM）
  const entities = intentResult.entities;

  // 4. 查詢資料庫
  const concerts = await concertRepository.search({
    artist: entities.artist,
    status: 'on_sale',
  });

  // 5. 生成回覆
  let responses: LineMessage[];

  if (concerts.length === 0) {
    // 無結果 → 提供替代方案
    responses = [
      {
        type: 'text',
        text: `目前沒有找到周杰倫的演唱會 😢\n\n要不要看看其他類似的藝人？`,
        quickReply: {
          items: [
            { type: 'action', action: { type: 'message', label: '林俊傑', text: '林俊傑的演唱會' } },
            { type: 'action', action: { type: 'message', label: '五月天', text: '五月天的演唱會' } },
            { type: 'action', action: { type: 'postback', label: '設定提醒', data: 'action=remind&artist=周杰倫' } },
          ],
        },
      },
    ];
  } else {
    // 有結果 → Carousel 展示
    responses = new SearchConcertStrategy().getMultipleResultsCarousel(concerts);
  }

  // 6. 儲存訊息
  await conversationManager.saveMessage(userId, {
    role: 'user',
    content: text,
    timestamp: new Date(),
  });

  await conversationManager.saveMessage(userId, {
    role: 'assistant',
    content: `找到 ${concerts.length} 場周杰倫演唱會`,
    timestamp: new Date(),
    metadata: { intent: intentResult.intent },
  });

  // 7. 更新狀態
  await conversationManager.updateContext(userId, {
    lastIntent: intentResult.intent,
    currentTopic: { artist: '周杰倫' },
  });

  // 8. 發送 Line 訊息
  return await lineClient.replyMessage(replyToken, responses);
}
```

### 範例 2：多輪對話流程

```typescript
// 使用者：「我想找演唱會」
// Bot：「好的！請問您喜歡什麼類型的音樂呢？」[Quick Reply: 流行/搖滾/古典/爵士]

// 使用者：「流行」
// Bot：「好的，流行音樂！請問您想在哪個地區觀看演出呢？」[Quick Reply: 台北/台中/高雄/不限]

// 使用者：「台北」
// Bot：「最後，您的預算範圍是？」[Quick Reply: 1000以下/1000-3000/3000以上/不限]

// 使用者：「1000-3000」
// Bot：[顯示符合條件的 Carousel]

async function handleMultiStepSearch(userId: string, message: string, step: number) {
  const state = await flowManager.getState(userId);

  switch (step) {
    case 0: // 啟動流程
      await flowManager.startFlow(userId, 'multi_step_search');
      return [
        {
          type: 'text',
          text: '好的！讓我幫您找合適的演唱會 🎵\n\n請問您喜歡什麼類型的音樂呢？',
          quickReply: {
            items: [
              { type: 'action', action: { type: 'message', label: '🎤 流行', text: '流行' } },
              { type: 'action', action: { type: 'message', label: '🎸 搖滾', text: '搖滾' } },
              { type: 'action', action: { type: 'message', label: '🎻 古典', text: '古典' } },
              { type: 'action', action: { type: 'message', label: '🎷 爵士', text: '爵士' } },
              { type: 'action', action: { type: 'message', label: '✨ 不限', text: '不限類型' } },
            ],
          },
        },
      ];

    case 1: // 收集類型
      state.flowData.genre = message;
      await flowManager.updateState(userId, { step: 2, flowData: state.flowData });
  
      return [
        {
          type: 'text',
          text: `好的，${message}音樂！🎵\n\n請問您想在哪個地區觀看演出呢？`,
          quickReply: {
            items: [
              { type: 'action', action: { type: 'message', label: '📍 台北', text: '台北' } },
              { type: 'action', action: { type: 'message', label: '📍 台中', text: '台中' } },
              { type: 'action', action: { type: 'message', label: '📍 高雄', text: '高雄' } },
              { type: 'action', action: { type: 'message', label: '🌐 不限', text: '不限地區' } },
            ],
          },
        },
      ];

    case 2: // 收集地點
      state.flowData.location = message;
      await flowManager.updateState(userId, { step: 3, flowData: state.flowData });
  
      return [
        {
          type: 'text',
          text: `了解！最後一個問題：\n您的預算範圍是？💰`,
          quickReply: {
            items: [
              { type: 'action', action: { type: 'message', label: '💵 1000以下', text: '1000以下' } },
              { type: 'action', action: { type: 'message', label: '💵 1000-3000', text: '1000-3000' } },
              { type: 'action', action: { type: 'message', label: '💵 3000以上', text: '3000以上' } },
              { type: 'action', action: { type: 'message', label: '💳 不限', text: '預算不限' } },
            ],
          },
        },
      ];

    case 3: // 完成搜尋
      state.flowData.budget = message;
      await flowManager.completeFlow(userId);
  
      // 執行搜尋
      const concerts = await concertRepository.search({
        genre: state.flowData.genre !== '不限類型' ? state.flowData.genre : undefined,
        location: state.flowData.location !== '不限地區' ? state.flowData.location : undefined,
        priceRange: state.flowData.budget !== '預算不限' ? state.flowData.budget : undefined,
      });

      if (concerts.length === 0) {
        return [
          {
            type: 'text',
            text: '抱歉，找不到完全符合條件的演唱會 😅\n\n要不要放寬一些條件重新搜尋？',
            quickReply: {
              items: [
                { type: 'action', action: { type: 'message', label: '🔄 重新搜尋', text: '重新搜尋演唱會' } },
                { type: 'action', action: { type: 'message', label: '👀 看推薦', text: '推薦演唱會給我' } },
              ],
            },
          },
        ];
      }

      return [
        {
          type: 'text',
          text: `太好了！找到 ${concerts.length} 場符合您條件的演唱會：\n\n📊 ${state.flowData.genre} | 📍 ${state.flowData.location} | 💰 ${state.flowData.budget}`,
        },
        ...new SearchConcertStrategy().getMultipleResultsCarousel(concerts),
      ];
  }
}
```

---

## 🚨 錯誤處理與降級策略

### 降級決策樹

```typescript
// services/fallback-handler.ts
export class FallbackHandler {
  async handleLLMError(
    error: Error,
    context: {
      intent: Intent;
      message: string;
      userId: string;
    }
  ): Promise<LineMessage[]> {
    // 1. 判斷錯誤類型
    if (error instanceof RateLimitError) {
      logger.warn('Rate limit hit, using cached response');
      return this.getCachedResponse(context.intent, context.message);
    }

    if (error instanceof QuotaExceededError) {
      logger.error('Quota exceeded, switching to rule-based');
      return this.getRuleBasedResponse(context.intent, context.message);
    }

    // 2. 使用規則式回覆
    const ruleResponse = this.getRuleBasedResponse(context.intent, context.message);
    if (ruleResponse) {
      return ruleResponse;
    }

    // 3. 通用降級訊息
    return this.getGenericFallback(context.intent);
  }

  private getRuleBasedResponse(intent: Intent, message: string): LineMessage[] | null {
    const rules = {
      [Intent.HOW_TO_BUY]: this.getHowToBuyTemplate(),
      [Intent.REFUND_POLICY]: this.getRefundPolicyTemplate(),
      [Intent.SEARCH_CONCERT]: this.getSearchPromptTemplate(),
    };

    return rules[intent] || null;
  }

  private getGenericFallback(intent: Intent): LineMessage[] {
    return [
      {
        type: 'text',
        text: '抱歉，我現在有點忙不過來 😅\n\n您可以：',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'uri',
                label: '🌐 前往官網',
                uri: 'https://www.opentix.life',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '📞 聯繫客服',
                text: '我要聯繫人工客服',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '🔄 重試',
                text: '重新詢問',
              },
            },
          ],
        },
      },
    ];
  }

  private getHowToBuyTemplate(): LineMessage[] {
    return [
      {
        type: 'text',
        text: `📝 購票流程簡介：

1️⃣ 註冊 Opentix 會員
2️⃣ 搜尋想看的演出
3️⃣ 選擇座位與票種
4️⃣ 填寫資料並付款
5️⃣ 取票（電子票券或超商）

詳細說明：https://www.opentix.life/guide`,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'message',
                label: '付款方式',
                text: '有哪些付款方式',
              },
            },
            {
              type: 'action',
              action: {
                type: 'message',
                label: '取票方式',
                text: '如何取票',
              },
            },
          ],
        },
      },
    ];
  }
}
```

---

## 📊 效能監控埋點

```typescript
// services/analytics.ts
export class AnalyticsService {
  async trackMessage(event: {
    userId: string;
    intent: Intent;
    responseTime: number;
    llmUsed: boolean;
    success: boolean;
  }) {
    await Analytics.create({
      userId: event.userId,
      intent: event.intent,
      responseTime: event.responseTime,
      llmProvider: event.llmUsed ? 'gemini' : 'rule-based',
      success: event.success,
      timestamp: new Date(),
    });
  }

  async trackCarouselInteraction(event: {
    userId: string;
    concertId: string;
    action: 'view_detail' | 'buy_ticket' | 'add_favorite';
  }) {
    await Interaction.create(event);
  }
}
```

---

## 📝 總結：關鍵設計原則

### ✅ DO (推薦做法)

1. **Intent 識別混合策略**

   - 規則式處理簡單 Intent（快速、可控）
   - LLM 處理複雜語義（靈活、智能）
2. **分層降級設計**

   ```
   LLM → 快取 → 規則式 → 通用 Fallback
   ```
3. **善用 Line 原生組件**

   - Quick Reply：引導下一步動作
   - Carousel：展示多個選項
   - Flex Message：精美的資訊卡片
4. **對話狀態管理**

   - 保留對話脈絡（最近 5-10 則訊息）
   - 追蹤多輪對話流程
   - 適時結束流程（避免卡住）
5. **結構化 LLM 輸出**

   - 使用 JSON 格式便於解析
   - 明確指定輸出格式
   - 驗證回應有效性

### ❌ DON'T (避免做法)

1. ❌ 每次都呼叫 LLM（成本高、速度慢）
2. ❌ 純文字回覆（沒有利用 Line 互動元件）
3. ❌ 無限多輪對話（使用者體驗差）
4. ❌ 沒有降級機制（LLM 失效時系統癱瘓）
5. ❌ 過度依賴 LLM（簡單問題用規則式更好）

---

## 🎓 進階優化建議

1. **快取機制**

   - 快取常見查詢結果（如「本週演唱會」）
   - 快取 LLM 回應（相似問題）
2. **A/B Testing**

   - 測試不同 Prompt 效果
   - 比較規則式 vs LLM 的使用者滿意度
3. **使用者分群**

   - 新使用者：更多引導與說明
   - 老使用者：簡化流程、直接推薦
4. **多模態輸入**

   - 支援圖片辨識（演出海報查詢）
   - 語音訊息轉文字
5. **主動推送**

   - 收藏藝人開賣提醒
   - 價格變動通知
   - 演出前一天提醒

```

```

### 6.2 監控指標

* API 成功率
* 爬蟲成功率
* 平均回應時間
* 快取命中率
* 用戶滿意度 (透過回饋按鈕)
