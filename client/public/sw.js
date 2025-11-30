/* Simple Cache-First PWA service worker with network-fallback and update strategy */
const CACHE_NAME = 'atelier-cache-v2';

const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  // add your main bundles / css / fonts / icons here
  // These will be auto-cached by Vite build
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : null))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip API requests - let them go to the network
  if (url.pathname.startsWith('/api/')) {
    return; // Don't intercept API requests
  }
  
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Navigation requests -> network-first (so users get updates)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(resp => {
          // Optionally cache navigation responses
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resp.clone());
            return resp;
          });
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For other assets -> cache-first then network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // Avoid caching opaque responses (cross-origin) unless necessary
        if (!resp || resp.status !== 200 || resp.type === 'opaque') return resp;
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        return resp;
      }).catch(() => {
        // Optional: return a fallback image for image requests
        if (event.request.destination === 'image') return caches.match('/icons/web-app-manifest-192x192.png');
      });
    })
  );
});

