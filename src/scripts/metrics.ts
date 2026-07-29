import type { DailyActivityData, DayTotals, FoodEntry, Goals, HuaweiSyncData, MealType } from './types';
import { MEAL_LABELS, MEAL_ICONS } from './types';
import { toDateKey } from './store';

export type DateRangePreset = '7d' | '30d' | 'this-month' | 'custom' | 'all';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface DayMetricPoint {
  dateKey: string;
  dateLabel: string; // Ej: "15 Oct" o "Lun"
  totals: DayTotals;
  entriesCount: number;
  huaweiActivity?: DailyActivityData | null;
}


export interface MealDistribution {
  meal: MealType;
  label: string;
  icon: string;
  calories: number;
  percentage: number;
}

export interface PeriodSummary {
  daysCount: number;
  activeDaysCount: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalSatFat: number;
  totalFiber: number;
  totalSugar: number;
  
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  avgSatFat: number;
  avgFiber: number;
  avgSugar: number;

  goalCompletionRate: number; // Porcentaje de días activos dentro del rango de calorías meta (±15%)
  macroPercentages: {
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  };
  mealDistributions: MealDistribution[];
  dailyPoints: DayMetricPoint[];
  entries: FoodEntry[];
  totalActiveBurn: number;
  totalSteps: number;
}


/** Formatea una fecha YYYY-MM-DD a un texto legible e.g. "12 Jul" */
export function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d} ${monthNames[date.getMonth()]}`;
}

/** Obtiene las fechas de inicio y fin para un preset determinado */
export function getDateRangeFromPreset(preset: DateRangePreset, customStart?: string, customEnd?: string): DateRange {
  const today = new Date();
  const endKey = toDateKey(today);

  if (preset === 'custom' && customStart && customEnd) {
    return { preset, startDate: customStart, endDate: customEnd };
  }

  if (preset === '7d') {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { preset, startDate: toDateKey(start), endDate: endKey };
  }

  if (preset === '30d') {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { preset, startDate: toDateKey(start), endDate: endKey };
  }

  if (preset === 'this-month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { preset, startDate: toDateKey(start), endDate: endKey };
  }

  // 'all' o fallback
  return { preset: 'all', startDate: '2020-01-01', endDate: endKey };
}

/** Filtra las entradas por rango de fechas */
export function filterEntriesByRange(allEntries: FoodEntry[], range: DateRange): FoodEntry[] {
  if (range.preset === 'all') return [...allEntries];
  return allEntries.filter((e) => e.date >= range.startDate && e.date <= range.endDate);
}

/** Genera la lista de todas las fechas entre startDate y endDate */
export function generateDateSequence(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const [sY, sM, sD] = startDate.split('-').map(Number);
  const [eY, eM, eD] = endDate.split('-').map(Number);
  if (!sY || !sM || !sD || !eY || !eM || !eD) return dates;

  const current = new Date(sY, sM - 1, sD);
  const end = new Date(eY, eM - 1, eD);

  // Limitar máximo 365 días por rendimiento
  let count = 0;
  while (current <= end && count < 365) {
    dates.push(toDateKey(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
}

/** Calcula el resumen y desglose métrico de un conjunto de entradas en un periodo */
export function calculatePeriodSummary(
  allEntries: FoodEntry[],
  range: DateRange,
  userGoals: Goals,
  huaweiSyncData: HuaweiSyncData = {}
): PeriodSummary {
  const filteredEntries = filterEntriesByRange(allEntries, range);

  let dateKeys: string[] = [];
  if (range.preset === 'all') {
    const uniqueDates = Array.from(new Set(filteredEntries.map((e) => e.date))).sort();
    dateKeys = uniqueDates.length > 0 ? uniqueDates : [toDateKey(new Date())];
  } else {
    dateKeys = generateDateSequence(range.startDate, range.endDate);
  }

  const daysCount = dateKeys.length || 1;
  const entriesByDate = new Map<string, FoodEntry[]>();

  for (const entry of filteredEntries) {
    const list = entriesByDate.get(entry.date) || [];
    list.push(entry);
    entriesByDate.set(entry.date, list);
  }

  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalSatFat = 0;
  let totalFiber = 0;
  let totalSugar = 0;
  let totalActiveBurn = 0;
  let totalSteps = 0;
  let activeDaysCount = 0;
  let daysOnGoalCount = 0;

  const dailyPoints: DayMetricPoint[] = [];

  for (const dKey of dateKeys) {
    const dayEntries = entriesByDate.get(dKey) || [];
    const totals: DayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, satFat: 0, fiber: 0, sugar: 0 };

    for (const e of dayEntries) {
      const q = e.quantity || 1;
      totals.calories += e.calories * q;
      totals.protein += e.protein * q;
      totals.carbs += e.carbs * q;
      totals.fat += e.fat * q;
      totals.satFat += (e.satFat ?? 0) * q;
      totals.fiber += (e.fiber ?? 0) * q;
      totals.sugar += (e.sugar ?? 0) * q;
    }

    const hwActivity = huaweiSyncData[dKey] ?? null;
    if (hwActivity) {
      totalActiveBurn += hwActivity.activeCalories || 0;
      totalSteps += hwActivity.steps || 0;
    }

    if (dayEntries.length > 0) {
      activeDaysCount++;
      // Consideramos día en meta si está dentro del ±15% del objetivo calórico
      const lower = userGoals.calories * 0.85;
      const upper = userGoals.calories * 1.15;
      if (totals.calories >= lower && totals.calories <= upper) {
        daysOnGoalCount++;
      }
    }

    totalCalories += totals.calories;
    totalProtein += totals.protein;
    totalCarbs += totals.carbs;
    totalFat += totals.fat;
    totalSatFat += totals.satFat;
    totalFiber += totals.fiber;
    totalSugar += totals.sugar;

    dailyPoints.push({
      dateKey: dKey,
      dateLabel: formatDateLabel(dKey),
      totals,
      entriesCount: dayEntries.length,
      huaweiActivity: hwActivity,
    });
  }

  const denominator = daysCount > 0 ? daysCount : 1;
  const avgCalories = Math.round(totalCalories / denominator);
  const avgProtein = Math.round((totalProtein / denominator) * 10) / 10;
  const avgCarbs = Math.round((totalCarbs / denominator) * 10) / 10;
  const avgFat = Math.round((totalFat / denominator) * 10) / 10;
  const avgSatFat = Math.round((totalSatFat / denominator) * 10) / 10;
  const avgFiber = Math.round((totalFiber / denominator) * 10) / 10;
  const avgSugar = Math.round((totalSugar / denominator) * 10) / 10;

  // % Macronutrientes en base a calorías (4 kcal/g proteína, 4 kcal/g carbos, 9 kcal/g grasa)
  const proteinKcal = totalProtein * 4;
  const carbsKcal = totalCarbs * 4;
  const fatKcal = totalFat * 9;
  const macroKcalTotal = proteinKcal + carbsKcal + fatKcal || 1;

  const macroPercentages = {
    proteinPct: Math.round((proteinKcal / macroKcalTotal) * 100),
    carbsPct: Math.round((carbsKcal / macroKcalTotal) * 100),
    fatPct: Math.round((fatKcal / macroKcalTotal) * 100),
  };

  // Desglose por Comidas
  const mealTotals: Record<MealType, number> = { desayuno: 0, almuerzo: 0, cena: 0, snacks: 0 };
  for (const e of filteredEntries) {
    const q = e.quantity || 1;
    if (e.meal && mealTotals[e.meal] !== undefined) {
      mealTotals[e.meal] += e.calories * q;
    }
  }

  const meals: MealType[] = ['desayuno', 'almuerzo', 'cena', 'snacks'];
  const mealDistributions: MealDistribution[] = meals.map((m) => {
    const cal = Math.round(mealTotals[m]);
    const pct = totalCalories > 0 ? Math.round((cal / totalCalories) * 100) : 0;
    return {
      meal: m,
      label: MEAL_LABELS[m] || m,
      icon: MEAL_ICONS[m] || '🍽️',
      calories: cal,
      percentage: pct,
    };
  });

  const goalCompletionRate = activeDaysCount > 0 ? Math.round((daysOnGoalCount / activeDaysCount) * 100) : 0;

  return {
    daysCount,
    activeDaysCount,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalSatFat: Math.round(totalSatFat * 10) / 10,
    totalFiber: Math.round(totalFiber * 10) / 10,
    totalSugar: Math.round(totalSugar * 10) / 10,

    avgCalories,
    avgProtein,
    avgCarbs,
    avgFat,
    avgSatFat,
    avgFiber,
    avgSugar,

    goalCompletionRate,
    macroPercentages,
    mealDistributions,
    dailyPoints,
    entries: filteredEntries,
    totalActiveBurn,
    totalSteps,
  };

}

/** Escapa campos para formato CSV */
function escapeCSV(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/** Genera una cadena CSV bien estructurada con UTF-8 BOM a partir de las entradas */
export function generateEntriesCSV(entries: FoodEntry[]): string {
  // Ordenar por fecha descendente, luego por comida
  const sorted = [...entries].sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return a.meal.localeCompare(b.meal);
  });

  const headers = [
    'Fecha',
    'Comida',
    'Emoji',
    'Alimento',
    'Cantidad (porciones)',
    'Calorías (kcal)',
    'Proteínas (g)',
    'Carbohidratos (g)',
    'Grasas Totales (g)',
    'Grasa Saturada (g)',
    'Fibra (g)',
    'Azúcar (g)',
  ];

  const rows: string[] = [];
  rows.push(headers.map(escapeCSV).join(','));

  for (const e of sorted) {
    const q = e.quantity || 1;
    const row = [
      e.date,
      MEAL_LABELS[e.meal] || e.meal,
      e.emoji || '🍽️',
      e.name,
      q,
      Math.round(e.calories * q),
      Math.round(e.protein * q * 10) / 10,
      Math.round(e.carbs * q * 10) / 10,
      Math.round(e.fat * q * 10) / 10,
      Math.round((e.satFat ?? 0) * q * 10) / 10,
      Math.round((e.fiber ?? 0) * q * 10) / 10,
      Math.round((e.sugar ?? 0) * q * 10) / 10,
    ];
    rows.push(row.map(escapeCSV).join(','));
  }

  // Incluir BOM UTF-8 (\uFEFF) para apertura correcta en Microsoft Excel
  return '\uFEFF' + rows.join('\r\n');
}

/** Descarga el archivo CSV en el navegador */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
