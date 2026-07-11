import { redis } from './_lib/push.js';

// 這是單人使用的個人工具，所以只存「最新一組」訂閱與提醒設定，
// 不做多使用者管理。每次啟用推播、或修改提醒時間，都會呼叫這支 API 覆蓋舊資料。
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const { subscription, prefs } = req.body || {};
    if (!subscription || !subscription.endpoint) {
      res.status(400).json({ error: '缺少訂閱資訊' });
      return;
    }
    await redis.set('push:subscription', subscription);
    if (prefs) await redis.set('push:prefs', prefs);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '伺服器錯誤，請確認 Upstash Redis 是否已設定' });
  }
}
