import type { APIRoute } from 'astro';

export const prerender = false;

/** GET /api/huawei/login?u=CODE -> Redirige a la autorización OAuth 2.0 de Huawei */
export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const u = url.searchParams.get('u') || '';

  const clientId = import.meta.env.HUAWEI_CLIENT_ID as string | undefined;
  const redirectUri =
    (import.meta.env.HUAWEI_REDIRECT_URI as string | undefined) || `${url.origin}/api/huawei/callback`;

  if (!clientId) {
    return new Response(
      JSON.stringify({
        error: 'huawei-not-configured',
        message: 'HUAWEI_CLIENT_ID no está configurado en las variables de entorno.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const scopes = [
    'https://www.huawei.com/healthkit/calories.read',
    'https://www.huawei.com/healthkit/activity.read',
    'https://www.huawei.com/healthkit/weight.read',
  ].join(' ');

  const authUrl = new URL('https://oauth-login.cloud.huawei.com/oauth2/v3/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('state', JSON.stringify({ u }));

  return redirect(authUrl.toString(), 302);
};
