# 🚀 Vercel 部署完整指南

本指南将帮助您从 ngrok 迁移到 Vercel 生产环境部署。

## 📋 部署前准备

### 1. 确保代码已提交到 Git

```bash
# 检查 Git 状态
git status

# 如果有未提交的更改
git add .
git commit -m "准备部署到 Vercel"
git push
```

### 2. 准备环境变量清单

请准备好以下环境变量的值（**不要使用开发环境的 token**）：

- ✅ `LINE_CHANNEL_ACCESS_TOKEN` (生产环境 Channel)
- ✅ `LINE_CHANNEL_SECRET` (生产环境 Channel)
- ✅ `MONGODB_URI` (MongoDB Atlas 连接字符串)
- ✅ `OPENAI_API_KEY` 或 `GOOGLE_API_KEY` (至少一个)
- ✅ `LLM_PROVIDER` (gemini 或 openai)

## 🔧 部署步骤

### 步骤 1: 创建 Vercel 账号

1. 访问 https://vercel.com
2. 点击 **"Sign Up"**
3. 使用 GitHub/GitLab/Bitbucket 账号登录（推荐）

### 步骤 2: 导入项目

1. 登录后点击 **"Add New..."** → **"Project"**
2. 选择您的 Git 仓库（如果看不到，点击 **"Adjust GitHub App Permissions"** 授权）
3. 点击项目旁边的 **"Import"**

### 步骤 3: 配置项目

Vercel 会自动检测 Next.js 项目，通常无需修改以下设置：

- **Framework Preset**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

**重要**：保持默认设置即可，Vercel 会自动处理。

### 步骤 4: 配置环境变量

在部署页面，点击 **"Environment Variables"** 添加以下变量：

#### 必需的环境变量

```bash
# LINE Messaging API (生产环境)
LINE_CHANNEL_ACCESS_TOKEN=你的生产环境token
LINE_CHANNEL_SECRET=你的生产环境secret

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# LLM (至少选择一个)
OPENAI_API_KEY=你的openai_key
# 或
GOOGLE_API_KEY=你的google_gemini_key
LLM_PROVIDER=gemini
```

#### 可选的环境变量

```bash
# Application URL (部署后会自动设置)
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# Environment
NODE_ENV=production

# Google Gemini 模型（可选）
GOOGLE_MODEL=gemini-2.0-flash-exp
```

**环境变量设置说明**：

1. 对于每个变量，选择应用的环境：
   - **Production** ✅ （生产环境）
   - **Preview** ✅ （预览/分支环境）
   - **Development** ❌ （本地开发，不需要在 Vercel 设置）

2. 点击 **"Add"** 添加每个变量

3. **重要**：确保使用的是**生产环境的 LINE Channel**，不要使用开发/测试 Channel

### 步骤 5: 部署

1. 点击 **"Deploy"** 按钮
2. 等待部署完成（通常 2-3 分钟）
3. 部署成功后，您会看到：
   ```
   ✅ Deployment successful
   🌍 https://your-project.vercel.app
   ```

### 步骤 6: 更新 LINE Webhook

1. 复制您的 Vercel URL（例如：`https://your-project.vercel.app`）

2. 登录 [LINE Developers Console](https://developers.line.biz/console/)

3. 选择您的 **生产环境 Channel**（不是测试 Channel）

4. 进入 **"Messaging API"** 标签页

5. 滚动到 **"Webhook URL"** 部分

6. 输入您的 webhook URL：
   ```
   https://your-project.vercel.app/api/webhook
   ```

7. 点击 **"Verify"** 验证 webhook 可用性
   - ✅ 如果显示 "Success"，说明配置正确
   - ❌ 如果失败，检查：
     - URL 是否正确
     - 部署是否成功（绿色状态）
     - `LINE_CHANNEL_SECRET` 是否正确

8. 启用 **"Use webhook"** 开关

9. 可以禁用 **"Auto-reply messages"**（因为我们使用自定义回复）

### 步骤 7: 验证部署

#### 健康检查

访问以下 URL 验证服务：

```
https://your-project.vercel.app/api/health
```

应该返回：`{ "ok": true }`

#### 数据库检查

```
https://your-project.vercel.app/api/admin/db
```

应该返回数据库连接状态。

#### 后台管理

访问后台管理界面：

```
https://your-project.vercel.app/admin
```

#### LINE Bot 测试

在 LINE 中向您的 Bot 发送消息，测试是否正常工作。

### 步骤 8: 配置 MongoDB Atlas IP 白名单

1. 登录 [MongoDB Atlas](https://cloud.mongodb.com/)

2. 选择您的集群

3. 点击 **"Network Access"**

4. 添加 IP 地址：
   - 选项 1（推荐）：点击 **"Add IP Address"** → **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - 选项 2（更安全）：添加 Vercel 的 IP 地址（需要查询 Vercel IP 列表）

5. 点击 **"Confirm"**

**注意**：Vercel Functions 的 IP 地址是动态的，所以建议使用 `0.0.0.0/0`（允许所有 IP）。

## 🔄 持续部署

Vercel 支持自动部署：

- ✅ **推送到 `main` 分支** → 自动部署到生产环境
- ✅ **推送到其他分支** → 创建预览部署
- ✅ **Pull Request** → 创建预览部署供测试

### 自动部署流程

```bash
# 1. 本地修改代码
git checkout -b feature/new-feature

# 2. 提交更改
git add .
git commit -m "添加新功能"
git push origin feature/new-feature

# 3. Vercel 会自动创建预览部署
# 预览 URL: https://your-project-git-feature-new-feature.vercel.app

# 4. 测试预览部署后，合并到 main
git checkout main
git merge feature/new-feature
git push origin main

# 5. Vercel 会自动部署到生产环境
```

## 🔒 安全最佳实践

### 1. 环境变量安全

- ✅ **不要**在代码中硬编码敏感信息
- ✅ **不要**将 `.env.local` 提交到 Git
- ✅ **使用** Vercel Dashboard 管理环境变量
- ✅ **定期**轮换 API Key 和 Token

### 2. LINE Channel 安全

- ✅ **使用**生产环境 Channel（不是测试 Channel）
- ✅ **不要**在公开场合分享 Channel Secret
- ✅ **定期**检查 webhook 日志

### 3. MongoDB Atlas 安全

- ✅ **设置**强密码
- ✅ **限制**数据库用户权限
- ✅ **启用**网络访问白名单
- ✅ **定期**备份数据库

### 4. API Key 管理

- ✅ **使用**不同的 API Key 用于生产和开发
- ✅ **监控** API 使用量和配额
- ✅ **设置**配额告警

## 📊 监控与日志

### Vercel 日志

1. 进入 Vercel Dashboard → 选择项目
2. 点击 **"Deployments"** 标签
3. 点击最新的部署
4. 点击 **"Functions"** 查看函数日志
5. 点击 **"Runtime Logs"** 查看运行时日志

### 应用日志

项目中的日志会输出到 Vercel Functions 日志中：

```typescript
// 使用 logger 记录日志
logger.info('Webhook received');
logger.error('Error occurred', error);
```

### 监控指标

在 Vercel Dashboard 可以查看：
- **Function Invocations**：函数调用次数
- **Function Duration**：函数执行时间
- **Function Errors**：错误数量
- **Bandwidth**：带宽使用量

## 🔧 故障排除

### 问题 1: Webhook 验证失败

**症状**：LINE Developers Console 显示 webhook 验证失败

**解决方案**：
1. 检查 webhook URL 是否正确（必须以 `https://` 开头）
2. 确保部署已成功（绿色状态）
3. 检查 `LINE_CHANNEL_SECRET` 是否正确
4. 确认使用的是生产环境 Channel Secret

### 问题 2: MongoDB 连接失败

**症状**：后台显示数据库未连接

**解决方案**：
1. 检查 `MONGODB_URI` 是否正确
2. 检查 MongoDB Atlas IP 白名单（应该是 `0.0.0.0/0`）
3. 检查数据库用户权限
4. 查看 Vercel 日志了解详细错误

### 问题 3: LLM API 调用失败

**症状**：Bot 回复失败或错误

**解决方案**：
1. 检查 API Key 是否正确
2. 检查 API 配额是否足够
3. 检查 `LLM_PROVIDER` 是否正确
4. 查看 Vercel 函数日志

### 问题 4: 构建失败

**症状**：Vercel 部署时构建失败

**解决方案**：
1. 检查 `package.json` 依赖是否正确
2. 查看构建日志了解详细错误
3. 确保所有必需的环境变量都已设置
4. 检查 TypeScript 错误（虽然设置了 `ignoreBuildErrors`，但建议修复）

### 问题 5: 函数超时

**症状**：某些请求超时（60 秒限制）

**解决方案**：
1. 检查是否有长时间运行的操作
2. 优化 LLM API 调用（使用更快的模型）
3. 使用 `vercel.json` 中的 `maxDuration` 配置（已设置为 60 秒）

## 📝 部署后检查清单

完成部署后，请检查以下项目：

- [ ] ✅ Vercel 部署状态为绿色（成功）
- [ ] ✅ `/api/health` 返回 `{ "ok": true }`
- [ ] ✅ `/api/admin/db` 显示数据库已连接
- [ ] ✅ LINE Webhook URL 验证成功
- [ ] ✅ 在 LINE 中测试 Bot 回复正常
- [ ] ✅ 后台管理界面可正常访问
- [ ] ✅ 对话列表可以正常加载
- [ ] ✅ MongoDB Atlas IP 白名单已配置
- [ ] ✅ 所有环境变量都已正确设置
- [ ] ✅ 使用生产环境的 LINE Channel Token

## 🎯 后续优化建议

### 1. 自定义域名

1. 在 Vercel Dashboard → **Settings** → **Domains**
2. 添加您的自定义域名
3. 按照指示配置 DNS 记录
4. 更新 LINE Webhook URL

### 2. 启用 Vercel Analytics

1. 在项目设置中启用 **Vercel Analytics**
2. 监控性能和用户行为
3. 优化慢查询和性能瓶颈

### 3. 设置告警

1. 在 Vercel Dashboard 设置部署失败告警
2. 监控函数错误率
3. 设置 API 配额告警

### 4. 数据库备份

1. 启用 MongoDB Atlas 自动备份
2. 定期导出对话数据
3. 设置备份告警

## 💡 常见问题

### Q: Vercel 免费版的限制是什么？

A: 
- ✅ 100GB 带宽/月
- ✅ 无限函数调用
- ✅ 60 秒函数执行时间
- ✅ 支持自定义域名
- ✅ 自动 HTTPS

对于中小型项目完全够用。

### Q: 如何查看生产环境的日志？

A: 
1. Vercel Dashboard → 项目 → Deployments
2. 点击最新部署
3. 点击 **"Functions"** 或 **"Runtime Logs"**

### Q: 如何回滚到之前的版本？

A: 
1. Vercel Dashboard → Deployments
2. 找到之前的成功部署
3. 点击 **"..."** → **"Promote to Production"**

### Q: 如何更新环境变量？

A: 
1. Vercel Dashboard → 项目 → Settings → Environment Variables
2. 添加或编辑环境变量
3. 重新部署（或自动触发）

## 🔗 有用的链接

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [LINE Developers Console](https://developers.line.biz/console/)
- [MongoDB Atlas](https://cloud.mongodb.com/)

## 📞 获取帮助

如果遇到问题：

1. 查看 Vercel 部署日志
2. 查看 Vercel 函数日志
3. 检查 LINE Developers Console 的 Webhook 日志
4. 检查 MongoDB Atlas 连接日志

---

**部署成功后，您的 Bot 就可以 24/7 运行了！** 🎉

