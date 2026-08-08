// Threasure Barber — Service Worker
const CACHE = 'threasure-v2';

// Recursos críticos que se cachean al instalar
const PRECACHE = [
  '/',
  '/reserva',
  '/app',
  '/mis-citas',
  '/manifest.json',
  '/manifest-admin.json',
  '/logo.png',
  '/qr-yape.jpeg',
  '/imagen8.png',
];

// Archivos pesados que dejamos pasar directo (no se cachean)
const NO_CACHE_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mp3', '.wav'];

const shouldSkip = (url) =>
  NO_CACHE_EXTENSIONS.some(ext => url.pathname.endsWith(ext));

// Instalar: precachea los recursos críticos y activa el SW nuevo sin esperar
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activar: limpia cachés viejos y toma el control de las pestañas abiertas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: red primero, caché como respaldo (excepto videos/audios)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Videos/audios: sin caché, directo a la red
  if (shouldSkip(url)) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Resto: intentar red, si falla usar caché
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// ── PUSH NOTIFICATIONS ──
// Recibe el push que manda nuestro backend (Vercel) y muestra la
// notificación del sistema (con su sonido nativo) aunque el navegador
// esté cerrado o la pestaña no esté abierta.
self.addEventListener('push', e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch {
    data = { title: 'Threasure Barber', body: e.data ? e.data.text() : '' };
  }

  const title = data.title || 'Threasure Barber';
  const options = {
    body: data.body || '',
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    tag: data.tag || undefined,
    data: { url: data.url || '/' },
    requireInteraction: !!data.requireInteraction,
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// Al hacer clic en la notificación, enfoca o abre la pestaña correspondiente.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || '/';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientsArr => {
      const existing = clientsArr.find(c => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});