import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const validCode = (u: string) => /^[A-Z0-9-]{6,20}$/i.test(u);

/** POST /api/push/unsubscribe  { u, endpoint? } */
export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) return json({ error: 'db-not-configured' }, 503);

  let body: { u?: string; endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-json' }, 400);
  }
  const { u, endpoint } = body;
  if (!u || !validCode(u)) return json({ error: 'invalid-code' }, 400);

  if (endpoint) {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE user_code = ? AND endpoint = ?',
      args: [u, endpoint],
    });
  } else {
    await db.execute({
      sql: 'DELETE FROM push_subscriptions WHERE user_code = ?',
      args: [u],
    });
  }
  // No eliminamos reminder_config para permitir reactivar después
  return json({ ok: true });
};
