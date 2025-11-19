# Opentix 音樂演出諮詢小幫手 - 對話/功能設計文件

## 📋 專案概述

**主題**：Opentix 音樂演出諮詢小幫手

**定位**：協助使用者搜尋和查詢音樂演出相關資訊的智能客服系統

**技術棧**：
- **前端框架**：Next.js 14+ (App Router) + TypeScript
- **樣式**：Tailwind CSS
- **資料庫**：MongoDB Atlas + Mongoose ODM
- **部署**：Vercel
- **LLM**：OpenAI GPT-4o-mini / Google Gemini 1.5 Flash

---

## 🎯 功能列表

### 1. 搜尋音樂演出資訊
- **藝人名稱搜尋**：支援中英文藝人名稱（如：Eric Lu、陸逸軒、魏德曼）
- **場館名稱搜尋**：支援中英文場館名稱（如：國家音樂廳、National Concert Hall）
- **演出類型搜尋**：室內樂、獨奏會、協奏曲、交響樂等
- **完整演出名稱搜尋**：支援完整演出標題搜尋
- **日期範圍搜尋**：今天、明天、本週、下週、特定日期範圍

### 2. 查詢演出詳情
- **演出地點**：場館資訊
- **演出時間**：日期和時間（引導至 Opentix 官網查看詳細資訊）
- **演出者資訊**：藝人名單
- **演出詳情**：使用 LLM 回答關於演出的問題

### 3. 提供 Opentix 購票連結
- 每個搜尋結果都包含 Opentix 購票連結
- 支援直接點擊連結前往購票頁面

### 4. 回答演出相關問題
- 使用 LLM 回答一般性問題
- 支援後續問題（如：「這個表演在哪裡演出？」）
- 維持對話上下文

### 5. 熱門演出推薦
- 顯示熱門演出列表（Carousel）
- 每個演出卡片包含圖片、標題、場館、購票連結
- 支援直接加入收藏

### 6. 收藏功能
- **加入收藏**：從搜尋結果或熱門演出列表加入收藏
- **查看收藏**：顯示所有收藏的演出（標題和連結）
- **取消收藏**：支援使用編號或事件 ID 取消收藏

### 7. 多語言支援
- **繁體中文**：預設語言
- **English**：完整英文介面
- 支援動態語言切換

---

## 💬 對話腳本設計

### 歡迎訊息

**繁體中文版本**：
```
🎵 歡迎來到 Opentix 音樂演出諮詢小幫手！

我可以協助您：
✓ 搜尋音樂演出資訊（藝人、場館、類型）
✓ 查詢演出詳情（地點、主辦單位、演出時長等）
✓ 提供 Opentix 購票連結
✓ 回答演出相關問題

請直接告訴我您想找什麼演出，或選擇下方功能！
```

**English Version**：
```
🎵 Welcome to Opentix Music Event Information Assistant!

I can help you:
✓ Search for music events (artists, venues, categories)
✓ Query event details (venue, organizer, duration, etc.)
✓ Provide Opentix ticket purchase links
✓ Answer event-related questions

Please tell me what event you're looking for, or select a function below!
```

### Quick Reply 按鈕

**主選單**：
- 🔍 搜尋 / 🔍 Search
- 🎵 熱門演出 / 🎵 Popular Events
- ⭐ 我的收藏 / ⭐ My Favorites
- 🌐 語言設定 / 🌐 Language

**搜尋引導**：
- 🎭 演出全名 / 🎭 Full Title
- 👤 藝人名稱 / 👤 Artist Name
- 🏛️ 場館名稱 / 🏛️ Venue Name
- 🎵 演出類型 / 🎵 Event Category

**事件相關操作**：
- ⭐ 收藏演出 / ⭐ Add to Favorites
- 📋 查看詳情 / 📋 View Details
- 🔙 主選單 / 🔙 Main Menu

### Flex Message 設計

**熱門演出 Carousel**：
- 每個卡片包含：
  - 演出圖片
  - 演出標題和副標題
  - 場館資訊
  - 類型標籤
  - 「查看詳情」按鈕（連結到 Opentix）
  - 「⭐ 加入收藏」按鈕

**搜尋結果 Carousel**：
- 最多顯示 10 個搜尋結果
- 每個卡片包含：
  - 演出圖片
  - 演出標題和副標題
  - 演出者資訊
  - 場館資訊
  - 類型標籤
  - 「查看詳情」按鈕
  - 「⭐ 收藏演出」按鈕

---

## 🔄 對話脈絡：維持上下文

### 狀態機設計

系統使用狀態機管理對話流程：

1. **IDLE**：初始狀態，等待使用者輸入
2. **SEARCHING**：正在處理搜尋請求
3. **EVENT_SELECTED**：使用者已選擇特定演出
4. **EVENT_LIST**：顯示搜尋結果列表
5. **FAQ_MODE**：FAQ 問答模式

### 上下文管理

**Session Context** 包含：
- `lastQuery`：最後一次搜尋查詢
- `lastSearchResults`：最後一次搜尋結果
- `selectedEvent`：當前選中的演出
- `selectedEventIndex`：選中演出的索引
- `language`：使用者語言設定
- `favoritesList`：收藏列表（用於編號取消收藏）

### 後續問題處理

系統能夠識別以下後續問題模式：
- **指代詞**：「這個表演」、「那個演出」、「它」
- **問題類型**：
  - 票價相關：「票價多少」、「多少錢」
  - 時間相關：「什麼時候」、「演出時間」
  - 地點相關：「在哪裡演出」、「演出地點」
  - 詳情相關：「介紹一下」、「詳細資訊」

**範例對話流程**：
```
使用者：魏德曼
系統：找到了魏德曼的演出：[顯示結果列表]

使用者：這個表演在哪裡演出？
系統：「魏德曼與NSO《跨樂自由的邊界》」的演出地點：國家音樂廳
```

---

## 🤖 LLM Prompt Template 設計

### System Prompt

系統提示詞根據語言設定動態生成，包含：

1. **角色定義**：Opentix 音樂演出諮詢小幫手
2. **職責說明**：
   - 搜尋音樂演出資訊
   - 查詢演出詳情
   - 提供 Opentix 購票連結
   - 回答演出相關問題
3. **回答原則**：
   - 簡潔明瞭，避免冗長
   - 使用對應語言（繁體中文或 English）
   - 適時使用 emoji 增加親和力
   - 包含相關連結時使用完整 URL
4. **限制**：
   - 不能代替使用者完成實際購票
   - 不處理金流或個資
   - 遇到複雜問題應轉介官方客服
5. **搜尋結果處理**：
   - 嚴格檢查搜尋結果相關性
   - 不相關的結果不要回答
   - 沒有結果時提供引導性建議

### User Prompt

用戶提示詞動態構建，包含：

1. **對話歷史**：最近 5-10 條訊息
2. **搜尋結果**：如果找到相關演出，包含在提示中
3. **解析查詢**：查詢類型、關鍵字、日期範圍等
4. **Opentix 連結**：搜尋 URL 或購票連結

### 錯誤處理 Prompt

當 LLM 或外部服務失效時：
- **429 Rate Limit**：「目前使用人數較多，系統暫時無法處理您的請求。請稍後再試」
- **503 Service Unavailable**：「服務暫時無法使用，請稍後再試」
- **Quota Exceeded**：「智能客服暫時無法使用，請直接前往 Opentix 官網」

---

## 📱 回應設計

### 預設腳本回應

1. **FAQ 回應**：規則式回答常見問題
   - 如何購票
   - 退票政策
   - 取票方式
   - 會員註冊

2. **熱門演出**：從資料庫載入熱門演出列表

3. **幫助訊息**：功能介紹和引導

### LLM 回應

1. **搜尋結果摘要**：使用 LLM 生成搜尋結果的摘要和介紹
2. **一般問題回答**：回答演出相關的一般性問題
3. **後續問題回答**：基於上下文回答後續問題

### 混合模式

結合預設腳本和 LLM 回應：
- 搜尋結果：使用 LLM 生成摘要，但使用預設模板顯示結果列表
- 後續問題：使用 LLM 回答，但參考預設的事件資訊

### LINE 訊息包裝

所有回應都包裝成適當的 LINE 訊息格式：
- **文字訊息**：簡單的文字回覆
- **Quick Reply**：提供快速選項
- **Flex Message**：豐富的卡片式內容
- **Carousel**：多個卡片的輪播

---

## 🎨 對話流程範例

### 範例 1：藝人搜尋

```
使用者：Eric Lu
系統：[顯示搜尋引導]
使用者：👤 Search by artist
系統：[顯示搜尋提示]
使用者：Eric Lu
系統：找到了 Eric Lu 的演出：
     1. 第十九屆國際蕭邦鋼琴大賽金獎得主陸逸軒 & 銀獎得主陳禹同鋼琴獨奏會
        演出者: 陸逸軒, 陳禹同
        場館: 衛武營國家藝術文化中心音樂廳
        類型: 音樂
        購票: [連結]
使用者：這個表演在哪裡演出？
系統：「第十九屆國際蕭邦鋼琴大賽金獎得主陸逸軒 & 銀獎得主陳禹同鋼琴獨奏會」的演出地點：衛武營國家藝術文化中心音樂廳
```

### 範例 2：收藏功能

```
使用者：🎵 熱門演出
系統：[顯示熱門演出 Carousel]
使用者：[點擊「⭐ 加入收藏」按鈕]
系統：✅ 收藏成功！
使用者：⭐ 我的收藏
系統：⭐ 您的收藏（共 1 個）
     1. 第十九屆國際蕭邦鋼琴大賽金獎得主陸逸軒 & 銀獎得主陳禹同鋼琴獨奏會
        購票: [連結]
使用者：取消收藏:1
系統：✅ 已取消收藏
```

### 範例 3：多語言切換

```
使用者：🌐 語言設定
系統：[顯示語言選擇選單]
使用者：🇺🇸 English
系統：Language changed to English
     [顯示英文歡迎訊息]
使用者：Eric Lu
系統：Found events for Eric Lu:
     [顯示英文搜尋結果]
```

---

## 🔧 技術實作細節

### 狀態機架構

使用 `services/state-machine.service.ts` 管理對話狀態：
- 根據當前狀態和用戶輸入決定下一個狀態
- 支援狀態轉換和動作觸發

### 意圖檢測

使用 `services/intent-detector.service.ts` 檢測用戶意圖：
- GLOBAL_COMMAND：全域命令（如：幫助、語言設定）
- QUICK_REPLY：快速回覆按鈕
- SEARCH：搜尋意圖
- FOLLOW_UP_QUESTION：後續問題
- ASK_TIME/ASK_PRICE/ASK_VENUE/ASK_ARTIST/ASK_DETAILS：特定問題類型
- FAQ：常見問題
- GENERAL：一般問題

### 查詢解析

使用 `services/query-parser.service.ts` 解析用戶查詢：
- 識別查詢類型（artist, venue, category, date, general）
- 提取關鍵字和參數
- 處理自然語言查詢（如：「有沒有魏德曼的表演」）

### 事件搜尋

使用 `services/event.service.ts` 搜尋演出：
- 支援多種搜尋方式（藝人、場館、類型、日期、一般搜尋）
- 相關性評分和排序
- 結果過濾和限制

---

## 📊 資料庫設計

### Conversation Model

```typescript
{
  userId: string;
  platform: string; // 'line'
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  metadata: {
    locale: string; // 'zh-TW' | 'en-US'
    state: string; // ConversationState
    lastQuery: string;
    lastSearchResults: any[];
    selectedEvent: any;
    selectedEventIndex: number;
  };
  status: 'active' | 'resolved' | 'archived';
}
```

### Message Model

```typescript
{
  conversationId: ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata: {
    messageType: string;
    replyToken: string;
    llmProvider: string;
    latency: number;
    error: string;
  };
}
```

---

## 🚀 部署與設定

### 環境變數

- `LINE_CHANNEL_ACCESS_TOKEN`：LINE Channel Access Token
- `LINE_CHANNEL_SECRET`：LINE Channel Secret
- `MONGODB_URI`：MongoDB 連接字串
- `OPENAI_API_KEY`：OpenAI API Key（可選）
- `GOOGLE_API_KEY`：Google API Key（可選）
- `LLM_PROVIDER`：LLM 供應商（'openai' 或 'gemini'）

### LINE Bot 設定

1. 建立 Line 官方帳號
2. 設定 Line Channel（Messaging API）
3. 開啟 webhook 端點：`https://your-domain.com/api/webhook`
4. 設定環境變數

---

## 📝 總結

本系統是一個功能完整的音樂演出諮詢小幫手，結合了：
- **智能搜尋**：多種搜尋方式和相關性評分
- **上下文管理**：狀態機和對話歷史
- **LLM 整合**：動態 prompt 和錯誤處理
- **用戶體驗**：多語言支援、收藏功能、豐富的訊息格式
- **錯誤處理**：完善的降級機制和錯誤訊息

系統設計遵循最佳實踐，確保穩定性和可擴展性。

