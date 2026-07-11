import webpush from 'web-push';
import { Redis } from '@upstash/redis';

// Vercel KV 已淘汰，改用 Marketplace 上的 Upstash Redis 整合。
// 透過 Vercel 儀表板安裝 Upstash 整合後，會自動注入 KV_REST_API_URL / KV_REST_API_TOKEN 這兩個環境變數。
export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// 台北時間固定 UTC+8，不做日光節約時間調整
export function taipeiNow() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 8 * 3600 * 1000);
}

export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function setupVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:example@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export function verifyCron(req) {
  // Vercel 會自動在 Cron 觸發的請求上加入 CRON_SECRET，避免被外部亂打
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 尚未設定就先放行，避免本機測試被擋
  const auth = req.headers['authorization'];
  return auth === `Bearer ${secret}`;
}

export { webpush };
