import { getDailySummaries, getDayTotals, getEntriesForDate, getLabs, getMealTotals, getGoals } from './store';
import { healthLimits } from './health';
import { effectiveFocus, labPriorities } from './labs';
import type { DayTotals, FoodEntry, HealthFocus, HealthLimits, Profile } from './types';

export interface ChallengeCtx {
  totals: DayTotals;
  entries: FoodEntry[];
  limits: HealthLimits;
  calorieGoal: number;
  dinnerKcal: number;
}

export interface ChallengeDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  focus: 'colesterol' | 'trigliceridos' | 'ambos';
  /** Si existe, el reto se marca solo al detectar el logro en tus registros. */
  auto?: (ctx: ChallengeCtx) => boolean;
}

function has(ctx: ChallengeCtx, foodIds: string[]): boolean {
  return ctx.entries.some((e) => e.foodId !== null && foodIds.includes(e.foodId));
}

function logged(ctx: ChallengeCtx): boolean {
  return ctx.entries.length > 0;
}

export const CHALLENGE_POOL: ChallengeDef[] = [
  // --- Colesterol ---
  { id: 'avena', emoji: '🥣', title: 'Avena en el desayuno', desc: 'Sus beta-glucanos ayudan a reducir el LDL ("malo").', focus: 'colesterol', auto: (c) => has(c, ['avena']) },
  { id: 'fibra-ok', emoji: '🌾', title: 'Meta de fibra', desc: 'Alcanza tu objetivo diario de fibra soluble.', focus: 'colesterol', auto: (c) => logged(c) && c.totals.fiber >= c.limits.fiber },
  { id: 'legumbres', emoji: '🫘', title: 'Legumbres hoy', desc: 'Frijoles o lentejas: fibra que barre el colesterol.', focus: 'colesterol', auto: (c) => has(c, ['frijoles', 'lentejas', 'hummus']) },
  { id: 'verde', emoji: '🥦', title: 'Verduras verdes', desc: 'Brócoli, espinaca o ensalada en alguna comida.', focus: 'colesterol', auto: (c) => has(c, ['brocoli', 'espinaca', 'ensalada']) },
  { id: 'satfat-ok', emoji: '🧈', title: 'Grasa saturada bajo control', desc: 'Termina el día por debajo de tu límite.', focus: 'colesterol', auto: (c) => logged(c) && c.totals.satFat <= c.limits.satFat },
  { id: 'sin-carne-roja', emoji: '🥩', title: 'Día sin carne roja', desc: 'La carne roja es de las mayores fuentes de grasa saturada: sube el LDL.', focus: 'colesterol', auto: (c) => logged(c) && !has(c, ['carne-res', 'cerdo', 'jamon', 'hamburguesa']) },

  // --- Triglicéridos ---
  { id: 'pescado', emoji: '🐟', title: 'Pescado rico en omega-3', desc: 'Salmón o atún: los omega-3 bajan los triglicéridos.', focus: 'trigliceridos', auto: (c) => has(c, ['salmon', 'atun']) },
  { id: 'sin-refrescos', emoji: '🥤', title: 'Cero bebidas azucaradas', desc: 'Ni refrescos ni jugos: el azúcar líquido dispara los TG.', focus: 'trigliceridos', auto: (c) => logged(c) && !has(c, ['refresco', 'jugo-naranja']) },
  { id: 'sin-alcohol', emoji: '🍺', title: 'Día sin alcohol', desc: 'El alcohol es de los mayores enemigos de los triglicéridos.', focus: 'trigliceridos', auto: (c) => logged(c) && !has(c, ['cerveza', 'vino']) },
  { id: 'azucar-ok', emoji: '🍬', title: 'Azúcar bajo control', desc: 'Mantén los azúcares por debajo de tu límite diario.', focus: 'trigliceridos', auto: (c) => logged(c) && c.totals.sugar <= c.limits.sugar },
  { id: 'cena-ligera', emoji: '🌙', title: 'Cena ligera', desc: 'Cena de máximo 500 kcal para no elevar los TG nocturnos.', focus: 'trigliceridos', auto: (c) => c.dinnerKcal > 0 && c.dinnerKcal <= 500 },

  // --- Ambos ---
  { id: 'frutos-secos', emoji: '🥜', title: 'Puñado de frutos secos', desc: 'Grasas buenas que mejoran tu perfil lipídico.', focus: 'ambos', auto: (c) => has(c, ['almendras', 'nueces', 'mantequilla-mani']) },
  { id: 'sin-fritos', emoji: '🍟', title: 'Día sin frituras', desc: 'Evita fritos: grasas que suben LDL y triglicéridos.', focus: 'ambos', auto: (c) => logged(c) && !has(c, ['papas-fritas', 'nuggets']) },
  { id: 'caminata', emoji: '🚶', title: '30 min de caminata', desc: 'El ejercicio aeróbico sube el HDL ("bueno"). Márcalo al completarlo.', focus: 'ambos' },
];

/* ---------- Selección determinista por día ---------- */

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = (seed + i * 7) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * 3 retos al día, deterministas por fecha. Si tus exámenes muestran
 * colesterol o triglicéridos altos, siempre incluye un reto de ese frente.
 */
export function dailyChallenges(dateKey: string, focus: HealthFocus | undefined): ChallengeDef[] {
  const f = focus ?? 'general';
  const seed = hashStr(dateKey);
  const priorities = labPriorities(getLabs());
  const eligible = (c: ChallengeDef) => f === 'general' || f === 'ambos' || c.focus === f || c.focus === 'ambos';

  const picks: ChallengeDef[] = [];
  if (priorities.cholesterol || f === 'colesterol' || f === 'ambos') {
    const c = seededShuffle(CHALLENGE_POOL.filter((x) => eligible(x) && x.focus === 'colesterol'), seed + 1)[0];
    if (c) picks.push(c);
  }
  if (priorities.triglycerides || f === 'trigliceridos' || f === 'ambos') {
    const t = seededShuffle(CHALLENGE_POOL.filter((x) => eligible(x) && x.focus === 'trigliceridos' && !picks.includes(x)), seed + 2)[0];
    if (t) picks.push(t);
  }
  const rest = seededShuffle(CHALLENGE_POOL.filter((x) => eligible(x) && !picks.includes(x)), seed + 3);
  return picks.concat(rest).slice(0, 3);
}

export function buildCtx(dateKey: string, profile: Profile | null): ChallengeCtx {
  const goals = getGoals();
  return {
    totals: getDayTotals(dateKey),
    entries: getEntriesForDate(dateKey),
    limits: healthLimits(effectiveFocus(profile, getLabs()), goals.calories),
    calorieGoal: goals.calories,
    dinnerKcal: getMealTotals(dateKey, 'cena'),
  };
}

export function isChallengeDone(ch: ChallengeDef, ctx: ChallengeCtx, manual: boolean): boolean {
  return manual || (ch.auto ? ch.auto(ctx) : false);
}

/* ---------- Reto semanal ---------- */

export interface WeeklyDef {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  target: number;
  unit: string;
  progress: (days: { dateKey: string; totals: DayTotals; entries: FoodEntry[] }[], ctx: ChallengeCtx) => number;
}

const WEEKLY: WeeklyDef[] = [
  {
    id: 'w-goal', emoji: '🎯', title: 'Semana dentro del objetivo', desc: 'Al menos 5 días sin pasarte de tus kcal.',
    target: 5, unit: 'días',
    progress: (days, ctx) => days.filter((d) => d.totals.calories > 0 && d.totals.calories <= ctx.calorieGoal).length,
  },
  {
    id: 'w-fish', emoji: '🐟', title: 'Omega-3 semanal', desc: 'Come pescado al menos 3 veces esta semana.',
    target: 3, unit: 'veces',
    progress: (days) => days.reduce((n, d) => n + d.entries.filter((e) => e.foodId === 'salmon' || e.foodId === 'atun').length, 0),
  },
  {
    id: 'w-fiber', emoji: '🌾', title: 'Fibra constante', desc: 'Al menos 5 días alcanzando tu objetivo de fibra.',
    target: 5, unit: 'días',
    progress: (days, ctx) => days.filter((d) => d.entries.length > 0 && d.totals.fiber >= ctx.limits.fiber).length,
  },
];

export function weeklyChallenge(dateKey: string): WeeklyDef {
  return WEEKLY[Math.floor(hashStr(dateKey.slice(0, 7)) / 7) % WEEKLY.length];
}

export function weeklyProgress(def: WeeklyDef, profile: Profile | null): number {
  const days = getDailySummaries(7);
  return Math.min(def.progress(days, buildCtx(days[days.length - 1].dateKey, profile)), def.target);
}

/* ---------- Racha ---------- */

/** Días consecutivos (hacia atrás desde hoy) completando los 3 retos diarios. */
export function currentStreak(profile: Profile | null, manualState: Record<string, Record<string, boolean>>): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ctx = buildCtx(key, profile);
    const todays = dailyChallenges(key, profile?.focus);
    const allDone = todays.every((ch) => isChallengeDone(ch, ctx, manualState[key]?.[ch.id] === true));
    if (allDone) streak++;
    else if (i === 0) {
      // hoy aún no cuenta: se puede completar durante el día
    } else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
