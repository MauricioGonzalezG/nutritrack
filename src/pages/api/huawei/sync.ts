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

  const [y, m, d] = dateStr.split('-').map(Number);
  // Rango amplio que cubre la zona horaria local del usuario (-12h a +12h)
  const localStart = new Date(y || new Date().getFullYear(), (m || 1) - 1, d || new Date().getDate(), 0, 0, 0, 0).getTime();
  const startTime = localStart - 12 * 3600 * 1000;
  const endTime = localStart + 36 * 3600 * 1000;

  let devices: string[] = [];
  try {
    const collectorsRes = await fetch(`https://health-api.cloud.huawei.com/healthkit/v1/dataCollectors`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (collectorsRes.ok) {
      const collectorsData = await collectorsRes.json();
      const list = collectorsData?.dataCollector || collectorsData?.dataCollectors || collectorsData?.data || [];
      if (Array.isArray(list)) {
        for (const col of list) {
          const devName = col.deviceInfo?.modelName || col.deviceInfo?.devName || col.collectorName || col.dataCollectorId || '';
          if (devName && !devices.includes(devName)) {
            devices.push(devName);
          }
        }
      }
    }
  } catch {
    /* opcional */
  }

  let activeCalories = 0;
  let steps = 0;
  let rawResponseInfo = '';

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
      const sampleSets = summaryData?.sampleSets || summaryData?.data || [];
      if (Array.isArray(sampleSets)) {
        for (const set of sampleSets) {
          const typeName = String(set.dataTypeName || set.dataType || '').toLowerCase();
          const points = set.samplePoints || set.sampleSet || set.data || [];
          for (const sample of points) {
            const firstVal = sample.value?.[0] || sample.value || {};
            const val = Number(firstVal.fpValue ?? firstVal.intVal ?? firstVal.val ?? 0);
            if (typeName.includes('calories') || typeName.includes('burnt')) {
              activeCalories += val;
            }
            if (typeName.includes('steps')) {
              steps += val;
            }
          }
        }
      }
    } else {
      rawResponseInfo = `HTTP ${summaryRes.status}: ${await summaryRes.text()}`;
    }
  } catch (err) {
    console.error('Error fetching Huawei Health summary:', err);
  }

  // Fallback con POST /sampleSets/read si el resumen vino en 0
  if (activeCalories === 0 && steps === 0) {
    try {
      const readRes = await fetch(`https://health-api.cloud.huawei.com/healthkit/v1/sampleSets/read`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sampleSet: [
            { dataTypeName: 'com.huawei.continuous.steps.delta', startTime, endTime },
            { dataTypeName: 'com.huawei.continuous.calories.burnt', startTime, endTime },
            { dataTypeName: 'com.huawei.continuous.steps.total', startTime, endTime },
          ],
        }),
      });
      if (readRes.ok) {
        const readData = await readRes.json();
        const groupList = readData?.group || readData?.sampleSets || [];
        if (Array.isArray(groupList)) {
          for (const g of groupList) {
            const sets = g.sampleSet || [g];
            for (const set of sets) {
              const typeName = String(set.dataTypeName || '').toLowerCase();
              for (const sample of set.samplePoints || []) {
                const firstVal = sample.value?.[0] || {};
                const val = Number(firstVal.fpValue ?? firstVal.intVal ?? 0);
                if (typeName.includes('calories') || typeName.includes('burnt')) activeCalories += val;
                if (typeName.includes('steps')) steps += val;
              }
            }
          }
        }
      }
    } catch {
      /* opcional */
    }
  }

  const resultData = {
    date: dateStr,
    activeCalories: Math.round(activeCalories),
    steps: Math.round(steps),
    devices,
    rawResponseInfo,
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
