import { getEntriesForDate, getGoals, getLabs, getProfile, todayKey } from './store';
import { buildCtx, dailyChallenges, isChallengeDone } from './challenges';
import { effectiveFocus } from './labs';
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

export function setRemindersEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  if (enabled) scheduleToday();
  else cancelAll();
}

interface ReminderContext {
  profile: ReturnType<typeof getProfile>;
  hasEntries: Record<MealType, boolean>;
  focus: ReturnType<typeof effectiveFocus>;
  challenge: { title: string; desc: string } | null;
}

function buildContext(meal: MealType): ReminderContext {
  const profile = getProfile();
  const focus = effectiveFocus(profile, getLabs());
  const dateKey = todayKey();
  const ctx = buildCtx(dateKey, profile);
  const todays = dailyChallenges(dateKey, focus);
  const entries = getEntriesForDate(dateKey);
  const hasEntries: Record<MealType, boolean> = {
    desayuno: entries.some((e) => e.meal === 'desayuno'),
    almuerzo: entries.some((e) => e.meal === 'almuerzo'),
    cena: entries.some((e) => e.meal === 'cena'),
    snacks: entries.some((e) => e.meal === 'snacks'),
  };
  return { profile, hasEntries, focus, challenge: todays[0] ?? null };
}

function messageFor(meal: MealType, ctx: ReminderContext): string {
  const already = ctx.hasEntries[meal];
  if (already) return `✅ Ya registraste ${MEAL_LABELS[meal].toLowerCase()}. ¡Buen trabajo!`;
  if (meal === 'desayuno') {
    return '🥣 ¿Qué desayunaste? La avena o un batido con frutas son grandes aliados para tu LDL.';
  }
  if (meal === 'almuerzo') {
    const reto = ctx.challenge ? ` Hoy toca: ${ctx.challenge.title.toLowerCase()}.` : '';
    return `🍛 No olvides registrar tu almuerzo.${reto}`;
  }
  if (meal === 'snacks') {
    return '🍎 ¿Tuviste algún snack? Una fruta o puñado de frutos secos siempre suma.';
  }
  return '🌙 Última comida del día. Cena ligera, sin alcohol ni fritos, para bajar triglicéridos.';
}

function titleFor(meal: MealType): string {
  return `NutriTrack · ${MEAL_LABELS[meal]}`;
}

/** Programa los recordatorios del día (saltando los del pasado). */
export async function scheduleToday(): Promise<void> {
  if (getPermission() !== 'granted') return;
  if (!('serviceWorker' in navigator)) return;

  await cancelAll();
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg?.active) return;

  const times = getTimes();
  const now = Date.now();
  const meals: MealType[] = ['desayuno', 'almuerzo', 'snacks', 'cena'];
  for (const meal of meals) {
    const [hh, mm] = times[meal].split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    const delay = target.getTime() - now;
    if (delay <= 0) continue; // ya pasó hoy
    const ctx = buildContext(meal);
    reg.active.postMessage({
      type: 'schedule',
      id: meal,
      delay,
      title: titleFor(meal),
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

/** Muestra una notificación de prueba inmediata. */
export async function testNotification(): Promise<PermissionState> {
  const state = await requestPermission();
  if (state !== 'granted' || getPermission() !== 'granted') return state;
  new Notification('NutriTrack', {
    body: '✅ Las notificaciones funcionan. Te avisaremos 3 veces al día.',
    icon: '/icon.svg',
  });
  return 'granted';
}

/** Registra el service worker (idempotente). */
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

/** Resumen del estado para la UI. */
export function remindersStatus(): { enabled: boolean; times: Record<MealType, string>; permission: PermissionState } {
  return { enabled: isRemindersEnabled(), times: getTimes(), permission: getPermission() };
}
