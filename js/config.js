/************************************************************
 * 🧠 VARIABLES GLOBALES
************************************************************/
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes en ms
const LOW_STOCK_THRESHOLD = 5; // ✅ seuil stock faible

let sales = JSON.parse(localStorage.getItem("sales") || "[]");
let cart = JSON.parse(localStorage.getItem("cart") || "[]");
let stockLogs = JSON.parse(localStorage.getItem("stockLogs") || "[]");

let currentPage = 1;
let currentPageDetail = 1;
let currentPageHistory = 1;
let currentPageToday = 1;
let currentPageHistoryStock = 1;

// 👉 nombre de produits par page
const itemsPerPage = 20; 
const itemsPerPageDetail = 20;
const itemsPerPageHistory = 20;
const itemsPerPageToday = 20;
const itemsPerPageHistoryStock = 20;


/* Fonction Générique pour responsive Mobile */
function renderResponsive(config){

  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  const tableBody = document.querySelector(config.tableSelector);
  const table = tableBody ? tableBody.closest("table") : null;
  const mobile = document.querySelector(config.mobileSelector);

  if(isMobile){
    if(table) table.style.display = "none";   // ✅ cache TABLE complet
    if(mobile) mobile.style.display = "flex";

    if(config.mobileRender){
      config.mobileRender();
    }

  }else{
    if(table) table.style.display = "table";  // ✅ réaffiche TABLE
    if(mobile) mobile.style.display = "none";

    if(config.desktopRender){
      config.desktopRender();
    }
  }
}

