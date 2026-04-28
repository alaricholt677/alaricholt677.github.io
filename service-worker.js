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

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Return cached response if available
      if (response) {
        return response;
      }
      
      // Try to fetch from network
      return fetch(event.request).catch(error => {
        // Silently fail for network errors (CORS, offline, etc)
        console.warn("Fetch failed for:", event.request.url, error);
        // Return offline placeholder or cached response
        return caches.match("/index.html");
      });
    })
  );
});
