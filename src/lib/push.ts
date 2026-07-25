import webpush from 'web-push';
import { type Client } from '@libsql/client';
import { getDb } from './db';

/**
 * Helpers del lado servidor para notificaciones Web Push.
 *
 * Suscripciones: en la tabla `push_subscriptions` (una por dispositivo).
 * Configuración (horarios, zona, último envío): en `user_data` con key
 *   'reminder_config', value JSON { times, timezone, lastSent }.
 */

interface PushSubscription {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}

interface ReminderConfig {
  times: Record<string, string>; // { desayuno: "08:00", almuerzo: "13:00", ... }
  timezone: string; // IANA: "America/Bogota"
  lastSent: Record<string, string>; // { desayuno: "2026-07-24", ... }
}

let configured = false;

export function ensureVapidConfigured(): boolean {
  if (configured) return true;
  const publicKey = import.meta.env.VAPID_PUBLIC_KEY;
  const privateKey = import.meta.env.VAPID_PRIVATE_KEY;
  const subject = (import.meta.env.VAPID_SUBJECT as string | undefined) ?? 'mailto:admin@example.com';
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  const k = import.meta.env.VAPID_PUBLIC_KEY as string | undefined;
  return k || null;
}

/** Convierte fecha UTC a hora local del usuario (HH:MM). */
function localTimeOf(date: Date, timezone: string): { hh: number; mm: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { hh, mm };
}

function toHM(t: { hh: number; mm: number }): string {
  return `${String(t.hh).padStart(2, '0')}:${String(t.mm).padStart(2, '0')}`;
}

function todayKeyFor(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // "2026-07-24"
}

async function loadAllConfigs(db: Client): Promise<Array<{ userCode: string; config: ReminderConfig; subscription: PushSubscription | null }>> {
  const subsRs = await db.execute('SELECT user_code, endpoint, p256dh, auth FROM push_subscriptions');
  const configsRs = await db.execute("SELECT user_code, value FROM user_data WHERE key = 'reminder_config'");

  const subs = new Map<string, PushSubscription>();
  for (const row of subsRs.rows) {
    subs.set(row.user_code as string, {
      endpoint: row.endpoint as string,
      expirationTime: null,
      keys: { p256dh: row.p256dh as string, auth: row.auth as string },
    });
  }
  const configs: { userCode: string; config: ReminderConfig; subscription: PushSubscription | null }[] = [];
  for (const row of configsRs.rows) {
    const userCode = row.user_code as string;
    try {
      const config = JSON.parse(row.value as string) as ReminderConfig;
      configs.push({ userCode, config, subscription: subs.get(userCode) ?? null });
    } catch {
      // valor corrupto: saltar
    }
  }
  return configs;
}

const MEAL_MESSAGES: Record<string, (meal: string) => { title: string; body: string }> = {
  desayuno: () => ({ title: 'NutriTrack · Desayuno', body: '🥣 ¿Qué desayunaste? La avena o un batido con frutas son grandes aliados para tu LDL.' }),
  almuerzo: () => ({ title: 'NutriTrack · Almuerzo', body: '🍛 No olvides registrar tu almuerzo. Ataca los retos del día.' }),
  snacks: () => ({ title: 'NutriTrack · Snacks', body: '🍎 ¿Tuviste algún snack? Una fruta o puñado de frutos secos siempre suma.' }),
  cena: () => ({ title: 'NutriTrack · Cena', body: '🌙 Última comida del día. Cena ligera, sin alcohol ni fritos, para bajar triglicéridos.' }),
};

const MEAL_ORDER = ['desayuno', 'almuerzo', 'snacks', 'cena'] as const;

/** Llamado por el cron job. Recorre usuarios y envía pushes según su hora local. */
export async function processReminders(): Promise<{ sent: number; skipped: number; errors: number }> {
  if (!ensureVapidConfigured()) return { sent: 0, skipped: 0, errors: 0 };
  const db = getDb();
  if (!db) return { sent: 0, skipped: 0, errors: 0 };
  const configs = await loadAllConfigs(db);
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const { userCode, config, subscription } of configs) {
    if (!subscription) { skipped++; continue; }
    const localNow = localTimeOf(new Date(), config.timezone || 'UTC');
    const currentHM = toHM(localNow);
    const today = todayKeyFor(config.timezone || 'UTC');
    let dirty = false;

    for (const meal of MEAL_ORDER) {
      const mealHM = config.times[meal];
      if (!mealHM) continue;
      if (config.lastSent?.[meal] === today) continue; // ya enviado hoy
      if (!isWithinWindow(currentHM, mealHM, 5)) continue;

      const msg = MEAL_MESSAGES[meal](meal);
      const payload = JSON.stringify({ title: msg.title, body: msg.body, meal });

      try {
        await webpush.sendNotification(subscription, payload);
        config.lastSent = { ...(config.lastSent ?? {}), [meal]: today };
        dirty = true;
        sent++;
      } catch (err) {
        // Si la suscripción expiró (410) o no es válida (404), eliminarla
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await db.execute({
            sql: 'DELETE FROM push_subscriptions WHERE user_code = ? AND endpoint = ?',
            args: [userCode, subscription.endpoint],
          });
        }
        errors++;
        console.warn(`[push] error sending to ${userCode}/${meal}: ${(err as Error).message} (status ${status})`);
      }
    }

    if (dirty) {
      await db.execute({
        sql: 'INSERT INTO user_data (user_code, key, value) VALUES (?, ?, ?) ON CONFLICT (user_code, key) DO UPDATE SET value = excluded.value',
        args: [userCode, 'reminder_config', JSON.stringify(config)],
      });
    }
  }
  return { sent, skipped, errors };
}

function isWithinWindow(currentHM: string, targetHM: string, windowMin: number): boolean {
  const [ch, cm] = currentHM.split(':').map(Number);
  const [th, tm] = targetHM.split(':').map(Number);
  const current = ch * 60 + cm;
  const target = th * 60 + tm;
  // Acepta target, target+1, ..., target + windowMin
  return current >= target && current < target + windowMin;
}
