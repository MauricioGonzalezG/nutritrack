import type { ChallengeState, DayTotals, Food, FoodEntry, Goals, LabResults, MealType, Profile } from './types';

const ENTRIES_KEY = 'nutritrack:entries';
const GOALS_KEY = 'nutritrack:goals';
const PROFILE_KEY = 'nutritrack:profile';
const CHALLENGES_KEY = 'nutritrack:challenges';
const LABS_KEY = 'nutritrack:labs';
const CUSTOM_FOODS_KEY = 'nutritrack:custom_foods';

export const DEFAULT_GOALS: Goals = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 65,
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Fechas ---------- */

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/* ---------- Objetivos ---------- */

export function getGoals(): Goals {
  return load(GOALS_KEY, { ...DEFAULT_GOALS });
}

export function setGoals(goals: Goals): void {
  save(GOALS_KEY, goals);
  notify();
}

/* ---------- Perfil ---------- */

export function getProfile(): Profile | null {
  return load<Profile | null>(PROFILE_KEY, null);
}

export function setProfile(profile: Profile): void {
  save(PROFILE_KEY, profile);
  notify();
}

/* ---------- Exámenes de sangre ---------- */

export function getLabs(): LabResults | null {
  return load<LabResults | null>(LABS_KEY, null);
}

export function setLabs(labs: LabResults): void {
  save(LABS_KEY, labs);
  notify();
}

/* ---------- Retos (marcas manuales) ---------- */

export function getChallengeState(): ChallengeState {
  return load<ChallengeState>(CHALLENGES_KEY, {});
}

export function toggleChallenge(dateKey: string, challengeId: string): boolean {
  const state = getChallengeState();
  const day = { ...(state[dateKey] ?? {}) };
  day[challengeId] = !day[challengeId];
  state[dateKey] = day;
  save(CHALLENGES_KEY, state);
  notify();
  return day[challengeId];
}

/* ---------- Entradas ---------- */

export function getEntries(): FoodEntry[] {
  return load<FoodEntry[]>(ENTRIES_KEY, []);
}

export function getEntriesForDate(dateKey: string): FoodEntry[] {
  return getEntries().filter((e) => e.date === dateKey);
}

export function getEntriesForMeal(dateKey: string, meal: MealType): FoodEntry[] {
  return getEntries().filter((e) => e.date === dateKey && e.meal === meal);
}

export function addEntry(entry: Omit<FoodEntry, 'id'>): FoodEntry {
  const full: FoodEntry = { ...entry, id: crypto.randomUUID() };
  const entries = getEntries();
  entries.push(full);
  save(ENTRIES_KEY, entries);
  notify();
  return full;
}

export function removeEntry(id: string): void {
  save(ENTRIES_KEY, getEntries().filter((e) => e.id !== id));
  notify();
}

/* ---------- Cálculos ---------- */

export function getDayTotals(dateKey: string): DayTotals {
  const totals: DayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, satFat: 0, fiber: 0, sugar: 0 };
  for (const e of getEntriesForDate(dateKey)) {
    totals.calories += e.calories * e.quantity;
    totals.protein += e.protein * e.quantity;
    totals.carbs += e.carbs * e.quantity;
    totals.fat += e.fat * e.quantity;
    totals.satFat += (e.satFat ?? 0) * e.quantity;
    totals.fiber += (e.fiber ?? 0) * e.quantity;
    totals.sugar += (e.sugar ?? 0) * e.quantity;
  }
  return totals;
}

export function getMealTotals(dateKey: string, meal: MealType): number {
  return getEntriesForMeal(dateKey, meal).reduce((sum, e) => sum + e.calories * e.quantity, 0);
}

/** Calorías de los últimos `days` días (incluye hoy), de más antiguo a más reciente. */
export function getWeekCalories(days = 7): { dateKey: string; label: string; calories: number }[] {
  const result: { dateKey: string; label: string; calories: number }[] = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const entries = getEntries();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const calories = entries
      .filter((e) => e.date === key)
      .reduce((sum, e) => sum + e.calories * e.quantity, 0);
    result.push({ dateKey: key, label: dayNames[d.getDay()], calories });
  }
  return result;
}

/** Totales y entradas de los últimos `days` días (para análisis y retos semanales). */
export function getDailySummaries(days = 7): { dateKey: string; totals: DayTotals; entries: FoodEntry[] }[] {
  const result: { dateKey: string; totals: DayTotals; entries: FoodEntry[] }[] = [];
  const entries = getEntries();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    const dayEntries = entries.filter((e) => e.date === key);
    const totals: DayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, satFat: 0, fiber: 0, sugar: 0 };
    for (const e of dayEntries) {
      totals.calories += e.calories * e.quantity;
      totals.protein += e.protein * e.quantity;
      totals.carbs += e.carbs * e.quantity;
      totals.fat += e.fat * e.quantity;
      totals.satFat += (e.satFat ?? 0) * e.quantity;
      totals.fiber += (e.fiber ?? 0) * e.quantity;
      totals.sugar += (e.sugar ?? 0) * e.quantity;
    }
    result.push({ dateKey: key, totals, entries: dayEntries });
  }
  return result;
}

/* ---------- Hidratación desde el servidor (sync) ---------- */

export const STORAGE_KEYS = { ENTRIES_KEY, GOALS_KEY, PROFILE_KEY, CHALLENGES_KEY, LABS_KEY };

export function hydrateFromServer(
  entries: FoodEntry[],
  goals: Goals | null,
  profile: Profile | null,
  challenges: ChallengeState | null,
  labs: LabResults | null,
): void {
  save(ENTRIES_KEY, entries);
  if (goals) save(GOALS_KEY, goals);
  if (profile) save(PROFILE_KEY, profile);
  if (challenges) save(CHALLENGES_KEY, challenges);
  if (labs) save(LABS_KEY, labs);
  notify();
}

/* ---------- Alimentos personalizados ---------- */

export function getCustomFoods(): Food[] {
  return load<Food[]>(CUSTOM_FOODS_KEY, []);
}

export function saveCustomFood(food: Omit<Food, 'id'> & { id?: string }): Food {
  const customFoods = getCustomFoods();
  const nameClean = food.name.trim();
  const existingIndex = customFoods.findIndex(
    (f) => (food.id && f.id === food.id) || f.name.trim().toLowerCase() === nameClean.toLowerCase()
  );

  const full: Food = {
    id: food.id || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: nameClean,
    emoji: food.emoji || '🍽️',
    calories: Math.round(Number(food.calories) || 0),
    protein: Math.round((Number(food.protein) || 0) * 10) / 10,
    carbs: Math.round((Number(food.carbs) || 0) * 10) / 10,
    fat: Math.round((Number(food.fat) || 0) * 10) / 10,
    satFat: Math.round((Number(food.satFat) || 0) * 10) / 10,
    fiber: Math.round((Number(food.fiber) || 0) * 10) / 10,
    sugar: Math.round((Number(food.sugar) || 0) * 10) / 10,
    serving: food.serving?.trim() || '1 porción',
    isCustom: true,
  };

  if (existingIndex >= 0) {
    customFoods[existingIndex] = full;
  } else {
    customFoods.unshift(full);
  }

  save(CUSTOM_FOODS_KEY, customFoods);
  notify();
  return full;
}

/* ---------- Suscripción a cambios ---------- */

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(): void {
  listeners.forEach((fn) => fn());
}
