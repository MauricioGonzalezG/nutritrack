import type { APIRoute } from 'astro';
import { ensureSchema, getDb } from '../../lib/db';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const noDb = () => json({ error: 'db-not-configured', remote: false }, 503);

const validCode = (u: string) => /^[A-Z0-9-]{6,20}$/i.test(u);

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

/** POST /api/entries  { u, entry } → inserta/actualiza una entrada. */
export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) return noDb();

  let body: { u?: string; entry?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-json' }, 400);
  }
  const { u, entry } = body;
  if (!u || !validCode(u)) return json({ error: 'invalid-code' }, 400);
  if (!entry || typeof entry.id !== 'string' || typeof entry.date !== 'string') {
    return json({ error: 'invalid-entry' }, 400);
  }

  await ensureSchema(db);
  await db.execute({
    sql: `INSERT INTO entries (id, user_code, date, meal, food_id, name, emoji, quantity, calories, protein, carbs, fat, sat_fat, fiber, sugar)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (id) DO UPDATE SET
            user_code = excluded.user_code,
            date = excluded.date,
            meal = excluded.meal,
            quantity = excluded.quantity`,
    args: [
      entry.id,
      u,
      entry.date,
      str(entry.meal, 'snacks'),
      typeof entry.foodId === 'string' ? entry.foodId : null,
      str(entry.name, 'Alimento'),
      str(entry.emoji, '🍽️'),
      num(entry.quantity) || 1,
      num(entry.calories),
      num(entry.protein),
      num(entry.carbs),
      num(entry.fat),
      num(entry.satFat),
      num(entry.fiber),
      num(entry.sugar),
    ],
  });
  return json({ ok: true });
};

/** DELETE /api/entries  { u, id } → elimina una entrada del usuario. */
export const DELETE: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) return noDb();

  let body: { u?: string; id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-json' }, 400);
  }
  const { u, id } = body;
  if (!u || !validCode(u)) return json({ error: 'invalid-code' }, 400);
  if (!id) return json({ error: 'invalid-id' }, 400);

  await ensureSchema(db);
  await db.execute({
    sql: 'DELETE FROM entries WHERE id = ? AND user_code = ?',
    args: [id, u],
  });
  return json({ ok: true });
};
