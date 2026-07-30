import type { APIRoute } from 'astro';
import { ensureSchema, getDb } from '../../../lib/db';

export const prerender = false;

/** GET /api/huawei/callback?code=...&state=... */
export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state');

  let u = '';
  if (rawState) {
    try {
      const decoded = decodeURIComponent(rawState);
      if (decoded.startsWith('{')) {
        const parsed = JSON.parse(decoded);
        u = parsed.u || '';
      } else {
        u = decoded === 'default' ? '' : decoded;
      }
    } catch {
      u = rawState === 'default' ? '' : rawState;
    }
  }


  const huaweiErr = url.searchParams.get('error');
  if (huaweiErr) {
    const desc = url.searchParams.get('error_description') || huaweiErr;
    return redirect(`/?huawei_error=${encodeURIComponent(desc)}`, 302);
  }

  if (!code) {
    return redirect(`/?huawei_error=no_code`, 302);
  }

  const clientId = (import.meta.env.HUAWEI_CLIENT_ID as string | undefined)?.trim();
  const clientSecret = (import.meta.env.HUAWEI_CLIENT_SECRET as string | undefined)?.trim();
  const redirectUri =
    (import.meta.env.HUAWEI_REDIRECT_URI as string | undefined)?.trim() || `${url.origin}/api/huawei/callback`;


  if (!clientId || !clientSecret) {
    return redirect(`/?huawei_error=missing_credentials`, 302);
  }

  try {
    const params = new URLSearchParams();
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);
    params.set('redirect_uri', redirectUri);

    const tokenRes = await fetch('https://oauth-login.cloud.huawei.com/oauth2/v3/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Huawei Token error:', errText);
      return redirect(`/?huawei_error=token_exchange_failed`, 302);
    }

    const tokens = await tokenRes.json();

    const db = getDb();
    if (db && u) {
      await ensureSchema(db);
      const value = JSON.stringify({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
        linkedAt: new Date().toISOString(),
      });
      await db.execute({
        sql: 'INSERT INTO user_data (user_code, key, value) VALUES (?, ?, ?) ON CONFLICT (user_code, key) DO UPDATE SET value = excluded.value',
        args: [u, 'huaweiTokens', value],
      });
    }

    return redirect(`/?huawei=connected`, 302);
  } catch (err) {
    console.error('Huawei callback exception:', err);
    return redirect(`/?huawei_error=exception`, 302);
  }
};
