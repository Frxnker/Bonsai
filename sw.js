// Service worker: guarda los archivos de la app para que funcione sin conexión.
// Estrategia: responde al instante con la copia guardada y, en segundo plano,
// descarga la versión nueva para la próxima vez que abras la app.

const CACHE = 'racha-v6';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  const fromNetwork = fetch(request);

  // Actualiza la copia guardada con lo que llegue de internet.
  event.waitUntil(
    fromNetwork
      .then((response) => {
        if (!response.ok || response.redirected) return;
        const copy = response.clone();
        return caches.open(CACHE).then((cache) => cache.put(request, copy));
      })
      .catch(() => {})
  );

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => cached || fromNetwork.catch(() => (
      request.mode === 'navigate' ? caches.match('./index.html') : Response.error()
    )))
  );
});
