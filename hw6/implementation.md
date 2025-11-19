# Line AI Chatbot 實作計畫

基於您的音樂會/演唱會購票系統需求，以下是完整的實作計畫：

---

## 📋 專案概述

**主題** ：音樂會/演唱會購票智能客服系統（基於 Opentix 平台知識）

**技術棧** ：

- **前端框架** ：Next.js 14+ (App Router) + TypeScript
- **樣式** ：Tailwind CSS
- **資料庫** ：MongoDB Atlas (Free Tier) + Mongoose ODM
- **部署** ：Vercel
- **驗證** ：Zod
- **LLM** ：OpenAI GPT-4 (主要)🎯 核心功能模組

### 1️⃣ Line Bot 對話功能設計

#### **功能列表**

1. **演唱會查詢**
   - 搜尋即將舉辦的演唱會/音樂會
   - 依藝人、日期、地點篩選
   - 顯示票價與座位資訊
2. **票務資訊**
   - 查詢特定演唱會詳情
   - 購票流程說明
   - 退換票政策
3. **購票助手**
   - 引導使用者完成購票步驟
   - 提供 Opentix 連結
   - 會員註冊協助
   - 
4. **FAQ 智能客服**
   - 常見問題即時回答
   - 票務糾紛處理建議
   - 場館交通指引
5. **個人化推薦**
   - 根據對話歷史推薦演唱會
   - 提醒收藏藝人的新演出

#### **對話腳本設計**

**歡迎訊息** （Flex Message）：

```
🎵 歡迎來到演唱會購票小幫手！

我可以協助您：
✓ 搜尋演唱會資訊
✓ 查詢票價與座位
✓ 解答購票疑問
✓ 提供個人化推薦

請直接告訴我您想找什麼演唱會，或輸入「幫助」查看更多功能！
```

**快速回覆（Quick Reply）範本** ：

- "本週演唱會"
- "熱門演出"
- "如何購票"
- "退票政策"
- "我的收藏"

  **Carousel Template（演唱會列表）** ：
- 演出圖片
- 藝人名稱
- 日期時間
- 地點
- 價格範圍
- 「查看詳情」按鈕 → 開啟 LIFF 頁面

---

### 2️⃣ LLM Prompt 設計

#### **System Prompt**

```typescript
const SYSTEM_PROMPT = `你是一位專業的演唱會購票客服助理，專精於 Opentix 購票平台。

知識背景：
- Opentix 是台灣主要的藝文票務平台
- 提供演唱會、音樂會、戲劇、展覽等票務服務
- 支援線上選位、超商取票、電子票券

你的職責：
1. 協助使用者搜尋演唱會資訊
2. 解答購票流程與政策問題
3. 提供友善、專業的客服體驗
4. 必要時引導使用者前往 Opentix 官網

回答原則：
- 簡潔明瞭，避免冗長
- 使用繁體中文與台灣用語
- 若不確定答案，建議聯繫官方客服
- 包含相關連結時使用完整 URL
- 適時使用 emoji 增加親和力

限制：
- 不能代替使用者完成實際購票
- 不處理金流或個資
- 遇到複雜問題應轉介人工客服
`;
```

#### **對話脈絡管理**

```typescript
interface ConversationContext {
  userId: string;
  recentMessages: Message[]; // 保留最近 10 則
  userIntent: string; // 'search' | 'inquiry' | 'purchase_guide' | 'faq'
  currentTopic?: {
    eventId?: string;
    artistName?: string;
    searchQuery?: string;
  };
  metadata: {
    preferredGenre?: string[];
    location?: string;
  };
}
```

#### **動態 Prompt 組合**

```typescript
function buildUserPrompt(context: ConversationContext, newMessage: string) {
  let prompt = `使用者訊息：${newMessage}\n\n`;

  // 加入對話歷史
  if (context.recentMessages.length > 0) {
    prompt += '近期對話：\n';
    context.recentMessages.slice(-3).forEach((msg) => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });
  }

  // 加入當前主題
  if (context.currentTopic?.artistName) {
    prompt += `\n當前討論藝人：${context.currentTopic.artistName}`;
  }

  return prompt;
}
```

---

### 3️⃣ Line Bot Server 架構

#### **API Routes 結構**

```
app/
├── api/
│   ├── webhook/
│   │   └── route.ts          # Line webhook endpoint
│   ├── admin/
│   │   ├── conversations/
│   │   │   └── route.ts      # 對話列表 API
│   │   ├── stats/
│   │   │   └── route.ts      # 統計資料 API
│   │   └── health/
│   │       └── route.ts      # 健康檢查
│   └── llm/
│       └── route.ts          # LLM 呼叫封裝
```

#### **Webhook 處理流程**

```typescript
// app/api/webhook/route.ts
export async function POST(req: Request) {
  try {
    // 1. 驗證 Line Signature
    const signature = req.headers.get('x-line-signature');
    const body = await req.text();

    if (!validateSignature(body, signature)) {
      return new Response('Invalid signature', { status: 401 });
    }

    // 2. 解析事件
    const events = JSON.parse(body).events;

    // 3. 並行處理事件
    await Promise.all(events.map((event) => handleEvent(event)));

    return new Response('OK', { status: 200 });
  } catch (error) {
    logger.error('Webhook error:', error);
    return new Response('Internal error', { status: 500 });
  }
}

async function handleEvent(event: LineEvent) {
  // 儲存訊息
  await saveMessage(event);

  // 根據類型處理
  switch (event.type) {
    case 'message':
      return handleMessage(event);
    case 'postback':
      return handlePostback(event);
    case 'follow':
      return sendWelcomeMessage(event.source.userId);
  }
}
```

---

### 4️⃣ LLM 整合與降級策略

#### **多供應商架構**

```typescript
// lib/llm/factory.ts
export class LLMFactory {
  private providers = {
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
  };

  async chat(messages: ChatMessage[], options: LLMOptions = {}): Promise<string> {
    const provider = options.provider || 'openai';

    try {
      return await this.providers[provider].chat(messages);
    } catch (error) {
      // 自動切換備援
      if (provider === 'openai') {
        logger.warn('OpenAI failed, switching to Anthropic');
        return await this.providers.anthropic.chat(messages);
      }
      throw error;
    }
  }
}
```

#### **錯誤處理與降級**

```typescript
// lib/llm/error-handler.ts
export async function chatWithFallback(
  context: ConversationContext,
  message: string
): Promise<string> {
  try {
    // 嘗試 LLM
    return await llmFactory.chat([
      { role: 'system', content: SYSTEM_PROMPT },
      ...context.recentMessages,
      { role: 'user', content: message },
    ]);
  } catch (error) {
    // 判斷錯誤類型
    if (error.code === 'rate_limit_exceeded') {
      return FALLBACK_RESPONSES.rate_limit;
    }

    if (error.code === 'quota_exceeded') {
      return FALLBACK_RESPONSES.quota_exceeded;
    }

    // 使用規則式回覆
    return getRuleBasedResponse(message) || FALLBACK_RESPONSES.default;
  }
}

const FALLBACK_RESPONSES = {
  rate_limit:
    '目前使用人數較多，請稍後再試。您也可以直接前往 Opentix 官網查詢：https://www.opentix.life/',
  quota_exceeded:
    '智能客服暫時無法使用，請直接聯繫官方客服 📞 或瀏覽常見問題：https://www.opentix.life/faq',
  default:
    '抱歉，我暫時無法理解您的問題。請問您想：\n1. 搜尋演唱會\n2. 查詢購票流程\n3. 了解退票政策\n4. 聯繫人工客服',
};
```

---

### 5️⃣ 資料庫設計

#### **Mongoose Schemas**

```typescript
// models/Conversation.ts
const ConversationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  platform: { type: String, default: 'line' },
  startedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
  messageCount: { type: Number, default: 0 },
  metadata: {
    userName: String,
    userPictureUrl: String,
    tags: [String],
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'archived'],
    default: 'active',
  },
});

// models/Message.ts
const MessageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  metadata: {
    messageType: String, // 'text', 'image', 'sticker'
    replyToken: String,
    llmProvider: String,
    latency: Number,
    error: String,
  },
});

// models/Analytics.ts
const AnalyticsSchema = new Schema({
  date: { type: Date, required: true, index: true },
  metrics: {
    totalMessages: Number,
    totalConversations: Number,
    activeUsers: Number,
    avgResponseTime: Number,
    llmSuccessRate: Number,
    errorRate: Number,
  },
  hourlyBreakdown: [
    {
      hour: Number,
      messageCount: Number,
      userCount: Number,
    },
  ],
});
```

---

### 6️⃣ 管理後台設計

#### **頁面結構**

```
app/
├── admin/
│   ├── layout.tsx           # 後台佈局（側邊欄、導航）
│   ├── page.tsx             # Dashboard（統計概覽）
│   ├── conversations/
│   │   ├── page.tsx         # 對話列表
│   │   └── [id]/
│   │       └── page.tsx     # 對話詳情
│   ├── analytics/
│   │   └── page.tsx         # 分析報表
│   └── settings/
│       └── page.tsx         # 系統設定
```

#### **即時更新實作**

```typescript
// app/admin/conversations/page.tsx
'use client';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    // 初始載入
    fetchConversations();

    // 每 5 秒輪詢新訊息
    const interval = setInterval(fetchConversations, 5000);

    return () => clearInterval(interval);
  }, []);

  // 或使用 Server-Sent Events
  useEffect(() => {
    const eventSource = new EventSource('/api/admin/stream');

    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setConversations((prev) => updateConversationWithMessage(prev, newMessage));
    };

    return () => eventSource.close();
  }, []);
}
```

#### **篩選與搜尋**

```typescript
// components/admin/ConversationFilter.tsx
interface FilterOptions {
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'active' | 'resolved' | 'archived';
  searchQuery?: string;
}

export function ConversationFilter({ onFilterChange }: Props) {
  return (
    <div className="flex gap-4">
      <Input
        placeholder="搜尋使用者 ID 或訊息內容"
        onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
      />
      <DateRangePicker
        onChange={(range) => onFilterChange({
          dateFrom: range.from,
          dateTo: range.to
        })}
      />
      <Select
        options={['active', 'resolved', 'archived']}
        onChange={(status) => onFilterChange({ status })}
      />
    </div>
  );
}
```

---

## 🏗️ 專案架構

```
hw6/
├── app/
│   ├── api/
│   │   ├── webhook/route.ts
│   │   ├── admin/
│   │   └── health/route.ts
│   ├── admin/                    # 管理後台
│   └── layout.tsx
├── lib/
│   ├── line/
│   │   ├── client.ts            # Line Messaging API wrapper
│   │   ├── signature.ts         # 簽章驗證
│   │   └── templates.ts         # 訊息範本
│   ├── llm/
│   │   ├── factory.ts           # LLM 工廠
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   └── anthropic.ts
│   │   └── prompts.ts
│   ├── db/
│   │   ├── mongodb.ts           # MongoDB 連接
│   │   └── repositories/
│   │       ├── conversation.ts
│   │       ├── message.ts
│   │       └── analytics.ts
│   └── utils/
│       ├── logger.ts
│       ├── error-handler.ts
│       └── validator.ts
├── models/
│   ├── Conversation.ts
│   ├── Message.ts
│   └── Analytics.ts
├── services/
│   ├── chat.service.ts          # 對話邏輯
│   ├── llm.service.ts           # LLM 呼叫
│   └── analytics.service.ts
├── components/
│   └── admin/
│       ├── ConversationList.tsx
│       ├── MessageThread.tsx
│       └── AnalyticsChart.tsx
├── types/
│   ├── line.ts
│   ├── llm.ts
│   └── conversation.ts
├── chatbot-design.md            # 對話設計文檔
├── README.md
├── .env.example
└── package.json
```

---

## 🔧 環境變數設定

```bash
# .env.example
# Line Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# LLM Providers
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/line-chatbot

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# Admin (Optional)
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=bcrypt_hashed_password
```

---

## 📝 實作步驟（分階段）

### **Phase 1: 基礎建設（Week 1）**

1. ✅ 建立 Next.js 專案與基本架構
2. ✅ 設定 MongoDB Atlas 與 Mongoose models
3. ✅ 實作 Line webhook 接收訊息
4. ✅ 串接 OpenAI API 並測試基本回覆
5. ✅ 部署至 Vercel 並設定 Line webhook URL

### **Phase 2: 核心功能（Week 2）**

1. ✅ 實作對話脈絡管理
2. ✅ 設計並實作 prompt templates
3. ✅ 建立規則式降級回覆系統
4. ✅ 實作錯誤處理與日誌
5. ✅ 加入 Quick Reply 與 Flex Message

### **Phase 3: 管理後台（Week 3）**

1. ✅ 建立後台頁面架構
2. ✅ 實作對話列表與詳情頁
3. ✅ 加入即時更新功能
4. ✅ 實作篩選與搜尋
5. ✅ 建立統計 Dashboard

### **Phase 4: 優化與測試（Week 4）**

1. ✅ 加入多 LLM 供應商備援
2. ✅ 實作速率限制
3. ✅ 效能優化（快取、索引）
4. ✅ 撰寫測試案例
5. ✅ 完成文檔與部署

---

## 🚀 部署清單

- [ ] 建立 Line Official Account
- [ ] 設定 Line Channel (Messaging API)
- [ ] 申請 OpenAI API key
- [ ] 建立 MongoDB Atlas cluster
- [ ] 部署至 Vercel
- [ ] 設定環境變數
- [ ] 配置 webhook URL
- [ ] 測試完整流程

---

## 📊 評分對應

| 項目                 | 實作內容              | 完成度    |
| -------------------- | --------------------- | --------- |
| **功能完整性** | Line Bot + LLM + 後台 | ✅        |
| **對話脈絡**   | 上下文管理            | ✅        |
| **資料持久化** | MongoDB 儲存          | ✅        |
| **即時更新**   | 輪詢/SSE              | ✅        |
| **降級處理**   | 多供應商 + 規則回覆   | ✅        |
| **錯誤處理**   | 集中式處理 + 日誌     | ✅        |
| **進階篩選**   | 多維度搜尋            | 🎯 加分項 |
| **效能監控**   | Analytics Dashboard   | 🎯 加分項 |

---

這個計畫涵蓋了所有必要功能與延伸項目，現在可以開始實作了！需要我協助建立任何具體的程式碼檔案嗎？
