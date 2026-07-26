import type { ActivityLevel, Food, Goals, HealthFocus, HealthLimits, Profile } from './types';

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentario: 'Sedentario (oficina, poco movimiento)',
  ligero: 'Ligero (caminatas, ejercicio 1-3 días/sem)',
  moderado: 'Moderado (ejercicio 3-5 días/sem)',
  activo: 'Activo (ejercicio 6-7 días/sem)',
  muy_activo: 'Muy activo (trabajo físico o doble sesión)',
};

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export const FOCUS_LABELS: Record<HealthFocus, string> = {
  colesterol: '❤️ Bajar colesterol',
  trigliceridos: '📉 Bajar triglicéridos',
  ambos: '💪 Colesterol y triglicéridos',
  general: '🥗 Salud general',
};

/* ---------- Métricas corporales ---------- */

export function bmi(p: Profile): number {
  const m = p.heightCm / 100;
  return p.weightKg / (m * m);
}

export function bmiCategory(value: number): { label: string; tone: 'info' | 'good' | 'warn' | 'bad' } {
  if (value < 18.5) return { label: 'Bajo peso', tone: 'warn' };
  if (value < 25) return { label: 'Peso saludable', tone: 'good' };
  if (value < 30) return { label: 'Sobrepeso', tone: 'warn' };
  return { label: 'Obesidad', tone: 'bad' };
}

/** Tasa metabólica basal — ecuación Mifflin-St Jeor. */
export function bmr(p: Profile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'hombre' ? base + 5 : base - 161;
}

/** Gasto energético diario total (TDEE). */
export function tdee(p: Profile): number {
  return bmr(p) * ACTIVITY_FACTORS[p.activity];
}

/** Calorías sugeridas según objetivo de peso saludable. */
export function suggestedCalories(p: Profile): number {
  const t = tdee(p);
  const b = bmi(p);
  let target = t;
  if (b >= 25) target = t - 500; // déficit para bajar ~0.5 kg/sem
  else if (b < 18.5) target = t + 300; // superávit suave
  return Math.max(1200, Math.round(target / 50) * 50);
}

/** Reparto de macros sugerido: 25% proteína, 45% carbos, 30% grasa. */
export function suggestedMacros(calories: number): Omit<Goals, 'calories'> {
  return {
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

/* ---------- Límites para salud cardiovascular ----------
   Basados en guías AHA/OMS:
   - Grasa saturada: <6% kcal si el enfoque es colesterol, <10% en general.
   - Fibra: 14 g por cada 1000 kcal (mín. 25 g).
   - Azúcar: <5% kcal si el enfoque es triglicéridos, <10% en general. */

export function healthLimits(focus: HealthFocus | undefined, calorieGoal: number): HealthLimits {
  const chol = focus === 'colesterol' || focus === 'ambos';
  const trig = focus === 'trigliceridos' || focus === 'ambos';
  return {
    satFat: Math.round(((chol ? 0.06 : 0.1) * calorieGoal) / 9),
    fiber: Math.max(25, Math.round((14 * calorieGoal) / 1000)),
    sugar: Math.round(((trig ? 0.05 : 0.1) * calorieGoal) / 4),
  };
}

/* ---------- Clasificación de alimentos para salud cardiovascular ---------- */

export type FoodRating = 'good' | 'limit' | 'neutral';

/** Alimentos que conviene limitar con LDL o triglicéridos altos. */
const LIMIT_IDS = new Set([
  // Internacionales
  'carne-res', 'cerdo', 'jamon', 'hamburguesa', 'burrito', 'pizza', 'papas-fritas', 'nuggets',
  'refresco', 'jugo-naranja', 'cerveza', 'vino', 'azucar', 'miel', 'galletas', 'brownie',
  'chips', 'cereal', 'donut', 'helado', 'chocolate', 'mantequilla',
  // Embutidos andinos
  'chorizo-antioqueno', 'longaniza', 'morcilla-sangre', 'butifarra', 'tocineta',
  'chicharron', 'chicharron-prensado', 'salchicha', 'mortadela',
  // Platos típicos altos en grasa saturada
  'bandeja-paisa', 'lechona', 'tamal-tolimense',
  // Dulces típicos
  'arequipe', 'leche-condensada', 'bocadillo-arequipe', 'milhojas', 'torta-chocolate',
  'cocadas', 'rosquilla', 'natilla', 'torta-banano', 'cholao', 'mazamorra-maracuya',
  'arroz-dulce', 'brevas-arequipe', 'postre-natas',
  // Bebidas con azúcar añadido
  'panela', 'agua-panela', 'agua-panela-queso', 'canelazo', 'chicha', 'champus', 'guarapo',
  // Callejeros
  'pandebono', 'pan-de-yuca', 'pandequeso', 'bunuelo', 'achiras', 'oblea', 'mantecada',
  'arepa-huevo', 'arepa-queso', 'empanada-antioquena', 'empanada-valluna',
  'colada-maicena', 'huevos-revueltos',
  // Plátano maduro frito
  'platano-maduro', 'yuca-frita', 'platanitos',
]);

/** Alimentos aliados del perfil lipídico (fibra, omega-3, grasas insaturadas). */
const GOOD_IDS = new Set([
  // Proteínas
  'salmon', 'atun', 'sardina', 'trucha', 'tilapia', 'mojarra', 'camaron',
  // Fibra y granos
  'avena', 'frijoles', 'lentejas', 'garbanzo', 'frijol-rojo', 'frijol-blanco', 'soja',
  'arveja-verde', 'habas', 'quinoa', 'cebada', 'centeno', 'arroz-integral', 'chia', 'linaza',
  // Frutos secos
  'almendras', 'nueces', 'pistachos', 'castanas-brasil', 'avellana', 'pinones',
  'semillas-girasol', 'mani',
  // Verduras
  'brocoli', 'espinaca', 'acelgas', 'lechuga', 'col', 'pimenton', 'apio', 'pepino',
  'champinones', 'berenjena', 'chayote', 'tomate', 'tomate-arbol', 'ahuyama', 'calabacin',
  'ensalada', 'repollo', 'rabanos', 'remolacha',
  // Frutas andinas
  'manzana', 'fresas', 'aguacate', 'lulo', 'mora', 'gulupa', 'curuba', 'pitahaya',
  'feijoa', 'uchuva', 'carambolo', 'guanabana', 'papaya', 'pina', 'mango',
  'granadilla', 'kiwi', 'arandanos', 'pera', 'ciruela', 'durazno', 'mandarina',
  'maracuya', 'frutilla', 'chontaduro', 'naranja',
  // Grasas saludables
  'aceite-oliva',
  // Legumbres andinas (platos)
  'hummus', 'frijoles-antioquenos', 'frijolada-boyacense', 'ajiaco', 'sancocho-pollo',
  'sancocho-res', 'sancocho-pescado', 'cuchuco', 'mute-santandereano', 'mondongo',
  'calentado-paisa',
  // Lácteos
  'kumis', 'suero', 'cuajada',
]);

/** Frutas enteras: su azúcar natural va acompañada de fibra, no se penaliza. */
const WHOLE_FRUITS = new Set(['manzana', 'banana', 'naranja', 'fresas', 'uvas', 'sandia']);

export function foodHeartRating(f: Food): FoodRating {
  if (GOOD_IDS.has(f.id)) return 'good';
  if (LIMIT_IDS.has(f.id)) return 'limit';
  if (f.satFat >= 5) return 'limit';
  if (f.sugar >= 20 && !WHOLE_FRUITS.has(f.id)) return 'limit';
  if (f.fiber >= 3.5) return 'good';
  return 'neutral';
}

/* ---------- Perfil de riesgo/amigos por alimento (selector) ----------
   Devuelve un nivel (good/warn/bad/neutral) + razones en texto plano,
   para mostrar avisos intuitivos directamente en la lista de alimentos. */

export type RiskLevel = 'good' | 'warn' | 'bad' | 'neutral';

export interface FoodRisk {
  level: RiskLevel;
  reasons: string[]; //Etiquetas cortas (≤4 palabras)
  primary: string; // razón principal (1)
}

const OMEGA3_IDS = new Set(['salmon', 'atun', 'sardina', 'trucha', 'mojarra', 'tilapia', 'camaron']);
const UNSAT_IDS = new Set(['aguacate', 'aceite-oliva', 'almendras', 'nueces', 'pistachos', 'castanas-brasil', 'avellana', 'mani', 'chia', 'linaza', 'semillas-girasol']);
const FRY_IDS = new Set(['papas-fritas', 'patacon', 'platano-maduro', 'yuca-frita', 'platanitos', 'empanada-antioquena', 'empanada-valluna', 'arepa-huevo', 'nuggets', 'chicharron', 'empanada-valluna']);
const ALCOHOL_IDS = new Set(['cerveza', 'vino', 'canelazo', 'carajillo', 'chicha', 'guarapo']);

export function foodRisk(f: Food): FoodRisk {
  const good: string[] = [];
  const warn: string[] = [];
  const bad: string[] = [];
  const wholeFruit = WHOLE_FRUITS.has(f.id);

  // --- Colesterol (LDL) ---
  if (f.satFat >= 6) bad.push('Sube colesterol 🧈');
  else if (f.satFat >= 3) warn.push('Sat. considerable');

  // --- Triglicéridos (azúcar/alcohol) ---
  if (f.sugar >= 20 && !wholeFruit) bad.push('Sube triglicéridos 🍬');
  else if (f.sugar >= 12 && !wholeFruit) warn.push('Azúcar presente');

  if (ALCOHOL_IDS.has(f.id)) bad.push('Alcohol 💣');

  // --- Calorías y frituras ---
  if (FRY_IDS.has(f.id)) bad.push('Fritura 🍟');
  if (f.calories >= 600) warn.push('Calorías altas');
  else if (f.calories >= 400 && !LIMIT_IDS.has(f.id)) warn.push('Calórico');

  if (LIMIT_IDS.has(f.id) && bad.length === 0) warn.push('Limitar');

  // --- Aliados (HDL↑ / LDL↓ / TG↓) ---
  if (OMEGA3_IDS.has(f.id)) good.push('Omega-3 ↓TG 🐟');
  if (UNSAT_IDS.has(f.id)) good.push('Grasas buenas 🫒');
  if (f.fiber >= 5) good.push('Fibra ↓LDL 🌾');
  else if (f.fiber >= 3 && good.length === 0) good.push('Buena fibra');
  else if (f.fiber >= 3) good.push('+Fibra');

  let level: RiskLevel;
  if (bad.length > 0) level = 'bad';
  else if (warn.length > 0) level = 'warn';
  else if (good.length > 0) level = 'good';
  else level = 'neutral';

  const reasons = [...bad, ...warn, ...good].slice(0, 3);
  const primary = reasons[0] ?? '';
  return { level, reasons, primary };
}
