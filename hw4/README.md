# 租屋平台系統

## 專案簡介與功能清單

本專案為一個全端租屋平台系統，提供房東與租客雙向服務。系統整合 Google Maps API 提供地理位置服務，並具備完整的用戶認證、房源管理、收藏評分等功能。

### 主要功能

#### 用戶管理
- 用戶註冊與登入（JWT 認證）
- 密碼加密存儲（bcrypt）
- 自動登入狀態維持
- 用戶資料管理

#### 房源管理
- 房源創建、編輯、刪除
- 房源搜尋與篩選
- 地理位置標記
- 房源狀態管理

#### 地圖服務
- Google Maps 整合
- 地址地理編碼
- 地圖標記互動
- 位置搜尋功能

#### 收藏與評分
- 房源收藏功能
- 評分系統（1-5星）
- 收藏列表管理
- 評分統計顯示

#### 進階篩選
- 價格範圍篩選
- 房型篩選
- 公設設施篩選
- 地理位置篩選

## 架構圖

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │   後端 (Express) │    │   資料庫 (SQLite) │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 用戶介面    │ │◄──►│ │ API 路由    │ │◄──►│ │ 用戶資料    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 地圖組件    │ │◄──►│ │ 地圖服務    │ │◄──►│ │ 房源資料    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ 表單組件    │ │◄──►│ │ 業務邏輯    │ │◄──►│ │ 收藏評分    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Google Maps API  │
                    │ (地理編碼服務)    │
                    └─────────────────┘
```

## 技術架構

### 前端技術棧
- React 18 + TypeScript
- Vite 建構工具
- Tailwind CSS 樣式框架
- shadcn/ui 組件庫
- React Router 路由管理
- Axios HTTP 客戶端

### 後端技術棧
- Node.js + Express.js
- TypeScript 類型安全
- SQLite 資料庫
- JWT 認證機制
- bcrypt 密碼加密
- Google Maps API 整合

## 快速開始

### 環境需求
- Node.js 18.0 或更高版本
- npm 或 yarn 套件管理器
- Google Maps API Key（可選）

### 1. 克隆專案
```bash
git clone <repository-url>
cd hw4
```

### 2. 後端設置

```bash
cd backend
npm install
```

複製環境變量範例文件：
```bash
cp .env.example .env
```

編輯 `.env` 文件，填入必要的配置：
```bash
nano .env
```

初始化資料庫並啟動後端服務：
```bash
npm run init-db
npm run dev
```

後端服務將運行於 `http://localhost:3000`

### 3. 前端設置

```bash
cd ../frontend
npm install
```

複製環境變量範例文件：
```bash
cp .env.example .env
```

編輯 `.env` 文件：
```bash
nano .env
```

安裝 shadcn/ui 組件：
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input label card alert dialog tabs select textarea slider checkbox table dropdown-menu separator scroll-area tooltip badge popover alert-dialog
```

啟動前端服務：
```bash
npm run dev
```

前端服務將運行於 `http://localhost:5173`

### 4. 初始化測試資料

後端啟動後會自動創建測試資料，包含：
- 400 個虛擬房源
- 100 個虛擬用戶
- 隨機評分與收藏資料

## 環境變量配置

### 後端環境變量 (.env)

```env
# 服務器配置
PORT=3000
NODE_ENV=development

# 資料庫配置
DATABASE_PATH=./database/rental_listings.db

# JWT 認證配置
JWT_SECRET=your_jwt_secret_here_change_this_in_production
JWT_EXPIRES_IN=7d

# CORS 配置
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Google Maps API 配置
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# 密碼加密配置
BCRYPT_ROUNDS=10

# 速率限制配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=10000
```

### 前端環境變量 (.env)

```env
# API 基礎 URL
VITE_API_BASE_URL=http://localhost:3000/api

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# 應用配置
VITE_APP_NAME=租屋平台
VITE_DEFAULT_MAP_CENTER_LAT=25.0330
VITE_DEFAULT_MAP_CENTER_LNG=121.5654
VITE_DEFAULT_MAP_ZOOM=12
```

## API 文檔

### 認證相關 API

#### 用戶註冊
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Test123!@#"
  }'
```

#### 用戶登入
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### 獲取當前用戶資訊
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 房源相關 API

#### 獲取所有房源
```bash
curl -X GET "http://localhost:3000/api/listings?page=1&limit=10&minPrice=10000&maxPrice=50000"
```

#### 創建新房源
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "溫馨套房",
    "description": "位於市中心的溫馨套房",
    "address": "台北市信義區信義路五段7號",
    "price": 25000,
    "bedrooms": 1,
    "bathrooms": 1,
    "area_sqft": 15,
    "property_type": "套房",
    "amenities": ["冷氣", "網路", "洗衣機"]
  }'
```

#### 獲取用戶的房源
```bash
curl -X GET http://localhost:3000/api/listings/user/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 地圖服務 API

#### 地址地理編碼
```bash
curl -X POST http://localhost:3000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{
    "address": "台北市信義區信義路五段7號"
  }'
```

### 收藏與評分 API

#### 添加收藏
```bash
curl -X POST http://localhost:3000/api/favorites/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 獲取用戶收藏
```bash
curl -X GET http://localhost:3000/api/favorites \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 添加評分
```bash
curl -X POST http://localhost:3000/api/ratings/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "rating": 5,
    "comment": "非常棒的房源！"
  }'
```

## 資料庫結構

### 用戶表 (users)
- id: 主鍵
- email: 電子郵件（唯一）
- username: 用戶名（唯一）
- password_hash: 密碼雜湊
- created_at: 創建時間
- updated_at: 更新時間

### 房源表 (listings)
- id: 主鍵
- user_id: 用戶ID（外鍵）
- title: 房源標題
- description: 房源描述
- address: 地址
- latitude: 緯度
- longitude: 經度
- price: 租金
- bedrooms: 臥室數
- bathrooms: 浴室數
- area_sqft: 坪數
- property_type: 房型
- status: 狀態
- amenities: 公設設施（JSON）
- floor: 樓層
- contact_phone: 聯絡電話
- management_fee: 管理費
- created_at: 創建時間
- updated_at: 更新時間

### 收藏表 (favorites)
- id: 主鍵
- user_id: 用戶ID（外鍵）
- listing_id: 房源ID（外鍵）
- created_at: 創建時間

### 評分表 (ratings)
- id: 主鍵
- user_id: 用戶ID（外鍵）
- listing_id: 房源ID（外鍵）
- rating: 評分（1-5）
- comment: 評分評論
- created_at: 創建時間
- updated_at: 更新時間

## 已知問題與未來改進方向

### 已知問題
1. **圖片上傳功能**：目前圖片上傳功能已移除，未來需要重新實現
2. **效能優化**：大量房源時地圖載入可能較慢
3. **行動裝置適配**：部分功能在行動裝置上體驗有待改善
4. **搜尋功能**：目前搜尋功能較為基礎，缺乏全文搜尋

### 未來改進方向
1. **圖片管理系統**：實現房源圖片上傳、管理、展示功能
2. **進階搜尋**：添加全文搜尋、智能推薦功能
3. **即時通訊**：房東與租客即時聊天功能
4. **支付整合**：整合第三方支付服務
5. **行動應用**：開發原生行動應用
6. **數據分析**：添加房源瀏覽統計、用戶行為分析
7. **多語言支援**：國際化功能
8. **API 文檔**：使用 Swagger 生成完整 API 文檔

## 安全性風險說明

### Google Maps API Key 安全性
本專案使用 Google Maps API Key 提供地圖服務。如果 API Key 未設置 IP 限制，存在以下安全風險：

1. **API 濫用風險**：未授權用戶可能濫用 API Key，導致超出配額
2. **費用風險**：API 調用可能產生費用，未限制的 Key 可能被惡意使用
3. **資料洩露風險**：API Key 暴露在前端代碼中，可能被逆向工程獲取

### 建議安全措施
1. **設置 API 限制**：在 Google Cloud Console 中設置 HTTP 引用者限制
2. **監控使用量**：定期檢查 API 使用量，設置配額警報
3. **定期輪換**：定期更換 API Key
4. **環境分離**：開發、測試、生產環境使用不同的 API Key
5. **代理服務**：考慮使用後端代理 Google Maps API 請求

### 其他安全考量
1. **JWT Secret**：生產環境必須使用強隨機密鑰
2. **HTTPS**：生產環境必須使用 HTTPS
3. **輸入驗證**：所有用戶輸入都經過驗證和清理
4. **SQL 注入防護**：使用參數化查詢防止 SQL 注入
5. **速率限制**：實施 API 速率限制防止濫用

## 開發指南

### 本地開發
```bash
# 啟動後端開發服務器
cd backend
npm run dev

# 啟動前端開發服務器
cd frontend
npm run dev
```

### 生產部署
```bash
# 建構後端
cd backend
npm run build
npm start

# 建構前端
cd frontend
npm run build
# 將 dist/ 目錄部署到 Web 服務器
```

### 測試
```bash
# 後端測試
cd backend
npm test

# 前端測試
cd frontend
npm test
```

## 貢獻指南

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 授權

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 文件。

## 聯絡資訊

如有問題或建議，請透過以下方式聯絡：
- 提交 Issue
- 發送 Pull Request
- 電子郵件聯絡