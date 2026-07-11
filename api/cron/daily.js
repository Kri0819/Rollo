import { redis, taipeiNow, dateKey, setupVapid, verifyCron, webpush } from '../_lib/push.js';

// Vercel 免費方案的 Cron 只能「一天觸發一次」，且只保證在指定的那個小時內觸發
// （例如排程訂在 23:xx UTC，就可能在 23:00:00~23:59:59 之間任何時間點被呼叫）。
// 所以這裡用「目前小時是否等於使用者設定的小時」來判斷要不要送，
// 而不是精確比對到分鐘——分鐘會有最多 59 分鐘的誤差，這是免費方案的限制。
export default async function handler(req, res) {
  if (!verifyCron(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const sub = await redis.get('push:subscription');
    const prefs = await redis.get('push:prefs');
    if (!sub || !prefs) { res.status(200).json({ skipped: 'no subscription or prefs' }); return; }

    const t = taipeiNow();
    const today = dateKey(t);
    const [targetH] = String(prefs.dailyTime || '07:50').split(':');
    const sameHour = Number(targetH) === t.getHours();

    const lastSent = await redis.get('push:lastSentDaily');
    if (lastSent === today || !sameHour) {
      res.status(200).json({ skipped: true, today, lastSent, sameHour });
      return;
    }

    setupVapid();
    await webpush.sendNotification(sub, JSON.stringify({
      title: '今日待辦提醒',
      body: '打開 ReCon｜再聯絡，查看今天有哪些個案需要聯絡。',
      tag: 'daily-reminder',
      url: '/',
    }));

    await redis.set('push:lastSentDaily', today);
    res.status(200).json({ sent: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
