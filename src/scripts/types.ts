export type MealType = 'desayuno' | 'almuerzo' | 'cena' | 'snacks';

export interface Food {
  id: string;
  name: string;
  emoji: string;
  calories: number; // kcal por porción
  protein: number; // g por porción
  carbs: number; // g por porción
  fat: number; // g por porción
  satFat: number; // grasa saturada (g) — clave para colesterol LDL
  fiber: number; // fibra (g) — ayuda a reducir colesterol
  sugar: number; // azúcares (g) — clave para triglicéridos
  serving: string; // descripción de la porción
  isCustom?: boolean; // indica si fue guardado por el usuario
}

export interface FoodEntry {
  id: string;
  foodId: string | null; // null si es personalizado
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  satFat: number;
  fiber: number;
  sugar: number;
  meal: MealType;
  quantity: number; // multiplicador de porciones
  date: string; // YYYY-MM-DD
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  satFat: number;
  fiber: number;
  sugar: number;
}

/* ---------- Perfil y salud ---------- */

export type Sex = 'hombre' | 'mujer';
export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy_activo';
export type HealthFocus = 'colesterol' | 'trigliceridos' | 'ambos' | 'general';

export interface Profile {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  focus: HealthFocus;
}

/** Límites/objetivos diarios derivados del perfil y del objetivo calórico. */
export interface HealthLimits {
  satFat: number; // límite (menos es mejor)
  fiber: number; // objetivo (más es mejor)
  sugar: number; // límite (menos es mejor)
}

/** Estado de retos: fecha -> id de reto -> completado (manual). */
export type ChallengeState = Record<string, Record<string, boolean>>;

/* ---------- Exámenes de sangre (perfil lipídico) ---------- */

export interface LabResults {
  date: string; // YYYY-MM-DD
  totalCholesterol: number; // mg/dl
  ldl: number; // mg/dl ("malo")
  hdl: number; // mg/dl ("bueno")
  triglycerides: number; // mg/dl
  vldl?: number; // mg/dl
  atherogenicIndex?: number; // CT / HDL
}

/* ---------- Datos de Huawei Health ---------- */

export interface DailyActivityData {
  activeCalories: number; // kcal quemadas activas (ej. GT 2 Pro)
  steps: number; // pasos registrados
  lastSyncedAt?: string; // fecha/hora de última sincronización
}

/** Mapa de fecha (YYYY-MM-DD) a actividad física registrada */
export type HuaweiSyncData = Record<string, DailyActivityData>;


export const MEAL_LABELS: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  cena: 'Cena',
  snacks: 'Snacks',
};

export const MEAL_ICONS: Record<MealType, string> = {
  desayuno: '🌅',
  almuerzo: '☀️',
  cena: '🌙',
  snacks: '🍿',
};
