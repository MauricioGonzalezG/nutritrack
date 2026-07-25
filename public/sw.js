// NutriTrack — Service Worker
// Maneja notificaciones de recordatorio (desayuno / almuerzo / cena) enviadas
// vía Web Push desde el backend. Al hacer click, enfoca la app y abre la comida.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/** Push desde el servidor: muestra la notificación con los datos del payload. */
self.addEventListener('push', (event) => {
  let payload = { title: 'NutriTrack', body: 'Tienes un recordatorio', meal: '' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: `nutritrack-${payload.meal || 'r'}-${Math.floor(Date.now() / 60000)}`,
    data: { meal: payload.meal, ts: Date.now() },
    requireInteraction: false,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

/** Al hacer click en una notificación: enfocar la app y abrir la comida correspondiente. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const meal = event.notification.data?.meal ?? '';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            client.postMessage({ type: 'open-meal', meal });
            return;
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow('/');
      }),
  );
});

/** Compatibilidad: mensajes directos desde la app (programación local por setTimeout). */
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'schedule') {
    const { id, delay, title, body, meal, tag, icon } = data;
    if (typeof delay !== 'number' || delay <= 0) return;
    setTimeout(() => {
      self.registration
        .showNotification(title ?? 'NutriTrack', {
          body: body ?? '',
          icon: icon ?? '/icon.svg',
          badge: '/icon.svg',
          tag: `nutritrack-${tag ?? id ?? 'r'}`,
          data: { meal, ts: Date.now() },
          requireInteraction: false,
        })
        .catch(() => {
          /* permiso revocado o SW detenido */
        });
    }, delay);
  }

  if (data.type === 'cancel-all') {
    self.registration
      .getNotifications({ tag: /^nutritrack-/ })
      .then((notifications) => notifications.forEach((n) => n.close()))
      .catch(() => {});
  }
});
