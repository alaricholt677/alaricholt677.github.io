self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("win12-cache").then(cache => {
      return cache.addAll([
        "/index.html",
        "/win12-icon.svg",
        "/search.svg",

        // News system files
        "/news/news.json",
        "/news/img/eos.jpg",
        "/news/img/win12-issues.jpg"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

