/* =========================================================
   MODULE : STATS CONTEXT
   RESPONSABILITÉ :
   - Récupérer les filtres UI (mois / type)
   - Normaliser les valeurs
   - Préparer les clés utiles (comparaisons)
   ========================================================= */

function getStatsContext(){

  const typeElement = document.getElementById("filterTypeStats");
  const monthElement = document.getElementById("filterMonthStats");

  // ✅ sécurité DOM
  if(!typeElement || !monthElement){
    console.error("❌ Elements filtre manquants");
    return null;
  }

  let type = typeElement.value;
  let monthValue = monthElement.value;

  if(!monthValue){
    monthValue = new Date().toISOString().slice(0,7);
    monthElement.value = monthValue;
  }

  const yearValue = monthValue.slice(0,4);

  return {
    type,
    monthValue,
    yearValue,

    isMonth: type === "month",
    isYear: type === "year",
    isMobileOrTablet: window.matchMedia("(max-width: 1024px)").matches,

    monthLabel: formatMonthLabel(monthValue),
    yearLabel: yearValue,

    prevMonthValue: getPreviousMonth(monthValue),
    prevYearValue: (Number(yearValue) - 1).toString(),
    lastYearMonthValue: getSameMonthLastYear(monthValue)
  };
}