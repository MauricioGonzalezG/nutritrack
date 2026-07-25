// NutriTrack — Service Worker
// Maneja notificaciones de recordatorio (desayuno / almuerzo / cena).

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
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

/** Mensajes desde la app: programar (o cancelar) recordatorios. */
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
          /* permiso revocado o SW detenido: ignorar silenciosamente */
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
