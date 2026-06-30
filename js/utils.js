/************************************************************
 * 🧠 MODULE : UTILITAIRES
 * ==========================================================
 * 🎯 RESPONSABILITÉS :
 * - Formatage des prix et nombres
 * - Formatage des dates
 * - Calculs KPI (évolution, pourcentage)
 * - Gestion des périodes (mois N, N-1, N-12)
 * - Fonctions génériques réutilisables
 *
 * 🔹 Format :
 * - formatPrice()              → format prix UI (FR)
 * - formatPricePDF()           → format prix PDF (arrondi)
 * - formatDate()               → format date FR
 *
 * 🔹 KPI / Couleurs :
 * - getPercentColor()          → couleur selon %
 * - getEvolution()             → évolution %
 *
 * 🔹 Dates :
 * - formatMonthLabel()         → mois lisible (Juin 2026)
 * - getPreviousMonth()         → mois N-1
 * - getSameMonthLastYear()     → mois N-12
 *
 * 🔹 Analyse :
 * - getTopProductsWithTie()    → top produits avec égalités
 *
 ************************************************************/
 
 function getPaymentSplit(sale){

  const saleTotal = sale.payment?.total || sale.total || 0;

  let totalPaid = 0;

  if(sale.payment?.type === "credit"){
    const payments = sale.payment.payments || [];
    totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  } else {
    totalPaid = saleTotal;
  }

  return {
    encaisse: totalPaid,
    credit: saleTotal - totalPaid
  };
}
 
 /************************************************************
 * 💰 FORMAT PRIX (UI)
 * ----------------------------------------------------------
 * - format français
 * - 2 décimales
 * - remplace virgule par point
 ************************************************************/
function formatPrice(value){
  return Number(value)
    .toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    .replace(",", "."); // ✅ remplace la virgule par un point
}

/************************************************************
 * 💰 FORMAT PRIX (PDF)
 * ----------------------------------------------------------
 * - arrondi
 * - séparateur milliers espace
 ************************************************************/
function formatPricePDF(value){
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/************************************************************
 * 📅 FORMAT DATE
 * ----------------------------------------------------------
 * - convertit en format FR lisible
 ************************************************************/
function formatDate(date){

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatDateFR(date){
  const d = new Date(date);

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

/************************************************************
 * 🎨 COULEUR SELON POURCENTAGE
 * ----------------------------------------------------------
 * - vert : >= 40%
 * - orange : >= 20%
 * - rouge : < 5%
 ************************************************************/
function getPercentColor(percent){

  percent = Number(percent);

  if(percent >= 40) return "#27ae60"; // ✅ fort (vert)
  if(percent >= 20) return "#f39c12"; // ✅ moyen (orange)
  if(percent < 5) return "#e74c3c";   // ✅ faible (rouge)

  return "black"; // ✅ normal
} 

/************************************************************
 * 📅 FORMAT MOIS LISIBLE
 * ----------------------------------------------------------
 * Exemple : "2026-06" → "juin 2026"
 ************************************************************/
function formatMonthLabel(monthValue){
  if(!monthValue) return "";

  const [year, month] = monthValue.split("-");

  const date = new Date(year, month - 1);

  return date.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric"
  });
}

/************************************************************
 * ⬅️ MOIS PRÉCÉDENT
 * ----------------------------------------------------------
 * Exemple : "2026-06" → "2026-05"
 ************************************************************/
function getPreviousMonth(monthValue){
  const [year, month] = monthValue.split("-").map(Number);

  const date = new Date(year, month - 1);
  date.setMonth(date.getMonth() - 1);

  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2,"0");

  return `${y}-${m}`;
}

/************************************************************
 * 📈 CALCUL ÉVOLUTION (%)
 * ----------------------------------------------------------
 * - retourne variation entre deux valeurs
************************************************************/
function getEvolution(current, prev){
  if(!prev) return "0%";

  const diff = ((current - prev) / prev) * 100;
  return diff.toFixed(1) + "%";
}


/************************************************************
 * 📅 MÊME MOIS ANNÉE PRÉCÉDENTE
 * ----------------------------------------------------------
 * Exemple : "2026-06" → "2025-06"
 ************************************************************/
function getSameMonthLastYear(monthValue){
  const [year, month] = monthValue.split("-");
  return `${Number(year) - 1}-${month}`;
}

/************************************************************
 * 🏆 TOP PRODUITS AVEC ÉGALITÉ
 * ----------------------------------------------------------
 * - retourne top N produits
 * - inclut égalités sur dernière position
************************************************************/
function getTopProductsWithTie(stats, limit = 3){

  const sorted = Object.entries(stats)
    .sort((a,b) => b[1] - a[1]);

  if(sorted.length === 0) return [];

  const result = [];
  let rankValue = null;

  for(let i = 0; i < sorted.length; i++){

    const [name, qty] = sorted[i];

    if(i < limit){
      result.push([name, qty]);
      rankValue = qty;
    } 
    else if(qty === rankValue){
      // ✅ inclure égalité
      result.push([name, qty]);
    } 
    else {
      break;
    }
  }

  return result;
}

function formatDateISO(date){

  if(!date) return "-";

  const d = new Date(date);

  if(isNaN(d)) return "-";

  return d.toISOString().split("T")[0]; // ✅ YYYY-MM-DD
}

function calcDiff(current, previous){

  if (!previous || previous === 0) {
    return "—";
  }

  const diff = ((current - previous) / previous) * 100;

  const formatted = diff.toFixed(1);

  return diff > 0 
    ? `+${formatted}%` 
    : `${formatted}%`;
}


function colorDiff(value){

  if (value === "—") return "gray";

  return value.startsWith("-") ? "red" : "green";
}