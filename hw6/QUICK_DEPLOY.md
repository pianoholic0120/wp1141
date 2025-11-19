# ⚡ 快速部署到 Vercel

5 分钟快速部署指南

## 🚀 一键部署

### 方法 1: 使用 Vercel CLI（推荐）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录 Vercel
vercel login

# 3. 在项目目录中部署
vercel

# 4. 按照提示完成配置
# - 选择项目
# - 添加环境变量
# - 确认部署
```

### 方法 2: 使用 Vercel Dashboard

1. 访问 https://vercel.com/new
2. 连接 Git 仓库
3. 导入项目
4. 配置环境变量
5. 点击部署

## 📋 必需的环境变量

在 Vercel Dashboard → Project → Settings → Environment Variables 中添加：

```bash
LINE_CHANNEL_ACCESS_TOKEN=你的生产环境token
LINE_CHANNEL_SECRET=你的生产环境secret
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=你的key
# 或
GOOGLE_API_KEY=你的key
LLM_PROVIDER=gemini
```

## 🔗 配置 LINE Webhook

部署完成后，在 LINE Developers Console 设置：

```
Webhook URL: https://your-project.vercel.app/api/webhook
```

点击 "Verify" 验证，然后启用 "Use webhook"。

## ✅ 验证部署

1. 健康检查: `https://your-project.vercel.app/api/health`
2. 后台管理: `https://your-project.vercel.app/admin`
3. LINE Bot: 在 LINE 中测试发送消息

## 📚 详细文档

- 完整部署指南: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- 部署检查清单: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

**完成！您的 Bot 现在可以 24/7 运行了！** 🎉

