/* =========================================================
   MODULE : STATS CONTROLLER
   RESPONSABILITÉ :
   - Orchestrer le flux des statistiques
   - Gérer UI globale
   - Appeler service (compute)
   - Router mobile/desktop
   - Conserver comportement existant
   ========================================================= */

function renderStatsTables(){

  // ✅ RESET
  const clear = (id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  };

  clear("kpiYearComparison");
  clear("kpiMonthComparison");
  clear("kpiMonthYearComparison");
  clear("kpiMonthSummary");


  // ✅ contexte
  const context = getStatsContext();
  if (!context) {
    console.error("❌ context undefined");
    return;
  }

  const sales = getSales();
  const stats = computeStatsData(sales, context);

  renderGlobalKPI(stats, context);

  const monthCompare = document.getElementById("kpiMonthComparison");
  const yearCompare = document.getElementById("kpiMonthYearComparison");

  const blockMonth = document.getElementById("blockMonth");
  const blockYear = document.getElementById("blockYear");

  const blockCategoryMonth = document.getElementById("blockCategoryMonth");
  const blockCategoryYear = document.getElementById("blockCategoryYear");


  /* =========================
     MODE UNIQUE
  ========================= */
  if (context.isMobileOrTablet){
    
     //AFFICHAGE MOBILE
      renderStatsMobile(stats, context);
  }
  else {

  if (context.isMonth) {
   
    // ✅ Comparaisons
    renderStatsComparisonTable(stats, context);
    renderComparisonMonthTable(stats, context);

    // ✅ KPI
    renderSummaryTable(stats, context);

    // ✅ Catégories
    renderCategoryTable(stats, context);

    // ✅ AFFICHAGE
    if(monthCompare) monthCompare.style.display = "";
    if(yearCompare) yearCompare.style.display = "";

    if(blockMonth) blockMonth.style.display = "";
    if(blockYear) blockYear.style.display = "none";

    // ✅ ✅ IMPORTANT → CATÉGORIES
    if(blockCategoryMonth) blockCategoryMonth.style.display = "";
    if(blockCategoryYear) blockCategoryYear.style.display = "none";


  } else if (context.isYear) {

    // ✅ Comparaison année
    renderStatsComparisonTable(stats, context);

    // ✅ KPI
    renderSummaryTable(stats, context);

    // ✅ Catégories
    renderCategoryTable(stats, context);

    // ✅ AFFICHAGE
    if(monthCompare) monthCompare.style.display = "none";
    if(yearCompare) yearCompare.style.display = "";

    if(blockMonth) blockMonth.style.display = "none";
    if(blockYear) blockYear.style.display = "";

    // ✅ ✅ IMPORTANT → CATÉGORIES
    if (blockCategoryMonth)
        blockCategoryMonth.style.display = "none";
    if (blockCategoryYear)
        blockCategoryYear.style.display = "";

    }

    /* =========================
    HIDE LEGACY BLOCS (FIX FINAL)
    ========================= */

    // ❌ anciens tableaux (toujours vides maintenant)
    if (blockMonth)
        blockMonth.style.display = "none";
    if (blockYear)
       blockYear.style.display = "none";
     
    renderTopProducts(stats, context);
     
  }

}





