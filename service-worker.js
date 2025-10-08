const CACHE_NAME = "0810250700"; // ✅ Increment this on each update
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/tvshows.html",
  "/tvplayer.html",
  "/testplay.html",
  "/player.html",
  "/recommended_movies.json",
  "/tvshows.json",
  "/icons/favicon.ico",
  "/icons/favicon-16x16.png",
  "/icons/favicon-32x32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",  
  "/manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css",
  "https://cdn.jsdelivr.net/npm/hls.js@latest",
  "https://cdnjs.cloudflare.com/ajax/libs/Swiper/8.4.7/swiper-bundle.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/Swiper/8.4.7/swiper-bundle.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1"
];

// ✅ Install event — pre-cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching assets...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // activate immediately
});

// ✅ Activate event — clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ✅ Improved Fetch event — handle all requests properly
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // For streaming/dynamic content - fetch directly without caching
  if (request.url.includes("/preview/") || request.url.includes(".m3u8") || request.url.includes("/stream/")) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return a fallback response if streaming fails
        return new Response("Stream unavailable", { status: 503 });
      })
    );
    return;
  }

  // For static assets - use cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[Service Worker] Serving from cache:", request.url);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      console.log("[Service Worker] Fetching from network:", request.url);
      return fetch(request).then((networkResponse) => {
        // Don't cache if it's not a successful response
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Cache the response for next time (only for GET requests from same origin)
        if (request.method === "GET" && url.origin === self.location.origin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(() => {
        // If network fails, try to serve a cached fallback
        return caches.match("/") || new Response("Offline", { status: 503 });
      });
    })
  );
});

// ✅ Add message handler for manual cache updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "UPDATE_CACHE") {
    // Force update cache
    caches.delete(CACHE_NAME).then(() => {
      caches.open(CACHE_NAME).then((cache) => {
        cache.addAll(ASSETS_TO_CACHE);
      });
    });
  }
});