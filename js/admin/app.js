/************************************************************
 * 🚀 POINT D’ENTRÉE GLOBAL
 ************************************************************/
document.addEventListener("DOMContentLoaded", initApp);


async function initApp() {
  console.log("🚀 App démarrée");

  // ✅ Sécurité
  if (!initAuth())
    return;

  //FORCER LA CREATION DU MAGASIN AUX ADMINS SANS MAGAISN
  const role = localStorage.getItem("userRole");

  if (role === "admin") {

    const hasShop = await hasShopAssigned();

    if (!hasShop) {

      showToast("🏪 Créez votre premier magasin");

      lockAppUntilStoreCreated();
      showStoreInfo();

      return;
    }
  }

  try {
    await loadCurrentShop();

  } catch (error) {
    console.warn("⚠️ Shop non chargée (offline)");

  }

  // ✅ Vérifier compte actif
  let ok = true;
  try {
    ok = await initCurrentUserContext();

  } catch (error) {
    console.warn("⚠️ Contexte utilisateur indisponible (offline)");

  }

  if (!ok) return;

  initServiceWorker();

  // ✅ Init data
  await initProducts();


  // Init mvt stock
  await initStockMovements();

  // Synchronisation en arrière-plan
  //syncProducts().catch(console.error);
  //syncStockMovements().catch(console.error);
  syncProfiles().catch(console.error);

  await syncProducts();
  await syncStockMovements();

  window.addEventListener("online", handleOnlineSync);

  // ✅ UI
  updateUserInfo();
  updateLastActivity();
  updateUserUI();

  // ✅ Init composants
  initImageInput();
  initPDFDate();

  // ✅ Lancer affichage
  render();
}

let syncInProgress = false;

async function handleOnlineSync() {

  if (syncInProgress) {
    return;
  }

  syncInProgress = true;

  try {

    console.log("🌐 Connexion rétablie");

    showToast("🌐 Synchronisation en cours...");

    await syncProducts();

    await syncStockMovements();

    await syncProfiles();

    if (
      typeof syncShops === "function"
    ) {
      await syncShops();
    }

    showToast(
      "✅ Synchronisation terminée"
    );

  } catch (error) {

    console.error(
      "Erreur synchronisation", error);

  } finally {

    syncInProgress = false;

  }

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

        console.log("✅ SW enregistré");

        // ✅ détection nouvelle version
        if (reg.waiting) {
          console.log("♻️ Nouvelle version disponible");
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // ✅ nouveau SW installé
        reg.addEventListener("updatefound", () => {
          console.log("🔄 Mise à jour SW détectée");
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
 * 🧠 VARIABLES GLOBALES
************************************************************/
let shopWindow = null; // ✅ référence fenêtre boutique

/************************************************************
 * 🛒 NAVIGATION
************************************************************/

function goToShop() {
  window.location.href = "/";
}


function clearSearch() {
  const input = document.getElementById("searchInput");
  input.value = "";
  render();
}


/************************************************************
 * 🔐 SESSION
************************************************************/
/************************************************************
 * ⏱️ TIMERS / ACTIVITÉ
 ************************************************************/

// 🔁 check session
setInterval(checkSessionTimeout, 5000);

const SESSION_Timeout = 60 * 60 * 1000;// 1 heure
const WARNING_TIME =
  SESSION_Timeout - (5 * 60 * 1000);


// 📌 activité utilisateur
//document.addEventListener("click", updateLastActivity);
//document.addEventListener("keypress", updateLastActivity);

// 💾 rappel backup
//setInterval(checkBackupReminder, 10 * 60 * 1000);

//ECOUTER LES ACTIONS UTILISATEUR
[
  "click",
  // "mousemove",
  "keydown",
  //"scroll",
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

  const inactiveTime = Date.now() - lastActivity;

  if (
    inactiveTime >= WARNING_TIME &&
    inactiveTime < SESSION_Timeout
  ) {

    showToast("⚠️ Votre session va expirer bientôt");

  }
  if (inactiveTime >= SESSION_Timeout) {

    forceLogout();
  }

}

//FORCER LA DECONNEXION
function forceLogout() {

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");

  window.location.href = "login";
}


/************************************************************
 * 📄 PAGINATION ADMIN
************************************************************/

function renderPagination(totalItems) {

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const container = document.getElementById("pagination");

  container.innerHTML = "";

  // ✅ bouton précédent
  const prevBtn = document.createElement("button");
  prevBtn.innerText = "⬅️";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    changePage(currentPage - 1);

    // ✅ SCROLL CORRIGÉ
    document.getElementById("tableCard").scrollIntoView({
      behavior: "smooth"
    });
  };
  container.appendChild(prevBtn);

  // ✅ pages
  for (let i = 1; i <= totalPages; i++) {

    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPage) {
      btn.style.background = "#2ecc71";
      btn.style.fontWeight = "bold";
    }

    btn.onclick = () => {
      changePage(i);

      // ✅ SCROLL CORRIGÉ
      document.getElementById("tableCard").scrollIntoView({
        behavior: "smooth"
      });
    };

    container.appendChild(btn);
  }

  // ✅ bouton suivant
  const nextBtn = document.createElement("button");
  nextBtn.innerText = "➡️";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    changePage(currentPage + 1);

    // ✅ SCROLL CORRIGÉ
    document.getElementById("tableCard").scrollIntoView({
      behavior: "smooth"
    });
  };
  container.appendChild(nextBtn);
}


function changePage(page) {
  currentPage = page;
  render();
}



/************************************************************
 * 🧩 SECTIONS ADMIN
 ************************************************************/

function showAdminSection(section) {

  const form = document.getElementById("formSection");
  const importBox = document.getElementById("importSection");

  if (!form || !importBox) {
    console.error("❌ Sections non trouvées");
    return;
  }

  // ✅ cacher toutes les sections
  form.style.display = "none";
  importBox.style.display = "none";

  // ✅ afficher la bonne section
  if (section === "form") {
    hideAllSectionsForms();
    form.style.display = "block";
    // ✅ scroll vers formulaire
    form.scrollIntoView({ behavior: "smooth" });

    document.getElementById("pdfContainer").style.display = "none";
    document.getElementById("infoShop").style.display = "none";
    document.getElementById("costSection").style.display = "none";
  }

  if (section === "import") {

    hideAllSectionsForms();

    importBox.style.display = "block";

    // ✅ cacher la date PDF
    document.getElementById("pdfContainer").style.display = "none";


    // ✅ attacher l'event file input (une seule fois proprement)
    const input = document.getElementById("fileInput");

    if (input && !input.dataset.listenerAttached) {

      input.addEventListener("change", function () {
        const fileName = this.files[0]?.name || "Aucun fichier sélectionné";
        document.getElementById("fileName").textContent = fileName;
      });

      // ✅ éviter double event (très important)
      input.dataset.listenerAttached = "true";
    }
  }

  // ✅ gérer bouton actif
  document.querySelectorAll(".menu button")
    .forEach(btn => btn.classList.remove("active"));

  const activeBtn = document.querySelector(
    `.menu button[onclick="showAdminSection('${section}')"]`
  );

  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

/************************************************************
 * LA vue paramètres
 ************************************************************/
function showSettings() {

  // ✅ cacher parties principales
  hideAllSections();

  // ✅ afficher paramètres
  document.getElementById("settingsCard").style.display = "block";

  // ✅ reset header
  document.getElementById("archivedHeader").style.display = "none";

}

/************************************************************
 * CACHE LES SECTIONS
 ************************************************************/
function hideAllSections() {
  const ids = [
    "tableCard",
    "formSection",
    "importSection",
    "settingsCard",
    "historyCard",
    "searchContainer",
    "pdfContainer"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

/************************************************************
 * 🖼️ INPUT IMAGE
 ************************************************************/
function initImageInput() {
  const input = document.getElementById("image");
  const fileNameDisplay = document.getElementById("fileName");

  if (!input || !fileNameDisplay) return;

  input.addEventListener("change", function () {
    fileNameDisplay.textContent = this.files.length > 0
      ? this.files[0].name
      : "Aucune image sélectionnée";
  });
}


/************************************************************
 * 📅 PDF DATE
 ************************************************************/
function initPDFDate() {
  const pdfInput = document.getElementById("pdfDate");
  if (pdfInput) {
    pdfInput.value = new Date().toISOString().split("T")[0];
  }
}


/************************************************************
 * 🔄 SYNCHRO TABS (localStorage)
 ************************************************************/
window.addEventListener("storage", function (event) {

  if (event.key === "products" || event.key === "products_updated_at") {
    products = JSON.parse(localStorage.getItem("products") || "[]");
    render();
  }

  if (event.key === "sales") {
    render();
  }
});


/************************************************************
 * 📡 SYNCHRO AVANCÉE (BroadcastChannel)
 ************************************************************/
const channel = new BroadcastChannel("app_sync");

channel.onmessage = (event) => {
  if (event.data === "products_updated") {
    products = JSON.parse(localStorage.getItem("products") || "[]");
    render();
  }
};


/************************************************************
 * FUNCTION : GESTION AFFICHAGE MENU DEROULANT DESKTOP
 ************************************************************/
function toggleGestionMenu(event) {
  event.stopPropagation();

  const menu = document.getElementById("gestionMenu");

  menu.classList.toggle("show");
}

function closeGestionMenu() {
  document.getElementById("gestionMenu")
    ?.classList.remove("show");
}

// Fermer au clic à l'extérieur
document.addEventListener("click", closeGestionMenu);

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
