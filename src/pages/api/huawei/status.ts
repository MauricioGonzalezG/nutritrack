import type { APIRoute } from 'astro';
import { ensureSchema, getDb } from '../../../lib/db';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** GET /api/huawei/status?u=CODE -> Verifica si hay conexión activa */
export const GET: APIRoute = async ({ request }) => {
  const u = new URL(request.url).searchParams.get('u') ?? '';
  if (!u) return json({ error: 'missing-user' }, 400);

  const db = getDb();
  if (!db) return json({ connected: false, mode: 'local' });

  await ensureSchema(db);
  const rowRs = await db.execute({
    sql: 'SELECT value FROM user_data WHERE user_code = ? AND key = ?',
    args: [u, 'huaweiTokens'],
  });

  if (rowRs.rows.length === 0) {
    return json({ connected: false });
  }

  try {
    const data = JSON.parse(rowRs.rows[0].value as string);
    return json({
      connected: true,
      linkedAt: data.linkedAt,
    });
  } catch {
    return json({ connected: false });
  }
};

/** DELETE /api/huawei/status?u=CODE -> Desvincula Huawei Health */
export const DELETE: APIRoute = async ({ request }) => {
  let body: { u?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const u = body.u || new URL(request.url).searchParams.get('u') || '';
  if (!u) return json({ error: 'missing-user' }, 400);

  const db = getDb();
  if (db) {
    await ensureSchema(db);
    await db.execute({
      sql: 'DELETE FROM user_data WHERE user_code = ? AND key IN (?, ?)',
      args: [u, 'huaweiTokens', 'huaweiData'],
    });
  }

  return json({ ok: true, connected: false });
};
