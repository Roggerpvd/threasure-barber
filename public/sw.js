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