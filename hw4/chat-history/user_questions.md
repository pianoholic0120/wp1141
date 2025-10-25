# User Questions from Development Process

_Extracted from chat history - User questions only_

**（我的implementation.md是依據我想要的要求，先打一個簡短的草稿給claude擴充的）**

（因為chat實在太長，有一部分遺失，但主要前面都是在做前端的各種微調，包含拖移條、介面格式、文字、排版、應有項目等等）

............

**User**

請依據implementation.md來實作這個全端的app應用。使用shadcn-ui並遵循以下規則：

## 作業說明

> ✅ 強調：前端與後端都必須各自有 .env 與 .env.example！ 兩邊都要！兩邊都要！兩邊都要！（重要所以說三次）
>
> * `.env`：本機實際設定（**不要** commit）
> * `.env.example`：提供欄位範例與說明（**必須** commit）

請實作一個「 **地圖功能導向** 」的全端應用，採用  **前後端分離架構** （React + Node/Express），並整合  **Google Maps API** 。
主題不限，但必須與「 **地圖 / 地點 / 座標** 」強相關，並完成登入、資料庫、基本 CRUD (Create、Read、Update、Delete) 與至少一項地圖互動。

> **目標** ：練習 前後端串接、本地帳密登入與資料庫整合、以及 Google Maps API 的實作。
> 不需部署，但架構需清晰、程式乾淨，並能完整重現測試流程。

---

## 可選主題（舉例，請自定一款）

* **店家/景點探索** ：以地圖搜尋與收藏店家或景點，建立自選清單與評分備註。
* **活動/事件地圖** ：建立活動（名稱、時間、地點），讓使用者查找並加入行程。
* **跑步/健走路線記錄** ：標記路線與里程，記錄完成日期與心得。
* **社群公益地圖** ：標記回收點/捐贈站/志工集合點，提供開放時間與類別。
* **租屋/二手物件分佈** ：發布含地點的物件資訊，可依距離或關鍵字篩選。

> 請避免僅做「靜態標記」；需有至少一種資料型態的 CRUD 與與地圖的雙向互動（例如：地圖點選產生 **地點表單** 、**列表點選**在地圖上定位）。

---

## 開發規格

### 🔹 前端

* **技術棧** ：React + TypeScript（建議使用 Vite 建置）
* **主要套件** ：React Router (前端 routing)、Axios (與後端的 HTTP 溝通)
* **UI 框架** ：Material UI / Ant Design / Shadcn / TailwindCSS（擇一或混用）
* **Google Maps SDK** ：使用 **Google Maps JavaScript API** 處理地圖顯示與互動
* **最低要求**
  * 地圖載入與基本操作（縮放、拖曳）
  * 可「搜尋」或「標記」地點（任一即可）
  * 使用者登入後才能針對 地點表單之類的資料 進行 新增/編輯/刪除（以頁面/按鈕狀態反映）

### 🔹 後端

* **技術棧** ：Node.js + Express（建議 TypeScript）
* **RESTful API** ：至少包含
* `/auth`（註冊、登入、登出）
* **一到兩個自定義資源** （例如 `/locations`、`/events`、`/posts`、`/items`…）具備 CRUD
* **Google Maps 伺服器端整合：**至少串接 **Geocoding** 或 **Places** 或 **Directions** 任一項（依主題選擇最合理者）
* **資料庫** ：使用 SQLite（也可選 MongoDB 或 PostgreSQL）
* 至少儲存「使用者登入資訊」或「主要資源資料」其中之一（建議兩者皆存）

<aside>
👉🏿

 **效能評估與優化** ：建議寫一些 monitors 來評估前後端在處理 Google Maps requests 時的效能，必要時做一些優化。

</aside>

---

## 登入與安全性要求

* 帳號欄位需包含 email/username + password（其一或兩者皆可）
* 密碼必須以雜湊方式儲存（例：`bcrypt` 或 `argon2`）
* 使用 **JWT** 或 **Session + Cookie** 任一機制（請於 README 說明）
* `.env` 檔不得上傳，並需提供 `.env.example`
* 後端 CORS 設定需允許：

  ```
  <http://localhost:5173>
  <http://127.0.0.1:5173>
  ```

  <aside>
  ⚠️

  請留意，這是你前端 Vite App 的 URL. 如果你因為任何因素導致你的前端的 port 不是 5173 (可能會是 5174, 517*, 3000, etc), 請重新確保你的前端是開在 5173, 或者是修改這個設定。

  </aside>
* 所有輸入需驗證（email 格式、密碼長度、必填欄位、數值/日期型態等）
* 錯誤回傳需包含正確狀態碼與訊息（如 400/401/403/404/422/500）
* 權限控管：

  * 未登入者不可操作受保護資源
  * 登入的使用者僅能修改/刪除自己的資料

---

## Google Maps API 設定指南

> ⚠️ 開通 Google Maps API 需要綁定付款方式（信用卡或 debit card）。Google 提供新帳號首 90 天或 $300 美金免費額度，足以完成本作業。

> ⚠️ 如果不希望在免費期限結束或是額度使用完畢之後被 Google 收費的同學，請務必記得在那之前取消訂閱。 **如因為自己的疏忽而造成扣款，我們恕不負責** 。

### 一、建立 Google Cloud 專案

1. 前往 Google Cloud Console，建立新專案（例如 `map-enhanced-app`）
2. 確認目前選擇的專案正確

### 二、啟用必要 API（依前後端分工）

* **Geocoding API / Places API / Directions API** → 建立「Server Key」
* **Maps JavaScript API** （地圖顯示與互動） → 建立「Browser Key」

### 三、建立與設定 API Key

**前端 Key（Browser Key）**

* 限制類型：HTTP 網域
* 允許清單：
  ```
  <http://localhost:5173/*>
  <http://127.0.0.1:5173/*>
  ```
* 啟用 API：Maps JavaScript API
* `.env` 範例：
  ```bash
  # frontend/.env.example
  VITE_GOOGLE_MAPS_JS_KEY=YOUR_BROWSER_KEY   # Maps JavaScript API（Browser Key）
  VITE_API_BASE_URL=http://localhost:3000    # 後端 API 位址
  ```

**後端 Key（Server Key）**

* 限制類型：IP 位址（Note: 由於目前 app 尚未 deploy, app 是跑在本地端，故可暫時無 IP 限制，但需在 README 標註安全風險）
* **服務啟用規則（統一規格）** ：為了確保到時候同學們可以順利 review 彼此的作業，所以即使你的 app 不會完全使用到  **Geocoding** ,  **Places** , **Directions** 這三種 APIs, 但還是請你使用  **同一把 Server Key 同時啟用下列三項服務** ，以便同學互相執行與助教批改時可以使用自己的同一把金鑰來執行你的 app：
* Geocoding API
* Places API
* Directions API
* `.env` 範例：
  ```bash
  # backend/.env.example
  PORT=3000
  CORS_ORIGINS=http://localhost:5173,<http://127.0.0.1:5173>
  DATABASE_URL=file:./dev.db
  GOOGLE_MAPS_SERVER_KEY=YOUR_SERVER_KEY   # 已啟用 Geocoding/Places/Directions
  ```

---

## 系統功能模組與最低要求

| 模組                                | 功能要求                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Auth（登入系統）**          | 註冊、登入、登出；帳號唯一；密碼雜湊；錯誤提示（帳號重複、密碼錯誤等）                                                                                                                                                                                                                                                               |
| **地圖互動（Maps）**          | 地圖載入；「搜尋」或「標記」地點任一；點選地圖或搜尋結果可回填表單欄位（地址/座標）                                                                                                                                                                                                                                                  |
| **核心資源（自定義 Domain）** | 至少 1 種資料型態（例：店家、活動、路線、物件…）具備**建立/讀取/更新/刪除** ；每筆資料需含 **名稱** 、 **地點或座標** 、 **可選的時間或分類** 。 **核心資源必須持久化在資料庫（SQLite/MongoDB/PostgreSQL 其一）** ，不得只存於前端 state 或伺服器記憶體陣列，需要確保前端重啟之後已經記錄的資料還在。 |
| **伺服器端 Google 服務**      | 至少使用 Geocoding / Places / Directions 之一：如地址轉座標、依關鍵字/範圍查找地點、計算路徑/距離                                                                                                                                                                                                                                    |
| **（選做）擴充功能**          | 任選**一項** ：收藏/評分、提醒（前端模擬）、上傳/連結圖片、RWD、社群分享、離線暫存等                                                                                                                                                                                                                                           |

---

## API 與資料欄位建議（通用、非強制）

* **路由設計** ：`/auth/*`、`/api/<your-resource>/*`（依主題命名，如 `/api/events`、`/api/locations`）
* **常見欄位** （可依主題調整）：
  `id`, `title/name`, `description`, `latitude`, `longitude`, `address`, `category`, `startTime/endTime` 或 `date`, `createdBy`, `createdAt/updatedAt`
* **查詢參數** ：`?q=keyword&category=…&radius=…&lat=…&lng=…&from=…&to=…`

---

## 開發建議流程

| 階段 | 任務                                                         | 驗收方式                        |
| ---- | ------------------------------------------------------------ | ------------------------------- |
| 1    | 完成前端頁面（先用假資料）                                   | 前端可操作、頁面導覽正確        |
| 2    | 實作後端 + SQLite + Auth（含密碼雜湊）                       | 以 `curl`或 `.http`測試 API |
| 3    | 串接 Google APIs（Geocoding / Places / Directions 擇一或多） | 驗回傳結果（記錄範例與說明）    |
| 4    | 前端串接後端（Axios）                                        | 完整流程可運作（登入後可 CRUD） |
| 5    | 文件撰寫（README +`.env.example`）                         | 從零可重現                      |

---

## 專案繳交說明

1. 將所有程式放在：
   ```
   wp1141/hw4/

   ```
2. 於 deadline 前 push 到 main：
   請務必寫好 .gitignore, 不要上傳不必要的檔案，例如：node_modules, .env, logs 等
   ```bash
   git add hw4
   git commit -m "<your message>"
   git push
   ```
3. [**README.md](http://readme.md/) 必須包含：**
   * 專案簡介與功能清單（說明你的主題與使用情境）
   * 架構圖（可手繪或簡圖）
   * 前後端啟動步驟（`npm run dev` / `npm run start`）
   * `.env.example`
   * 後端 API 一覽與至少  **5 個 `curl` 範例** （含授權流程範例）
   * 已知問題與未來改進方向
   * （若使用 Server Key 無 IP 限制）**安全性風險說明**

---

## 補充：批改時請替換成你自己的金鑰（務必閱讀）

同一把 server key 來啟用後端的服務，為了統一後端金鑰設定、方便彼此在本機互跑專案與助教批改：

1. **統一啟用** ：如前面規定所述，請各位使用同一把 Server Key 來**同時啟用** Geocoding / Places / Directions 三項服務（即使你的主題未全用到），以利 reviewer 與助教在本機批改你的 app。
2. **批改必要提醒** ：你的 `.env.example` 與 README  **必須明確提示評分者「需置換為自己的金鑰後再啟動」** ，否則地圖功能將無法運作。
3. **金鑰的 placeholder** ：可在 README 提供占位符與範例指令，協助評分者了解應該要填入哪些金鑰（但請勿填寫真值）：

```bash
   # 於專案根目錄建立/編輯 .env（請評分者自行貼上金鑰）
   # frontend/.env
   VITE_GOOGLE_MAPS_JS_KEY=YOUR_BROWSER_KEY

   # backend/.env
   GOOGLE_MAPS_SERVER_KEY=YOUR_SERVER_KEY   # 啟用 Geocoding/Places/Directions

```

> 可簡單示範：將「YOUR_BROWSER_KEY / YOUR_SERVER_KEY」替換為自己的金鑰後再啟動。請勿在版本庫中提供任何有效金鑰。

---

## 補充：Chat History 與敏感資訊處理（務必特別留意）

為了協助檢視你的開發歷程，同時確保 **金鑰與個資不外洩** ，請遵守：

### 1) 匯出 Cursor 聊天紀錄

* 將本次作業相關的 Cursor chat history 匯出並放在：
  ```
  wp1141/hw4/chat-history/

  ```
* 檔名可自訂，但請保留原始時間或主題，方便索引。

<aside>
🤔

但如果你的 chat history 檔案太過龐大 (e.g. > 1MB), 請做出適當的刪減，留下 prompt, 工作項目，結論內容… 等重要資訊，然後刪除其他細節。

</aside>

### 2) 由 Cursor 自行淨化（先輸出，再清理）

* 匯出後，請再用 Cursor 審閱 `wp1141/hw4/chat-history/`， **主動要求它移除/遮罩所有敏感資訊** ，包含：
  * API Key / Secret / Token
  * 內網位址、Cookie、Session、資料庫連線字串
  * 個資（email、電話、學號…）
* 可直接貼給 Cursor 的指令型描述（範例）：
  > 「請讀取 wp1141/hw4/chat-history/ 的所有檔案，找出並移除或遮罩所有可能的敏感資訊（例如 API Key、Secrets、Tokens、Cookies、DB 連線字串、內網位址、個資）。請給我清理後的版本，並列出你移除的遮罩的項目類型與檔名。」
  >
* 若 Cursor 回傳修訂內容，請**覆蓋原檔**或另存 `-redacted`，上傳前僅保留 **已清理版本** 。

### 3) 關於 `.env` 與金鑰暴露風險

* **Cursor 預設讀不到 `.env`** 。讀不到時可能會下類似 `cat` 的指令嘗試讀檔。
* 你可**自行斟酌**是否讓 Cursor 存取你的 Key（一般不建議）。
* **無論如何** ，就算 Cursor 在對話中看到或引用了你的 Key，務必在 chat history 中 **移除或遮罩** ，不要把任何有效金鑰一併上傳 (如上項說明)。
* 請確認 `.env` 已在 `.gitignore`；並提供 `.env.example` 方便評測。

### 4) 上傳前自我安全檢查清單

* [ ] `wp1141/hw4/chat-history/` 已存在，且為**清理過的版本**
* [ ] chat history 中**沒有**明碼出現的：API Key / Secret / Token / Cookie / DB 連線字串 / 個資
* [ ] `.env` 未被提交；`.env.example` 有被提交且內容完整（但不含真值）
* [ ] README 已註記：若後端 Server Key 未限制 IP 的安全風險
* [ ] 提交前以關鍵字做全域搜尋：`key=`、`AIza`、`sk-`、`token`、`secret`、`cookie`、`password`、`Bearer` … 等

### 5) 建議遮罩格式

* 金鑰/憑證：保留開頭 4 碼 + `***` + 結尾 4 碼（例：`AIza****9XyZ`）
* 個資：以 `**` 取代個人識別段落（例：`s*****@ntu.edu.tw`）

> 重要：不要將任何有效金鑰、密碼、Cookie、Token、個資，連同 chat history 一起上傳。若不確定是否敏感，寧可遮罩。

---

## 評分標準（建議比例）

| 項目                       | 比例 |
| -------------------------- | ---- |
| 功能完整與使用體驗         | 60%  |
| 架構與程式品質（含安全性） | 30%  |
| 美觀與創意                 | 10%  |

**等第參考：**

| 評等          | 描述               |
| ------------- | ------------------ |
| Dead (0)      | 無法執行或空白頁   |
| Bad (1)       | 功能極簡或常出錯   |
| Fair (3)      | 可用但體驗不足     |
| Good (5)      | 流程順暢、達標     |
| Excellent (6) | 架構佳或有創意亮點 |

> 評分重點在「是否貼心、好用」，不再功能是否複雜、絢麗。

> 適逢期中考週，請大家斟酌自己的時間，對於本次作業已做出有完整基本功能、但流暢的 UIUX 的 app 為目標，真的有時間，再慢慢加上去。切勿一開始就 over-design, 最後無法收斂。

> 請確保登入、資料驗證、錯誤處理、與 Google 服務串接 皆有落地實作；並在 README 明確標示金鑰替換步驟，否則可能影響評分。

---

## 注意事項與常見地雷

也請 reviewer 在 review 時花些時間協助檢查，作為是否給予高分的憑據

* **資料驗證** ：前後端皆需做（email 格式、密碼長度、必填欄位、數值/日期格式）
* **權限與錯誤碼** ：回傳合適 HTTP 狀態碼與訊息（401/403/404/422/500 等）
* **安全性** ：密碼雜湊、JWT/Session 安全配置、CORS 白名單、`.env` 管理
* **Google API 使用量** ：避免不必要的高頻呼叫（可做簡單節流/快取）
* **可重現性** ：README 的步驟需能讓助教從零跑起（含種子資料/初始化腳本）

---

**User**

有些房屋的詳細資訊裡面的公設設施會出現英文，請全部修正好

---

**User**

我的後端是否有滿足：

- **技術棧**：Node.js + Express（建議 TypeScript）
- **RESTful API**：至少包含
  - `/auth`（註冊、登入、登出）
  - **一到兩個自定義資源**（例如 `/locations`、`/events`、`/posts`、`/items`…）具備 CRUD
- **Google Maps 伺服器端整合：**至少串接 **Geocoding** 或 **Places** 或 **Directions** 任一項（依主題選擇最合理者）
- **資料庫**：使用 SQLite（也可選 MongoDB 或 PostgreSQL）
  - 至少儲存「使用者登入資訊」或「主要資源資料」其中之一（建議兩者皆存）

---

**User**

上方篩選欄位請在"臥室"、"衛浴"等項目旁邊加入以"縣市"、"區"等等來做篩選，且如果已經選擇了縣市，則區才可以選擇，且會依據縣市做調整

---

**User**

有些虛擬資料的座標和地址對不上，請仔細確認並修正

---

**User**

你雖然說是200個資料，但我先前跟你說我當初看到是501個而現在變成701個，表示是增加上去而不是，但先前的資料很多有公設上的缺失，請重新給我完整且地理位置準確的共400筆資料，不是增加上去而是整個重新給我

---

**User**

篩選機制還是有問題，我用電視做篩選卻把有電視作為公設的三民區安靜公寓給篩選掉，請仔細檢查篩選的機制並修正

---

**User**

你一直卡在一樣的地方啊，發現是空的你重新生成用同一個程式碼是沒有差的吧，請仔細確認你的邏輯

---

**User**

按下清除全部應該連公設的篩選也一並清除，並且當按下房屋項目是地圖上的紅標應改浮起或是有醒目的提示讓使用者知道

---

**User**

請加入收藏/評分的功能，房資資訊會顯示他的評分，使用者也可以看到自己的房子的評分以及自己評分過的列表，同時也可以收藏房間到一個列表理供自己查看

---

**User**

先請關掉所有process，我自己手動打開

---

**User**

我無法載入我的房屋、我的收藏、我的評分等等，會壞掉並顯示無法載入

---

**User**

一樣只要我去看列表、收藏等等就會整個系統crash

---

**User**

很多房屋詳細資訊中的公設的名稱是英文，請都換成中文，同時使用者無法收藏、無法順利提交評分、無法看到評分、看到收藏，這些都需要解決，請仔細檢查哪裡有問題

---

**User**

Error: Request failed with status code 429 註冊帳號也失敗

---

**User**

google map也不能成功搜尋、無法收藏評分或是瀏覽收藏評分等等，全部都不能用

---

**User**

感覺還是會超出用量，一下子就跑不動了，是否可以監測並依此調整。
同時現在我雖然可以幫忙評分，但無法看到各個房屋的平均評分，也就是來自所有其他人的評分，請進行修改

---

**User**

操作還是有很大限制，一下就會跳出錯誤，同時現在還是看不到其他人的評分，公設詳細資料處也有英文，請轉成中文。
我的收藏頁面想要看詳細資料或是我的評分頁面按下編輯都會直接跳回地圖頁面但又不會停在剛剛想要看的房屋位置和右側資訊欄位置，也請修正

---

**User**

在我的收藏或是我的評分頁面裡若是要查看詳細資料就只需要把詳細資料的視窗展開即可，不需要和地圖配合，因為這個在收藏和評分的列表中不用和地圖交互，除非是主畫面有地圖的展開詳細資訊才需要能夠和地圖交互

---

**User**

在我的評分中更新評分會跳出詳細資訊，我可以在裡面更新評分，可是更新後卻沒有正確更新，以至於只有詳細資訊裡面的評分有更新而我的評分列表中沒有變

---

**User**

我若是在收藏頁面移除特定房屋的收藏，會沒有辦法馬上看到變更

---

**User**

可是我在收藏頁面移除特定房屋的收藏之後，該房屋還是會留在我的收藏頁面除非我重新離開再進到收藏頁面。
另外請將跳出的通知另外請將跳出的通知移到頁面右下角而不是右上角

---

**User**

解除愛心收藏後還是會保留在收藏頁面裡，我想要的是按下移除後會有彈出視窗詢問是否要移除收藏，使用者若決定移除，則會直接從收藏清單中移除，不用切換頁面就可以直接在收藏頁面將該房屋移除而無法看到

---

**User**

我移除了之後該房屋資訊和方匡還是留在收藏頁面，但應該要從收藏頁面移走才對

---

**User**

只有顯示從收藏移除而已

---

**User**

撰寫README，並請包涵"- 專案簡介與功能清單（說明你的主題與使用情境）

- 架構圖（可手繪或簡圖）
- 前後端啟動步驟（`npm run dev` / `npm run start`）
- `.env.example`
- 後端 API 一覽與至少 5 個 `curl` 範例（含授權流程範例）
- 已知問題與未來改進方向
- （若使用 Server Key 無 IP 限制）安全性風險說明" 並撰寫env.sample，且README 的步驟需能其他人從零跑起（含種子資料/初始化腳本），不要使用表情符號，讓README專業一點

---

**User**

先把不需用推到github的東西正確加到.gitignore

---

**User**

[plugin:vite:import-analysis] Failed to resolve import "@/lib/utils" from "src/components/ui/dialog.tsx". Does the file exist?
/Users/arthurlin/Desktop/網服/wp1141/hw4/frontend/src/components/ui/dialog.tsx:5:19
18 |  import * as DialogPrimitive from "@radix-ui/react-dialog";
19 |  import { X } from "lucide-react";
20 |  import { cn } from "@/lib/utils";
| ^
21 | const Dialog = DialogPrimitive.Root;
22 | const DialogTrigger = DialogPrimitive.Trigger;
at TransformPluginContext._formatError (file:///Users/arthurlin/Desktop/%E7%B6%B2%E6%9C%8D/wp1141/hw4/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:49258:41
at TransformPluginContext.error (file:///Users/arthurlin/Desktop/%E7%B6%B2%E6%9C%8D/wp1141/hw4/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:49253:16
at normalizeUrl (file:///Users/arthurlin/Desktop/%E7%B6%B2%E6%9C%8D/wp1141/hw4/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:64307:23
at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
at async file:///Users/arthurlin/Desktop/%E7%B6%B2%E6%9C%8D/wp1141/hw4/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:64439:39
at async Promise.all (index 6)
at async TransformPluginContext.transform (file:///Users/arthurlin/Desktop/%E7%B6%B2%E6%9C%8D/wp1141/hw4/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:64366:7
at async PluginContainer.transform (file:///Users/arthurlin/Desktop/%E7%B6%B2%E6%9C%8D/wp1141/hw4/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:49099:18
at async viteTransformMiddleware (file:///Users/arthurlin/Desktop/%E7%B6%B2%E6%9C%8D/wp1141/hw4/frontend/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:62106:24

---

**User**

請創建前端.env

---

**User**

建立完整虛擬的400個房屋資料，具備完整不同房東、真實地理位置、詳細名稱、完整公設資訊的資料

---

**User**

400個房子景分布在全台灣，而不要只在北部

---

**User**

房型篩選功能無效，且篩選條目與現在有的各種房型不合。公設篩選功能無效，且右側房屋列表無法直接看到各個公設，需要點進詳細資訊才可以看到，請修改

---

**User**

公設篩選還是有誤，例如我想選衣櫃卻會把有提供衣櫃「日式獨立套房 - 信義區」的給篩選掉，最後連一個都沒有，會是篩選機制和讀取檔案方式有問題嗎？還是虛擬資料創建時格式和我們要的有不符

---

**User**

我看到的結果還是沒辦法篩選，請檢查是不是有太多process

---

**User**

還是不行，依然無法正確篩選，現在連線是跟地區的篩選機制也被破壞掉了，許喔俺台北是，節果連不在台北的也會被保留

---

**User**

縣市的篩選解決了，但公設的篩選還是不行

---

**User**

公設與設施篩選
選擇必備的公設條件
的功能依然完全無效，他會把索有房間都過濾掉，不管選擇哪個公設，都沒有房間可以符合資格

---

**User**

現在有一個問題是假如我輸入"公館"，會從400個房屋篩選到只剩75個，這部分是對的，但此時不會有清除全部的功能，且清除全部沒有包含手動輸入地址這個按距離排序的功能，請調整

---

**User**

請將公設資訊全部轉成中文，但保留篩選的能力，也就是要同時注意encoding，確保不會因為顯示是中文而導致公設篩選功能失效

---

**User**

使用者看房屋的評分會看不到其他人的留言，我想要讓有登錄者都可以看到所有其他人的留言

---

**User**

新增房屋的細節請都用中文，如"Address"，且登入介面的各種警告提示也都用中文

---

**User**

搜尋錯誤會跳出提示"Could not geocode address"，請改成中文提示。
同時建立房屋時輸入地址後按尋找會找到對應的地圖上經緯度和位置，但是請找中文地址而不要回傳英文地址，且google map相關回應和提示請都用中文

---

**User**

坪數的篩選功能無法正常有用

---

**User**

公設中的"安靜"和"安靜區域"重複了，"樓層"可以去除

---

**User**

若我從我的收藏移除房屋應該立即從收藏頁面中移除，而不需用等到離開再回來收藏頁面才消失

---

**User**

幫我新增多一些虛擬評價和分數，勁量每個房屋至少要有3則評價和五個平均分數

---

**User**

評分和給的評論不一致，請修正，並確保多樣化一些

---

**User**

請讓留下評論者的名字可以更多樣，更接近真實情況

---

**User**

評分的人不腰出現lanlordxx這種名字

---

**User**

名字要是中文，且不要有數字
