import type { APIRoute } from 'astro';
import { ensureSchema, getDb } from '../../../lib/db';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const validCode = (u: string) => /^[A-Z0-9-]{6,20}$/i.test(u);

/** POST /api/push/subscribe  { u, subscription, times, timezone } */
export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) return json({ error: 'db-not-configured' }, 503);

  let body: { u?: string; subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } }; times?: Record<string, string>; timezone?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-json' }, 400);
  }
  const { u, subscription, times, timezone } = body;
  if (!u || !validCode(u)) return json({ error: 'invalid-code' }, 400);
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return json({ error: 'invalid-subscription' }, 400);
  }

  await ensureSchema(db);

  // Guarda suscripción
  await db.execute({
    sql: `INSERT INTO push_subscriptions (user_code, endpoint, p256dh, auth)
          VALUES (?, ?, ?, ?)
          ON CONFLICT (user_code, endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`,
    args: [u, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
  });

  // Guarda config de recordatorios (manteniendo lastSent existente)
  const config = { times: times ?? {}, timezone: timezone ?? 'UTC', lastSent: {} as Record<string, string> };
  const existing = await db.execute({
    sql: "SELECT value FROM user_data WHERE user_code = ? AND key = 'reminder_config'",
    args: [u],
  });
  if (existing.rows[0]) {
    try {
      const prev = JSON.parse(existing.rows[0].value as string) as { lastSent?: Record<string, string> };
      if (prev.lastSent) config.lastSent = prev.lastSent;
    } catch { /* ignorar */ }
  }
  await db.execute({
    sql: 'INSERT INTO user_data (user_code, key, value) VALUES (?, ?, ?) ON CONFLICT (user_code, key) DO UPDATE SET value = excluded.value',
    args: [u, 'reminder_config', JSON.stringify(config)],
  });

  return json({ ok: true });
};
