# Rollo｜滾滾

會自己滾到明天的待辦清單。

輸入一次待辦事項，沒完成就每天保留在待辦頁。快到期、今日截止、已逾期會自動變色提醒。

## 雲端同步設定（Supabase + Google 登入）

登入後，待辦事項與標籤會存進 Supabase，而不是只留在裝置上。設定分兩塊：

### 1. 建立資料表

到 Supabase 專案的 **SQL Editor**，貼上並執行 `supabase/schema.sql` 這個檔案。它會建立 `tasks`、`tags` 兩張表，並開啟 Row Level Security（每個人只能讀寫自己的資料）。

### 2. 開啟 Google 登入

Supabase 幫你處理整個 Google OAuth 流程，設定都在 Supabase 後台，**不是**在這個專案的程式碼裡：

1. Google Cloud Console → 這組 OAuth 用戶端的「已授權的重新導向 URI」，加上：
   ```
   https://hmxajsjowjejqlvjrybe.supabase.co/auth/v1/callback
   ```
2. Supabase 後台 → Authentication → Providers → Google → 開啟，貼上 Google 的 **Client ID** 和 **Client Secret**（Client Secret 只填在這裡，絕對不要放進前端程式碼或 `.env`）。
3. Supabase 後台 → Authentication → URL Configuration，把 Site URL／Redirect URLs 加上你會用到的網址，例如：
   - `http://localhost:5173`（本機開發）
   - 你實際部署的網域，例如 `https://your-app.vercel.app`

### 3. 前端環境變數

`.env` 裡需要：
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=你的-anon-public-key
```
這組 anon key 本來就設計成可以放在前端（會被瀏覽器看到），真正的存取權限是靠上面的 Row Level Security 控制，不是靠藏起這組 key。

如果部署在 Vercel／Netlify，記得到該平台的環境變數設定裡也加上同樣兩個變數。

### 沒登入的狀態

沒有登入或還沒設定 Supabase 時，App 照樣可以用——待辦事項存在裝置本機（localStorage），只是標籤功能會鎖起來，登入後才能用。第一次登入時，如果雲端還沒有資料、但這台裝置已經有本機資料，會自動把本機資料搬一份上雲端。
