/*
 * St. Kizito Admin — minimal service worker.
 *
 * Goals: make the app installable and resilient offline WITHOUT ever serving stale parish data.
 *  - Navigations: network-first, fall back to the cached /offline page when the network is down.
 *  - Static assets (css/js/fonts/images): cache-first (they are content-hashed / immutable).
 *  - API / Supabase / anything else: passthrough (never cached) so admins always see live data.
 */
const CACHE = 'kizito-admin-v1';
const OFFLINE_URL = '/offline';
const STATIC_RE = /\.(?:css|js|mjs|woff2?|ttf|png|svg|jpg|jpeg|webp|avif|ico)$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin (Supabase etc.)

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
