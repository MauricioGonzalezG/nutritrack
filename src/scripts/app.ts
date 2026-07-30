import type { GeminiAnalysis, GeminiItem } from '../pages/api/analyze-photo';
import { FOODS, findFood, getAllFoods, searchFoods } from './foods';
import {
  addEntry,
  getChallengeState,
  getCustomFoods,
  getDailySummaries,
  getDayTotals,
  getEntries,
  getEntriesForDate,
  getEntriesForMeal,
  getGoals,
  getHuaweiData,
  getHuaweiDataForDate,
  getLabs,
  getProfile,
  getWeekCalories,
  removeEntry,
  saveCustomFood,
  setGoals,
  setLabs,
  setProfile,
  subscribe,
  toDateKey,
  todayKey,
  toggleChallenge,
  updateHuaweiDayData,
} from './store';
import {
  calculatePeriodSummary,
  downloadCSV,
  generateEntriesCSV,
  getDateRangeFromPreset,
  type DateRangePreset,
  type PeriodSummary,
} from './metrics';
import {
  ACTIVITY_LABELS,
  FOCUS_LABELS,
  bmi,
  bmiCategory,
  bmr,
  foodHeartRating,
  foodRisk,
  healthLimits,
  suggestedCalories,
  suggestedMacros,
  tdee,
} from './health';
import { ANALYTES, PROFILE_HINTS, SEED_LABS, analyteStatus, effectiveFocus } from './labs';
import {
  buildCtx,
  currentStreak,
  dailyChallenges,
  isChallengeDone,
  weeklyChallenge,
  weeklyProgress,
} from './challenges';
import { generateInsights } from './analysis';
import { getSyncCode, initSync, isRemote, linkDevice, pushData, pushDelete, pushEntry } from './sync';
import {
  DEFAULT_TIMES,
  cancelAll,
  getPermission,
  getTimes,
  isPushSubscribed,
  isRemindersEnabled,
  registerServiceWorker,
  requestPermission,
  scheduleToday,
  setRemindersEnabled,
  setTimes,
  subscribeToPush,
  testNotification,
  unsubscribeFromPush,
} from './notifications';
import {
  MEAL_ICONS,
  MEAL_LABELS,
  type ActivityLevel,
  type Food,
  type Goals,
  type HealthFocus,
  type LabResults,
  type MealType,
  type Profile,
  type Sex,
} from './types';

/* ==================================================================
   Estado de la UI
   ================================================================== */

const MEALS: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snacks'];

let selectedDate = new Date();
let modalMeal: MealType = 'desayuno';
let selectedFood: Food | null = null;
let quantity = 1;
let searchQuery = '';
let modalTab: 'buscar' | 'foto' | 'personalizado' = 'buscar';
let photoSelected: File | null = null;
let detectedPhotoItems: GeminiItem[] = [];
let detectedPhotoSummary: GeminiAnalysis | null = null;
let bannerDismissed = localStorage.getItem('nutritrack:banner-dismissed') === '1';

let metricsPreset: DateRangePreset = '7d';
let metricsCustomStart = '';
let metricsCustomEnd = '';

let activeMetricsTab: 'dashboard' | 'chat' = 'dashboard';
let chatMessages: Array<{ role: 'user' | 'model'; content: string }> = [];

interface NutrientFilters {
  protein: boolean;
  carbs: boolean;
  fat: boolean;
  satFat: boolean;
  fiber: boolean;
  sugar: boolean;
}

const DEFAULT_NUTRIENT_FILTERS: NutrientFilters = {
  protein: true,
  carbs: true,
  fat: true,
  satFat: false,
  fiber: false,
  sugar: false,
};

function getNutrientFilters(): NutrientFilters {
  try {
    const raw = localStorage.getItem('nutritrack:nutrient_filters');
    return raw ? { ...DEFAULT_NUTRIENT_FILTERS, ...JSON.parse(raw) } : DEFAULT_NUTRIENT_FILTERS;
  } catch {
    return DEFAULT_NUTRIENT_FILTERS;
  }
}

function saveNutrientFilters(filters: NutrientFilters): void {
  localStorage.setItem('nutritrack:nutrient_filters', JSON.stringify(filters));
}

function syncNutrientFilterCheckboxes(): void {
  const f = getNutrientFilters();
  const setCheck = (id: string, checked: boolean) => {
    const input = document.querySelector<HTMLInputElement>(id);
    if (input) input.checked = checked;
  };
  setCheck('#nf-protein', f.protein);
  setCheck('#nf-carbs', f.carbs);
  setCheck('#nf-fat', f.fat);
  setCheck('#nf-satfat', f.satFat);
  setCheck('#nf-fiber', f.fiber);
  setCheck('#nf-sugar', f.sugar);
}

/* ==================================================================
   Utilidades
   ================================================================== */

function $(selector: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    console.warn(`[NutriTrack] Elemento no encontrado: ${selector}`);
    return document.createElement('div');
  }
  return el;
}

function esc(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString('es-ES');
}

function fmtMacro(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('es-ES');
}

function dateLabel(date: Date): string {
  const key = toDateKey(date);
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (key === today) return 'Hoy';
  if (key === toDateKey(yesterday)) return 'Ayer';
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fullDateLabel(date: Date): string {
  const s = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const ICONS = {
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>',
  check: '✓',
};

/* ==================================================================
   Renderizado general
   ================================================================== */

function renderAll(): void {
  renderHeader();
  renderBanner();
  renderRing();
  renderHuaweiWidget();
  renderMacros();
  renderCardio();
  renderLabs();
  renderChallenges();
  renderMeals();
  renderWeek();
  renderPlan();
  renderAnalysis();
  updateBellDot();
}

function renderHeader(): void {
  const isPlan = toDateKey(selectedDate) > todayKey();
  $('#date-label').textContent = dateLabel(selectedDate);
  $('#date-full').textContent = fullDateLabel(selectedDate);
  $('#plan-badge').classList.toggle('hidden', !isPlan);
  // Permitir avanzar hasta 7 días hacia el futuro para planificar.
  const max = new Date();
  max.setHours(0, 0, 0, 0);
  max.setDate(max.getDate() + 7);
  ($('#btn-next-day') as HTMLButtonElement).disabled = toDateKey(selectedDate) >= toDateKey(max);
}

function renderBanner(): void {
  const show = !getProfile() && !bannerDismissed;
  $('#profile-banner').classList.toggle('hidden', !show);
}

function renderRing(): void {
  const goals = getGoals();
  const totals = getDayTotals(toDateKey(selectedDate));
  const hwData = getHuaweiDataForDate(toDateKey(selectedDate));
  const activeCalories = hwData?.activeCalories || 0;
  const adjustedGoal = goals.calories + activeCalories;

  const pct = adjustedGoal > 0 ? Math.min(totals.calories / adjustedGoal, 1) : 0;

  const ring = $('#ring-progress') as unknown as SVGCircleElement;
  const r = Number(ring.getAttribute('r'));
  const circ = 2 * Math.PI * r;
  ring.style.strokeDasharray = `${circ}`;
  ring.style.strokeDashoffset = `${circ * (1 - pct)}`;

  $('#ring-kcal').textContent = fmt(totals.calories);
  $('#ring-goal').textContent = activeCalories > 0
    ? `de ${fmt(adjustedGoal)} kcal (+${fmt(activeCalories)} Huawei)`
    : `de ${fmt(goals.calories)} kcal`;

  const remaining = adjustedGoal - totals.calories;
  const remainingEl = $('#ring-remaining');
  if (remaining >= 0) {
    remainingEl.textContent = `${fmt(remaining)} kcal restantes`;
    remainingEl.classList.remove('over');
  } else {
    remainingEl.textContent = `${fmt(-remaining)} kcal por encima`;
    remainingEl.classList.add('over');
  }

  $('#stat-consumed').textContent = fmt(totals.calories);
  $('#stat-goal').textContent = fmt(adjustedGoal);
  $('#stat-remaining').textContent = fmt(Math.max(remaining, 0));
}

let isHuaweiConnectedState = false;

function renderHuaweiWidget(): void {
  const card = $('#huawei-widget-card');
  if (!card) return;
  const dateKey = toDateKey(selectedDate);
  const hwData = getHuaweiDataForDate(dateKey);

  if (isHuaweiConnectedState || (hwData && (hwData.activeCalories > 0 || hwData.steps > 0))) {
    card.classList.remove('hidden');
    const calEl = $('#hw-widget-calories');
    const stepsEl = $('#hw-widget-steps');
    if (calEl) calEl.textContent = `${fmt(hwData?.activeCalories || 0)} kcal`;
    if (stepsEl) stepsEl.textContent = `${fmt(hwData?.steps || 0)}`;
  } else {
    card.classList.add('hidden');
  }
}



function renderMacros(): void {
  const goals = getGoals();
  const totals = getDayTotals(toDateKey(selectedDate));
  const macros = [
    { label: 'Proteínas', value: totals.protein, goal: goals.protein, cls: 'protein' },
    { label: 'Carbohidratos', value: totals.carbs, goal: goals.carbs, cls: 'carbs' },
    { label: 'Grasas', value: totals.fat, goal: goals.fat, cls: 'fat' },
  ];

  $('#macros').innerHTML = macros
    .map((m) => {
      const pct = m.goal > 0 ? Math.min((m.value / m.goal) * 100, 100) : 0;
      return `
      <div class="macro">
        <div class="macro-head">
          <span class="macro-name">${m.label}</span>
          <span class="macro-value">${fmtMacro(m.value)} / ${fmt(m.goal)} g</span>
        </div>
        <div class="macro-bar"><div class="macro-fill ${m.cls}" style="width:${pct}%"></div></div>
      </div>`;
    })
    .join('');
}

/* ==================================================================
   Salud cardiovascular (grasa saturada, fibra, azúcar)
   ================================================================== */

function renderCardio(): void {
  const profile = getProfile();
  const goals = getGoals();
  const totals = getDayTotals(toDateKey(selectedDate));
  const focus = effectiveFocus(profile, getLabs());
  const limits = healthLimits(focus, goals.calories);

  $('#focus-badge').textContent = FOCUS_LABELS[focus];

  // Grasa saturada: límite (menos es mejor)
  const satPct = Math.min((totals.satFat / limits.satFat) * 100, 100);
  const satCls = totals.satFat <= limits.satFat * 0.8 ? 'limit-ok' : totals.satFat <= limits.satFat ? 'limit-warn' : 'limit-over';

  // Fibra: objetivo (más es mejor)
  const fibPct = Math.min((totals.fiber / limits.fiber) * 100, 100);

  // Azúcar: límite (menos es mejor)
  const sugPct = Math.min((totals.sugar / limits.sugar) * 100, 100);
  const sugCls = totals.sugar <= limits.sugar * 0.8 ? 'limit-ok' : totals.sugar <= limits.sugar ? 'limit-warn' : 'limit-over';

  $('#cardio').innerHTML = `
    <div class="gauge">
      <div class="gauge-head">
        <span class="gauge-name">🧈 Grasa saturada <span class="gauge-tag">límite · colesterol</span></span>
        <span class="gauge-value">${fmtMacro(totals.satFat)} / ${limits.satFat} g</span>
      </div>
      <div class="gauge-bar"><div class="gauge-fill ${satCls}" style="width:${satPct}%"></div></div>
    </div>
    <div class="gauge">
      <div class="gauge-head">
        <span class="gauge-name">🌾 Fibra <span class="gauge-tag">objetivo · colesterol</span></span>
        <span class="gauge-value">${fmtMacro(totals.fiber)} / ${limits.fiber} g</span>
      </div>
      <div class="gauge-bar"><div class="gauge-fill goal-fill" style="width:${fibPct}%"></div></div>
    </div>
    <div class="gauge">
      <div class="gauge-head">
        <span class="gauge-name">🍬 Azúcares <span class="gauge-tag">límite · triglicéridos</span></span>
        <span class="gauge-value">${fmtMacro(totals.sugar)} / ${limits.sugar} g</span>
      </div>
      <div class="gauge-bar"><div class="gauge-fill ${sugCls}" style="width:${sugPct}%"></div></div>
    </div>`;
}

/* ==================================================================
   Exámenes de sangre
   ================================================================== */

function renderLabs(): void {
  const labs = getLabs();
  const profile = getProfile();
  const card = $('#labs-card');

  if (!labs) {
    card.classList.add('hidden');
    return;
  }
  card.classList.remove('hidden');

  $('#lab-date').textContent = new Date(labs.date + 'T12:00:00').toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const rows = ANALYTES.filter((a) => labs[a.key] !== undefined && labs[a.key] !== null);
  $('#labs').innerHTML = rows
    .map((a) => {
      const value = labs[a.key] as number;
      const status = analyteStatus(a.key, value, profile?.sex);
      return `
      <div class="lab-row">
        <span class="lab-name">${a.name}<span class="lab-ref">${a.ref} ${a.unit}</span></span>
        <span class="lab-value">${value.toLocaleString('es-ES')}</span>
        <span class="lab-status ${status.tone}">${status.label}</span>
      </div>`;
    })
    .join('');
}

function openLabsModal(): void {
  const labs = getLabs();
  ($('#lab-date-input') as HTMLInputElement).value = labs?.date ?? todayKey();
  ($('#lab-ct') as HTMLInputElement).value = labs ? String(labs.totalCholesterol) : '';
  ($('#lab-ldl') as HTMLInputElement).value = labs ? String(labs.ldl) : '';
  ($('#lab-hdl') as HTMLInputElement).value = labs ? String(labs.hdl) : '';
  ($('#lab-tg') as HTMLInputElement).value = labs ? String(labs.triglycerides) : '';
  ($('#lab-vldl') as HTMLInputElement).value = labs?.vldl !== undefined ? String(labs.vldl) : '';
  ($('#lab-index') as HTMLInputElement).value = labs?.atherogenicIndex !== undefined ? String(labs.atherogenicIndex) : '';
  $('#labs-modal').classList.add('open');
  document.body.classList.add('modal-open');
  setupModalViewport($('#labs-modal'));
}

function closeLabsModal(): void {
  $('#labs-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
  teardownModalViewport();
}

function saveLabs(): void {
  const num = (id: string) => Number(($(id) as HTMLInputElement).value) || 0;
  const totalCholesterol = num('#lab-ct');
  const ldl = num('#lab-ldl');
  const hdl = num('#lab-hdl');
  const triglycerides = num('#lab-tg');
  if (!totalCholesterol || !ldl || !hdl || !triglycerides) return;

  const vldlRaw = ($('#lab-vldl') as HTMLInputElement).value;
  const indexRaw = ($('#lab-index') as HTMLInputElement).value;
  const labs: LabResults = {
    date: ($('#lab-date-input') as HTMLInputElement).value || todayKey(),
    totalCholesterol,
    ldl,
    hdl,
    triglycerides,
    vldl: vldlRaw ? Number(vldlRaw) : undefined,
    atherogenicIndex: indexRaw ? Number(indexRaw) : Math.round((totalCholesterol / hdl) * 100) / 100,
  };
  setLabs(labs);
  pushData('labs', labs);
  closeLabsModal();
  renderAll();
}

/* ==================================================================
   Retos
   ================================================================== */

function renderChallenges(): void {
  const profile = getProfile();
  const dateKey = toDateKey(selectedDate);
  const ctx = buildCtx(dateKey, profile);
  const manual = getChallengeState()[dateKey] ?? {};

  const list = dailyChallenges(dateKey, effectiveFocus(profile, getLabs()));
  $('#challenge-list').innerHTML = list
    .map((ch) => {
      const done = isChallengeDone(ch, ctx, manual[ch.id] === true);
      const mode = ch.auto ? (done ? 'Auto ✓' : 'Auto') : 'Manual';
      return `
      <li>
        <button class="challenge ${done ? 'done' : ''}" data-challenge="${ch.id}" aria-pressed="${done}">
          <span class="challenge-emoji">${ch.emoji}</span>
          <span class="challenge-info">
            <span class="challenge-title">${esc(ch.title)}</span>
            <span class="challenge-desc">${esc(ch.desc)}</span>
          </span>
          <span class="challenge-auto">${mode}</span>
          <span class="challenge-check">${ICONS.check}</span>
        </button>
      </li>`;
    })
    .join('');

  // Racha (siempre respecto a hoy)
  const streak = currentStreak(profile, getChallengeState());
  $('#streak-badge').textContent = `🔥 ${streak} ${streak === 1 ? 'día' : 'días'}`;

  // Reto semanal
  const weekly = weeklyChallenge(todayKey());
  const progress = weeklyProgress(weekly, profile);
  const pct = (progress / weekly.target) * 100;
  $('#weekly').innerHTML = `
    <div class="weekly-head">
      <span class="weekly-emoji">${weekly.emoji}</span>
      <span class="weekly-title">${esc(weekly.title)}</span>
      <span class="weekly-count">${progress}/${weekly.target} ${weekly.unit}</span>
    </div>
    <p class="weekly-desc">${esc(weekly.desc)}</p>
    <div class="weekly-bar"><div class="weekly-fill" style="width:${pct}%"></div></div>`;
}

/* ==================================================================
   Comidas
   ================================================================== */

function renderMeals(): void {
  syncNutrientFilterCheckboxes();
  const dateKey = toDateKey(selectedDate);
  const container = $('#meals');
  const showReminders = isRemindersEnabled() && dateKey === todayKey();
  const now = new Date();
  const times = getTimes();
  const filters = getNutrientFilters();

  container.innerHTML = MEALS.map((meal) => {
    const entries = getEntriesForMeal(dateKey, meal);
    const total = entries.reduce((s, e) => s + e.calories * e.quantity, 0);

    let pendingBadge = '';
    if (showReminders) {
      if (entries.length > 0) {
        pendingBadge = `<span class="meal-pending done" title="Ya registraste ${MEAL_LABELS[meal].toLowerCase()}">✓</span>`;
      } else {
        const [hh, mm] = (times[meal] ?? DEFAULT_TIMES[meal]).split(':').map(Number);
        const target = new Date();
        target.setHours(hh, mm, 0, 0);
        if (now >= target) pendingBadge = `<span class="meal-pending">Pendiente</span>`;
      }
    }

    const items = entries.length
      ? entries
          .map((e) => {
            const qty = e.quantity;
            const tags: string[] = [
              `<span class="entry-tag entry-tag-qty">${e.quantity} × porción</span>`
            ];
            if (filters.protein) tags.push(`<span class="entry-tag entry-tag-p">P ${fmtMacro(e.protein * qty)}g</span>`);
            if (filters.carbs) tags.push(`<span class="entry-tag entry-tag-c">C ${fmtMacro(e.carbs * qty)}g</span>`);
            if (filters.fat) tags.push(`<span class="entry-tag entry-tag-g">G ${fmtMacro(e.fat * qty)}g</span>`);
            if (filters.satFat) tags.push(`<span class="entry-tag entry-tag-sat">G.Sat ${fmtMacro((e.satFat ?? 0) * qty)}g</span>`);
            if (filters.fiber) tags.push(`<span class="entry-tag entry-tag-fibra">Fibra ${fmtMacro((e.fiber ?? 0) * qty)}g</span>`);
            if (filters.sugar) tags.push(`<span class="entry-tag entry-tag-azucar">Azúcar ${fmtMacro((e.sugar ?? 0) * qty)}g</span>`);

            return `
        <li class="entry" data-id="${e.id}">
          <span class="entry-emoji">${e.emoji}</span>
          <div class="entry-info">
            <span class="entry-name">${esc(e.name)}</span>
            <div class="entry-detail-tags">${tags.join('')}</div>
          </div>
          <span class="entry-kcal">${fmt(e.calories * e.quantity)} kcal</span>
          <button class="icon-btn entry-delete" data-delete="${e.id}" aria-label="Eliminar ${esc(e.name)}">${ICONS.trash}</button>
        </li>`;
          })
          .join('')
      : `<li class="entry-empty">Sin registros — añade tu primer alimento</li>`;

    return `
      <section class="card meal-card" data-meal="${meal}">
        <header class="meal-head">
          <div class="meal-title">
            <span class="meal-icon">${MEAL_ICONS[meal]}</span>
            <h3>${MEAL_LABELS[meal]}${pendingBadge}</h3>
          </div>
          <div class="meal-side">
            <span class="meal-total">${fmt(total)} kcal</span>
            <button class="btn-add" data-add="${meal}">${ICONS.plus}<span>Añadir</span></button>
          </div>
        </header>
        <ul class="entries">${items}</ul>
      </section>`;
  }).join('');
}

function renderWeek(): void {
  const week = getWeekCalories(7);
  const goal = getGoals().calories;
  const max = Math.max(...week.map((d) => d.calories), goal, 1);
  const today = todayKey();

  $('#week-chart').innerHTML = week
    .map((d) => {
      const h = Math.max((d.calories / max) * 100, 2);
      const over = d.calories > goal;
      return `
      <div class="bar-col" title="${d.label}: ${fmt(d.calories)} kcal">
        <span class="bar-value">${d.calories > 0 ? fmt(d.calories) : ''}</span>
        <div class="bar-track">
          <div class="bar ${d.dateKey === today ? 'today' : ''} ${over ? 'over' : ''}" style="height:${h}%"></div>
        </div>
        <span class="bar-label">${d.label}</span>
      </div>`;
    })
    .join('');
}

/* ==================================================================
   Plan de dieta recomendado
   ================================================================== */

function renderPlan(): void {
  const labs = getLabs();
  const profile = getProfile();
  const focus = effectiveFocus(profile, labs);

  const good = getAllFoods().filter((f) => foodHeartRating(f) === 'good');
  const limit = getAllFoods().filter((f) => foodHeartRating(f) === 'limit');

  $('#plan-good').innerHTML = good.map((f) => `<span class="chip good">${f.emoji} ${esc(f.name)}</span>`).join('');
  $('#plan-limit').innerHTML = limit.map((f) => `<span class="chip limit">${f.emoji} ${esc(f.name)}</span>`).join('');

  const cholHigh = labs !== null && (labs.ldl >= 130 || labs.totalCholesterol >= 200);
  const trigHigh = labs !== null && labs.triglycerides >= 150;
  const parts: string[] = [];
  if (cholHigh) parts.push('para bajar tu LDL: corta grasa saturada y sube la fibra soluble (avena, legumbres) — estilo dieta mediterránea');
  if (trigHigh) parts.push('para bajar tus triglicéridos: elimina alcohol y azúcares añadidos, reduce harinas refinadas y prioriza pescado azul');
  if (!labs) parts.push('añade tus exámenes de sangre para afinar este plan a tus valores');
  if (focus === 'general' && !labs) parts.push('alimentación variada con énfasis en alimentos naturales y poco procesados');

  $('#plan-basis').textContent = labs
    ? `según tu examen del ${new Date(labs.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
    : 'recomendación general';
  $('#plan-note').textContent = `💡 ${parts.join(' · ')}.`;
}

/* ==================================================================
   Análisis personalizado
   ================================================================== */

function renderAnalysis(): void {
  const dateKey = toDateKey(selectedDate);
  const isPlan = dateKey > todayKey();
  const insights = generateInsights({
    profile: getProfile(),
    labs: getLabs(),
    totals: getDayTotals(dateKey),
    entries: getEntriesForDate(dateKey),
    goals: getGoals(),
    week: getDailySummaries(7),
  });

  // Si es un día futuro (plan), antepón un insight predictivo.
  if (isPlan) {
    const totals = getDayTotals(dateKey);
    const goals = getGoals();
    const label = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const atGoal = totals.calories > 0 && Math.abs(totals.calories - goals.calories) <= 150;
    const cardText =
      totals.calories === 0
        ? 'Vacio por ahora: ve sumando alimentos planificados y volverá a calcularse el beneficio.'
        : atGoal
          ? `Si sigues este plan (${totals.calories} kcal ≈ objetivo), mantienes el déficit que baja LDL y triglicéridos.`
          : totals.calories > goals.calories
            ? `Plasamas ${Math.round(totals.calories - goals.calories)} kcal de más: revisa snacks y bebidas antes de comerlas.`
            : `Plan por debajo del objetivo (${Math.round(goals.calories - totals.calories)} kcal): bien si buscas bajar peso, sin descuidar macros.`;
    insights.unshift({
      icon: '📌',
      title: `Plan para ${label}`,
      text: cardText,
      tone: totals.calories === 0 ? 'info' : atGoal ? 'good' : 'warn',
    });
  }

  $('#insights').innerHTML = insights
    .map(
      (i) => `
    <li class="insight tone-${i.tone}">
      <span class="insight-icon">${i.icon}</span>
      <div>
        <div class="insight-title">${esc(i.title)}</div>
        <div class="insight-text">${esc(i.text)}</div>
      </div>
    </li>`
    )
    .join('');
}

/* ==================================================================
   Modal: añadir alimento
   ================================================================== */

/** Ajusta el modal al área visible (sin el teclado) en tiempo real.
 *  En móvil, alinea arriba para que el input no quede tapado. */
let modalViewportTeardown: (() => void) | null = null;

function setupModalViewport(modal: HTMLElement): void {
  teardownModalViewport();

  const card = modal.querySelector('.modal-card') as HTMLElement | null;
  if (!card) return;

  const isNarrow =
    window.innerWidth < 600 ||
    (window.visualViewport ? window.visualViewport.width < 600 : false);
  if (isNarrow) modal.classList.add('modal--top');

  const update = () => {
    const vv = window.visualViewport;
    const visibleHeight = vv ? vv.height : window.innerHeight;
    const margin = isNarrow ? 16 : 40;
    const maxH = Math.max(320, Math.floor(visibleHeight - margin));
    card.style.maxHeight = `${maxH}px`;
  };

  update();

  const onResize = () => update();
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
    window.visualViewport.addEventListener('scroll', onResize);
  }
  window.addEventListener('resize', onResize);

  modalViewportTeardown = () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', onResize);
      window.visualViewport.removeEventListener('scroll', onResize);
    }
    window.removeEventListener('resize', onResize);
  };
}

function teardownModalViewport(): void {
  if (modalViewportTeardown) {
    modalViewportTeardown();
    modalViewportTeardown = null;
  }
  document.querySelectorAll('.modal--top').forEach((m) => m.classList.remove('modal--top'));
  document.querySelectorAll('.modal-card').forEach((c) => {
    (c as HTMLElement).style.maxHeight = '';
  });
}

function updateAnalyzeButtonState(): void {
  const btn = document.querySelector<HTMLButtonElement>('#btn-analyze-photo');
  if (!btn) return;
  const textInput = document.querySelector<HTMLTextAreaElement>('#photo-text-input');
  const desc = textInput?.value?.trim() || '';
  const hasPhoto = photoSelected !== null;
  btn.disabled = !hasPhoto && !desc;
}

function openModal(meal: MealType): void {
  modalMeal = meal;
  selectedFood = null;
  quantity = 1;
  searchQuery = '';
  modalTab = 'buscar';
  photoSelected = null;
  detectedPhotoItems = [];
  detectedPhotoSummary = null;
  $('#photo-dropzone').classList.remove('hidden');
  $('#photo-preview-wrap').classList.add('hidden');
  $('#photo-loading').classList.add('hidden');
  $('#photo-results').classList.add('hidden');
  ($('#photo-input-camera') as HTMLInputElement).value = '';
  ($('#photo-input-gallery') as HTMLInputElement).value = '';
  ($('#photo-text-input') as HTMLTextAreaElement).value = '';
  $('#photo-error').textContent = '';
  updateAnalyzeButtonState();
  $('#modal').classList.add('open');
  document.body.classList.add('modal-open');
  renderModal();
  setupModalViewport($('#modal'));
  setTimeout(() => {
    const input = $('#food-search') as HTMLInputElement;
    input.focus();
    setTimeout(() => input.scrollIntoView({ block: 'nearest' }), 350);
  }, 50);
}

function closeModal(): void {
  $('#modal').classList.remove('open');
  document.body.classList.remove('modal-open');
  teardownModalViewport();
}

function renderModal(): void {
  $('#modal-title').textContent = `Añadir a ${MEAL_LABELS[modalMeal]}`;

  $('#tab-buscar').classList.toggle('active', modalTab === 'buscar');
  $('#tab-foto').classList.toggle('active', modalTab === 'foto');
  $('#tab-custom').classList.toggle('active', modalTab === 'personalizado');
  // Ambos tabs (buscar + foto) comparten panel-buscar; mostramos/ocultamos internos.
  const showBuscarPane = modalTab === 'buscar' || modalTab === 'foto';
  $('#panel-buscar').classList.toggle('hidden', !showBuscarPane);
  $('#panel-buscar-content').classList.toggle('hidden', modalTab !== 'buscar');
  $('#panel-foto').classList.toggle('hidden', modalTab !== 'foto');
  $('#panel-custom').classList.toggle('hidden', modalTab !== 'personalizado');

  $('#meal-pills').innerHTML = MEALS.map(
    (m) =>
      `<button class="pill ${m === modalMeal ? 'active' : ''}" data-meal="${m}">${MEAL_ICONS[m]} ${MEAL_LABELS[m]}</button>`
  ).join('');

  if (modalTab === 'buscar') {
    const input = $('#food-search') as HTMLInputElement;
    if (input.value !== searchQuery) input.value = searchQuery;

    const results = searchFoods(searchQuery);
    $('#food-list').innerHTML = results.length
      ? results
          .map((f) => {
            const risk = foodRisk(f);
            const isCustomBadge = f.isCustom ? `<span class="risk-badge low">⭐ Mi Alimento</span>` : '';
            const badges = (risk.reasons.length || f.isCustom)
              ? `<div class="risk-badges">${isCustomBadge}${risk.reasons
                  .slice(0, 2)
                  .map((r) => `<span class="risk-badge ${risk.level}">${esc(r)}</span>`)
                  .join('')}</div>`
              : '';
            return `
        <button class="food-item risk-${risk.level} ${selectedFood?.id === f.id ? 'selected' : ''}" data-food="${f.id}">
          <span class="food-emoji">${f.emoji}</span>
          <div class="food-info">
            <span class="food-name">${esc(f.name)}</span>
            <span class="food-serving">${esc(f.serving)}</span>
            ${badges}
          </div>
          <span class="food-kcal">${fmt(f.calories)} kcal</span>
        </button>`;
          })
          .join('')
      : `<p class="no-results">No se encontraron alimentos para “${esc(searchQuery)}”.</p>`;

    renderSelection();
  }
}

function renderSelection(): void {
  const panel = $('#selection-panel');
  if (!selectedFood) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  $('#sel-emoji').textContent = selectedFood.emoji;
  $('#sel-name').textContent = selectedFood.name;
  $('#sel-serving').textContent = selectedFood.serving;
  $('#qty-value').textContent = quantity.toLocaleString('es-ES');
  $('#sel-kcal').textContent = `${fmt(selectedFood.calories * quantity)} kcal`;
}

function confirmAdd(): void {
  if (!selectedFood) return;
  const entry = addEntry({
    foodId: selectedFood.id,
    name: selectedFood.name,
    emoji: selectedFood.emoji,
    calories: selectedFood.calories,
    protein: selectedFood.protein,
    carbs: selectedFood.carbs,
    fat: selectedFood.fat,
    satFat: selectedFood.satFat,
    fiber: selectedFood.fiber,
    sugar: selectedFood.sugar,
    meal: modalMeal,
    quantity,
    date: toDateKey(selectedDate),
  });
  pushEntry(entry);
  closeModal();
  renderAll();
}

function handlePhotoFile(file: File): void {
  if (!file || !file.type.startsWith('image/')) return;
  photoSelected = file;
  const url = URL.createObjectURL(file);
  ($('#photo-preview') as HTMLImageElement).src = url;
  $('#photo-preview-wrap').classList.remove('hidden');
  $('#photo-dropzone').classList.add('hidden');
  $('#photo-results').classList.add('hidden');
  ($('#btn-analyze-photo') as HTMLButtonElement).disabled = false;
  $('#photo-error').textContent = '';
}

async function compressImage(file: File, maxDim = 1280, quality = 0.8): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

async function analyzePhoto(): Promise<void> {
  const desc = ($('#photo-text-input') as HTMLTextAreaElement).value.trim();
  if (!photoSelected && !desc) return;

  const btn = $('#btn-analyze-photo') as HTMLButtonElement;
  btn.disabled = true;
  $('#photo-loading').classList.remove('hidden');
  $('#photo-results').classList.add('hidden');
  $('#photo-error').textContent = '';
  try {
    const form = new FormData();
    if (desc) form.append('description', desc);

    if (photoSelected) {
      const compressed = await compressImage(photoSelected).catch(() => photoSelected);
      if (compressed) {
        form.append('image', compressed, 'photo.jpg');
      }
    }

    const res = await fetch('/api/analyze-photo', { method: 'POST', body: form });
    const responseText = await res.text();

    let data: { ok?: true; result?: GeminiAnalysis; error?: string; message?: string } = {};
    try {
      data = JSON.parse(responseText);
    } catch {
      if (res.status === 413 || responseText.includes('Request Entity') || responseText.includes('Too Large')) {
        throw new Error('La imagen es demasiado grande para el servidor. Intenta con otra imagen.');
      }
      throw new Error(`Error del servidor (${res.status}): ${responseText.slice(0, 100)}`);
    }

    if (!res.ok || !data.ok || !data.result) {
      throw new Error(data.message || data.error || 'No se pudo analizar (HTTP ' + res.status + ')');
    }
    const r = data.result;
    detectedPhotoSummary = r;
    detectedPhotoItems = Array.isArray(r.items) && r.items.length > 0 ? r.items : [r];

    renderPhotoResults();

    $('#photo-loading').classList.add('hidden');
    $('#photo-preview-wrap').classList.add('hidden');
    btn.disabled = false;
  } catch (err) {
    $('#photo-loading').classList.add('hidden');
    updateAnalyzeButtonState();
    $('#photo-error').textContent = '⚠️ ' + (err as Error).message;
  }
}

function renderPhotoResults(): void {
  const container = $('#photo-results');
  const list = $('#photo-items-list');
  const subtitle = $('#photo-results-subtitle');
  if (!container || !list) return;

  list.innerHTML = '';
  const count = detectedPhotoItems.length;
  if (subtitle) {
    subtitle.textContent = count > 1 ? `${count} alimentos detectados` : `1 alimento detectado`;
  }

  detectedPhotoItems.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'photo-item-card';
    card.setAttribute('data-index', String(index));
    card.innerHTML = `
      <input type="checkbox" class="photo-item-checkbox" data-index="${index}" checked />
      <div class="photo-item-info">
        <span class="photo-item-name">${esc(item.emoji || '🍽️')} ${esc(item.name)}</span>
        <span class="photo-item-sub">${esc(item.serving || '')} • P:${item.protein}g | C:${item.carbs}g | G:${item.fat}g</span>
      </div>
      <span class="photo-item-kcal">${item.calories} kcal</span>
    `;
    list.appendChild(card);
  });

  updateAddPhotoButtonText();
  container.classList.remove('hidden');

  list.querySelectorAll('.photo-item-card').forEach((card) => {
    card.addEventListener('click', (ev) => {
      const target = ev.target as HTMLElement;
      const cb = card.querySelector<HTMLInputElement>('.photo-item-checkbox');
      if (cb && target !== cb) {
        cb.checked = !cb.checked;
        updateAddPhotoButtonText();
      }
    });
  });

  list.querySelectorAll('.photo-item-checkbox').forEach((cb) => {
    cb.addEventListener('change', updateAddPhotoButtonText);
  });
}

function updateAddPhotoButtonText(): void {
  const btnAdd = $('#btn-add-photo-items') as HTMLButtonElement;
  if (!btnAdd) return;
  const checkboxes = document.querySelectorAll<HTMLInputElement>('.photo-item-checkbox:checked');
  const count = checkboxes.length;
  if (count === 0) {
    btnAdd.disabled = true;
    btnAdd.textContent = 'Selecciona al menos 1';
  } else if (count === 1) {
    btnAdd.disabled = false;
    btnAdd.textContent = 'Añadir 1 alimento';
  } else {
    btnAdd.disabled = false;
    btnAdd.textContent = `Añadir los ${count} alimentos`;
  }
}

function addSelectedPhotoItems(): void {
  const checkboxes = document.querySelectorAll<HTMLInputElement>('.photo-item-checkbox:checked');
  const itemsToAdd: GeminiItem[] = [];

  if (checkboxes.length > 0) {
    checkboxes.forEach((cb) => {
      const index = Number(cb.dataset.index);
      if (detectedPhotoItems[index]) {
        itemsToAdd.push(detectedPhotoItems[index]);
      }
    });
  } else if (detectedPhotoSummary) {
    itemsToAdd.push(detectedPhotoSummary);
  } else if (detectedPhotoItems.length > 0) {
    itemsToAdd.push(...detectedPhotoItems);
  }

  if (itemsToAdd.length === 0) return;

  itemsToAdd.forEach((item) => {
    const customFood = saveCustomFood({
      name: item.name || 'Alimento',
      emoji: item.emoji || '🍽️',
      calories: Math.round(Number(item.calories) || 0),
      protein: Math.round((Number(item.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(item.fat) || 0) * 10) / 10,
      satFat: Math.round((Number(item.satFat) || 0) * 10) / 10,
      fiber: Math.round((Number(item.fiber) || 0) * 10) / 10,
      sugar: Math.round((Number(item.sugar) || 0) * 10) / 10,
      serving: item.serving || '1 porción',
    });

    const entry = addEntry({
      foodId: customFood.id,
      name: customFood.name,
      emoji: customFood.emoji,
      calories: customFood.calories,
      protein: customFood.protein,
      carbs: customFood.carbs,
      fat: customFood.fat,
      satFat: customFood.satFat,
      fiber: customFood.fiber,
      sugar: customFood.sugar,
      meal: modalMeal,
      quantity: 1,
      date: toDateKey(selectedDate),
    });
    pushEntry(entry);
  });

  pushData('customFoods', getCustomFoods());

  closeModal();
  renderAll();
}

function editPhotoSingleCustom(): void {
  const item = detectedPhotoSummary || detectedPhotoItems[0];
  if (!item) return;

  ($('#custom-name') as HTMLInputElement).value = item.name || 'Alimento de la foto';
  ($('#custom-kcal') as HTMLInputElement).value = String(item.calories || '');
  ($('#custom-protein') as HTMLInputElement).value = String(item.protein || '');
  ($('#custom-carbs') as HTMLInputElement).value = String(item.carbs || '');
  ($('#custom-fat') as HTMLInputElement).value = String(item.fat || '');
  ($('#custom-satfat') as HTMLInputElement).value = String(item.satFat || '');
  ($('#custom-fiber') as HTMLInputElement).value = String(item.fiber || '');
  ($('#custom-sugar') as HTMLInputElement).value = String(item.sugar || '');

  modalTab = 'personalizado';
  renderModal();
  $('#custom-error').textContent = `✅ Valores cargados de foto. Revisa y pulsa “Añadir”.`;
}

function confirmCustom(): void {
  const name = ($('#custom-name') as HTMLInputElement).value.trim();
  const kcal = Number(($('#custom-kcal') as HTMLInputElement).value) || 0;
  if (!name) {
    ($('#custom-name') as HTMLInputElement).focus();
    $('#custom-error').textContent = 'Escribe un nombre para el alimento.';
    return;
  }
  $('#custom-error').textContent = '';
  const val = (id: string) => Number(($(id) as HTMLInputElement).value) || 0;
  const shouldSaveLibrary = ($('#custom-save-library') as HTMLInputElement)?.checked ?? true;

  let foodId: string | null = null;
  if (shouldSaveLibrary) {
    const customFood = saveCustomFood({
      name,
      emoji: '🍽️',
      calories: kcal,
      protein: val('#custom-protein'),
      carbs: val('#custom-carbs'),
      fat: val('#custom-fat'),
      satFat: val('#custom-satfat'),
      fiber: val('#custom-fiber'),
      sugar: val('#custom-sugar'),
      serving: '1 porción',
    });
    foodId = customFood.id;
    pushData('customFoods', getCustomFoods());
  }

  const entry = addEntry({
    foodId,
    name,
    emoji: '🍽️',
    calories: kcal,
    protein: val('#custom-protein'),
    carbs: val('#custom-carbs'),
    fat: val('#custom-fat'),
    satFat: val('#custom-satfat'),
    fiber: val('#custom-fiber'),
    sugar: val('#custom-sugar'),
    meal: modalMeal,
    quantity: 1,
    date: toDateKey(selectedDate),
  });
  pushEntry(entry);
  for (const id of ['#custom-name', '#custom-kcal', '#custom-protein', '#custom-carbs', '#custom-fat', '#custom-satfat', '#custom-fiber', '#custom-sugar']) {
    ($(id) as HTMLInputElement).value = '';
  }
  closeModal();
  renderAll();
}

/* ==================================================================
   Modal: objetivos
   ================================================================== */

function openSettings(): void {
  const g = getGoals();
  ($('#goal-calories') as HTMLInputElement).value = String(g.calories);
  ($('#goal-protein') as HTMLInputElement).value = String(g.protein);
  ($('#goal-carbs') as HTMLInputElement).value = String(g.carbs);
  ($('#goal-fat') as HTMLInputElement).value = String(g.fat);
  $('#settings-modal').classList.add('open');
  document.body.classList.add('modal-open');
  setupModalViewport($('#settings-modal'));
}

function closeSettings(): void {
  $('#settings-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
  teardownModalViewport();
}

function saveSettings(): void {
  const num = (id: string, fallback: number) => {
    const v = Number(($(id) as HTMLInputElement).value);
    return v > 0 ? v : fallback;
  };
  const current = getGoals();
  const goals: Goals = {
    calories: num('#goal-calories', current.calories),
    protein: num('#goal-protein', current.protein),
    carbs: num('#goal-carbs', current.carbs),
    fat: num('#goal-fat', current.fat),
  };
  setGoals(goals);
  pushData('goals', goals);
  closeSettings();
  renderAll();
}

/* ==================================================================
   Modal: recordatorios
   ================================================================== */

function updateBellDot(): void {
  const dot = $('#bell-dot');
  if (!dot) return;
  const enabled = isRemindersEnabled();
  const perm = getPermission();
  dot.classList.toggle('hidden', !(enabled && perm === 'granted'));
}

async function updateReminderStatus(): Promise<void> {
  const status = $('#reminder-status');
  const perm = getPermission();
  const enabled = isRemindersEnabled();
  const pushOk = enabled ? await isPushSubscribed().catch(() => false) : false;
  if (perm === 'unsupported') {
    status.className = 'reminder-status warn';
    status.textContent = '⚠️ Tu navegador no soporta notificaciones nativas. Usaremos avisos dentro de la app.';
  } else if (perm === 'denied') {
    status.className = 'reminder-status denied';
    status.textContent = '🚫 Bloqueaste las notificaciones del navegador. Habilítalas en Configuración del sitio (candado 🔒) para que podamos avisarte.';
  } else if (perm === 'granted' && enabled && pushOk) {
    status.className = 'reminder-status ok';
    status.textContent = '✅ Activo con push: te avisaremos a las horas elegidas, aunque la app esté cerrada.';
  } else if (perm === 'granted' && enabled && !pushOk) {
    status.className = 'reminder-status warn';
    status.textContent = '⚠️ Activado, pero la suscripción push falló (¿base de datos no configurada?). Mientras la app esté abierta funcionarán los avisos.';
  } else if (perm === 'granted' && !enabled) {
    status.className = 'reminder-status warn';
    status.textContent = '🔔 Tienes permiso para recibir notificaciones, pero los recordatorios están desactivados. Actívalos abajo.';
  } else if (enabled && perm === 'default') {
    status.className = 'reminder-status warn';
    status.textContent = '⏳ Activado, pero falta permiso: al pulsar Guardar te lo solicitaremos.';
  } else {
    status.className = 'reminder-status warn';
    status.textContent = '🔕 Activa el switch y te pediremos permiso para enviarte avisos.';
  }
}

function openReminders(): void {
  const times = getTimes();
  ($('#r-desayuno') as HTMLInputElement).value = times.desayuno;
  ($('#r-almuerzo') as HTMLInputElement).value = times.almuerzo;
  ($('#r-snacks') as HTMLInputElement).value = times.snacks;
  ($('#r-cena') as HTMLInputElement).value = times.cena;
  ($('#reminders-switch') as HTMLInputElement).checked = isRemindersEnabled();
  updateReminderStatus();
  $('#reminders-modal').classList.add('open');
  document.body.classList.add('modal-open');
  setupModalViewport($('#reminders-modal'));
}

function closeReminders(): void {
  $('#reminders-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
  teardownModalViewport();
}

async function saveReminders(): Promise<void> {
  const sw = $('#reminders-switch') as HTMLInputElement;
  const wantsEnabled = sw.checked;

  const times = {
    desayuno: ($('#r-desayuno') as HTMLInputElement).value || DEFAULT_TIMES.desayuno,
    almuerzo: ($('#r-almuerzo') as HTMLInputElement).value || DEFAULT_TIMES.almuerzo,
    snacks: ($('#r-snacks') as HTMLInputElement).value || DEFAULT_TIMES.snacks,
    cena: ($('#r-cena') as HTMLInputElement).value || DEFAULT_TIMES.cena,
  };
  setTimes(times);

  if (wantsEnabled) {
    const perm = await requestPermission();
    if (perm !== 'granted') {
      // No se pudo obtener permiso: apagar el switch y no guardar enabled
      sw.checked = false;
      setRemindersEnabled(false);
      updateReminderStatus();
      updateBellDot();
      return;
    }
    // Suscribirse al push (envía al servidor si hay DB)
    const result = await subscribeToPush(times);
    if (!result.ok) {
      console.warn('No se pudo suscribir a push:', result.reason);
    }
    setRemindersEnabled(true);
  } else {
    // Desactivar: desuscribir y limpiar
    await unsubscribeFromPush();
    setRemindersEnabled(false);
  }

  updateReminderStatus();
  updateBellDot();
  renderMeals();
  closeReminders();
}

async function handleTestNotif(): Promise<void> {
  const state = await testNotification();
  if (state !== 'granted') {
    const btn = $('#btn-test-notif');
    btn.textContent = '🚫 Permiso bloqueado';
    setTimeout(() => (btn.textContent = '🔔 Probar notificación'), 2500);
  } else {
    const btn = $('#btn-test-notif');
    btn.textContent = '✅ Enviada';
    setTimeout(() => (btn.textContent = '🔔 Probar notificación'), 2500);
  }
  updateReminderStatus();
  updateBellDot();
}

function fillProfileSelects(): void {
  ($('#pf-activity') as HTMLSelectElement).innerHTML = Object.entries(ACTIVITY_LABELS)
    .map(([v, label]) => `<option value="${v}">${label}</option>`)
    .join('');
  ($('#pf-focus') as HTMLSelectElement).innerHTML = Object.entries(FOCUS_LABELS)
    .map(([v, label]) => `<option value="${v}">${label}</option>`)
    .join('');
}

function readProfileForm(): Profile | null {
  const age = Number(($('#pf-age') as HTMLInputElement).value);
  const heightCm = Number(($('#pf-height') as HTMLInputElement).value);
  const weightKg = Number(($('#pf-weight') as HTMLInputElement).value);
  if (!age || !heightCm || !weightKg) return null;
  return {
    age,
    heightCm,
    weightKg,
    sex: ($('#pf-sex') as HTMLSelectElement).value as Sex,
    activity: ($('#pf-activity') as HTMLSelectElement).value as ActivityLevel,
    focus: ($('#pf-focus') as HTMLSelectElement).value as HealthFocus,
  };
}

function renderProfileSummary(): void {
  const p = readProfileForm();
  const box = $('#profile-summary');
  if (!p) {
    box.classList.add('hidden');
    return;
  }
  const b = bmi(p);
  const cat = bmiCategory(b);
  const suggested = suggestedCalories(p);
  box.classList.remove('hidden');
  box.innerHTML = `
    <div class="summary-item"><b>${b.toFixed(1)}</b><span>IMC · ${cat.label}</span></div>
    <div class="summary-item"><b>${fmt(bmr(p))} kcal</b><span>Metabolismo basal</span></div>
    <div class="summary-item"><b>${fmt(tdee(p))} kcal</b><span>Gasto diario estimado</span></div>
    <div class="summary-item highlight"><b>${fmt(suggested)} kcal</b><span>Objetivo sugerido</span></div>`;
}

function updateSyncUI(): void {
  const status = $('#sync-status');
  if (isRemote()) {
    status.textContent = '✅ Conectado: tus datos se sincronizan en la nube.';
    status.className = 'sync-status ok';
  } else {
    status.textContent = '📴 Modo local: configura la base de datos para sincronizar entre dispositivos.';
    status.className = 'sync-status local';
  }
  $('#sync-code').textContent = getSyncCode();
  void checkHuaweiStatus();
}

async function checkHuaweiStatus(): Promise<void> {
  const statusEl = $('#huawei-status');
  const btnConnect = $('#btn-connect-huawei');
  const btnSync = $('#btn-sync-huawei');
  const btnDisconnect = $('#btn-disconnect-huawei');
  const code = getSyncCode();

  if (!statusEl) return;

  try {
    const res = await fetch(`/api/huawei/status?u=${encodeURIComponent(code)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.connected) {
      isHuaweiConnectedState = true;
      const dateStr = data.linkedAt ? new Date(data.linkedAt).toLocaleDateString('es-ES') : '';
      statusEl.textContent = `🟢 Conectado con Huawei Health ${dateStr ? `(vinculado: ${dateStr})` : ''}`;
      btnConnect.classList.add('hidden');
      btnSync.classList.remove('hidden');
      btnDisconnect.classList.remove('hidden');
      void syncHuaweiDataToday(false);
    } else {

      isHuaweiConnectedState = false;
      statusEl.textContent = '⚪ Huawei Health no está vinculado.';
      btnConnect.classList.remove('hidden');
      btnSync.classList.add('hidden');
      btnDisconnect.classList.add('hidden');
    }
  } catch {
    isHuaweiConnectedState = false;
    statusEl.textContent = '⚪ Huawei Health no configurado (requiere variables de entorno de Huawei).';
    btnConnect.classList.remove('hidden');
    btnSync.classList.add('hidden');
    btnDisconnect.classList.add('hidden');
  }
  renderHuaweiWidget();
}

async function syncHuaweiDataToday(showAlert = false): Promise<void> {
  const code = getSyncCode();
  const dateKey = toDateKey(selectedDate);
  try {
    const res = await fetch(`/api/huawei/sync?u=${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateKey }),
    });
    if (!res.ok) {
      if (showAlert) alert('⚠️ No se pudieron obtener los datos. Verifica la conexión con el servidor.');
      return;
    }
    const json = await res.json();
    if (json.ok && json.data) {
      updateHuaweiDayData(dateKey, {
        activeCalories: json.data.activeCalories,
        steps: json.data.steps,
        lastSyncedAt: json.data.lastSyncedAt,
      });
      renderAll();
      if (showAlert) {
        const devs = Array.isArray(json.data.devices) && json.data.devices.length > 0
          ? `\n📱 Dispositivos detectados en Huawei Cloud: ${json.data.devices.join(', ')}`
          : '\n⚠️ No se hallaron colectores de datos registrados en la cuenta.';
        const diag = json.data.rawResponseInfo ? `\nℹ️ Info API: ${json.data.rawResponseInfo}` : '';
        alert(`✅ Diagnóstico Huawei Health:\n🔥 Calorías activas: ${json.data.activeCalories} kcal\n👟 Pasos: ${json.data.steps}${devs}${diag}`);
      }

    } else if (showAlert) {
      alert(`⚠️ ${json.message || 'No se obtuvieron datos nuevos.'}`);
    }
  } catch (err) {
    console.error('[NutriTrack] Error al sincronizar con Huawei:', err);
    if (showAlert) alert('⚠️ Error al conectar con el servidor.');
  }
}

function handleHuaweiOAuthResponse(): void {
  const params = new URLSearchParams(window.location.search);
  if (params.has('huawei')) {
    if (params.get('huawei') === 'connected') {
      alert('✅ ¡Tu Huawei Watch GT 2 Pro / Huawei Health se ha conectado correctamente!');
      void syncHuaweiDataToday(true);
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (params.has('huawei_error')) {
    const err = params.get('huawei_error');
    alert(`⚠️ Ocurrió un error al conectar con Huawei Health (${err}). Revisa la configuración de credenciales.`);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}



function openProfile(): void {
  fillProfileSelects();
  const p = getProfile();
  if (p) {
    ($('#pf-sex') as HTMLSelectElement).value = p.sex;
    ($('#pf-age') as HTMLInputElement).value = String(p.age);
    ($('#pf-height') as HTMLInputElement).value = String(p.heightCm);
    ($('#pf-weight') as HTMLInputElement).value = String(p.weightKg);
    ($('#pf-activity') as HTMLSelectElement).value = p.activity;
    ($('#pf-focus') as HTMLSelectElement).value = p.focus;
  } else {
    // Prellenar con los datos conocidos del examen de sangre
    ($('#pf-sex') as HTMLSelectElement).value = PROFILE_HINTS.sex;
    ($('#pf-age') as HTMLInputElement).value = String(PROFILE_HINTS.age);
    ($('#pf-focus') as HTMLSelectElement).value = effectiveFocus(null, getLabs());
  }
  renderProfileSummary();
  updateSyncUI();
  $('#link-error').textContent = '';
  $('#profile-modal').classList.add('open');
  document.body.classList.add('modal-open');
  setupModalViewport($('#profile-modal'));
}

function closeProfile(): void {
  $('#profile-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
  teardownModalViewport();
}

function saveProfile(): void {
  const p = readProfileForm();
  if (!p) {
    ($('#pf-age') as HTMLInputElement).focus();
    return;
  }
  setProfile(p);
  pushData('profile', p);
  bannerDismissed = true;
  localStorage.setItem('nutritrack:banner-dismissed', '1');
  closeProfile();
  renderAll();
}

function applySuggested(): void {
  const p = readProfileForm();
  if (!p) return;
  const calories = suggestedCalories(p);
  const goals: Goals = { calories, ...suggestedMacros(calories) };
  setGoals(goals);
  pushData('goals', goals);
  renderAll();
  const btn = $('#btn-apply-suggested');
  btn.textContent = `✅ Objetivos aplicados: ${fmt(calories)} kcal`;
  setTimeout(() => {
    btn.textContent = '✨ Aplicar objetivos sugeridos a mi plan';
  }, 2500);
}

/* ==================================================================
   Datos de ejemplo (solo la primera vez)
   ================================================================== */

function seedDemoData(): void {
  if (localStorage.getItem('nutritrack:seeded')) return;
  localStorage.setItem('nutritrack:seeded', '1');

  // Punto de partida: exámenes de sangre reales (23-jul-2026)
  setLabs(SEED_LABS);

  const today = todayKey();
  const demo: Array<[string, MealType, number]> = [
    ['avena', 'desayuno', 1],
    ['banana', 'desayuno', 1],
    ['cafe-leche', 'desayuno', 1],
    ['pollo', 'almuerzo', 1.5],
    ['arroz', 'almuerzo', 1],
    ['ensalada', 'almuerzo', 1],
    ['yogur-griego', 'snacks', 1],
  ];
  for (const [foodId, meal, qty] of demo) {
    const f = findFood(foodId);
    if (!f) continue;
    addEntry({
      foodId: f.id,
      name: f.name,
      emoji: f.emoji,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      satFat: f.satFat,
      fiber: f.fiber,
      sugar: f.sugar,
      meal,
      quantity: qty,
      date: today,
    });
  }
}

/* ==================================================================
   Métricas y Exportación CSV
   ================================================================== */

function openMetrics(): void {
  $('#metrics-modal').classList.add('open');
  document.body.classList.add('modal-open');

  if (!metricsCustomStart || !metricsCustomEnd) {
    const today = new Date();
    const ago30 = new Date();
    ago30.setDate(today.getDate() - 30);
    metricsCustomStart = toDateKey(ago30);
    metricsCustomEnd = toDateKey(today);
    ($('#metrics-start-date') as HTMLInputElement).value = metricsCustomStart;
    ($('#metrics-end-date') as HTMLInputElement).value = metricsCustomEnd;
  }

  renderMetrics();
}

function closeMetrics(): void {
  $('#metrics-modal').classList.remove('open');
  if (
    !$('#modal').classList.contains('open') &&
    !$('#settings-modal').classList.contains('open') &&
    !$('#profile-modal').classList.contains('open') &&
    !$('#labs-modal').classList.contains('open') &&
    !$('#reminders-modal').classList.contains('open')
  ) {
    document.body.classList.remove('modal-open');
  }
}

function renderMetricsChart(summary: PeriodSummary, userGoals: Goals): string {
  const points = summary.dailyPoints;
  if (!points || points.length === 0) {
    return '<p class="field-hint" style="text-align:center; padding: 20px;">No hay registros en este periodo</p>';
  }

  const maxCal = Math.max(...points.map((p) => p.totals.calories), userGoals.calories, 100);
  const svgWidth = Math.max(points.length * 42, 480);
  const svgHeight = 170;
  const paddingBottom = 28;
  const paddingTop = 20;
  const chartHeight = svgHeight - paddingBottom - paddingTop;
  const barWidth = Math.max(Math.min(svgWidth / points.length - 8, 28), 8);

  const goalY = svgHeight - paddingBottom - (userGoals.calories / maxCal) * chartHeight;

  let barsHTML = '';
  points.forEach((p, idx) => {
    const x = idx * (svgWidth / points.length) + (svgWidth / points.length - barWidth) / 2;
    const h = (p.totals.calories / maxCal) * chartHeight;
    const y = svgHeight - paddingBottom - h;
    const isGoalMet = Math.abs(p.totals.calories - userGoals.calories) <= userGoals.calories * 0.15;
    const barColor =
      p.totals.calories === 0
        ? 'rgba(255,255,255,0.06)'
        : isGoalMet
        ? 'url(#barGradientGreen)'
        : p.totals.calories > userGoals.calories
        ? '#fb7185'
        : '#818cf8';

    barsHTML += `
      <g class="chart-bar-group">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${Math.max(h, 2)}" rx="4" fill="${barColor}">
          <title>${p.dateLabel}: ${fmt(p.totals.calories)} kcal</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${svgHeight - 8}" font-size="10" fill="#8b949e" text-anchor="middle">${p.dateLabel}</text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGradientGreen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#34d399" />
          <stop offset="100%" stop-color="#a3e635" />
        </linearGradient>
      </defs>
      <line x1="0" y1="${goalY}" x2="${svgWidth}" y2="${goalY}" stroke="#5b636b" stroke-dasharray="4 4" stroke-width="1.5" />
      <text x="${svgWidth - 5}" y="${goalY - 4}" font-size="10" fill="#a3e635" text-anchor="end">Meta: ${fmt(userGoals.calories)} kcal</text>
      ${barsHTML}
    </svg>
  `;
}

function renderMetrics(): void {
  const allEntries = getEntries();
  const userGoals = getGoals();
  const range = getDateRangeFromPreset(metricsPreset, metricsCustomStart, metricsCustomEnd);
  const summary = calculatePeriodSummary(allEntries, range, userGoals);

  // 1. Actualizar pills activas y caja de rango personalizado
  const pills = document.querySelectorAll<HTMLButtonElement>('#metrics-range-pills .range-pill');
  pills.forEach((pill) => {
    if (pill.dataset.preset === metricsPreset) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  const customBox = $('#custom-range-inputs');
  if (metricsPreset === 'custom') {
    customBox.classList.remove('hidden');
  } else {
    customBox.classList.add('hidden');
  }

  // 2. Tarjetas KPI
  const kpiGrid = $('#metrics-kpi-grid');
  kpiGrid.innerHTML = `
    <div class="metrics-kpi-card" style="--kpi-color: #34d399;">
      <span class="kpi-title">Calorías Diarias</span>
      <span class="kpi-value">${fmt(summary.avgCalories)} <span class="kpi-unit">kcal/día</span></span>
      <span class="kpi-sub">Objetivo: ${fmt(userGoals.calories)} kcal</span>
    </div>
    <div class="metrics-kpi-card" style="--kpi-color: #818cf8;">
      <span class="kpi-title">Proteínas</span>
      <span class="kpi-value">${fmtMacro(summary.avgProtein)} <span class="kpi-unit">g/día</span></span>
      <span class="kpi-sub">${summary.macroPercentages.proteinPct}% de kcal tot.</span>
    </div>
    <div class="metrics-kpi-card" style="--kpi-color: #fbbf24;">
      <span class="kpi-title">Carbohidratos</span>
      <span class="kpi-value">${fmtMacro(summary.avgCarbs)} <span class="kpi-unit">g/día</span></span>
      <span class="kpi-sub">${summary.macroPercentages.carbsPct}% de kcal tot.</span>
    </div>
    <div class="metrics-kpi-card" style="--kpi-color: #f472b6;">
      <span class="kpi-title">Grasas Totales</span>
      <span class="kpi-value">${fmtMacro(summary.avgFat)} <span class="kpi-unit">g/día</span></span>
      <span class="kpi-sub">${summary.macroPercentages.fatPct}% de kcal tot.</span>
    </div>
    <div class="metrics-kpi-card" style="--kpi-color: #fb7185;">
      <span class="kpi-title">Grasa Saturada</span>
      <span class="kpi-value">${fmtMacro(summary.avgSatFat)} <span class="kpi-unit">g/día</span></span>
      <span class="kpi-sub">Total: ${fmtMacro(summary.totalSatFat)} g</span>
    </div>
    <div class="metrics-kpi-card" style="--kpi-color: #a3e635;">
      <span class="kpi-title">Fibra</span>
      <span class="kpi-value">${fmtMacro(summary.avgFiber)} <span class="kpi-unit">g/día</span></span>
      <span class="kpi-sub">Total: ${fmtMacro(summary.totalFiber)} g</span>
    </div>
    <div class="metrics-kpi-card" style="--kpi-color: #38bdf8;">
      <span class="kpi-title">Azúcares</span>
      <span class="kpi-value">${fmtMacro(summary.avgSugar)} <span class="kpi-unit">g/día</span></span>
      <span class="kpi-sub">Total: ${fmtMacro(summary.totalSugar)} g</span>
    </div>
    <div class="metrics-kpi-card" style="--kpi-color: #c084fc;">
      <span class="kpi-title">Meta Cumplida</span>
      <span class="kpi-value">${summary.goalCompletionRate}% <span class="kpi-unit">de días</span></span>
      <span class="kpi-sub">${summary.activeDaysCount} días con registros</span>
    </div>
  `;

  // 3. Gráfico de tendencias
  const chartWrap = $('#metrics-chart-wrap');
  chartWrap.innerHTML = renderMetricsChart(summary, userGoals);
  $('#metrics-chart-hint').textContent = `${summary.daysCount} días evaluados (${summary.activeDaysCount} activos)`;

  // 4. Distribución por comidas
  const mealDistGrid = $('#metrics-meal-dist');
  mealDistGrid.innerHTML = summary.mealDistributions
    .map(
      (m) => `
    <div class="meal-dist-card">
      <div class="meal-dist-head">
        <span>${m.icon} ${m.label}</span>
        <span>${fmt(m.calories)} kcal (${m.percentage}%)</span>
      </div>
      <div class="meal-dist-bar">
        <div class="meal-dist-fill" style="width: ${m.percentage}%;"></div>
      </div>
    </div>
  `
    )
    .join('');

  // 5. Tabla de detalle de alimentos del periodo
  const tbody = $('#metrics-table-body');
  if (summary.entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 24px; color: var(--text-muted);">No se encontraron alimentos en el periodo seleccionado.</td></tr>';
  } else {
    const sortedEntries = [...summary.entries].sort((a, b) => b.date.localeCompare(a.date));
    tbody.innerHTML = sortedEntries
      .slice(0, 100)
      .map((e) => {
        const q = e.quantity || 1;
        return `
        <tr>
          <td><b>${e.date}</b></td>
          <td><span class="badge-meal">${MEAL_ICONS[e.meal] || ''} ${MEAL_LABELS[e.meal] || e.meal}</span></td>
          <td>${e.emoji || '🍽️'} ${esc(e.name)}</td>
          <td>${q}</td>
          <td><b>${fmt(e.calories * q)}</b></td>
          <td>${fmtMacro(e.protein * q)} g</td>
          <td>${fmtMacro(e.carbs * q)} g</td>
          <td>${fmtMacro(e.fat * q)} g</td>
          <td>${fmtMacro((e.satFat ?? 0) * q)} g</td>
          <td>${fmtMacro((e.fiber ?? 0) * q)} g</td>
          <td>${fmtMacro((e.sugar ?? 0) * q)} g</td>
        </tr>
      `;
      })
      .join('');
  }
}

function handleExportRangeCSV(): void {
  const allEntries = getEntries();
  const userGoals = getGoals();
  const range = getDateRangeFromPreset(metricsPreset, metricsCustomStart, metricsCustomEnd);
  const summary = calculatePeriodSummary(allEntries, range, userGoals);
  const csvStr = generateEntriesCSV(summary.entries);
  const filename = `nutritrack_metricas_${range.startDate}_a_${range.endDate}.csv`;
  downloadCSV(filename, csvStr);
}

function handleExportAllCSV(): void {
  const allEntries = getEntries();
  const csvStr = generateEntriesCSV(allEntries);
  downloadCSV('nutritrack_registro_alimentos_completo.csv', csvStr);
}

/* ---------- Chatbot IA NutriBot ---------- */

function switchMetricsMainTab(tab: 'dashboard' | 'chat'): void {
  activeMetricsTab = tab;
  const btnDash = $('#mtab-dashboard');
  const btnChat = $('#mtab-chat');
  const viewDash = $('#mview-dashboard');
  const viewChat = $('#mview-chat');

  if (tab === 'dashboard') {
    btnDash.classList.add('active');
    btnChat.classList.remove('active');
    viewDash.classList.remove('hidden');
    viewChat.classList.add('hidden');
  } else {
    btnDash.classList.remove('active');
    btnChat.classList.add('active');
    viewDash.classList.add('hidden');
    viewChat.classList.remove('hidden');
    setTimeout(() => ($('#chat-input') as HTMLInputElement).focus(), 100);
  }
}

function getChatContext(): any {
  const profile = getProfile();
  const labs = getLabs();
  const goals = getGoals();
  const allEntries = getEntries();
  const range = getDateRangeFromPreset(metricsPreset, metricsCustomStart, metricsCustomEnd);
  const summary = calculatePeriodSummary(allEntries, range, goals);

  const recentEntries = [...allEntries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 20)
    .map((e) => ({
      date: e.date,
      meal: MEAL_LABELS[e.meal] || e.meal,
      name: e.name,
      quantity: e.quantity,
      calories: Math.round(e.calories * (e.quantity || 1)),
      protein: Math.round(e.protein * (e.quantity || 1) * 10) / 10,
      carbs: Math.round(e.carbs * (e.quantity || 1) * 10) / 10,
      fat: Math.round(e.fat * (e.quantity || 1) * 10) / 10,
      satFat: Math.round((e.satFat ?? 0) * (e.quantity || 1) * 10) / 10,
      fiber: Math.round((e.fiber ?? 0) * (e.quantity || 1) * 10) / 10,
      sugar: Math.round((e.sugar ?? 0) * (e.quantity || 1) * 10) / 10,
    }));

  return {
    profile: profile
      ? {
          sexo: profile.sex,
          edad: profile.age,
          alturaCm: profile.heightCm,
          pesoKg: profile.weightKg,
          actividad: profile.activity,
          enfoqueSalud: profile.focus,
        }
      : null,
    labs: labs
      ? {
          fechaExamen: labs.date,
          colesterolTotal: labs.totalCholesterol,
          LDL: labs.ldl,
          HDL: labs.hdl,
          triglicéridos: labs.triglycerides,
          indiceAterogénico: labs.atherogenicIndex,
        }
      : null,
    goals,
    metricsSummary: {
      periodoPreset: range.preset,
      fechaInicio: range.startDate,
      fechaFin: range.endDate,
      promedioCalorias: summary.avgCalories,
      promedioProteinas: summary.avgProtein,
      promedioCarbohidratos: summary.avgCarbs,
      promedioGrasasTotales: summary.avgFat,
      promedioGrasaSaturada: summary.avgSatFat,
      promedioFibra: summary.avgFiber,
      promedioAzucar: summary.avgSugar,
      porcentajeCumplimientoMeta: summary.goalCompletionRate,
      diasActivos: summary.activeDaysCount,
    },
    recentEntries,
  };
}

function renderChatMessageBubble(role: 'user' | 'model', content: string): void {
  const container = $('#chat-messages-container');
  const isUser = role === 'user';
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`;

  const formattedText = esc(content)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  bubble.innerHTML = `
    <span class="bubble-avatar">${isUser ? '👤' : '🥗'}</span>
    <div class="bubble-content">
      <p>${formattedText}</p>
    </div>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage(userText: string): Promise<void> {
  const prompt = userText.trim();
  if (!prompt) return;

  const inputEl = $('#chat-input') as HTMLInputElement;
  const sendBtn = $('#btn-send-chat') as HTMLButtonElement;

  inputEl.value = '';
  inputEl.disabled = true;
  sendBtn.disabled = true;

  chatMessages.push({ role: 'user', content: prompt });
  renderChatMessageBubble('user', prompt);

  $('#chat-loading').classList.remove('hidden');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatMessages,
        context: getChatContext(),
      }),
    });

    const data = await res.json();
    $('#chat-loading').classList.add('hidden');

    if (data.error || !data.answer) {
      const errMsg = data.error || 'No se pudo obtener respuesta de NutriBot.';
      renderChatMessageBubble('model', `⚠️ Error: ${errMsg}`);
    } else {
      chatMessages.push({ role: 'model', content: data.answer });
      renderChatMessageBubble('model', data.answer);
    }
  } catch (err: any) {
    $('#chat-loading').classList.add('hidden');
    renderChatMessageBubble('model', `⚠️ Hubo un problema de conexión: ${err.message || err}`);
  } finally {
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

/* ==================================================================
   Eventos
   ================================================================== */

function bindEvents(): void {
  // Eventos de Métricas y CSV
  $('#btn-metrics').addEventListener('click', openMetrics);
  $('#metrics-close').addEventListener('click', closeMetrics);

  $('#mtab-dashboard').addEventListener('click', () => switchMetricsMainTab('dashboard'));
  $('#mtab-chat').addEventListener('click', () => switchMetricsMainTab('chat'));

  $('#chat-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = ($('#chat-input') as HTMLInputElement).value;
    void sendChatMessage(text);
  });

  $('#chat-quick-chips').addEventListener('click', (ev) => {
    const chip = (ev.target as HTMLElement).closest<HTMLButtonElement>('.chat-chip');
    if (!chip || !chip.dataset.prompt) return;
    void sendChatMessage(chip.dataset.prompt);
  });

  $('#metrics-range-pills').addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLButtonElement>('.range-pill');
    if (!btn || !btn.dataset.preset) return;
    metricsPreset = btn.dataset.preset as DateRangePreset;
    renderMetrics();
  });

  $('#btn-apply-custom-range').addEventListener('click', () => {
    metricsCustomStart = ($('#metrics-start-date') as HTMLInputElement).value;
    metricsCustomEnd = ($('#metrics-end-date') as HTMLInputElement).value;
    metricsPreset = 'custom';
    renderMetrics();
  });

  $('#btn-export-range-csv').addEventListener('click', handleExportRangeCSV);
  $('#btn-export-all-csv').addEventListener('click', handleExportAllCSV);
  // Filtros de datos visibles en alimentos
  const bindFilter = (id: string, key: keyof NutrientFilters) => {
    const el = document.querySelector<HTMLInputElement>(id);
    if (el) {
      el.addEventListener('change', () => {
        const current = getNutrientFilters();
        current[key] = el.checked;
        saveNutrientFilters(current);
        renderMeals();
      });
    }
  };
  bindFilter('#nf-protein', 'protein');
  bindFilter('#nf-carbs', 'carbs');
  bindFilter('#nf-fat', 'fat');
  bindFilter('#nf-satfat', 'satFat');
  bindFilter('#nf-fiber', 'fiber');
  bindFilter('#nf-sugar', 'sugar');

  // Navegación de fecha
  $('#btn-prev-day').addEventListener('click', () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    renderAll();
  });
  $('#btn-next-day').addEventListener('click', () => {
    // Permitir avanzar hasta 7 días hacia el futuro para planificar.
    const max = new Date();
    max.setDate(max.getDate() + 7);
    if (toDateKey(selectedDate) >= toDateKey(max)) return;
    selectedDate.setDate(selectedDate.getDate() + 1);
    renderAll();
  });
  $('#btn-today').addEventListener('click', () => {
    selectedDate = new Date();
    renderAll();
  });

  // Comidas: añadir y eliminar
  $('#meals').addEventListener('click', (ev) => {
    const target = ev.target as HTMLElement;
    const addBtn = target.closest<HTMLElement>('[data-add]');
    if (addBtn) {
      openModal(addBtn.dataset.add as MealType);
      return;
    }
    const delBtn = target.closest<HTMLElement>('[data-delete]');
    if (delBtn) {
      const id = delBtn.dataset.delete!;
      const item = delBtn.closest('.entry');
      item?.classList.add('removing');
      setTimeout(() => {
        removeEntry(id);
        pushDelete(id);
        renderAll();
      }, 180);
    }
  });

  // Retos: marcar/desmarcar
  $('#challenge-list').addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-challenge]');
    if (!btn) return;
    toggleChallenge(toDateKey(selectedDate), btn.dataset.challenge!);
    pushData('challenges', getChallengeState());
    renderChallenges();
    renderAnalysis();
  });

  // Modal añadir: búsqueda y selección
  $('#food-search').addEventListener('input', (ev) => {
    searchQuery = (ev.target as HTMLInputElement).value;
    renderModal();
  });

  $('#food-list').addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-food]');
    if (!btn) return;
    selectedFood = findFood(btn.dataset.food!) ?? null;
    quantity = 1;
    renderModal();
  });

  $('#meal-pills').addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest<HTMLElement>('[data-meal]');
    if (!btn) return;
    modalMeal = btn.dataset.meal as MealType;
    $('#modal-title').textContent = `Añadir a ${MEAL_LABELS[modalMeal]}`;
    renderModal();
  });

  $('#qty-minus').addEventListener('click', () => {
    quantity = Math.max(0.5, quantity - 0.5);
    renderSelection();
  });
  $('#qty-plus').addEventListener('click', () => {
    quantity = Math.min(20, quantity + 0.5);
    renderSelection();
  });
  $('#btn-confirm-add').addEventListener('click', confirmAdd);
  $('#btn-confirm-custom').addEventListener('click', confirmCustom);

  $('#tab-buscar').addEventListener('click', () => {
    modalTab = 'buscar';
    renderModal();
    setTimeout(() => ($('#food-search') as HTMLInputElement).focus(), 50);
  });
  $('#tab-foto').addEventListener('click', () => {
    modalTab = 'foto';
    renderModal();
  });
  $('#tab-custom').addEventListener('click', () => {
    modalTab = 'personalizado';
    renderModal();
  });

  // Foto: tomar con cámara, elegir de galería o arrastrar
  const dropzone = $('#photo-dropzone');
  dropzone.addEventListener('dragover', (ev) => {
    ev.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', (ev) => {
    ev.preventDefault();
    dropzone.classList.remove('dragover');
    const file = ev.dataTransfer?.files?.[0];
    if (file) handlePhotoFile(file);
  });

  $('#btn-take-photo').addEventListener('click', () => ($('#photo-input-camera') as HTMLInputElement).click());
  $('#btn-pick-gallery').addEventListener('click', () => ($('#photo-input-gallery') as HTMLInputElement).click());
  $('#btn-change-photo').addEventListener('click', () => {
    photoSelected = null;
    ($('#photo-input-camera') as HTMLInputElement).value = '';
    ($('#photo-input-gallery') as HTMLInputElement).value = '';
    $('#photo-results').classList.add('hidden');
    $('#photo-dropzone').classList.remove('hidden');
    $('#photo-preview-wrap').classList.add('hidden');
    updateAnalyzeButtonState();
  });

  $('#photo-text-input').addEventListener('input', updateAnalyzeButtonState);

  const onPhotoChange = (ev: Event) => {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) handlePhotoFile(file);
  };
  $('#photo-input-camera').addEventListener('change', onPhotoChange);
  $('#photo-input-gallery').addEventListener('change', onPhotoChange);

  $('#btn-analyze-photo').addEventListener('click', analyzePhoto);
  $('#btn-add-photo-items').addEventListener('click', addSelectedPhotoItems);
  $('#btn-edit-single-custom').addEventListener('click', editPhotoSingleCustom);

  $('#food-search').addEventListener('input', (ev) => {
    searchQuery = (ev.target as HTMLInputElement).value;
    renderModal();
  });

  // Cerrar modales
  $('#modal-close').addEventListener('click', closeModal);
  $('#settings-close').addEventListener('click', closeSettings);
  $('#profile-close').addEventListener('click', closeProfile);
  $('#labs-close').addEventListener('click', closeLabsModal);
  $('#reminders-close').addEventListener('click', closeReminders);
  for (const [id, close] of [
    ['#modal', closeModal],
    ['#settings-modal', closeSettings],
    ['#profile-modal', closeProfile],
    ['#labs-modal', closeLabsModal],
    ['#reminders-modal', closeReminders],
    ['#metrics-modal', closeMetrics],
  ] as const) {
    $(id).addEventListener('click', (ev) => {
      if (ev.target === ev.currentTarget) close();
    });
  }
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      closeModal();
      closeSettings();
      closeProfile();
      closeLabsModal();
      closeReminders();
      closeMetrics();
    }
  });

  // Objetivos
  $('#btn-settings').addEventListener('click', openSettings);
  $('#btn-save-goals').addEventListener('click', saveSettings);

  // Exámenes de sangre
  $('#btn-edit-labs').addEventListener('click', openLabsModal);
  $('#btn-save-labs').addEventListener('click', saveLabs);

  // Recordatorios
  $('#btn-reminders').addEventListener('click', openReminders);
  $('#reminders-close').addEventListener('click', closeReminders);
  $('#btn-save-reminders').addEventListener('click', saveReminders);
  $('#btn-test-notif').addEventListener('click', handleTestNotif);
  $('#reminders-modal').addEventListener('click', (ev) => {
    if (ev.target === ev.currentTarget) closeReminders();
  });
  // Cambio en el switch → actualizar mensaje de estado
  $('#reminders-switch').addEventListener('change', updateReminderStatus);

  // Perfil
  $('#btn-profile').addEventListener('click', openProfile);
  $('#btn-save-profile').addEventListener('click', saveProfile);
  $('#btn-apply-suggested').addEventListener('click', applySuggested);
  for (const id of ['#pf-sex', '#pf-age', '#pf-height', '#pf-weight', '#pf-activity', '#pf-focus']) {
    $(id).addEventListener('input', renderProfileSummary);
  }

  // Banner
  $('#btn-complete-profile').addEventListener('click', openProfile);
  $('#btn-dismiss-banner').addEventListener('click', () => {
    bannerDismissed = true;
    localStorage.setItem('nutritrack:banner-dismissed', '1');
    renderBanner();
  });

  // Sincronización
  $('#btn-copy-code').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(getSyncCode());
      $('#btn-copy-code').textContent = '¡Copiado!';
      setTimeout(() => ($('#btn-copy-code').textContent = 'Copiar'), 2000);
    } catch {
      /* portapapeles no disponible */
    }
  });
  $('#btn-link-device').addEventListener('click', async () => {
    const input = $('#link-code-input') as HTMLInputElement;
    const ok = await linkDevice(input.value);
    if (ok) {
      input.value = '';
      $('#link-error').textContent = '';
      updateSyncUI();
      renderAll();
    } else {
      $('#link-error').textContent = 'No se pudo vincular: revisa el código o la conexión con el servidor.';
    }
  });

  // Huawei Health
  $('#btn-connect-huawei').addEventListener('click', () => {
    const code = getSyncCode();
    window.location.href = `/api/huawei/login?u=${encodeURIComponent(code)}`;
  });
  $('#btn-sync-huawei').addEventListener('click', async () => {
    const statusEl = $('#huawei-status');
    if (statusEl) statusEl.textContent = '🔄 Sincronizando datos de hoy...';
    await syncHuaweiDataToday(true);
    await checkHuaweiStatus();
  });
  $('#btn-disconnect-huawei').addEventListener('click', async () => {
    if (!confirm('¿Seguro que deseas desvincular tu cuenta de Huawei Health?')) return;
    const code = getSyncCode();
    await fetch(`/api/huawei/status`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ u: code }),
    });
    await checkHuaweiStatus();
    renderAll();
  });
  $('#btn-widget-sync-huawei').addEventListener('click', async () => {
    await syncHuaweiDataToday(true);
  });

}

/* ==================================================================
   Init
   ================================================================== */

function initApp(): void {
  try {
    subscribe(() => renderAll());
    seedDemoData();
    bindEvents();
    handleHuaweiOAuthResponse();
    renderAll();

    void registerServiceWorker().then(async () => {
      navigator.serviceWorker?.addEventListener('message', (ev) => {
        if (ev.data?.type === 'open-meal' && ev.data.meal) {
          openModal(ev.data.meal as MealType);
        }
      });
      if (isRemindersEnabled() && getPermission() === 'granted') {
        await scheduleToday();
      }
    });

    void initSync(() => {
      renderAll();
      void checkHuaweiStatus();
    });
  } catch (err) {
    console.error('[NutriTrack] Error durante la inicialización:', err);
  }
}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Re-programar al volver a la pestaña (por si la fecha cambió o la app quedó abierta)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateBellDot();
    if (isRemindersEnabled() && getPermission() === 'granted') {
      void scheduleToday();
    }
  }
});
