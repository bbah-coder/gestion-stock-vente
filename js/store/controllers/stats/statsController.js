/************************************************************
 * ⚙️ INITIALISATION FILTRE STATS
 * ----------------------------------------------------------
 * - récupère filtres stockés (localStorage)
 * - initialise mois courant par défaut
 ************************************************************/
function initStatsFilter(){

  const input = document.getElementById("filterMonthStats");
  const select = document.getElementById("filterTypeStats");

  const savedMonth = localStorage.getItem("statsMonth");
  const savedType = localStorage.getItem("statsType");

  // ✅ TYPE (month par défaut)
  if(savedType){
    select.value = savedType;
  } else {
    select.value = "month"; // ✅ IMPORTANT
  }

  // ✅ MOIS
  if(savedMonth){
    input.value = savedMonth;
  } else {
    const today = new Date().toISOString().slice(0,7);
    input.value = today;
  }
}

function bindStatsEvents(){

  const input = document.getElementById("filterMonthStats");
  const select = document.getElementById("filterTypeStats");

  input.addEventListener("change", () => {
    localStorage.setItem("statsMonth", input.value);
    renderStatsTables(); // ✅ refresh
  });

  select.addEventListener("change", () => {
    localStorage.setItem("statsType", select.value);
    renderStatsTables(); // ✅ refresh
  });
}