/************************************************************
 * Service-worker (POS OFFLINE READY)
 ************************************************************/
//const CACHE_NAME = "pos-cache-v5";
const CACHE_STATIC = "pos-static";   // assets statiques
const CACHE_DYNAMIC = "pos-dynamic"; // runtime cache

// ✅ liste adaptée à TON arbo
const ASSETS = [
  /*manifest*/
  "/",
  "/manifest.json",

  /* CSS */
  "/css/admin.css",
  "/css/home.css",
  "/css/index.css",
  "/css/login.css",
  "/css/mobile.css",
  "/css/mobileAdmin.css",
  "/css/style.css",

  /* JS GLOBAL */
  "/js/utils.js",
  "/js/config.js",

  /* JS login */
  "/js/login.js",
  "/js/home.js",

  /* JS ADMIN */
  "/js/admin/auth.js",
  "/js/admin/backup.js",
  "/js/admin/products.js",
  "/js/admin/stock.js",
  "/js/admin/ui.js",
  "/js/admin/pdf.js",
  "/js/admin/app.js",
  "/js/admin/mobileAdmin.js",

  /* JS STORE */
  "/js/store/articles.js",
  "/js/store/lowStock.js",
  "/js/store/sales.js",
  "/js/store/services/history/service.js",
  "/js/store/ui/history/view.js",
  "/js/store/controllers/history/controller.js",
  "/js/store/repository/stats/salesRepository.js",
  "/js/store/services/stats/service.js",
  "/js/store/ui/stats/view.js",
  "/js/store/controllers/stats/context.js",
  "/js/store/controllers/stats/controller.js",
  "/js/store/controllers/stats/statsController.js",
  "/js/store/exportCreditPDF.js",
  "/js/store/index.js",
  "/js/store/mobile.js",
  "/js/store/ticket.js"
];

// ✅ INSTALL → cache initial
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(async cache => {

      for (const url of ASSETS) {
        try {
          const res = await fetch(url);
          if (res.ok) await cache.put(url, res);
        } catch (e) {
          console.warn("❌ Skip cache:", url);
        }
      }

    })
  );

  self.skipWaiting();
});

// ✅ ACTIVATE → nettoyage cache
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => ![CACHE_STATIC, CACHE_DYNAMIC].includes(key))
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});


self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  const isHTML = event.request.headers.get("accept")?.includes("text/html");
  const isJS = url.pathname.endsWith(".js");
  const isCSS = url.pathname.endsWith(".css");
  const isImage = event.request.destination === "image";

  // ✅ HTML + JS + CSS → NETWORK FIRST
  if (isHTML || isJS || isCSS) {

    event.respondWith(
      fetch(event.request)
        .then(response => {

          const clone = response.clone();

          caches.open(CACHE_DYNAMIC).then(cache => {
            cache.put(event.request, clone);

            // ✅ 🔥 limiter le cache
            limitCache(CACHE_DYNAMIC, 50);
          });

          return response;

        })
        .catch(() => {
          return caches.match(event.request)
            .then(cached => {
              if (cached) return cached;
              return caches.match("/") || new Response("Offline");
            });
        })
    );

    return;
  }

  // ✅ IMAGES → CACHE FIRST
  if (isImage) {

    event.respondWith(
      caches.match(event.request)
        .then(cached => {

          if (cached) return cached;

          return fetch(event.request)
            .then(response => {

              const clone = response.clone();

              caches.open(CACHE_DYNAMIC).then(cache => {
                cache.put(event.request, clone);

                // ✅ 🔥 limiter le cache
                limitCache(CACHE_DYNAMIC, 100);
              });

              return response;

            })
            .catch(() => {
              return new Response("", {
                status: 404,
                statusText: "Image offline"
              });
            });

        })
    );

    return;
  }

  // ✅ DEFAULT
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response("Offline", {
        status: 503,
        statusText: "Offline"
      });
    })
  );

});

function limitCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(() => limitCache(cacheName, maxItems));
      }
    });
  });
}

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});





