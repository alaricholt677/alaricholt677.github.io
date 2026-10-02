const CACHE_NAME = "win12-cache-v8";
​const PRECACHE_ASSETS = [
"/index.html",
"/win12.html",
"/win12-icon.svg",
"/search.svg",
"/news/news.json",
"/moreOS/Win11.html",
"/moreOS/Win12_New.html",
"/moreOS/Android_Sim.html",
"/moreOS/win98.html",
"/moreOS/PS5.html",
"/moreOS/",
"/PKGS/spudzy/spudzy.js",
"/PKGS/spudzy/",
"/PKGS/music-spud/spudzy-music-ai.js",
"/PKGS/music-spud/"
];
​// Install Event: Cache files individually so any network hiccup never freezes the app
self.addEventListener("install", event => {
event.waitUntil(
caches.open(CACHE_NAME).then(cache => {
return Promise.all(
PRECACHE_ASSETS.map(url => {
return cache.add(url).catch(error => {
console.warn("Skipping failed asset:", url, error);
});
})
);
})
);
self.skipWaiting();
});
​// Activate Event: Clean up old caches
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
​// Fetch Event: Serve from cache, or fetch from network and cache dynamically
self.addEventListener("fetch", event => {
if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) {
return;
}
​event.respondWith(
caches.match(event.request).then(cachedResponse => {
if (cachedResponse) {
return cachedResponse;
}
​return fetch(event.request)
.then(networkResponse => {
if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
return networkResponse;
}
​const responseToCache = networkResponse.clone();
caches.open(CACHE_NAME).then(cache => {
cache.put(event.request, responseToCache);
});
​return networkResponse;
})
.catch(error => {
console.warn("Fetch failed:", event.request.url, error);
if (event.request.mode === "navigate") {
return caches.match("/index.html");
}
});
})
);
});
