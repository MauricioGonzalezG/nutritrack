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

/** GET /api/state?u=CODE → todo el estado del usuario. */
export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) return noDb();

  const u = new URL(request.url).searchParams.get('u') ?? '';
  if (!validCode(u)) return json({ error: 'invalid-code' }, 400);

  await ensureSchema(db);

  const entriesRs = await db.execute({
    sql: 'SELECT * FROM entries WHERE user_code = ? ORDER BY date DESC, rowid ASC',
    args: [u],
  });
  const dataRs = await db.execute({
    sql: 'SELECT key, value FROM user_data WHERE user_code = ?',
    args: [u],
  });

  const entries = entriesRs.rows.map((r) => ({
    id: r.id,
    foodId: r.food_id,
    name: r.name,
    emoji: r.emoji,
    quantity: r.quantity,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
    satFat: r.sat_fat,
    fiber: r.fiber,
    sugar: r.sugar,
    meal: r.meal,
    date: r.date,
  }));

  const data: Record<string, unknown> = {};
  for (const row of dataRs.rows) {
    try {
      data[row.key as string] = JSON.parse(row.value as string);
    } catch {
      /* valor corrupto: ignorar */
    }
  }

  return json({ remote: true, entries, data });
};

/** PUT /api/state  { u, key, value } → guarda profile/goals/challenges. */
export const PUT: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) return noDb();

  let body: { u?: string; key?: string; value?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad-json' }, 400);
  }
  const { u, key, value } = body;
  if (!u || !validCode(u)) return json({ error: 'invalid-code' }, 400);
  if (!key || !['profile', 'goals', 'challenges', 'labs'].includes(key)) return json({ error: 'invalid-key' }, 400);

  await ensureSchema(db);
  await db.execute({
    sql: 'INSERT INTO user_data (user_code, key, value) VALUES (?, ?, ?) ON CONFLICT (user_code, key) DO UPDATE SET value = excluded.value',
    args: [u, key, JSON.stringify(value ?? null)],
  });
  return json({ ok: true });
};
