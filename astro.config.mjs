// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Las páginas se prerenderizan (estáticas) y las rutas /api/*
  // se ejecutan como funciones serverless en Vercel (prerender = false).
  adapter: vercel(),
});
