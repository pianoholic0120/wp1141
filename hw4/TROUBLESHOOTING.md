# 🔧 故障排除指南

## 常見問題解決方案

---

## 1. 註冊/登入問題

### ❌ "Network Error" 無法註冊

**原因：** 後端未運行或無法連接

**解決方案：**
```bash
# 1. 確認後端運行
curl http://localhost:3000/health

# 2. 如果沒有回應，重啟後端
cd hw4/backend
npm run dev

# 3. 使用無痕模式清除快取
# Mac: Cmd+Shift+N, Windows: Ctrl+Shift+N
```

### ❌ 註冊失敗但密碼都是綠色

**解決方案：**
1. **使用無痕視窗**註冊
2. 或用 API 直接創建帳號：
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","password":"Test123!@#"}'
```
3. 然後用創建的帳號登入

---

## 2. 地圖顯示問題

### ❌ 地圖不顯示或一直 "Loading..."

**解決方案：**

1. **刷新頁面**（Cmd+Shift+R）
2. **等待 3-5 秒**
3. **查看 Console (F12)：**

**正常日誌：**
```
Google Maps loaded successfully
✅ Google Map initialized successfully
```

**如果看到錯誤：**
- API Key 錯誤 → 檢查 `.env` 中的 `VITE_GOOGLE_MAPS_API_KEY`
- Network 錯誤 → 檢查網絡連接
- 權限錯誤 → 確認 Maps JavaScript API 已啟用

### ❌ 切換頁面後地圖消失

**解決方案：**
- **刷新頁面**
- 地圖會重新載入並顯示
- 或稍等 2-3 秒，地圖會自動出現

---

## 3. 創建 Listing 問題

### ❌ "Validation error" 無法創建

**檢查清單：**

1. **Title：** 至少 5 個字符
   - ❌ "公寓" (太短)
   - ✅ "台北信義區公寓"

2. **Price：** 必須 > 0
   - ❌ 0 或空白
   - ✅ 25000

3. **座標：** 不能是 0
   - ❌ Latitude: 0, Longitude: 0
   - ✅ 點擊快速選擇按鈕
   - ✅ 或手動輸入有效座標

**快速修復：**
- 點擊 "Location" 標籤
- 點擊任一快速選擇按鈕（台北101、台大等）
- 座標自動填入！

### ❌ 地理編碼失敗

**解決方案：**
1. **使用快速選擇按鈕**（推薦）
2. **或手動輸入座標**
3. **或設置 Google Maps API** (參考 SETUP-GUIDE.md)

---

## 4. 編輯 Listing 問題

### ❌ 點擊 Edit 後畫面空白

**原因：** EditListing 頁面未正確載入

**解決方案：**
- 刷新頁面（Cmd+Shift+R）
- 或返回 My Listings，重新點擊 Edit

### ❌ 無法編輯（403 Forbidden）

**原因：** 只能編輯自己創建的 listings

**解決方案：**
- 確認使用創建該 listing 的帳號登入
- 在 "My Listings" 頁面編輯（不是 Dashboard）

---

## 5. 後端連接問題

### 確認後端運行

```bash
# 測試健康檢查
curl http://localhost:3000/health

# 應該返回：
{"status":"ok","message":"Server is running"}
```

### 確認端口

```bash
# 檢查端口 3000 是否被使用
lsof -ti:3000

# 如果有輸出 = 正在運行
# 如果沒有輸出 = 未運行
```

### 重啟後端

```bash
cd hw4/backend
# 按 Ctrl+C 停止（如果運行中）
npm run dev
```

---

## 6. 前端問題

### 確認前端配置

```bash
cat hw4/frontend/.env | grep VITE_API_BASE_URL
# 應該顯示: VITE_API_BASE_URL=http://localhost:3000/api
```

### 清除瀏覽器快取

**方法 1: 無痕模式（推薦）**
- Mac: Cmd+Shift+N
- Windows: Ctrl+Shift+N

**方法 2: 強制刷新**
- Mac: Cmd+Shift+R  
- Windows: Ctrl+Shift+F5

**方法 3: 清空快取**
- F12 → 右鍵點擊刷新按鈕
- 選擇 "清空快取並強制重新整理"

---

## 7. Google Maps API 問題

### 設置 API Key

**檢查：**
```bash
# 後端
grep GOOGLE_MAPS_API_KEY hw4/backend/.env

# 前端
grep VITE_GOOGLE_MAPS_API_KEY hw4/frontend/.env
```

**應該顯示：**
```
GOOGLE_MAPS_API_KEY=AIzaSyD...
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD...
```

### 啟用必要的 APIs

訪問 [Google Cloud Console](https://console.cloud.google.com/)：

1. 選擇 "My Maps Project"
2. APIs & Services > Library
3. 搜尋並啟用：
   - ✅ **Maps JavaScript API**
   - ✅ **Geocoding API**
   - ✅ **Places API**

### 測試地理編碼

```bash
curl -X POST http://localhost:3000/api/maps/geocode \
  -H "Content-Type: application/json" \
  -d '{"address":"Taipei 101"}'
```

**成功回應：**
```json
{
  "latitude": 25.0339,
  "longitude": 121.5645,
  "formattedAddress": "..."
}
```

---

## 8. 資料庫問題

### 重置資料庫

```bash
cd hw4/backend
rm database/rental_listings.db
npm run init-db
npm run dev
```

⚠️ **警告：** 會刪除所有用戶和 listings！

---

## 9. 完全重置（最終方案）

如果所有方法都不行：

```bash
# 停止所有服務（Ctrl+C）

# 後端
cd hw4/backend
rm -rf node_modules package-lock.json database/*.db
npm install
npm run init-db
npm run dev

# 前端（新終端）
cd hw4/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## 📞 診斷腳本

執行這個腳本獲取完整診斷：

```bash
echo "=== 系統診斷 ==="
echo ""
echo "1. 後端狀態:"
curl -s http://localhost:3000/health || echo "❌ 後端未運行"
echo ""
echo "2. 前端配置:"
grep VITE_API_BASE_URL hw4/frontend/.env
echo ""
echo "3. 後端配置:"
grep "PORT\|GOOGLE_MAPS_API_KEY" hw4/backend/.env | head -2
echo ""
echo "4. 資料庫:"
ls -lh hw4/backend/database/*.db 2>/dev/null || echo "資料庫不存在"
```

**將結果複製給我，我會幫您診斷！**

---

## ✅ 健康檢查

確認系統正常：

- [ ] `curl http://localhost:3000/health` 返回 OK
- [ ] 訪問 http://localhost:5173 可以看到登入頁面
- [ ] 可以成功登入
- [ ] 儀表板地圖在 3-5 秒內顯示
- [ ] 可以創建 listing
- [ ] 可以編輯自己的 listing
- [ ] 可以刪除自己的 listing

---

## 🆘 需要幫助？

**請提供：**
1. 瀏覽器 Console (F12) 的錯誤訊息
2. 後端終端的輸出
3. 您執行的操作步驟
4. 診斷腳本的輸出

我會立即幫您解決！🔧

