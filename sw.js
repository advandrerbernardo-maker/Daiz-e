const CACHE = 'daize-v1';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest'
];

const CDNS = [
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
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
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith('daize-') &&
            key !== CACHE
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  const permitido =
    url.origin === self.location.origin ||
    CDNS.includes(url.hostname);

  if (!permitido) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE)
                .then(cache =>
                  cache.put('./index.html', copy)
                )
            );
          }
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();

          event.waitUntil(
            caches.open(CACHE)
              .then(cache =>
                cache.put(request, copy)
              )
          );
        }

        return response;
      });
    })
  );
});
