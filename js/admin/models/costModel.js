/* ==========================================
   COST MODEL
   Gestion des calculs de coûts d'achat
========================================== */

// Historique des calculs
let costCalculations = JSON.parse(
    localStorage.getItem("costCalculations") || "[]"
);

/**
 * Sauvegarder dans localStorage
 */
function saveCostCalculations() {
    localStorage.setItem(
        "costCalculations",
        JSON.stringify(costCalculations)
    );
}

/**
 * Retourne tous les calculs
 */
function getCostCalculations() {
    return costCalculations;
}

/**
 * Ajouter un calcul
 */
function addCostCalculation(calculation) {
    costCalculations.push(calculation);
    saveCostCalculations();
}

/**
 * Supprimer un calcul
 */
function deleteCostCalculation(id) {
    costCalculations = costCalculations.filter(
        c => c.id !== id
    );

    saveCostCalculations();
}