/* ==========================================
   COST CONTROLLER
   Gestion du calcul en cours
========================================== */

let currentCostCalculation = {
    date: new Date().toISOString(),

    allocationMethod: "value", // value ou quantity

    extraCosts: [],

    items: []
};

/*************************************************
 *FUNCTION :  Réinitialiser le calcul en cours
 *************************************************/
function resetCurrentCostCalculation() {

    currentCostCalculation = {
        date: new Date().toISOString(),

        extraCosts: [],

        items: []
    };
}

/*************************************************
 *FUNCTION :  Retourne le calcul en cours
 *************************************************/
function getCurrentCostCalculation() {
    return currentCostCalculation;
}

/*************************************************
 *FUNCTION :  Ajouter un frais annexe
 *************************************************/
function addExtraCost(label, amount) {

    currentCostCalculation.extraCosts.push({
        id: crypto.randomUUID(),
        label,
        amount: Number(amount) || 0
    });
}

/*************************************************
 *FUNCTION :  Ajouter un article au calcul
 *************************************************/
function addCostItem(
    productName,
    quantity,
    purchasePrice
) {

    const existingItem =
        currentCostCalculation.items.find(
            item =>
                item.productName.toLowerCase().trim() ===
                productName.toLowerCase().trim()
        );

    if (existingItem) {

        existingItem.quantity += Number(quantity);

        existingItem.purchasePrice =
            Number(purchasePrice);

        return true;
    }

    currentCostCalculation.items.push({

        productName,

        quantity: Number(quantity),

        purchasePrice: Number(purchasePrice)

    });

    return true;
}

/*************************************************
 *FUNCTION :  Supprimer un coût calculé
 *************************************************/
function removeCostItemByIndex(index) {

    currentCostCalculation.items.splice(
        index,
        1
    );

    renderCostItems();
}

/*************************************************
 *FUNCTION :  Supprimer un article
 *************************************************/
function removeCostItem(productId) {

    currentCostCalculation.items =
        currentCostCalculation.items.filter(
            item => item.productId != productId
        );
}

/*************************************************
 *FUNCTION :  Calcul du total des frais annexes
 *************************************************/
function getTotalExtraCosts() {

    return currentCostCalculation.extraCosts.reduce(
        (sum, cost) =>
            sum + Number(cost.amount || 0),
        0
    );
}

/*************************************************
 *FUNCTION :  Valeur totale d'achat
 *************************************************/
function getTotalPurchaseValue() {

    return currentCostCalculation.items.reduce(
        (sum, item) =>
            sum +
            (
                Number(item.quantity || 0) *
                Number(item.purchasePrice || 0)
            ),
        0
    );
}

/*************************************************
 *FUNCTION :  Calculer les coûts réels
 *     Répartition au prorata de la valeur d'achat
 *************************************************/
function calculateCurrentCosts() {

    const totalExtraCosts = getTotalExtraCosts();
    const totalPurchaseValue = getTotalPurchaseValue();

    if (totalPurchaseValue <= 0) {
        return [];
    }

    return currentCostCalculation.items.map(item => {

        const purchaseValue =
            Number(item.quantity) *
            Number(item.purchasePrice);

        const ratio =
            purchaseValue / totalPurchaseValue;

        // Part réelle des frais affectés à l'article
        const allocatedCost =
            totalExtraCosts * ratio;

        // Frais par unité
        const allocatedCostPerUnit =
            allocatedCost / Number(item.quantity);

        // Coût réel unitaire
        const realUnitCost =
            Number(item.purchasePrice) +
            allocatedCostPerUnit;

        return {
            ...item,

            purchaseValue,

            ratio: Number(ratio.toFixed(6)),

            allocatedCost,

            allocatedCostPerUnit,

            realUnitCost
        };

    });

}

/*************************************************
 *FUNCTION :  Calculer les coûts réels
 *     Répartition par quantité
 *************************************************/
function calculateCurrentCostsByQuantity() {

    const totalExtraCosts = getTotalExtraCosts();

    const totalQuantity =
        currentCostCalculation.items.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        );

    if (totalQuantity <= 0) {
        return [];
    }

    // coût annexe par unité
    const extraCostPerUnit =
        totalExtraCosts / totalQuantity;

    return currentCostCalculation.items.map(item => {

        const purchaseValue =
            Number(item.quantity) *
            Number(item.purchasePrice);

        const allocatedCost =
            Math.ceil(
                extraCostPerUnit *
                item.quantity
            );

        const allocatedCostPerUnit =
            Math.ceil(extraCostPerUnit);

        const realUnitCost =
            Math.ceil(
                Number(item.purchasePrice) +
                allocatedCostPerUnit
            );

        return {
            ...item,

            purchaseValue,

            allocatedCost,

            allocatedCostPerUnit,

            realUnitCost
        };
    });
}


/*************************************************
 *FUNCTION : Enregistrer le calcul actuel
 *************************************************/

function saveCurrentCalculation(method = "value", devise = "GNF") {

    let results = [];

    if (method === "quantity") {
        results = calculateCurrentCostsByQuantity();
    } else {
        results = calculateCurrentCosts();
    }

    if (!results.length) {
        console.warn("Aucun résultat à enregistrer");
        return false;
    }

    const calculation = {

        id: crypto.randomUUID(),

        date: new Date().toISOString(),

        allocationMethod: method,

        devise,

        transportCost: Number(
            document.getElementById(
                "transportCost"
            ).value || 0
        ),

        customsCost: Number(
            document.getElementById(
                "customsCost"
            ).value || 0
        ),

        otherCost: Number(
            document.getElementById(
                "otherCost"
            ).value || 0
        ),

        totalExtraCosts: getTotalExtraCosts(),

        totalPurchaseValue: getTotalPurchaseValue(),

        results

    };

    addCostCalculation(calculation);

    createStockMovementsFromCalculation(
        calculation
    );

    updateProductStockFromCalculation(
        calculation
    );

    console.log(
        "✅ Calcul enregistré",
        calculation
    );

    return true;
}

/*************************************************
 *FUNCTION : Retourne le dernier calcul
 *************************************************/
function getLastCalculation() {

    const calculations =
        getCostCalculations();

    if (!calculations.length) {
        return null;
    }

    return calculations[
        calculations.length - 1
    ];
}

/*************************************************
 *FUNCTION : Creer les mouvements de stock
 *************************************************/

function createStockMovementsFromCalculation(calculation) {

    if (!calculation?.results?.length) {
        return;
    }

    const username = localStorage.getItem("username") || "Système";

    const userRole = localStorage.getItem("userRole") || "Inconnu";

    const devise = document.getElementById("calculDevise")?.value || "GNF";

    calculation.results.forEach(item => {

        // recherche du produit
        const product = products.find(
            p => p.name === item.productName
        );

        if (!product) return;

        // mise à jour stock
        product.stock =
            Number(product.stock || 0) +
            Number(item.quantity);

        // compteur entrées
        product.entries ??= 0;
        product.entries += Number(item.quantity);

        // mouvement compatible avec l'existant
        stockMovements.unshift({

            product: item.productName,

            type: "entry",

            reason: "achat",

            quantity: Number(item.quantity),

            comment:
                `Calcul coût d'achat | ` +
                `PA: ${formatCurrency(item.purchasePrice, devise)} | ` +
                `Coût réel: ${formatCurrency(item.realUnitCost, devise)}`,

            user: username,

            role: userRole,

            date: new Date()
                .toLocaleString("fr-FR")

        });

    });

    localStorage.setItem(
        "products",
        JSON.stringify(products)
    );

    localStorage.setItem(
        "stockMovements",
        JSON.stringify(stockMovements)
    );

    render();
}
/* ==========================================
   METTRE A JOUR LE STOCK PRODUIT
========================================== */

/*************************************************
 *FUNCTION : Mettre à jour le stock produit
 *************************************************/

function updateProductStockFromCalculation(
    calculation
) {

    calculation.results.forEach(item => {

        const product = products.find(
            p =>
                p.name
                    .toLowerCase()
                    .trim() ===
                item.productName
                    .toLowerCase()
                    .trim()
        );

        if (!product) {

            console.warn(
                "Produit introuvable :",
                item.productName
            );

            return;
        }

        product.stock =
            Number(product.stock || 0) +
            Number(item.quantity);
    });

    saveProducts();
}

/*************************************************
 *FUNCTION : Importer les produits via Excel
 * Pour calculer les coûts d'achat
 *************************************************/
function importCostExcel(event) {

    const file =
        event.target.files[0];

    if (!file) return;

    const reader =
        new FileReader();

    reader.onload = function (e) {

        const data =
            new Uint8Array(
                e.target.result
            );

        const workbook =
            XLSX.read(
                data,
                { type: "array" }
            );

        const sheetName =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[sheetName];

        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                { defval: "" }
            );

        importRowsToCostCalculation(
            rows
        );

    };

    reader.readAsArrayBuffer(file);

}

/*************************************************
 *FUNCTION : Les colonnes du fichier excel
 *************************************************/
function importRowsToCostCalculation(
    rows
) {

    rows.forEach(row => {

        const productName =
            String(
                row["Produit"] || ""
            ).trim();

        const quantity =
            Number(
                row["Quantité"] || 0
            );

        const purchasePrice =
            Number(
                row["Prix Achat"] || 0
            );

        if (
            !productName ||
            quantity <= 0 ||
            purchasePrice <= 0
        ) {
            return;
        }

        const success =
            addCostItem(
                productName,
                quantity,
                purchasePrice
            );

        if (!success) {

            console.warn(
                "Produit introuvable :",
                productName
            );

        }

    });

    renderCostItems();

    showToast(
        `✅ ${rows.length} ligne(s) importée(s)`
    );

}

