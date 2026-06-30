/************************************************************
 * 🚀 POINT D’ENTRÉE GLOBAL
 ************************************************************/
document.addEventListener("DOMContentLoaded", initApp);


function initApp() {
  console.log("🚀 App démarrée");
  
  // ✅ Sécurité
  if (!initAuth()) return;
  
  initServiceWorker();

  // ✅ Init data
  initProducts();

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

/************************************************************
 * INIT SERVICE WORKER
 ***********************************************************/
function initServiceWorker(){
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => console.log("✅ SW OK"))
      .catch(err => console.error("❌ SW ERROR", err));
  }
}


/************************************************************
 * 🧠 VARIABLES GLOBALES
************************************************************/
let shopWindow = null; // ✅ référence fenêtre boutique



/************************************************************
 * 🛒 NAVIGATION
************************************************************/

function goToShop(){
  window.location.href = "/";
}

/*function goToShop(){

  // ✅ si déjà ouverte → focus
  if(shopWindow && !shopWindow.closed){
    shopWindow.focus();
    return;
  }

  // ✅ sinon ouvrir
  shopWindow = window.open("index.html", "_blank");
}*/

function clearSearch(){
  const input = document.getElementById("searchInput");
  input.value = "";
  render();
}


/************************************************************
 * 🔐 SESSION
************************************************************/

function checkSessionTimeout(){

  const lastActivity = localStorage.getItem("lastActivity");
  if(!lastActivity) return;

  const now = Date.now();

  if(now - lastActivity > SESSION_TIMEOUT){

    // ✅ afficher message
    const msg = document.getElementById("sessionMessage");
    msg.style.display = "block";

    // ✅ attendre 1 seconde puis déconnecter
    setTimeout(() => {
      logout();
    }, 1000);
  }
}

/************************************************************
 * 📄 PAGINATION ADMIN
************************************************************/

function renderPagination(totalItems){

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
  for(let i = 1; i <= totalPages; i++){

    const btn = document.createElement("button");
    btn.innerText = i;

    if(i === currentPage){
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


function changePage(page){
  currentPage = page;
  render();
}



/************************************************************
 * 🧩 SECTIONS ADMIN
 ************************************************************/
 
function showAdminSection(section){

  const form = document.getElementById("formSection");
  const importBox = document.getElementById("importSection");

  if(!form || !importBox){
    console.error("❌ Sections non trouvées");
    return;
  }

  // ✅ cacher toutes les sections
  form.style.display = "none";
  importBox.style.display = "none";

  // ✅ afficher la bonne section
  if(section === "form"){
    form.style.display = "block";
    document.getElementById("pdfContainer").style.display = "none";
  }

 /* if(section === "import"){
    importBox.style.display = "block";
    document.getElementById("pdfContainer").style.display = "none";
  }*/
  
  if(section === "import"){
  
  importBox.style.display = "block";

  // ✅ cacher la date PDF
  document.getElementById("pdfContainer").style.display = "none";

  // ✅ attacher l'event file input (une seule fois proprement)
  const input = document.getElementById("fileInput");

  if(input && !input.dataset.listenerAttached){

    input.addEventListener("change", function(){
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

  if(activeBtn){
    activeBtn.classList.add("active");
  }
}


function showSettings(){

  // ✅ cacher parties principales
    hideAllSections();

  // ✅ afficher paramètres
  document.getElementById("settingsCard").style.display = "block";

  // ✅ reset header
  document.getElementById("archivedHeader").style.display = "none";
  
}

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
 * ⏱️ TIMERS / ACTIVITÉ
 ************************************************************/

// 🔁 check session
setInterval(checkSessionTimeout, 5000);

// 📌 activité utilisateur
document.addEventListener("click", updateLastActivity);
document.addEventListener("keypress", updateLastActivity);

// 💾 rappel backup
setInterval(checkBackupReminder, 10 * 60 * 1000);


/************************************************************
 * Footer 
 ************************************************************
document.getElementById("footerDate").innerText =
  formatDateFR(new Date());

document.getElementById("year").innerText =
  new Date().getFullYear();

// optionnel si tu gères les users
const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
document.getElementById("footerUser").innerText =
  user.role || "Utilisateur"; */

/************************************************************
 * Gestion de rôle
 ************************************************************/

/*document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("userRole");

  if(role === "vendeur"){

    const btnHistory = document.getElementById("btnHistory");
    const btnStats = document.getElementById("btnStats");

    if(btnHistory) btnHistory.style.display = "none";
    if(btnStats) btnStats.style.display = "none";
  }

});*/

document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("userRole");

  if(role === "vendeur"){

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
