import type { APIRoute } from 'astro';
import { ensureSchema, getDb } from '../../../lib/db';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

interface HuaweiTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  linkedAt: string;
}

async function refreshHuaweiToken(
  tokens: HuaweiTokens,
  userCode: string,
  db: ReturnType<typeof getDb>
): Promise<string | null> {
  const clientId = import.meta.env.HUAWEI_CLIENT_ID as string | undefined;
  const clientSecret = import.meta.env.HUAWEI_CLIENT_SECRET as string | undefined;
  if (!clientId || !clientSecret || !tokens.refreshToken) return null;

  try {
    const params = new URLSearchParams();
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', tokens.refreshToken);
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);

    const res = await fetch('https://oauth-login.cloud.huawei.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const newAccessToken = data.access_token as string;
    const newExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    const updatedTokens: HuaweiTokens = {
      ...tokens,
      accessToken: newAccessToken,
      expiresAt: newExpiresAt,
    };

    if (db) {
      await db.execute({
        sql: 'INSERT INTO user_data (user_code, key, value) VALUES (?, ?, ?) ON CONFLICT (user_code, key) DO UPDATE SET value = excluded.value',
        args: [userCode, 'huaweiTokens', JSON.stringify(updatedTokens)],
      });
    }

    return newAccessToken;
  } catch {
    return null;
  }
}

/** POST /api/huawei/sync?u=CODE  body: { date?: 'YYYY-MM-DD' } */
export const POST: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const u = url.searchParams.get('u') || '';
  if (!u) return json({ error: 'missing-user' }, 400);

  let body: { date?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* opcional */
  }

  const dateStr = body.date || new Date().toISOString().slice(0, 10);

  const db = getDb();
  if (!db) {
    return json({ error: 'db-not-configured', message: 'Modo local sin base de datos' }, 503);
  }

  await ensureSchema(db);
  const tokenRs = await db.execute({
    sql: 'SELECT value FROM user_data WHERE user_code = ? AND key = ?',
    args: [u, 'huaweiTokens'],
  });

  if (tokenRs.rows.length === 0) {
    return json({ error: 'not-connected', message: 'Huawei Health no está vinculado' }, 404);
  }

  let tokens: HuaweiTokens;
  try {
    tokens = JSON.parse(tokenRs.rows[0].value as string);
  } catch {
    return json({ error: 'corrupt-tokens' }, 500);
  }

  let accessToken = tokens.accessToken;
  if (Date.now() >= tokens.expiresAt - 60000) {
    const refreshed = await refreshHuaweiToken(tokens, u, db);
    if (!refreshed) {
      return json({ error: 'token-expired', message: 'El token expiró y no se pudo renovar' }, 401);
    }
    accessToken = refreshed;
  }

  const startTime = new Date(`${dateStr}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${dateStr}T23:59:59.999Z`).getTime();

  let activeCalories = 0;
  let steps = 0;

  try {
    const summaryRes = await fetch(
      `https://health-api.cloud.huawei.com/healthkit/v1/sampleSet:dailySummary?startTime=${startTime}&endTime=${endTime}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (summaryRes.ok) {
      const summaryData = await summaryRes.json();
      if (summaryData && Array.isArray(summaryData.sampleSets)) {
        for (const set of summaryData.sampleSets) {
          if (
            set.dataTypeName === 'com.huawei.continuous.calories.burnt' ||
            set.dataTypeName === 'com.huawei.instantaneous.calories.bmm'
          ) {
            for (const sample of set.samplePoints || []) {
              activeCalories += Number(sample.value?.[0]?.fpValue || sample.value?.[0]?.intVal || 0);
            }
          }
          if (set.dataTypeName === 'com.huawei.continuous.steps.delta') {
            for (const sample of set.samplePoints || []) {
              steps += Number(sample.value?.[0]?.intVal || sample.value?.[0]?.fpValue || 0);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching Huawei Health summary:', err);
  }

  const resultData = {
    date: dateStr,
    activeCalories: Math.round(activeCalories),
    steps: Math.round(steps),
    lastSyncedAt: new Date().toISOString(),
  };

  const dataRs = await db.execute({
    sql: 'SELECT value FROM user_data WHERE user_code = ? AND key = ?',
    args: [u, 'huaweiData'],
  });

  let currentMap: Record<string, unknown> = {};
  if (dataRs.rows.length > 0) {
    try {
      currentMap = JSON.parse(dataRs.rows[0].value as string);
    } catch {
      currentMap = {};
    }
  }

  currentMap[dateStr] = resultData;

  await db.execute({
    sql: 'INSERT INTO user_data (user_code, key, value) VALUES (?, ?, ?) ON CONFLICT (user_code, key) DO UPDATE SET value = excluded.value',
    args: [u, 'huaweiData', JSON.stringify(currentMap)],
  });

  return json({ ok: true, data: resultData, huaweiData: currentMap });
};
