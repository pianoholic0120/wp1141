# ✅ Vercel 部署检查清单

使用此清单确保部署到 Vercel 时所有步骤都已完成。

## 📦 部署前检查

### 代码准备
- [ ] 所有更改已提交到 Git
- [ ] 代码已推送到远程仓库（GitHub/GitLab/Bitbucket）
- [ ] `.env.local` 已在 `.gitignore` 中（不会被提交）
- [ ] 没有硬编码的本地 URL 或 ngrok URL

### 环境变量准备
准备以下环境变量的**生产环境**值：

- [ ] `LINE_CHANNEL_ACCESS_TOKEN`（生产环境 Channel）
- [ ] `LINE_CHANNEL_SECRET`（生产环境 Channel）
- [ ] `MONGODB_URI`（MongoDB Atlas 连接字符串）
- [ ] `OPENAI_API_KEY` 或 `GOOGLE_API_KEY`（至少一个）
- [ ] `LLM_PROVIDER`（gemini 或 openai）

**重要**：不要使用开发/测试 Channel 的 Token！

## 🚀 Vercel 部署步骤

### 1. Vercel 账号与项目导入
- [ ] 已创建 Vercel 账号（https://vercel.com）
- [ ] 已连接 Git 账号（GitHub/GitLab/Bitbucket）
- [ ] 已在 Vercel Dashboard 导入项目
- [ ] 项目名称已确认

### 2. 环境变量配置
在 Vercel 项目设置中配置环境变量：

**必需变量：**
- [ ] `LINE_CHANNEL_ACCESS_TOKEN`（设置为 Production）
- [ ] `LINE_CHANNEL_SECRET`（设置为 Production）
- [ ] `MONGODB_URI`（设置为 Production）
- [ ] `OPENAI_API_KEY` 或 `GOOGLE_API_KEY`（设置为 Production）
- [ ] `LLM_PROVIDER`（设置为 Production）

**可选变量：**
- [ ] `NEXT_PUBLIC_APP_URL`（Vercel 会自动设置，也可以手动设置）
- [ ] `NODE_ENV`（设置为 `production`）
- [ ] `GOOGLE_MODEL`（如果需要自定义模型）

### 3. 部署执行
- [ ] 点击 **"Deploy"** 按钮
- [ ] 等待部署完成（通常 2-3 分钟）
- [ ] 部署状态显示为绿色（成功）✅
- [ ] 记录部署后的 URL（例如：`https://your-project.vercel.app`）

### 4. LINE Webhook 配置
在 LINE Developers Console 配置：

- [ ] 登录 [LINE Developers Console](https://developers.line.biz/console/)
- [ ] 选择**生产环境 Channel**（不是测试 Channel）
- [ ] 进入 **"Messaging API"** 标签页
- [ ] 设置 Webhook URL: `https://your-project.vercel.app/api/webhook`
- [ ] 点击 **"Verify"** 验证成功 ✅
- [ ] 启用 **"Use webhook"** 开关 ✅
- [ ] （可选）禁用 **"Auto-reply messages"**

### 5. MongoDB Atlas 配置
- [ ] 登录 [MongoDB Atlas](https://cloud.mongodb.com/)
- [ ] 进入 **"Network Access"**
- [ ] 添加 IP 地址：`0.0.0.0/0`（允许所有 IP）✅
- [ ] 或添加 Vercel 的 IP 地址（更安全但需要维护）

## ✅ 部署后验证

### 健康检查
- [ ] 访问 `https://your-project.vercel.app/api/health`
  - 应该返回：`{ "ok": true }`

### 数据库检查
- [ ] 访问 `https://your-project.vercel.app/api/admin/db`
  - 应该显示数据库已连接 ✅

### 后台管理
- [ ] 访问 `https://your-project.vercel.app/admin`
  - 页面正常加载 ✅
- [ ] 访问 `https://your-project.vercel.app/admin/conversations`
  - 对话列表正常显示 ✅
- [ ] 访问 `https://your-project.vercel.app/admin/analytics`
  - 统计报表正常显示 ✅
- [ ] 访问 `https://your-project.vercel.app/admin/settings`
  - 配置状态正常显示 ✅

### LINE Bot 功能测试
- [ ] 在 LINE 中向 Bot 发送消息
- [ ] Bot 能正常回复 ✅
- [ ] 测试欢迎消息（新增好友）
- [ ] 测试快速回复按钮
- [ ] 测试搜索功能
- [ ] 测试语言切换
- [ ] 测试热门演出 Carousel

## 🔍 故障排除检查

如果遇到问题，请检查：

### Webhook 问题
- [ ] Webhook URL 是否正确（必须以 `https://` 开头）
- [ ] `LINE_CHANNEL_SECRET` 是否正确
- [ ] 使用的是生产环境 Channel（不是测试 Channel）
- [ ] 查看 LINE Developers Console 的 Webhook 日志

### 数据库问题
- [ ] `MONGODB_URI` 是否正确
- [ ] MongoDB Atlas IP 白名单已设置（`0.0.0.0/0`）
- [ ] 数据库用户权限正确
- [ ] 查看 Vercel 函数日志中的数据库错误

### LLM API 问题
- [ ] API Key 是否正确
- [ ] API 配额是否足够
- [ ] `LLM_PROVIDER` 设置是否正确
- [ ] 查看 Vercel 函数日志中的 API 错误

### 构建问题
- [ ] 查看 Vercel 构建日志
- [ ] 检查是否有 TypeScript 错误
- [ ] 检查依赖是否正确安装

## 📊 监控设置（可选）

### Vercel 监控
- [ ] 启用 Vercel Analytics（可选）
- [ ] 设置部署失败邮件通知
- [ ] 定期查看函数日志

### 应用监控
- [ ] 定期检查后台统计数据
- [ ] 监控错误率
- [ ] 监控 API 使用量

## 🎯 完成标准

部署成功的标志：

✅ Vercel 部署状态：绿色（成功）
✅ 健康检查：返回 `{ "ok": true }`
✅ 数据库连接：已连接
✅ LINE Webhook：验证成功
✅ Bot 功能：所有功能正常
✅ 后台管理：所有页面可访问

## 📝 部署后记录

部署完成后，记录以下信息：

- **Vercel URL**: `https://_________________.vercel.app`
- **LINE Webhook URL**: `https://_________________.vercel.app/api/webhook`
- **部署日期**: _______________
- **MongoDB Atlas 数据库名称**: _______________
- **使用的 LLM Provider**: _______________

## 🔗 重要链接

- **Vercel Dashboard**: https://vercel.com/dashboard
- **项目部署页面**: https://vercel.com/dashboard/[your-username]/[your-project]
- **LINE Developers Console**: https://developers.line.biz/console/
- **MongoDB Atlas**: https://cloud.mongodb.com/

---

**部署完成后，您的 Bot 就可以 24/7 运行了！** 🎉

如有问题，请参考 `VERCEL_DEPLOYMENT.md` 中的故障排除部分。

