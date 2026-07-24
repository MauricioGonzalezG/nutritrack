import { bmi, bmiCategory, healthLimits } from './health';
import { effectiveFocus } from './labs';
import type { DayTotals, FoodEntry, Goals, HealthLimits, LabResults, Profile } from './types';

export interface Insight {
  icon: string;
  title: string;
  text: string;
  tone: 'good' | 'warn' | 'bad' | 'info';
}

interface AnalysisInput {
  profile: Profile | null;
  labs: LabResults | null;
  totals: DayTotals;
  entries: FoodEntry[];
  goals: Goals;
  week: { dateKey: string; totals: DayTotals; entries: FoodEntry[] }[];
}

function topContributor(entries: FoodEntry[], field: 'satFat' | 'sugar'): FoodEntry | null {
  let best: FoodEntry | null = null;
  let max = 0;
  for (const e of entries) {
    const v = (e[field] ?? 0) * e.quantity;
    if (v > max) {
      max = v;
      best = e;
    }
  }
  return best;
}

function labInsights(labs: LabResults, profile: Profile | null): Insight[] {
  const out: Insight[] = [];
  const date = new Date(labs.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  if (labs.ldl >= 190) {
    out.push({
      icon: '🩺',
      title: `LDL en ${labs.ldl} mg/dl — muy alto (óptimo < 100)`,
      text: `Un LDL por encima de 190 a los ${profile?.age ?? '26'} años amerita valoración médica: a veces tiene componente genético (hipercolesterolemia familiar) y la dieta sola no basta. Agenda cita con tu médico; mientras tanto, este plan va en la dirección correcta.`,
      tone: 'bad',
    });
  } else if (labs.ldl >= 130) {
    out.push({
      icon: '❤️',
      title: `LDL en ${labs.ldl} mg/dl — por encima de lo óptimo`,
      text: 'Prioridad #1: menos grasa saturada (carne roja, embutidos, lácteos enteros) y más fibra soluble (avena, legumbres).',
      tone: 'warn',
    });
  }

  if (labs.triglycerides >= 200) {
    out.push({
      icon: '📉',
      title: `Triglicéridos en ${labs.triglycerides} mg/dl — altos (normal < 150)`,
      text: 'Los TG responden muy bien a la dieta: corta azúcares y harinas refinadas, elimina alcohol y refrescos, y suma pescado azul 2-3 veces por semana.',
      tone: 'bad',
    });
  } else if (labs.triglycerides >= 150) {
    out.push({
      icon: '📉',
      title: `Triglicéridos en ${labs.triglycerides} mg/dl — límite alto`,
      text: 'Con controlar azúcar, alcohol y porciones de carbos refinados deberían bajar en pocas semanas.',
      tone: 'warn',
    });
  }

  const hdlMin = profile?.sex === 'mujer' ? 50 : 40;
  if (labs.hdl < hdlMin) {
    out.push({
      icon: '🏃',
      title: `HDL en ${labs.hdl} mg/dl — bajo (ideal > ${hdlMin})`,
      text: 'El HDL "bueno" se sube sobre todo con ejercicio aeróbico regular (30 min diarios), grasas saludables (aceite de oliva, frutos secos) y dejando de fumar si aplica.',
      tone: 'warn',
    });
  }

  if (labs.atherogenicIndex !== undefined && labs.atherogenicIndex > 4) {
    out.push({
      icon: '🎯',
      title: `Índice aterogénico: ${labs.atherogenicIndex} (ideal ≤ 4.0)`,
      text: `Punto de partida del ${date}. Es la relación colesterol total/HDL: bajará al atacar los tres frentes (LDL↓, TG↓, HDL↑). Repite el examen en 3 meses para medir tu progreso.`,
      tone: 'info',
    });
  }

  return out;
}

export function generateInsights({ profile, labs, totals, entries, goals, week }: AnalysisInput): Insight[] {
  const out: Insight[] = [];
  const focus = effectiveFocus(profile, labs);
  const limits: HealthLimits = healthLimits(focus, goals.calories);
  const logged = entries.length > 0;

  /* ---- Punto de partida: exámenes de sangre ---- */
  if (labs) {
    out.push(...labInsights(labs, profile));
  }

  /* ---- Perfil corporal ---- */
  if (profile) {
    const b = bmi(profile);
    const cat = bmiCategory(b);
    out.push({
      icon: '⚖️',
      title: `Tu IMC es ${b.toFixed(1)} — ${cat.label}`,
      text:
        cat.tone === 'good'
          ? 'Estás en rango saludable. Mantén tus hábitos actuales.'
          : b >= 25
            ? 'Bajar de peso suele mejorar directamente colesterol y triglicéridos. Un déficit moderado es suficiente.'
            : 'Prioriza alimentos densos en nutrientes para ganar peso de forma saludable.',
      tone: cat.tone,
    });
  }

  /* ---- Adherencia calórica semanal ---- */
  const activeDays = week.filter((d) => d.totals.calories > 0);
  if (activeDays.length >= 2) {
    const avg = activeDays.reduce((s, d) => s + d.totals.calories, 0) / activeDays.length;
    const diff = avg - goals.calories;
    out.push({
      icon: diff <= 0 ? '📅' : '⚠️',
      title: `Promedio semanal: ${Math.round(avg).toLocaleString('es-ES')} kcal/día`,
      text:
        Math.abs(diff) <= 100
          ? 'Excelente constancia: estás clavando tu objetivo calórico.'
          : diff > 0
            ? `Estás ~${Math.round(diff)} kcal por encima de tu objetivo. Revisa snacks y bebidas: suelen ser la causa.`
            : `Estás ~${Math.round(-diff)} kcal por debajo. Bien si buscas bajar de peso; no bajes de forma agresiva.`,
      tone: Math.abs(diff) <= 100 ? 'good' : diff > 0 ? 'warn' : 'info',
    });
  }

  /* ---- Grasa saturada (colesterol LDL) ---- */
  if (logged) {
    const pct = Math.round((totals.satFat / limits.satFat) * 100);
    const top = topContributor(entries, 'satFat');
    if (focus === 'colesterol' || focus === 'ambos') {
      out.push({
        icon: totals.satFat <= limits.satFat ? '❤️' : '🧈',
        title: `Grasa saturada: ${totals.satFat.toFixed(1)} g de ${limits.satFat} g (${pct}%)`,
        text:
          totals.satFat <= limits.satFat
            ? 'Vas dentro del límite. La grasa saturada es la que más eleva el LDL ("malo").'
            : `Te pasaste del límite.${top ? ` Mayor fuente hoy: ${top.name}.` : ''} Sustituye por aceite de oliva, pescado o frutos secos.`,
        tone: totals.satFat <= limits.satFat ? 'good' : 'bad',
      });
    }

    /* ---- Fibra (colesterol) ---- */
    const fiberPct = Math.round((totals.fiber / limits.fiber) * 100);
    if (focus === 'colesterol' || focus === 'ambos' || totals.fiber < limits.fiber * 0.6) {
      out.push({
        icon: fiberPct >= 100 ? '🌾' : '🥣',
        title: `Fibra: ${totals.fiber.toFixed(1)} g de ${limits.fiber} g (${fiberPct}%)`,
        text:
          fiberPct >= 100
            ? '¡Meta lograda! La fibra soluble captura colesterol en el intestino y ayuda a eliminarlo.'
            : 'Para subirla: avena en el desayuno, legumbres 3-4 veces por semana y fruta con cáscara.',
        tone: fiberPct >= 100 ? 'good' : fiberPct >= 60 ? 'info' : 'warn',
      });
    }

    /* ---- Azúcar (triglicéridos) ---- */
    if (focus === 'trigliceridos' || focus === 'ambos' || totals.sugar > limits.sugar) {
      const sugarPct = Math.round((totals.sugar / limits.sugar) * 100);
      const topS = topContributor(entries, 'sugar');
      out.push({
        icon: totals.sugar <= limits.sugar ? '🍯' : '🥤',
        title: `Azúcares: ${totals.sugar.toFixed(1)} g de ${limits.sugar} g (${sugarPct}%)`,
        text:
          totals.sugar <= limits.sugar
            ? 'Bien controlado. El exceso de azúcar se convierte en triglicéridos en el hígado.'
            : `Exceso de azúcar.${topS ? ` Principal fuente: ${topS.name}.` : ''} El azúcar líquida (refrescos, jugos) es la que más sube los TG.`,
        tone: totals.sugar <= limits.sugar ? 'good' : 'bad',
      });
    }

    /* ---- Omega-3 semanal (triglicéridos) ---- */
    if (focus === 'trigliceridos' || focus === 'ambos') {
      const fish = week.reduce((n, d) => n + d.entries.filter((e) => e.foodId === 'salmon' || e.foodId === 'atun').length, 0);
      out.push({
        icon: fish >= 2 ? '🐟' : '🎣',
        title: `Pescado esta semana: ${fish} ${fish === 1 ? 'vez' : 'veces'}`,
        text:
          fish >= 2
            ? 'Muy bien: los omega-3 del pescado azul reducen triglicéridos de forma demostrada.'
            : 'Apunta a 2-3 porciones de pescado azul por semana (salmón, atún, sardina) para bajar triglicéridos.',
        tone: fish >= 2 ? 'good' : 'info',
      });
    }

    /* ---- Refuerzo positivo global ---- */
    const allOk = totals.satFat <= limits.satFat && totals.sugar <= limits.sugar && totals.fiber >= limits.fiber;
    if (allOk) {
      out.push({
        icon: '🏆',
        title: 'Día cardiovascularmente perfecto',
        text: 'Grasa saturada y azúcar bajo límite, y fibra en objetivo. Así se cuida el corazón.',
        tone: 'good',
      });
    }
  } else {
    out.push({
      icon: '📝',
      title: 'Aún no has registrado alimentos hoy',
      text: 'Registra tus comidas para recibir análisis sobre colesterol, triglicéridos y calorías.',
      tone: 'info',
    });
  }

  return out;
}
