/************************************************************
 * 🚀 CONTROLLER GLOBAL (UI + NAV)
 ************************************************************/

document.addEventListener("DOMContentLoaded", async () => {

  initServiceWorker();

  const ok = await initCurrentUserContext();

  if (!ok) return;

  initApp();

  window.addEventListener("online", handleOnlineSync);

  updateUserUI();

});

/************************************************************
 * 📡 SYNCHRO AVANCÉE (écoute Realtime)
 ************************************************************/

function startProductsRealtime() {

  const channel = supabaseClient

    .channel("products-realtime")

    // Produits
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products"
      },
      async (payload) => {

        try {

          //console.log("📦 Produit reçu via Realtime", payload);

          if (!payload.new) {
            return;
          }

          const updatedProduct = mapProduct(payload.new);

          //console.log("Produit mappé :", updatedProduct);

          // Mise à jour IndexedDB
          await db.products.put(updatedProduct);

          //console.log("✅ Produit enregistré dans IndexedDB");

          // Vérification
          const saved = await db.products.get(updatedProduct.id);

          //console.log("✅ Vérification IndexedDB :", saved);

          // Rechargement depuis IndexedDB
          //products = await loadProducts();
          const index =
            products.findIndex(
              p => p.id === updatedProduct.id
            );

          if (index !== -1) {

            products[index] = updatedProduct;

          } else {

            products.unshift(updatedProduct);

          }

          refreshShopProducts();

          renderLowStock();

          updateCartBadge()

        } catch (error) {

          console.error("Erreur realtime produit", error);

        }

      }
    )

    // Mouvements de stock
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "stock_movements"
      },

      async (payload) => {

        try {

          //console.log("📦 Mouvement reçu via Realtime :", payload);

          if (!payload.new) {
            return;
          }

          //Mise à jour IndexedDB
          await db.stockMovements.put(payload.new);

          const index = stockMovements.findIndex(
            m => m.id === payload.new.id
          );

          if (index !== -1) {

            stockMovements[index] = payload.new;

          } else {

            stockMovements.unshift(payload.new);

          }

          //console.log("✅ Mouvement enregistré dans IndexedDB", payload.new.id);
          //console.log("✅ Nombre total de mouvements :", stockMovements.length);

          refreshShopProducts();

          renderLowStock();

          updateCartBadge();

        } catch (error) {

          console.error("Erreur realtime mouvement", error);

        }

      }
    )
    // Ventes
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sales"
      },

      async (payload) => {

        try {

          //console.log("🛒 Vente reçue via Realtime :", payload);

          if (!payload.new) {
            return;
          }

          const updatedSale =
            mapSale(payload.new);

          // Mise à jour IndexedDB
          await db.sales.put(updatedSale);

          const index = sales.findIndex(
            s => s.id === updatedSale.id
          );

          if (index !== -1) {

            sales[index] =
              updatedSale;

          } else {

            sales.unshift(updatedSale);

          }

          //console.log("✅ Vente enregistrée dans IndexedDB", updatedSale.id);

          //console.log("✅ Nombre total de ventes :", sales.length);

          // Rafraîchissement UI
          renderDashboard();

          renderSalesByDay();

          filterSalesByDate();

          renderStatsTables();

          renderCreditDashboard();

        } catch (error) {

          console.error(
            "❌ Erreur realtime vente", error);

        }

      }
    )

    .subscribe((status) => {

      if (status === "CHANNEL_ERROR") {
        console.error(
          "Erreur Realtime"
        );
      }

    });

  return channel;
}

document.addEventListener("DOMContentLoaded", async () => {

  products = await loadProducts();

  stockMovements = await loadStockMovements();

  sales = await loadSales();

  //console.log("✅ Ventes chargées :", sales.length);

  await refreshShopProducts();

  renderLowStock();

  updateCartBadge();

  startProductsRealtime();

});



function startAutoSyncProducts() {

  setInterval(async () => {

    try {

      const isAllowed = localStorage.getItem("isLoggedIn") === "true";

      if (!isAllowed) {
        return;
      }

      await syncProducts();

    } catch (error) {

      console.error(
        "Erreur synchronisation produits",
        error
      );

    }

  }, 30000); // 30 secondes

}


async function initApp() {
  showSection("products");
  startAutoSyncProducts();

  // Init vente
  await initSales();

}

/************************************************************
 * INIT SERVICE WORKER
 ***********************************************************/
function initServiceWorker() {

  if (!("serviceWorker" in navigator)) {
    console.warn("❌ Service Worker non supporté");
    return;
  }

  window.addEventListener("load", () => {

    navigator.serviceWorker.register("/service-worker.js")
      .then(reg => {

        //console.log("✅ SW enregistré");

        // ✅ détection nouvelle version
        if (reg.waiting) {
          //console.log("♻️ Nouvelle version disponible");
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // ✅ nouveau SW installé
        reg.addEventListener("updatefound", () => {
          //console.log("🔄 Mise à jour SW détectée");
        });

      })
      .catch(err => {
        console.error("❌ SW ERROR", err);
      });

    // ✅ reload automatique quand SW change
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("✅ Nouveau SW actif");
    });

  });

}

/************************************************************
 * 🔐 SESSION
************************************************************/
// 🔁 check session
setInterval(checkSessionTimeout, 5000);

const SESSION_Timeout = 60 * 60 * 1000;// 1 heure
const WARNING_TIME =
  SESSION_Timeout - (5 * 60 * 1000);


//ECOUTER LES ACTIONS UTILISATEUR
[
  "click",
  //"mousemove",
  "keydown",
  // "scroll",
  "touchstart"
].forEach(event => {

  document.addEventListener(
    event,
    updateLastActivity,
    { passive: true }
  );

});

function checkSessionTimeout() {

  const lastActivity = Number(
    localStorage.getItem("lastActivity")
  );

  if (!lastActivity) return;

  const inactiveTime =
    Date.now() - lastActivity;

  if (
    inactiveTime >= WARNING_TIME &&
    inactiveTime < SESSION_Timeout
  ) {

    showToast(
      "⚠️ Votre session va expirer bientôt"
    );

  }

  if (inactiveTime >= SESSION_Timeout) {


    forceLogout();

  }

}

//FORCER LA DECONNEXION
async function forceLogout() {

  // Déconnexion Supabase
  await supabaseClient.auth.signOut();

  // Vider IndexedDB
  await Promise.all(
    db.tables.map(table =>
      table.clear()
    )
  );
  // Vider LocalStorage
  localStorage.clear();
  // Vider SessionStorage
  sessionStorage.clear();

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");

  window.location.href = "login.html";
}
/************************************************************
 * 🎮 NAVIGATION
 ***********************************************************/

function goToAdmin() {
  window.location.href = "admin";
}


async function showSection(section, options = {}) {

  // ✅ 1. RESET + ACTIVE FIX
  document.querySelectorAll(".menu button")
    .forEach(btn => btn.classList.remove("active"));

  document.querySelectorAll("#cartBtnMobile").forEach(btn => {
    btn.classList.remove("active");
  });


  const activeBtn = document.querySelector(
    `.menu button[data-section="${section}"]`
  );

  if (activeBtn) {
    activeBtn.classList.add("active");
  }

  // ✅ 2. MASQUER TOUTES LES SECTIONS
  const sections = [
    "productsSection",
    "cartSection",
    "todaySection",
    "historySection",
    "chartsSection",
    "lowStockSection",
    "creditSection",
    "ticketsSection"
  ];

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // ✅ 3. LOGIQUE METIER

  if (section === "products") {

    promoMode = false;
    showPromoOnly = options.promo || false;

    document.getElementById("productsSection").style.display = "block";

    currentPage = 1;
    //renderProducts();
    await refreshShopProducts();
  }

  if (section === "cart") {
    document.getElementById("cartSection").style.display = "block";

    const btn = document.getElementById("cartBtnMobile");
    if (btn) {
      btn.classList.add("active");
    }
    //Toujours rerendre le panier
    renderCartMobile();

  }

  if (section === "today") {
    document.getElementById("todaySection").style.display = "block";

    currentPageToday = 1;
    renderDashboard();
  }

  if (section === "history") {

    document.getElementById("historySection").style.display = "block";

    currentPageHistory = 1;
    currentPageDetail = 1;

    const input = document.getElementById("filterDate");
    input.type = "date";

    const today = new Date().toISOString().split("T")[0];
    input.value = today;

    renderSalesByDay();
    populateCategoriesHistory();

    document.getElementById("detailSection").style.display = "none";
  }

  if (section === "charts") {
    document.getElementById("chartsSection").style.display = "block";

    initStatsFilter();
    renderStatsTables();
  }

  if (section === "lowStock") {
    document.getElementById("lowStockSection").style.display = "block";
    renderLowStock();
  }

  if (section === "credit") {
    document.getElementById("creditSection").style.display = "block";
    renderCreditDashboard();
  }

  if (section === "tickets") {

    const el = document.getElementById("ticketsSection");
    if (el)
      el.style.display = "block";

    // ✅ reset pagination
    ticketPage = 1;

    // ✅ render
    renderTickets();
  }
  setActiveMobileMenu(section);
  // ✅ FIX FINAL PANIER ACTIF
  if (section === "cart") {
    const btn = document.getElementById("cartBtnMobile");
    if (btn)
      btn.classList.add("active");
  }

}

async function globalSearch() {

  const activeBtn = document.querySelector(".menu button.active");

  if (!activeBtn) {
    //renderProducts();
    await refreshShopProducts();
    return;
  }

  const section = activeBtn.dataset.section;

  // ✅ PRODUITS
  if (section === "products") {
    currentPage = 1;
    await refreshShopProducts();
    //renderProducts();
  }

  // ✅ VENTES JOUR
  if (section === "today") {
    currentPageToday = 1;
    renderDashboard();
  }

  // ✅ HISTORIQUE
  if (section === "history") {
    currentPageHistory = 1;
    renderSalesByDay();

    document.getElementById("detailSection").style.display = "none";
  }

  // ✅ STOCK FAIBLE
  if (section === "lowStock") {
    renderLowStock();
  }

  // ✅ CREDIT (bonus UX)
  if (section === "credit") {
    renderCreditDashboard();
  }
}


/************************************************************
 * 🔐 USER
 ************************************************************/


async function logout() {

  if (!confirm("Voulez-vous vous déconnecter ?")) return;

  //Déconnexion Supabase
  await supabaseClient.auth.signOut();

  // Vider IndexedDB
  await Promise.all(db.tables.map(table => table.clear()));

  // Vider LocalStorage
  localStorage.clear();
  // Vider SessionStorage
  sessionStorage.clear();

  localStorage.removeItem("userRole");
  localStorage.removeItem("lastActivity");
  localStorage.removeItem("isLoggedIn");

  window.location.href = "login.html";
  //window.location.href = "index.html";
}

function updateUserInfo() {

  const role = localStorage.getItem("userRole");
  const label = document.getElementById("userInfo");

  if (!label) return;

  if (role === "admin") {
    label.innerText = "👑 Admin";
    label.style.color = "#2c3e50";
  } else {
    label.innerText = "🛒 Vendeur";
    label.style.color = "#27ae60";
  }
}

function switchUser() {

  if (!confirm("Voulez-vous changer de compte ?")) return;

  localStorage.removeItem("userRole");
  localStorage.removeItem("lastActivity");

  window.location.href = "login";
}

function updateUserUI() {

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("userRole");

  // ✅ HEADER
  const userEl = document.getElementById("userInfo");

  if (userEl) {

    if (role === "admin") {
      userEl.innerText = "👑 Admin";
    } else if (role === "vendeur") {
      userEl.innerText = "🛒 Vendeur";
    } else if (username) {
      userEl.innerText = `👤 ${username}`;
    } else {
      userEl.innerText = "👤 Utilisateur";
    }
  }

  // ✅ FOOTER USER
  const footerUser = document.getElementById("footerUser");

  if (footerUser) {
    footerUser.innerText = username || "Utilisateur";
  }

  // ✅ FOOTER DATE
  const footerDate = document.getElementById("footerDate");

  if (footerDate) {
    footerDate.innerText = formatDateFR(new Date());
  }

  // ✅ FOOTER YEAR
  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.innerText = new Date().getFullYear();
  }
}


/************************************************************
 * Gestion de rôle
 ************************************************************/

document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("userRole");

  if (role === "vendeur") {

    document.querySelectorAll(".btnHistory").forEach(el => {
      el.style.display = "none";
    });

    document.querySelectorAll(".btnStats").forEach(el => {
      el.style.display = "none";
    });

    document.querySelectorAll(".btnAdmin").forEach(el => {
      el.style.display = "none";
    });

  }

});

let syncInProgress = false;

async function handleOnlineSync() {

  if (syncInProgress) {
    return;
  }

  syncInProgress = true;

  try {

    //console.log("🌐 Connexion rétablie");

    showToast("🌐 Synchronisation en cours...");

    await syncProducts();

    await syncStockMovements();

    await syncProfiles();

    await syncSales();

    if (
      typeof syncShops === "function"
    ) {
      await syncShops();
    }

    showToast(
      "✅ Synchronisation terminée"
    );

  } catch (error) {

    console.error("Erreur synchronisation", error);

  } finally {

    syncInProgress = false;

  }

}

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState === "hidden"
    ) {

      localStorage.setItem(
        "lastBackgroundTime",
        Date.now()
      );

    }

    if (
      document.visibilityState === "visible"
    ) {

      const lastTime =
        Number(
          localStorage.getItem(
            "lastBackgroundTime"
          )
        );

      const inactiveTime =
        Date.now() - lastTime;

      if (
        inactiveTime >= SESSION_Timeout
      ) {

        forceLogout();

      }

    }

  }
);



























