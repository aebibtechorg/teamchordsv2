const CACHE_VERSION = 'v3';
const SHELL_CACHE = `teamchords-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `teamchords-runtime-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/service-worker.js',
  '/favicon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
];

const isSameOrigin = (requestUrl) => requestUrl.origin === self.location.origin;

const cacheResponse = async (cacheName, request, response) => {
  if (!response || !response.ok) {
    return response;
  }

  const cache = await caches.open(cacheName);
  cache.put(request, response.clone());
  return response;
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_SHELL_URLS);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => ![SHELL_CACHE, RUNTIME_CACHE].includes(name))
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !isSameOrigin(new URL(request.url))) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        return await cacheResponse(RUNTIME_CACHE, request, response);
      } catch {
        const cached = await caches.match('/index.html');
        return cached || caches.match('/');
      }
    })());
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);
        return await cacheResponse(RUNTIME_CACHE, request, response);
      } catch {
        return cached;
      }
    })());
  }
});
