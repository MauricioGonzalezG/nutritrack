import { FOODS, searchFoods } from './foods';
import {
  addEntry,
  getChallengeState,
  getDailySummaries,
  getDayTotals,
  getEntriesForDate,
  getEntriesForMeal,
  getGoals,
  getLabs,
  getProfile,
  getWeekCalories,
  removeEntry,
  setGoals,
  setLabs,
  setProfile,
  toDateKey,
  todayKey,
  toggleChallenge,
} from './store';
import {
  ACTIVITY_LABELS,
  FOCUS_LABELS,
  bmi,
  bmiCategory,
  bmr,
  foodHeartRating,
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
let modalTab: 'buscar' | 'personalizado' = 'buscar';
let bannerDismissed = localStorage.getItem('nutritrack:banner-dismissed') === '1';

/* ==================================================================
   Utilidades
   ================================================================== */

function $(selector: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Elemento no encontrado: ${selector}`);
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
  $('#date-label').textContent = dateLabel(selectedDate);
  $('#date-full').textContent = fullDateLabel(selectedDate);
  ($('#btn-next-day') as HTMLButtonElement).disabled = toDateKey(selectedDate) === todayKey();
}

function renderBanner(): void {
  const show = !getProfile() && !bannerDismissed;
  $('#profile-banner').classList.toggle('hidden', !show);
}

function renderRing(): void {
  const goals = getGoals();
  const totals = getDayTotals(toDateKey(selectedDate));
  const pct = goals.calories > 0 ? Math.min(totals.calories / goals.calories, 1) : 0;

  const ring = $('#ring-progress') as unknown as SVGCircleElement;
  const r = Number(ring.getAttribute('r'));
  const circ = 2 * Math.PI * r;
  ring.style.strokeDasharray = `${circ}`;
  ring.style.strokeDashoffset = `${circ * (1 - pct)}`;

  $('#ring-kcal').textContent = fmt(totals.calories);
  $('#ring-goal').textContent = `de ${fmt(goals.calories)} kcal`;

  const remaining = goals.calories - totals.calories;
  const remainingEl = $('#ring-remaining');
  if (remaining >= 0) {
    remainingEl.textContent = `${fmt(remaining)} kcal restantes`;
    remainingEl.classList.remove('over');
  } else {
    remainingEl.textContent = `${fmt(-remaining)} kcal por encima`;
    remainingEl.classList.add('over');
  }

  $('#stat-consumed').textContent = fmt(totals.calories);
  $('#stat-goal').textContent = fmt(goals.calories);
  $('#stat-remaining').textContent = fmt(Math.max(remaining, 0));
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
}

function closeLabsModal(): void {
  $('#labs-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
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
  const dateKey = toDateKey(selectedDate);
  const container = $('#meals');
  const showReminders = isRemindersEnabled() && dateKey === todayKey();
  const now = new Date();
  const times = getTimes();

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
          .map(
            (e) => `
        <li class="entry" data-id="${e.id}">
          <span class="entry-emoji">${e.emoji}</span>
          <div class="entry-info">
            <span class="entry-name">${esc(e.name)}</span>
            <span class="entry-detail">${e.quantity} × porción · P ${fmtMacro(e.protein * e.quantity)}g · C ${fmtMacro(e.carbs * e.quantity)}g · G ${fmtMacro(e.fat * e.quantity)}g</span>
          </div>
          <span class="entry-kcal">${fmt(e.calories * e.quantity)} kcal</span>
          <button class="icon-btn entry-delete" data-delete="${e.id}" aria-label="Eliminar ${esc(e.name)}">${ICONS.trash}</button>
        </li>`
          )
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

  const good = FOODS.filter((f) => foodHeartRating(f) === 'good');
  const limit = FOODS.filter((f) => foodHeartRating(f) === 'limit');

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
  const insights = generateInsights({
    profile: getProfile(),
    labs: getLabs(),
    totals: getDayTotals(dateKey),
    entries: getEntriesForDate(dateKey),
    goals: getGoals(),
    week: getDailySummaries(7),
  });

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

function openModal(meal: MealType): void {
  modalMeal = meal;
  selectedFood = null;
  quantity = 1;
  searchQuery = '';
  modalTab = 'buscar';
  $('#modal').classList.add('open');
  document.body.classList.add('modal-open');
  renderModal();
  setTimeout(() => ($('#food-search') as HTMLInputElement).focus(), 50);
}

function closeModal(): void {
  $('#modal').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function renderModal(): void {
  $('#modal-title').textContent = `Añadir a ${MEAL_LABELS[modalMeal]}`;

  $('#tab-buscar').classList.toggle('active', modalTab === 'buscar');
  $('#tab-custom').classList.toggle('active', modalTab === 'personalizado');
  $('#panel-buscar').classList.toggle('hidden', modalTab !== 'buscar');
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
            const rating = foodHeartRating(f);
            const dot = rating !== 'neutral' ? `<span class="food-dot ${rating}" title="${rating === 'good' ? 'Aliado de tu corazón' : 'Conviene limitar'}"></span>` : '';
            return `
        <button class="food-item ${selectedFood?.id === f.id ? 'selected' : ''}" data-food="${f.id}">
          <span class="food-emoji">${f.emoji}</span>
          <div class="food-info">
            <span class="food-name">${esc(f.name)}</span>
            <span class="food-serving">${esc(f.serving)} · Fibra ${fmtMacro(f.fiber)}g · Sat ${fmtMacro(f.satFat)}g</span>
          </div>
          ${dot}
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

function confirmCustom(): void {
  const name = ($('#custom-name') as HTMLInputElement).value.trim();
  const kcal = Number(($('#custom-kcal') as HTMLInputElement).value) || 0;
  if (!name || kcal <= 0) {
    ($('#custom-name') as HTMLInputElement).focus();
    $('#custom-error').textContent = !name ? 'Escribe un nombre para el alimento.' : 'Las calorías deben ser mayores que 0.';
    return;
  }
  $('#custom-error').textContent = '';
  const val = (id: string) => Number(($(id) as HTMLInputElement).value) || 0;
  const entry = addEntry({
    foodId: null,
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
}

function closeSettings(): void {
  $('#settings-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
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
}

function closeReminders(): void {
  $('#reminders-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
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
}

function closeProfile(): void {
  $('#profile-modal').classList.remove('open');
  document.body.classList.remove('modal-open');
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
    const f = FOODS.find((x) => x.id === foodId);
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
   Eventos
   ================================================================== */

function bindEvents(): void {
  // Navegación de fecha
  $('#btn-prev-day').addEventListener('click', () => {
    selectedDate.setDate(selectedDate.getDate() - 1);
    renderAll();
  });
  $('#btn-next-day').addEventListener('click', () => {
    if (toDateKey(selectedDate) === todayKey()) return;
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
    selectedFood = FOODS.find((f) => f.id === btn.dataset.food) ?? null;
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
  });
  $('#tab-custom').addEventListener('click', () => {
    modalTab = 'personalizado';
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
}

/* ==================================================================
   Init
   ================================================================== */

seedDemoData();
bindEvents();
renderAll();

// Service Worker para notificaciones + programar recordatorios del día
registerServiceWorker().then(async () => {
  // Escuchar mensajes del SW: click en notificación → abrir comida
  navigator.serviceWorker?.addEventListener('message', (ev) => {
    if (ev.data?.type === 'open-meal' && ev.data.meal) {
      openModal(ev.data.meal as MealType);
    }
  });
  // Re-programar para el día cada vez que la app se carga
  if (isRemindersEnabled() && getPermission() === 'granted') {
    await scheduleToday();
  }
});

// Si hay base de datos configurada, el estado remoto reemplaza al local.
initSync(() => renderAll());

// Re-programar al volver a la pestaña (por si la fecha cambió o la app quedó abierta)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateBellDot();
    if (isRemindersEnabled() && getPermission() === 'granted') {
      void scheduleToday();
    }
  }
});
