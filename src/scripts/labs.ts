import type { HealthFocus, LabResults, Profile, Sex } from './types';

/**
 * Interpretación del perfil lipídico con cortes clínicos estándar
 * (ATP III / guías AHA-ACC). Educativo, no diagnóstico.
 */

export interface AnalyteInfo {
  key: keyof Omit<LabResults, 'date'>;
  name: string;
  unit: string;
  ref: string; // texto de referencia para mostrar
}

export const ANALYTES: AnalyteInfo[] = [
  { key: 'totalCholesterol', name: 'Colesterol total', unit: 'mg/dl', ref: 'Deseable < 200' },
  { key: 'ldl', name: 'LDL ("malo")', unit: 'mg/dl', ref: 'Óptimo < 100' },
  { key: 'hdl', name: 'HDL ("bueno")', unit: 'mg/dl', ref: 'H > 40 · M > 50' },
  { key: 'triglycerides', name: 'Triglicéridos', unit: 'mg/dl', ref: 'Normal < 150' },
  { key: 'vldl', name: 'VLDL', unit: 'mg/dl', ref: '2 – 30' },
  { key: 'atherogenicIndex', name: 'Índice aterogénico', unit: '', ref: '≤ 4.0' },
];

export type LabTone = 'good' | 'warn' | 'bad';

export interface LabStatus {
  label: string;
  tone: LabTone;
}

export function analyteStatus(key: AnalyteInfo['key'], value: number, sex: Sex = 'hombre'): LabStatus {
  switch (key) {
    case 'totalCholesterol':
      if (value < 200) return { label: 'Deseable', tone: 'good' };
      if (value < 240) return { label: 'Límite alto', tone: 'warn' };
      return { label: 'Alto', tone: 'bad' };
    case 'ldl':
      if (value < 100) return { label: 'Óptimo', tone: 'good' };
      if (value < 130) return { label: 'Casi óptimo', tone: 'good' };
      if (value < 160) return { label: 'Límite alto', tone: 'warn' };
      if (value < 190) return { label: 'Alto', tone: 'bad' };
      return { label: 'Muy alto', tone: 'bad' };
    case 'hdl': {
      const min = sex === 'hombre' ? 40 : 50;
      if (value < min) return { label: 'Bajo', tone: 'warn' };
      if (value >= 60) return { label: 'Protector', tone: 'good' };
      return { label: 'Aceptable', tone: 'good' };
    }
    case 'triglycerides':
      if (value < 150) return { label: 'Normal', tone: 'good' };
      if (value < 200) return { label: 'Límite alto', tone: 'warn' };
      if (value < 500) return { label: 'Alto', tone: 'bad' };
      return { label: 'Muy alto', tone: 'bad' };
    case 'vldl':
      return value <= 30 ? { label: 'Normal', tone: 'good' } : { label: 'Alto', tone: 'warn' };
    case 'atherogenicIndex':
      if (value <= 4) return { label: 'Normal', tone: 'good' };
      if (value <= 6) return { label: 'Alto', tone: 'warn' };
      return { label: 'Muy alto', tone: 'bad' };
  }
}

/** Enfoque efectivo: el del perfil si existe; si no, se deduce de los exámenes. */
export function effectiveFocus(profile: Profile | null, labs: LabResults | null): HealthFocus {
  if (profile?.focus) return profile.focus;
  if (labs) {
    const cholHigh = labs.ldl >= 130 || labs.totalCholesterol >= 200;
    const trigHigh = labs.triglycerides >= 150;
    if (cholHigh && trigHigh) return 'ambos';
    if (cholHigh) return 'colesterol';
    if (trigHigh) return 'trigliceridos';
  }
  return 'general';
}

/** Prioridades derivadas de los exámenes (para elegir retos). */
export function labPriorities(labs: LabResults | null): { cholesterol: boolean; triglycerides: boolean } {
  return {
    cholesterol: labs !== null && (labs.ldl >= 130 || labs.totalCholesterol >= 200),
    triglycerides: labs !== null && labs.triglycerides >= 150,
  };
}

/** Tu punto de partida: examen del 23-jul-2026 (precargado la primera vez). */
export const SEED_LABS: LabResults = {
  date: '2026-07-23',
  totalCholesterol: 277,
  ldl: 211.9,
  hdl: 35.71,
  triglycerides: 203.5,
  vldl: 29.4,
  atherogenicIndex: 7.76,
};

/** Datos del examen usados para prellenar el perfil. */
export const PROFILE_HINTS = { age: 26, sex: 'hombre' as Sex };
