import type { APIRoute } from 'astro';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export interface GeminiItem {
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
}

export interface GeminiAnalysis extends GeminiItem {
  confidence: 'high' | 'medium' | 'low' | string;
  items: GeminiItem[];
}

const PROMPT = `Analiza la comida o alimento descrito o visible en la imagen. Identifica si hay uno o varios alimentos por separado (ej: si hay un plato con arroz, pollo y ensalada, desglosa los componentes por separado).

Devuelve ÚNICAMENTE un objeto JSON sin formato markdown ni texto adicional con esta estructura:
{
  "items": [
    {
      "name": "nombre del alimento individual en español, máx 35 caracteres",
      "emoji": "UN emoji relevante (ej: 🍚)",
      "calories": kilocalorías_estimadas_de_este_alimento,
      "protein": gramos_proteína,
      "carbs": gramos_carbohidratos,
      "fat": gramos_grasa,
      "satFat": gramos_grasa_saturada,
      "fiber": gramos_fibra,
      "sugar": gramos_azúcares,
      "serving": "descripción breve de porción (ej: 1 taza / 150g)"
    }
  ],
  "name": "nombre resumido del plato o comida completa",
  "emoji": "UN emoji general",
  "calories": kilocalorías_totales_del_plato,
  "protein": gramos_proteína_totales,
  "carbs": gramos_carbohidratos_totales,
  "fat": gramos_grasa_totales,
  "satFat": gramos_grasa_saturada_totales,
  "fiber": gramos_fibra_totales,
  "sugar": gramos_azúcares_totales,
  "serving": "1 porción / plato completo",
  "confidence": "high" | "medium" | "low"
}

Si la entrada contiene un solo alimento o producto, la lista "items" debe contener ese único alimento.`;

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

async function callGemini(
  image: Blob | null,
  description: string,
  mimeType: string,
  apiKey: string
): Promise<any> {
  let promptText = PROMPT;
  if (description.trim()) {
    promptText += `\n\nDESCRIPCIÓN O NOTAS DEL USUARIO SOBRE LA COMIDA:\n"${description.trim()}"`;
  }
  if (!image) {
    promptText += `\n\nNota: No se adjuntó imagen. Basa la estimación nutricional ÚNICAMENTE en la descripción en texto del usuario.`;
  }

  const parts: any[] = [{ text: promptText }];

  if (image && image.size > 0) {
    const buffer = await image.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
  }

  const body = {
    contents: [{ parts }],
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

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No se pudo parsear la respuesta de Gemini');
    return JSON.parse(match[0]);
  }
}

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** POST /api/analyze-photo  multipart/form-data con campo "image" (opcional) y "description" (opcional) */
export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY as string | undefined;
  if (!apiKey) return json({ error: 'no-api-key', message: 'Falta GEMINI_API_KEY en el servidor.' }, 503);

  let image: File | null = null;
  let description = '';
  try {
    const form = await request.formData();
    image = form.get('image') as File | null;
    description = String(form.get('description') || '');
  } catch {
    return json({ error: 'bad-form' }, 400);
  }

  const hasImage = Boolean(image && image.size > 0);
  const hasDesc = Boolean(description.trim().length > 0);

  if (!hasImage && !hasDesc) {
    return json({ error: 'no-input', message: 'Escribe una descripción de la comida o selecciona una foto.' }, 400);
  }

  if (hasImage && !image!.type.startsWith('image/')) {
    return json({ error: 'not-image' }, 400);
  }
  if (hasImage && image!.size > 8 * 1024 * 1024) {
    return json({ error: 'too-big', message: 'La imagen supera 8 MB.' }, 413);
  }

  try {
    const raw = await callGemini(hasImage ? image : null, description, image?.type || 'image/jpeg', apiKey);

    const cleanItem = (item: any): GeminiItem => ({
      name: String(item?.name || 'Alimento').slice(0, 50),
      emoji: String(item?.emoji || '🍽️').slice(0, 8),
      calories: Math.round(num(item?.calories)),
      protein: Math.round(num(item?.protein) * 10) / 10,
      carbs: Math.round(num(item?.carbs) * 10) / 10,
      fat: Math.round(num(item?.fat) * 10) / 10,
      satFat: Math.round(num(item?.satFat) * 10) / 10,
      fiber: Math.round(num(item?.fiber) * 10) / 10,
      sugar: Math.round(num(item?.sugar) * 10) / 10,
      serving: String(item?.serving || '1 porción').slice(0, 60),
    });

    const totalSummary = cleanItem(raw);
    const rawItems: any[] = Array.isArray(raw?.items) && raw.items.length > 0 ? raw.items : [raw];
    const items: GeminiItem[] = rawItems.map(cleanItem);

    const result: GeminiAnalysis = {
      ...totalSummary,
      confidence: String(raw?.confidence || 'medium'),
      items,
    };

    return json({ ok: true, result });
  } catch (err) {
    return json({ error: 'gemini-failed', message: (err as Error).message }, 502);
  }
};