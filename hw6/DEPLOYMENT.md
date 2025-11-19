# Vercel 部署指南

本指南将帮助您将 Line Bot 从本地 ngrok 迁移到 Vercel 生产环境部署。

## 📋 前置要求

1. **GitHub/GitLab/Bitbucket 账号**（用于代码托管）
2. **Vercel 账号**（免费注册：https://vercel.com）
3. **LINE Developers 账号**（用于配置 webhook）

## 🚀 部署步骤

### 1. 准备代码仓库

确保您的代码已经提交到 Git 仓库（GitHub/GitLab/Bitbucket）：

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repository-url>
git push -u origin main
```

### 2. 在 Vercel 中导入项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..."** → **"Project"**
3. 选择您的 Git 仓库
4. 点击 **"Import"**

### 3. 配置项目设置

在 Vercel 项目导入页面：

#### 项目配置
- **Framework Preset**: Next.js（自动检测）
- **Root Directory**: `./`（默认）
- **Build Command**: `npm run build`（自动）
- **Output Directory**: `.next`（自动）
- **Install Command**: `npm install`（自动）

#### 环境变量配置

点击 **"Environment Variables"**，添加以下环境变量：

**必需的环境变量：**

```
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
```

**LLM 配置（至少选择一个）：**

```
OPENAI_API_KEY=your_openai_key
# 或
GOOGLE_API_KEY=your_google_gemini_key
LLM_PROVIDER=gemini  # 或 'openai'
```

**可选配置：**

```
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
NODE_ENV=production
GOOGLE_MODEL=gemini-2.5-flash
```

⚠️ **重要**：
- 不要在代码中硬编码这些值
- 生产环境的值应该与本地开发不同（使用 LINE Production Channel）
- 环境变量配置后需要重新部署才会生效

### 4. 部署

点击 **"Deploy"** 按钮，Vercel 将自动：
1. 安装依赖
2. 构建项目
3. 部署到生产环境

部署完成后，您会获得一个 URL，例如：
```
https://your-project-name.vercel.app
```

### 5. 配置 LINE Webhook

1. 登录 [LINE Developers Console](https://developers.line.biz/console/)
2. 选择您的 Channel
3. 进入 **"Messaging API"** 标签
4. 在 **"Webhook URL"** 字段输入：
   ```
   https://your-project-name.vercel.app/api/webhook
   ```
5. 点击 **"Verify"** 验证 webhook 可用性
6. 启用 **"Use webhook"** 开关

### 6. 验证部署

#### 健康检查
访问以下 URL 验证服务是否正常运行：

```
https://your-project-name.vercel.app/api/health
```

应该返回：`{ "ok": true }`

#### 数据库检查
```
https://your-project-name.vercel.app/api/admin/db
```

应该返回数据库连接状态。

#### Webhook 测试
在 LINE 中向您的 Bot 发送消息，应该能收到回复。

## 🔄 持续部署

Vercel 支持自动部署：
- 推送到 `main` 分支会自动触发生产部署
- 推送到其他分支会创建预览部署
- 每次部署都会生成唯一的 URL

## 🌍 环境变量管理

### 在 Vercel Dashboard 中管理

1. 进入项目设置 → **Environment Variables**
2. 可以分别为以下环境设置不同的值：
   - **Production**（生产环境）
   - **Preview**（预览环境）
   - **Development**（本地开发）

### 通过 CLI 管理（可选）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 添加环境变量
vercel env add LINE_CHANNEL_ACCESS_TOKEN production
vercel env add LINE_CHANNEL_SECRET production
vercel env add MONGODB_URI production
vercel env add OPENAI_API_KEY production

# 查看环境变量
vercel env ls
```

## 🔒 安全注意事项

1. **不要提交 `.env.local` 到 Git**
   - 确保 `.env.local` 在 `.gitignore` 中

2. **使用生产环境的 LINE Channel**
   - 不要使用开发/测试 Channel 的 Token
   - 生产环境应该使用正式的 LINE Channel

3. **MongoDB Atlas IP 白名单**
   - 在 MongoDB Atlas 中，将 **"Allow Access from Anywhere"** (0.0.0.0/0)
   - 或者只添加 Vercel 的 IP 地址

4. **环境变量安全**
   - 不要在代码中硬编码敏感信息
   - 定期轮换 API Key 和 Token

## 📊 监控与日志

### Vercel 日志
1. 进入 Vercel Dashboard → 项目 → **"Deployments"**
2. 点击最新部署 → **"Functions"** → 查看函数日志

### 应用日志
项目中的日志会输出到 Vercel Functions 日志中，可以通过 Dashboard 查看。

## 🔧 故障排除

### Webhook 验证失败
- 检查 webhook URL 是否正确
- 确保部署已成功（绿色状态）
- 检查 `LINE_CHANNEL_SECRET` 是否正确

### MongoDB 连接失败
- 检查 `MONGODB_URI` 是否正确
- 检查 MongoDB Atlas IP 白名单设置
- 确认数据库用户权限

### LLM API 调用失败
- 检查 API Key 是否正确
- 检查 API 配额是否足够
- 查看 Vercel 函数日志了解详细错误

### 构建失败
- 检查 `package.json` 中的依赖是否正确
- 查看构建日志了解错误详情
- 确保所有必需的环境变量都已设置

## 🎯 最佳实践

1. **使用环境变量管理敏感信息**
   - 生产、预览、开发环境使用不同的配置

2. **启用 Vercel Analytics**（可选）
   - 监控 API 调用和性能

3. **设置自定义域名**（可选）
   - 在项目设置 → **Domains** 中添加自定义域名
   - 需要配置 DNS 记录

4. **定期备份数据库**
   - 使用 MongoDB Atlas 的自动备份功能

5. **监控使用量**
   - 关注 Vercel Functions 的执行时间
   - 关注 MongoDB Atlas 的使用量
   - 关注 LLM API 的配额使用

## 📝 后续步骤

部署成功后：

1. ✅ 测试所有 Bot 功能
2. ✅ 验证后台管理系统可访问
3. ✅ 检查错误日志
4. ✅ 设置监控告警（可选）
5. ✅ 更新文档中的 webhook URL

## 🔗 有用的链接

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [LINE Messaging API 文档](https://developers.line.biz/en/docs/messaging-api/)
- [MongoDB Atlas 文档](https://www.mongodb.com/docs/atlas/)

