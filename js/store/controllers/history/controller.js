/* =========================================================
   MODULE : SALES ANALYTICS
   RESPONSABLE : Bachir BAH
   VERSION : 1.0
   ========================================================= */

/************************************************************
 * 📊 FILTRE ANALYSE PAR DATE (POINT D’ENTRÉE PRINCIPAL)
 * ----------------------------------------------------------
 * Rôle :
 * - Charger les données du jour sélectionné
 * - Calculer les statistiques (CA, catégories, top produits)
 * - Calculer la comparaison avec le dernier jour actif
 * - Router vers le rendu Desktop ou Mobile/Tablette
 *
 * Fonctions utilisées :
 * ✅ getSalesByDate()
 * ✅ computeSalesStats()
 * ✅ computeComparison()
 * ✅ renderMobileKPI()
 * ✅ renderDesktopFull()
 * ✅ formatDateFR()
 *
 * Sortie :
 * → Mise à jour de l’UI complète (KPI + tableaux)
 ************************************************************/

function filterSalesByDate(){

  const selectedDate = document.getElementById("filterDate").value;
  if(!selectedDate) return;

  const selectedCategory =
    document.getElementById("filterCategoryHistory")?.value || "all";

  const search =
    document.getElementById("searchInput")?.value.toLowerCase().trim() || "";

  // ✅ DATA
  const daySales = getSalesByDate(selectedDate);
  const stats = computeSalesStats(daySales, selectedCategory, search);
  const comparison = computeComparison(selectedDate, stats.totalCA);

  // ✅ SWITCH DEVICE
  const isMobileOrTablet = window.matchMedia("(max-width: 1200px)").matches;

  if (isMobileOrTablet) {

    // ✅ MOBILE + TABLETTE (VERSION COMPACTE)
    renderMobileKPI(stats, comparison, selectedDate)

  } else {

    // ✅ DESKTOP (VERSION COMPLETE RESTAURÉE ✅)
    renderDesktopFull(stats, comparison, selectedDate);

  }

  // ✅ HIDE LEGACY PARTS
  const detail = document.getElementById("salesDetail");
  if(detail) detail.style.display = "none";

  const detailProducts = document.getElementById("detailProducts");
  if(detailProducts) detailProducts.style.display = "none";
}