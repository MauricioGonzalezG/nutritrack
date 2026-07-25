import type { APIRoute } from 'astro';
import { ensureSchema, getDb } from '../../../lib/db';
import { processReminders } from '../../../lib/push';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * GET /api/cron/reminders
 * Vercel Cron envía un GET cada 5 minutos. Opcionalmente protegido por CRON_SECRET.
 */
export const GET: APIRoute = async ({ request, url }) => {
  const secret = import.meta.env.CRON_SECRET as string | undefined;
  if (secret) {
    const provided = request.headers.get('x-cron-secret');
    if (provided !== secret) return json({ error: 'unauthorized' }, 401);
  }

  try {
    const debug = url.searchParams.get('debug') === '1';
    if (debug) {
      const db = getDb();
      if (!db) return json({ error: 'no-db' }, 503);
      await ensureSchema(db);
      const cfgs = await db.execute("SELECT user_code, value FROM user_data WHERE key = 'reminder_config'");
      const subs = await db.execute("SELECT user_code, endpoint FROM push_subscriptions");
      return json({
        configs: cfgs.rows.map(r => ({ user: r.user_code, value: r.value })),
        subs: subs.rows.map(r => ({ user: r.user_code, endpoint: r.endpoint })),
      });
    }
    const result = await processReminders();
    return json({ ok: true, ...result });
  } catch (err) {
    return json({ error: 'cron-failed', message: (err as Error).message }, 500);
  }
};
