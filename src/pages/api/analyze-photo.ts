import type { APIRoute } from 'astro';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

interface GeminiAnalysis {
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  satFat: number;
  fiber: number;
  sugar: number;
  serving: string;
  confidence: 'high' | 'medium' | 'low' | string;
}

const PROMPT = `Analiza la comida visible en esta imagen y devuelve un objeto JSON con estos campos EXACTOS (todos los valores nutricionales en gramos o kcal por la porción visible):
- name: nombre del plato o alimento principal, en español, máx 40 caracteres
- emoji: UN emoji que represente la comida (ej: "🍕")
- calories: kilocalorías totales estimadas del plato (número)
- protein: gramos de proteína (número)
- carbs: gramos de carbohidratos (número)
- fat: gramos de grasa total (número)
- satFat: gramos de grasa saturada estimada (número)
- fiber: gramos de fibra (número)
- sugar: gramos de azúcares (número)
- serving: descripción breve de la porción (ej: "1 plato (300 g)", "1 porción mediana")
- confidence: nivel de confianza: "high", "medium" o "low"

Responde ÚNICAMENTE con el JSON, sin texto adicional, sin markdown.`;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

async function callGemini(image: Blob, mimeType: string, apiKey: string): Promise<GeminiAnalysis> {
  const buffer = await image.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.2,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía de Gemini');

  let parsed: GeminiAnalysis;
  try {
    parsed = JSON.parse(text) as GeminiAnalysis;
  } catch {
    // extraer JSON del texto
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No se pudo parsear la respuesta');
    parsed = JSON.parse(match[0]) as GeminiAnalysis;
  }
  return parsed;
}

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** POST /api/analyze-photo  multipart/form-data con campo "image" */
export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY as string | undefined;
  if (!apiKey) return json({ error: 'no-api-key', message: 'Falta GEMINI_API_KEY en el servidor.' }, 503);

  let image: File | null = null;
  try {
    const form = await request.formData();
    image = form.get('image') as File | null;
  } catch {
    return json({ error: 'bad-form' }, 400);
  }
  if (!image || !image.size) return json({ error: 'no-image' }, 400);
  if (!image.type.startsWith('image/')) return json({ error: 'not-image' }, 400);
  if (image.size > 8 * 1024 * 1024) return json({ error: 'too-big', message: 'La imagen supera 8 MB.' }, 413);

  try {
    const raw = await callGemini(image, image.type || 'image/jpeg', apiKey);
    const result: GeminiAnalysis = {
      name: String(raw.name || 'Alimento detectado').slice(0, 50),
      emoji: String(raw.emoji || '🍽️').slice(0, 8),
      calories: Math.round(num(raw.calories)),
      protein: Math.round(num(raw.protein) * 10) / 10,
      carbs: Math.round(num(raw.carbs) * 10) / 10,
      fat: Math.round(num(raw.fat) * 10) / 10,
      satFat: Math.round(num(raw.satFat) * 10) / 10,
      fiber: Math.round(num(raw.fiber) * 10) / 10,
      sugar: Math.round(num(raw.sugar) * 10) / 10,
      serving: String(raw.serving || '1 porción').slice(0, 60),
      confidence: String(raw.confidence || 'medium'),
    };
    return json({ ok: true, result });
  } catch (err) {
    return json({ error: 'gemini-failed', message: (err as Error).message }, 502);
  }
};