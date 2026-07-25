import { getEntriesForDate, getLabs, getProfile, todayKey } from './store';
import { buildCtx, dailyChallenges } from './challenges';
import { effectiveFocus } from './labs';
import { getSyncCode } from './sync';
import { MEAL_LABELS, type MealType } from './types';

const TIMES_KEY = 'nutritrack:reminder-times';
const ENABLED_KEY = 'nutritrack:reminders-enabled';

export const DEFAULT_TIMES: Record<MealType, string> = {
  desayuno: '08:00',
  almuerzo: '13:00',
  snacks: '16:30',
  cena: '19:30',
};

export type PermissionState = 'unsupported' | 'default' | 'granted' | 'denied';

export function getPermission(): PermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (getPermission() === 'unsupported') return 'unsupported';
  if (getPermission() === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result as PermissionState;
}

export function isRemindersEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === '1';
}

export function setRemindersEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  if (enabled) void scheduleToday();
  else void cancelAll();
}

export function getTimes(): Record<MealType, string> {
  try {
    const raw = localStorage.getItem(TIMES_KEY);
    return raw ? { ...DEFAULT_TIMES, ...(JSON.parse(raw) as Partial<Record<MealType, string>>) } : { ...DEFAULT_TIMES };
  } catch {
    return { ...DEFAULT_TIMES };
  }
}

export function setTimes(times: Record<MealType, string>): void {
  localStorage.setItem(TIMES_KEY, JSON.stringify(times));
}

interface ReminderContext {
  hasEntries: Record<MealType, boolean>;
  challenge: { title: string; desc: string } | null;
}

function buildContext(): ReminderContext {
  const profile = getProfile();
  const focus = effectiveFocus(profile, getLabs());
  const dateKey = todayKey();
  buildCtx(dateKey, profile); // mantiene coherencia si se invoca desde otros lugares
  const todays = dailyChallenges(dateKey, focus);
  const entries = getEntriesForDate(dateKey);
  const hasEntries: Record<MealType, boolean> = {
    desayuno: entries.some((e) => e.meal === 'desayuno'),
    almuerzo: entries.some((e) => e.meal === 'almuerzo'),
    cena: entries.some((e) => e.meal === 'cena'),
    snacks: entries.some((e) => e.meal === 'snacks'),
  };
  return { hasEntries, challenge: todays[0] ?? null };
}

function messageFor(meal: MealType, ctx: ReminderContext): string {
  if (ctx.hasEntries[meal]) return `✅ Ya registraste ${MEAL_LABELS[meal].toLowerCase()}. ¡Buen trabajo!`;
  if (meal === 'desayuno') return '🥣 ¿Qué desayunaste? La avena o un batido con frutas son grandes aliados para tu LDL.';
  if (meal === 'almuerzo') {
    const reto = ctx.challenge ? ` Hoy toca: ${ctx.challenge.title.toLowerCase()}.` : '';
    return `🍛 No olvides registrar tu almuerzo.${reto}`;
  }
  if (meal === 'snacks') return '🍎 ¿Tuviste algún snack? Una fruta o puñado de frutos secos siempre suma.';
  return '🌙 Última comida del día. Cena ligera, sin alcohol ni fritos, para bajar triglicéridos.';
}

/* ==================================================================
   Web Push (VAPID): suscripción persistente enviada por el servidor
   ================================================================== */

async function fetchVapidKey(): Promise<string | null> {
  try {
    const r = await fetch('/api/push/vapid-key');
    if (!r.ok) return null;
    const data = (await r.json()) as { key: string | null };
    return data.key;
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export async function isPushSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return false;
  const sub = await reg.pushManager.getSubscription();
  return !!sub;
}

export async function subscribeToPush(times: Record<MealType, string>): Promise<{ ok: boolean; reason?: string }> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, reason: 'unsupported' };
  }
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return { ok: false, reason: 'no-service-worker' };

  const vapidKey = await fetchVapidKey();
  if (!vapidKey) return { ok: false, reason: 'no-vapid-key' };

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    try {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    } catch (err) {
      return { ok: false, reason: `subscribe-failed:${(err as Error).message}` };
    }
  }

  const json = subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  try {
    const r = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        u: getSyncCode(),
        subscription: { endpoint: json.endpoint, keys: json.keys },
        times,
        timezone,
      }),
    });
    if (!r.ok) return { ok: false, reason: `server-${r.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `network:${(err as Error).message}` };
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  try {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ u: getSyncCode(), endpoint: sub.endpoint }),
    });
  } catch { /* ignorar errores de red al desuscribir */ }
  await sub.unsubscribe();
}

/* ==================================================================
   Programación local (fallback cuando no hay servidor / push)
   ================================================================== */

export async function scheduleToday(): Promise<void> {
  if (getPermission() !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;
  await cancelAll();
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg?.active) return;
  const times = getTimes();
  const ctx = buildContext();
  const now = Date.now();
  const meals: MealType[] = ['desayuno', 'almuerzo', 'snacks', 'cena'];
  for (const meal of meals) {
    const [hh, mm] = times[meal].split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    const delay = target.getTime() - now;
    if (delay <= 0) continue;
    reg.active.postMessage({
      type: 'schedule',
      id: meal,
      delay,
      title: `NutriTrack · ${MEAL_LABELS[meal]}`,
      body: messageFor(meal, ctx),
      meal,
      tag: meal,
    });
  }
}

export async function cancelAll(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  reg?.active?.postMessage({ type: 'cancel-all' });
}

export async function testNotification(): Promise<PermissionState> {
  const state = await requestPermission();
  if (state !== 'granted' || getPermission() !== 'granted') return state;
  new Notification('NutriTrack', {
    body: '✅ Las notificaciones funcionan. Te avisaremos 3 veces al día.',
    icon: '/icon.svg',
  });
  return 'granted';
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('Service worker no disponible:', err);
    return null;
  }
}

export function remindersStatus(): { enabled: boolean; times: Record<MealType, string>; permission: PermissionState } {
  return { enabled: isRemindersEnabled(), times: getTimes(), permission: getPermission() };
}
