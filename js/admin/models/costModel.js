/* ==========================================
   COST MODEL
   Gestion des calculs de coûts d'achat
========================================== */

// Historique des calculs
let costCalculations = JSON.parse(
    localStorage.getItem("costCalculations") || "[]"
);

/*************************************************
 *FUNCTION :  Sauvegarder dans localStorage
 *************************************************/
function saveCostCalculations() {
    localStorage.setItem(
        "costCalculations",
        JSON.stringify(costCalculations)
    );
}

/*************************************************
 *FUNCTION :  Retourne tous les calculs
 *************************************************/
function getCostCalculations() {
    return costCalculations;
}

/*************************************************
 *FUNCTION :  Ajouter un calcul
 *************************************************/
function addCostCalculation(calculation) {
    costCalculations.push(calculation);
    saveCostCalculations();
}

/*************************************************
 *FUNCTION :  Supprimer un clacul
 *************************************************/
function deleteCostCalculation(id) {
    costCalculations = costCalculations.filter(
        c => c.id !== id
    );

    saveCostCalculations();
}