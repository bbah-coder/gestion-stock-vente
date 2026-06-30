/**
 * =========================================================
 * MODULE : SALES REPOSITORY
 * RESPONSABILITÉ :
 * - Accéder aux données de ventes (localStorage)
 * - Centraliser la logique de persistence
 * - Isoler le controller du stockage
 *
 * POURQUOI :
 * - Évite la duplication de JSON.parse partout
 * - Permet de changer la source (API, IndexedDB…) facilement
 * - Facilite les tests et la maintenance
 *
 * UTILISATION :
 * const sales = getSales();
 *
 * RETOUR :
 * - Tableau de ventes (Array)
 * =========================================================
 */
function getSales(){

  try {
    return JSON.parse(localStorage.getItem("sales") || "[]");
  } catch(e){
    console.error("❌ erreur parsing sales", e);
    return [];
  }
}

/**
 * =========================================================
 * SAUVEGARDE DES VENTES
 * =========================================================
 */
function saveSales(sales){

  try {
    localStorage.setItem("sales", JSON.stringify(sales || []));
  } catch(e){
    console.error("❌ erreur sauvegarde sales", e);
  }
}