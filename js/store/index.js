
/************************************************************
 * 🚀 CONTROLLER GLOBAL (UI + NAV)
 ************************************************************/


document.addEventListener("DOMContentLoaded", () => {
  //updateUserInfo();
  initServiceWorker();
  initApp();
  updateUserUI();
});


function initApp(){
  showSection("products");

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
 * 🎮 NAVIGATION
 ***********************************************************/
 
 function goToAdmin(){
  window.location.href = "admin.html";
}


function showSection(section, options = {}){

  // ✅ 1. RESET + ACTIVE FIX
  document.querySelectorAll(".menu button")
  .forEach(btn => btn.classList.remove("active"));

  document.querySelectorAll("#cartBtnMobile").forEach(btn => {
      btn.classList.remove("active");
  });


  const activeBtn = document.querySelector(
    `.menu button[data-section="${section}"]`
  );

  if(activeBtn){
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
    if(el) el.style.display = "none";
  });

  // ✅ 3. LOGIQUE METIER

  if(section === "products"){

    promoMode = false;
    showPromoOnly = options.promo || false;

    document.getElementById("productsSection").style.display = "block";

    currentPage = 1;
    renderProducts();
  }

  if(section === "cart"){
    document.getElementById("cartSection").style.display = "block";
    
    const btn = document.getElementById("cartBtnMobile");
    if (btn) btn.classList.add("active");

  }

  if(section === "today"){
    document.getElementById("todaySection").style.display = "block";

    currentPageToday = 1;
    renderDashboard();
  }

  if(section === "history"){

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

  if(section === "charts"){
    document.getElementById("chartsSection").style.display = "block";

    initStatsFilter();
    renderStatsTables();
  }

  if(section === "lowStock"){
    document.getElementById("lowStockSection").style.display = "block";
    renderLowStock();
  }

  if(section === "credit"){
    document.getElementById("creditSection").style.display = "block";
    renderCreditDashboard();
  }
  
  if(section === "tickets"){

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

function globalSearch(){

  const activeBtn = document.querySelector(".menu button.active");

  if(!activeBtn){
    renderProducts();
    return;
  }

  const section = activeBtn.dataset.section;

  // ✅ PRODUITS
  if(section === "products"){
    currentPage = 1;
    renderProducts();
  }

  // ✅ VENTES JOUR
  if(section === "today"){
    currentPageToday = 1;
    renderDashboard();
  }

  // ✅ HISTORIQUE
  if(section === "history"){
    currentPageHistory = 1;
    renderSalesByDay();

    document.getElementById("detailSection").style.display = "none";
  }

  // ✅ STOCK FAIBLE
  if(section === "lowStock"){
    renderLowStock();
  }

  // ✅ CREDIT (bonus UX)
  if(section === "credit"){
    renderCreditDashboard();
  }
}


/************************************************************
 * 🔐 USER
 ************************************************************/


function logout(){

  if(!confirm("Voulez-vous vous déconnecter ?")) return;

  localStorage.removeItem("userRole");
  localStorage.removeItem("lastActivity");
  localStorage.removeItem("isLoggedIn");

  //window.location.href = "login.html";
   window.location.href = "home.html";
}

function updateUserInfo(){

  const role = localStorage.getItem("userRole");
  const label = document.getElementById("userInfo");

  if(!label) return;

  if(role === "admin"){
    label.innerText = "👑 Admin";
    label.style.color = "#2c3e50";
  } else {
    label.innerText = "🛒 Vendeur";
    label.style.color = "#27ae60";
  }
}

function switchUser(){

  if(!confirm("Voulez-vous changer de compte ?")) return;

  localStorage.removeItem("userRole");
  localStorage.removeItem("lastActivity");

  window.location.href = "login.html";
}

function updateUserUI(){

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

  if(footerUser){
    footerUser.innerText = username || "Utilisateur";
  }

  // ✅ FOOTER DATE
  const footerDate = document.getElementById("footerDate");

  if(footerDate){
    footerDate.innerText = formatDateFR(new Date());
  }

  // ✅ FOOTER YEAR
  const yearEl = document.getElementById("year");

  if(yearEl){
    yearEl.innerText = new Date().getFullYear();
  }
}

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
  user.role || "Utilisateur";*/


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



























