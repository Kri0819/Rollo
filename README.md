# Rollo｜滾滾

會自己滾到明天的待辦清單。

輸入一次待辦事項，沒完成就每天保留在待辦頁。快到期、今日截止、已逾期會自動變色提醒。

## Google 登入設定

設定頁與標籤功能需要登入才能使用，登入採用 Google Identity Services（純前端，沒有後端資料庫，資料仍只存在使用者的裝置上，不會跨裝置同步）。

1. 到 [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 建立一個 OAuth 用戶端 ID（應用程式類型選「網頁應用程式」）。
2. 在「已授權的 JavaScript 來源」加入你會用到的網址，例如：
   - `http://localhost:5173`（本機開發）
   - 你實際部署的網域，例如 `https://your-app.vercel.app`
3. 複製產生的 Client ID（格式類似 `xxxxx.apps.googleusercontent.com`），填入 `.env`：
   ```
   VITE_GOOGLE_CLIENT_ID=你的-client-id.apps.googleusercontent.com
   ```
4. 如果部署在 Vercel／Netlify 之類的平台，記得到該平台的環境變數設定裡也加上同一組 `VITE_GOOGLE_CLIENT_ID`，否則正式站會顯示「尚未設定 Google Client ID」。

目前這組登入只用來取得 Google 的名字／大頭貼、並解鎖標籤功能，不會把待辦資料上傳到任何伺服器。
