/************************************************************
 * Service-worker
 ************************************************************/
const CACHE_NAME = "pos-cache-v5";

// ✅ liste adaptée à TON arbo
const ASSETS = [
  "/",
  "/admin",
  "/home",
  "/login",

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


// ✅ INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("✅ Cache ready");
        return cache.addAll(ASSETS);
      })
  );
  self.skipWaiting();
});

// ✅ ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ✅ FETCH (offline + cache images automatique)
self.addEventListener("fetch", event => {

  // ✅ ignorer requêtes non GET (sécurité)
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(response => {

      // ✅ si en cache → servir
      if (response) return response;

      // ✅ sinon → requête réseau
      return fetch(event.request)
        .then(fetchRes => {

          // ✅ cache images automatiquement
          if (event.request.url.includes("/image/")) {
            const copy = fetchRes.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, copy);
            });
          }

          return fetchRes;
        })
        .catch(() => {
          // ✅ fallback uniquement HTML
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/");
          }
        });

    })
  );
});





