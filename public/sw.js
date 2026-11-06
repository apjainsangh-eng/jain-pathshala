// Only job: show offline.html when a page can't load because the phone has no internet.
// Nothing else is cached, so new versions of the website (and Niyam Yatra under /niyam) always load fresh.
const CACHE = 'offline-v1';
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE, '/icon-192.png'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return (await event.preloadResponse) || (await fetch(request));
      } catch {
        return (await caches.match(OFFLINE)) || Response.error();
      }
    })());
  } else if (new URL(request.url).pathname === '/icon-192.png') {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
