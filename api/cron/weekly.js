import { redis, taipeiNow, dateKey, setupVapid, verifyCron, webpush } from '../_lib/push.js';

export default async function handler(req, res) {
  if (!verifyCron(req)) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const sub = await redis.get('push:subscription');
    const prefs = await redis.get('push:prefs');
    if (!sub || !prefs) { res.status(200).json({ skipped: 'no subscription or prefs' }); return; }

    const t = taipeiNow();
    const today = dateKey(t);
    const weeklyDow = typeof prefs.weeklyDow === 'number' ? prefs.weeklyDow : 5; // 0=日 ... 6=六，預設週五
    const [targetH] = String(prefs.weeklyTime || '11:00').split(':');
    const sameHour = Number(targetH) === t.getHours();
    const sameDow = t.getDay() === weeklyDow;

    const lastSent = await redis.get('push:lastSentWeekly');
    if (lastSent === today || !sameHour || !sameDow) {
      res.status(200).json({ skipped: true, today, lastSent, sameHour, sameDow });
      return;
    }

    setupVapid();
    await webpush.sendNotification(sub, JSON.stringify({
      title: '每週紀錄彙整提醒',
      body: '別忘了盡速完成本週的聯絡紀錄彙整喔。',
      tag: 'weekly-reminder',
      url: '/',
    }));

    await redis.set('push:lastSentWeekly', today);
    res.status(200).json({ sent: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}
