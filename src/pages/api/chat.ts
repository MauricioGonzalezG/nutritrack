import type { APIRoute } from 'astro';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatContextPayload {
  profile?: any;
  labs?: any;
  goals?: any;
  metricsSummary?: any;
  recentEntries?: any[];
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return json({ error: 'Falta configurar la clave GEMINI_API_KEY en las variables de entorno.' }, 500);
  }

  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];
    const context: ChatContextPayload = body.context || {};

    if (!messages.length) {
      return json({ error: 'No se enviaron mensajes para el chat.' }, 400);
    }

    const systemPrompt = `Eres NutriBot 🥗🤖, un asistente de nutrición y salud altamente capacitado, empático y preventivo integrado en la app NutriTrack.

Tu misión es analizar la información del usuario (su perfil, exámenes de sangre, objetivos de calorías/macros, resumen del periodo evaluado y alimentos consumidos) para responder sus preguntas sobre su progreso, dar recomendaciones nutricionales concretas y proyectar mejoras en su salud cardiovascular y peso.

=== CONTEXTO DEL USUARIO EN NUTRITRACK ===
1. PERFIL FÍSICO:
${context.profile ? JSON.stringify(context.profile, null, 2) : 'Perfil no completado aún'}

2. EXÁMENES DE SANGRE (PERFIL LIPÍDICO):
${context.labs ? JSON.stringify(context.labs, null, 2) : 'No hay exámenes de sangre registrados aún'}

3. OBJETIVOS DIARIOS:
${context.goals ? JSON.stringify(context.goals, null, 2) : 'Metas por defecto (2000 kcal)'}

4. RESUMEN Y PROMEDIOS DEL PERIODO SELECCIONADO:
${context.metricsSummary ? JSON.stringify(context.metricsSummary, null, 2) : 'Sin métricas calculadas'}

5. ÚLTIMOS ALIMENTOS REGISTRADOS:
${context.recentEntries && context.recentEntries.length > 0 ? JSON.stringify(context.recentEntries.slice(0, 15), null, 2) : 'Sin registros recientes'}
==========================================

INSTRUCCIONES DE RESPUESTA:
- Responde siempre en español fluido, claro y motivador.
- Usa formato markdown limpio (negritas, listas con viñetas) y emojis acordes.
- Si el usuario pregunta por su proyección de mejora (ej: colesterol o peso), analiza sus niveles de grasa saturada, fibra y calorías actuales comparados con sus exámenes e indícale una estimación realista.
- Ofrece sugerencias prácticas de sustitución de alimentos (ej: preferir grasas saludables como aguacate/frutos secos vs grasas saturadas).
- Incluye un breve aviso de que tus respuestas son informativas/educativas y no reemplazan el diagnóstico de su médico tratante.
`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const role = msg.role === 'user' ? 'user' : 'model';
      let text = msg.content;

      if (i === 0 && role === 'user') {
        text = `${systemPrompt}\n\nCONSULTA INICIAL DEL USUARIO:\n${msg.content}`;
      }

      contents.push({
        role,
        parts: [{ text }],
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text().catch(() => '');
      throw new Error(`Gemini API Error ${res.status}: ${errTxt.slice(0, 200)}`);
    }

    const data = await res.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error('No se obtuvo respuesta de Gemini IA.');
    }

    return json({ answer: replyText });
  } catch (err: any) {
    console.error('[NutriTrack Chat Error]:', err);
    return json({ error: err.message || 'Error al conectar con la IA.' }, 500);
  }
};
