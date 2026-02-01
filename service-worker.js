self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("win12-cache").then(cache => {
      return cache.addAll([
        "/index.html",
        "/win12-icon.svg",
        "/search.svg",
        "/news/news.json"
      ]);
    })
  );
});

// Cache big images only when they are requested
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Only cache images inside /news/img/
        if (event.request.url.includes("/news/img/")) {
          caches.open("win12-cache").then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });

      return cached || fetchPromise;
    })
  );
});
