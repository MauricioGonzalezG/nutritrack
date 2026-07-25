import { createClient, type Client } from '@libsql/client';

/**
 * Conexión a Turso (SQLite serverless). Si no hay variables de entorno,
 * devuelve null y la app funciona en modo local (localStorage).
 */
let client: Client | null | undefined;

export function getDb(): Client | null {
  if (client === undefined) {
    const url = import.meta.env.TURSO_DATABASE_URL as string | undefined;
    const authToken = import.meta.env.TURSO_AUTH_TOKEN as string | undefined;
    if (!url) {
      client = null;
    } else if (url.startsWith('file:')) {
      // SQLite local (desarrollo/pruebas): no requiere token.
      client = createClient({ url });
    } else {
      client = authToken ? createClient({ url, authToken }) : null;
    }
  }
  return client;
}

let schemaReady = false;

export async function ensureSchema(db: Client): Promise<void> {
  if (schemaReady) return;
  await db.batch([
    `CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      user_code TEXT NOT NULL,
      date TEXT NOT NULL,
      meal TEXT NOT NULL,
      food_id TEXT,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '🍽️',
      quantity REAL NOT NULL DEFAULT 1,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      sat_fat REAL NOT NULL DEFAULT 0,
      fiber REAL NOT NULL DEFAULT 0,
      sugar REAL NOT NULL DEFAULT 0
    )`,
    `CREATE INDEX IF NOT EXISTS idx_entries_user ON entries(user_code, date)`,
    `CREATE TABLE IF NOT EXISTS user_data (
      user_code TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (user_code, key)
    )`,
    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      user_code TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_code, endpoint)
    )`,
  ]);
  schemaReady = true;
}
