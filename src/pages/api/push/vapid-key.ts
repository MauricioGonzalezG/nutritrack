import type { APIRoute } from 'astro';
import { getVapidPublicKey } from '../../../lib/push';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

/** GET /api/push/vapid-key → { key: string | null } */
export const GET: APIRoute = () => {
  return json({ key: getVapidPublicKey() });
};
