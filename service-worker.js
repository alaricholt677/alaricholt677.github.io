
const CACHE_NAME = "win12-cache-v6";

// All specified files and directories to pre-cache immediately
const PRECACHE_ASSETS = [
  "/index.html",
  "/win12.html",
  "/win12-icon.svg",
  "/search.svg",
  "/news/news.json",
  "/moreOS/win11.html",
  "/moreOS/Win12.html",
  "/moreOS/android_sim.html",
  "/moreOS/win98.html",
  "/moreOS/PS5.html",
  "/moreOS/",
  "/PKGS/spudzy/spudzy.js",
  "/PKGS/spudzy/",
  "/PKGS/music-spud/spudzy-music-ai.js",
  "/PKGS/music-spud/"
];

// Install Event: Cache core files right away
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up old caches when updating
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Serve from cache, or fetch from network and cache dynamically
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(error => {
          console.warn("Fetch failed, serving offline fallback:", event.request.url, error);
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});
