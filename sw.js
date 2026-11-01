
const CACHE = 'cac-v3';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith('cac-') && key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  const esPagina =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/index.html');

  if (esPagina) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copia = response.clone();
            event.waitUntil(
              caches.open(CACHE).then(cache =>
                cache.put(event.request, copia)
              )
            );
          }
          return response;
        })
        .catch(async () => {
          return (
            await caches.match(event.request) ||
            await caches.match('./index.html') ||
            Response.error()
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (response.ok) {
          const copia = response.clone();
          event.waitUntil(
            caches.open(CACHE).then(cache =>
              cache.put(event.request, copia)
            )
          );
        }
        return response;
      });
    })
  );
});
