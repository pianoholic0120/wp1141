# Line AI Chatbot (HW6)

A Next.js 14 + TypeScript project for a Line chatbot powered by LLM with MongoDB persistence and a simple Admin UI.

## 🚀 快速部署到 Vercel

**想要快速部署？** 查看 [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

**详细部署指南：** 查看 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

---

## Getting Started

1. Install dependencies (pick ONE):
   - pnpm:
     ```bash
     pnpm install
     ```
   - npm:
     ```bash
     npm install
     ```
   - yarn:
     ```bash
     yarn install
     ```

2. Set environment variables (create `.env.local` in project root):

   ```bash
   # Line Messaging API
   LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
   LINE_CHANNEL_SECRET=your_channel_secret

   # LLM Providers (at least one required)
   OPENAI_API_KEY=your_openai_key
   GOOGLE_API_KEY=your_google_gemini_key
   LLM_PROVIDER=gemini  # or 'openai', defaults to gemini if GOOGLE_API_KEY is set
   GOOGLE_MODEL=gemini-2.5-flash  # optional, defaults to gemini-2.5-flash

   # Database
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/line-chatbot

   # Application
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

3. Import event data (optional but recommended):

   ```bash
   # First, ensure you have event data in output_site/pages/ directory
   # Then run:
   npm run import-events
   # or: pnpm import-events
   # or: yarn import-events
   ```

   This will parse and import all event markdown files from `output_site/pages/` into MongoDB.

4. Run dev:

   ```bash
   pnpm dev
   # or: npm run dev
   # or: yarn dev
   ```

5. Configure Line webhook:
   - **本地开发 (ngrok)**:
     - 运行 `ngrok http 3000`
     - 在 LINE Developers console 设置 Webhook URL: `https://your-ngrok-url.ngrok.io/api/webhook`
   - **生产环境 (Vercel)**:
     - 部署到 Vercel 后，设置 Webhook URL: `https://your-project.vercel.app/api/webhook`
   - 确保 Channel access token 和 Channel secret 与对应环境匹配。

6. Verify health:
   - Visit http://localhost:3000/api/health → should return `{ ok: true }`.
   - Visit http://localhost:3000/api/admin/db → should return database connection status.

## Structure

- `app/api/webhook/route.ts` — Line webhook endpoint
- `app/api/admin/*` — Admin API endpoints (conversations, stats, db health)
- `lib/line/*` — Line helpers (signature, client, templates)
- `lib/llm/*` — LLM factory and providers (OpenAI, Gemini)
- `lib/db/mongodb.ts` — MongoDB connection
- `models/*` — Mongoose models (Conversation, Message, Event, Analytics)
- `services/*` — Business logic (chat, llm, event search)
- `app/admin/*` — Admin UI (dashboard, conversations, analytics, settings)
- `scripts/import-events.ts` — Event data import script
- `output_site/` — Scraped Opentix website data (markdown files)

## Scripts

- `dev` — start Next.js dev server
- `build` — build production
- `start` — start production server
- `lint` — run Next.js ESLint
- `lint:fix` — run ESLint and auto-fix issues
- `format` — format code with Prettier
- `format:check` — check code formatting
- `import-events` — import event data from `output_site/pages/` to MongoDB

## 部署到 Vercel

详细的部署指南请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署步骤

1. 将代码推送到 Git 仓库（GitHub/GitLab/Bitbucket）
2. 在 [Vercel Dashboard](https://vercel.com/dashboard) 导入项目
3. 配置环境变量（LINE_CHANNEL_ACCESS_TOKEN, LINE_CHANNEL_SECRET, MONGODB_URI 等）
4. 部署后更新 LINE Developers Console 中的 Webhook URL

## Notes

- Remember to set webhook URL in Line Developers console to `/api/webhook`.
- 生产环境使用 Vercel 部署，本地开发可以使用 ngrok。
- MongoDB Atlas: 生产环境建议将 IP 白名单设置为 `0.0.0.0/0`（允许所有 IP）或添加 Vercel 的 IP 地址。

## Admin UI

- Home/Dashboard: http://localhost:3000/admin
- Conversations: http://localhost:3000/admin/conversations (polling every 5s, with search & filter)
- Analytics: http://localhost:3000/admin/analytics (statistics dashboard)
- Settings: http://localhost:3000/admin/settings

## Features

### 主題

**Opentix 演唱會購票智能客服系統** - 協助使用者搜尋演出、查詢票價、解答購票疑問的 Line Bot

### Line Bot Features

- ✅ **Welcome message with Quick Reply** - 新增好友自動顯示歡迎訊息 + 5 個快速按鈕
- ✅ **多語言支援** - 繁體中文、English，可隨時切換
- ✅ **Event search by artist name or keywords** - 智能搜尋演出資訊
- ✅ **Popular events carousel (Flex Message)** - 熱門演出卡片輪播
- ✅ **Purchase guide & refund policy** - 規則式回覆 + LLM 智能回答
- ✅ **Context-aware conversations** - 保留最近 10 則訊息作為上下文
- ✅ **優化的按鈕流程** - 80% 操作可透過按鈕完成，減少打字需求
- ✅ **Quick Reply 智能顯示** - 搜尋結果、FAQ 回覆後自動顯示相關操作按鈕
- ✅ **Buttons Template** - 支援快速操作按鈕
- ✅ **Graceful fallback** - LLM 失敗時提供友善降級回覆

### Admin Features

- ✅ Real-time conversation list (auto-refresh every 5s)
- ✅ Search conversations by userId
- ✅ Filter by status (active/resolved/archived)
- ✅ Analytics dashboard (total conversations, messages, active users)
- ✅ Database health check endpoint

### Technical Features

- ✅ **MongoDB Atlas integration** with Mongoose
- ✅ **Multi-LLM support** (OpenAI, Gemini) with automatic fallback
- ✅ **Event database** with full-text search (過濾已下架節目)
- ✅ **ESLint + Prettier** - 程式碼品質與格式檢查
- ✅ **Tailwind CSS** - 現代化 UI 樣式
- ✅ **Error handling & logging** - 完整的錯誤處理與日誌
- ✅ **Webhook signature validation** - 安全的 webhook 驗證
- ✅ **Markdown 清理** - 自動清理 LLM 回覆中的 Markdown 格式

## Code Quality

### ESLint + Prettier

專案已配置 ESLint 和 Prettier 確保程式碼品質：

```bash
# 檢查程式碼
npm run lint

# 自動修復 ESLint 問題
npm run lint:fix

# 格式化程式碼
npm run format

# 檢查格式
npm run format:check
```

### Tailwind CSS

專案使用 Tailwind CSS 進行樣式管理：

- 配置檔案：`tailwind.config.ts`
- 全域樣式：`app/globals.css`
- 自訂顏色主題：Primary colors (50-900)

## 功能列表與使用流程

### 主要功能

1. **🎵 熱門演出** - 查看熱門演出 Carousel
2. **📅 本週演唱會** - 查看本週演出
3. **💳 如何購票** - 購票流程說明
4. **📋 退票政策** - 退票政策說明
5. **🌐 語言設定** - 切換語言（繁體中文/English）

### 使用流程優化

- ✅ **歡迎訊息**：自動顯示 5 個主要功能按鈕
- ✅ **搜尋結果後**：自動顯示相關操作按鈕（搜尋其他、熱門演出、前往 Opentix、如何購票、幫助）
- ✅ **FAQ 回覆後**：自動顯示主選單按鈕
- ✅ **章節回覆後**：自動顯示主選單按鈕 + Carousel（如果是熱門演出）
- ✅ **減少打字**：80% 的操作可透過按鈕完成
