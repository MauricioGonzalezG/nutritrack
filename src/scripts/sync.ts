import {
  getChallengeState,
  getCustomFoods,
  getEntries,
  getGoals,
  getLabs,
  getProfile,
  hydrateFromServer,
} from './store';
import type { ChallengeState, Food, FoodEntry, Goals, LabResults, Profile } from './types';

/**
 * Sincronización con el servidor (Turso vía API routes).
 * Si la API no está configurada (sin base de datos), la app funciona
 * 100% en modo local con localStorage.
 *
 * Estrategia:
 * - Al iniciar, se descarga el estado remoto y reemplaza al local.
 * - Si el remoto está vacío (código nuevo), se SUBE el estado local.
 * - Las escrituras son locales primero (optimistas) y luego se envían.
 */

const CODE_KEY = 'nutritrack:sync-code';

let remote = false;
let code = '';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos

function generateCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
  return `${pick(4)}-${pick(4)}`;
}

export function getSyncCode(): string {
  if (code) return code;
  const stored = localStorage.getItem(CODE_KEY);
  if (stored) {
    code = stored;
  } else {
    code = generateCode();
    localStorage.setItem(CODE_KEY, code);
  }
  return code;
}

export function isRemote(): boolean {
  return remote;
}

interface StateResponse {
  remote: boolean;
  entries: FoodEntry[];
  data: {
    profile?: Profile | null;
    goals?: Goals | null;
    challenges?: ChallengeState | null;
    labs?: LabResults | null;
    customFoods?: Food[] | null;
  };
}

const headers = { 'Content-Type': 'application/json' };

/** Sube el estado local completo al servidor (primera sincronización de un código). */
async function uploadAllLocal(): Promise<void> {
  const u = getSyncCode();
  try {
    await fetch('/api/state', { method: 'PUT', headers, body: JSON.stringify({ u, key: 'goals', value: getGoals() }) });
    const profile = getProfile();
    if (profile) {
      await fetch('/api/state', { method: 'PUT', headers, body: JSON.stringify({ u, key: 'profile', value: profile }) });
    }
    const challenges = getChallengeState();
    if (Object.keys(challenges).length > 0) {
      await fetch('/api/state', { method: 'PUT', headers, body: JSON.stringify({ u, key: 'challenges', value: challenges }) });
    }
    const labs = getLabs();
    if (labs) {
      await fetch('/api/state', { method: 'PUT', headers, body: JSON.stringify({ u, key: 'labs', value: labs }) });
    }
    const customFoods = getCustomFoods();
    if (customFoods.length > 0) {
      await fetch('/api/state', { method: 'PUT', headers, body: JSON.stringify({ u, key: 'customFoods', value: customFoods }) });
    }
    const entries = getEntries();
    for (let i = 0; i < entries.length; i += 20) {
      await Promise.all(
        entries
          .slice(i, i + 20)
          .map((entry) => fetch('/api/entries', { method: 'POST', headers, body: JSON.stringify({ u, entry }) })),
      );
    }
  } catch {
    remote = false;
  }
}

/** Decide si bajar el estado remoto o subir el local. */
async function reconcile(state: StateResponse): Promise<void> {
  const remoteEmpty = (state.entries?.length ?? 0) === 0 && Object.keys(state.data ?? {}).length === 0;
  if (remoteEmpty) {
    await uploadAllLocal();
  } else {
    hydrateFromServer(
      state.entries ?? [],
      state.data?.goals ?? null,
      state.data?.profile ?? null,
      state.data?.challenges ?? null,
      state.data?.labs ?? null,
      state.data?.customFoods ?? null,
    );
  }
}

/** Carga inicial: intenta reconciliar con el servidor. */
export async function initSync(onHydrated: () => void): Promise<void> {
  const u = getSyncCode();
  try {
    const res = await fetch(`/api/state?u=${encodeURIComponent(u)}`);
    if (!res.ok) throw new Error(String(res.status));
    const state = (await res.json()) as StateResponse;
    remote = true;
    await reconcile(state);
  } catch {
    remote = false; // modo local
  } finally {
    onHydrated();
  }
}

/** Vincula este dispositivo a otro código (p. ej. el del celular). */
export async function linkDevice(newCode: string): Promise<boolean> {
  const normalized = newCode.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,20}$/.test(normalized)) return false;
  try {
    const res = await fetch(`/api/state?u=${encodeURIComponent(normalized)}`);
    if (!res.ok) return false;
    const state = (await res.json()) as StateResponse;
    code = normalized;
    localStorage.setItem(CODE_KEY, normalized);
    remote = true;
    await reconcile(state);
    return true;
  } catch {
    return false;
  }
}

/* ---------- Escrituras (disparo y olvido, con modo local de respaldo) ---------- */

function post(url: string, method: string, payload: unknown): void {
  if (!remote) return;
  fetch(url, {
    method,
    headers,
    body: JSON.stringify(payload),
  }).catch(() => {
    remote = false;
  });
}

export function pushEntry(entry: FoodEntry): void {
  post('/api/entries', 'POST', { u: getSyncCode(), entry });
}

export function pushDelete(id: string): void {
  post('/api/entries', 'DELETE', { u: getSyncCode(), id });
}

export function pushData(key: 'profile' | 'goals' | 'challenges' | 'labs' | 'customFoods', value: unknown): void {
  post('/api/state', 'PUT', { u: getSyncCode(), key, value });
}
