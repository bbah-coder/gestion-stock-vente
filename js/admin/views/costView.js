/* ==========================================
   PRODUIT ACTUELLEMENT SÉLECTIONNÉ
========================================== */

let selectedCostProduct = null;

/*************************************************
 * NOMBRE D'ELEMENTS AFFICHES
 *************************************************/
let costHistoryLimit = 3


function showCostModule() {

    // Masquer les autres vues
    document
        .querySelectorAll(".view-section")
        .forEach(section => {
            section.style.display = "none";
        });
    hideAllSectionsForms();
    // Afficher le module coût
    document.getElementById("costSection").style.display = "block";
    document.getElementById("importSection").style.display = "none";

    closeMobileMenu?.();
}


function renderAddCostItemForm() {

    const productName = prompt("Nom du produit");

    if (!productName) return;

    const quantity = Number(
        prompt("Quantité") || 0
    );

    const purchasePrice = Number(
        prompt("Prix d'achat unitaire") || 0
    );

    const success = addCostItem(
        productName,
        quantity,
        purchasePrice
    );

    if (!success) {
        showToast?.("❌ Produit introuvable");
        return;
    }

    renderCostItems();
}

function renderCostItems() {

    const container =
        document.getElementById(
            "costItemsContainer"
        );

    if (!container) return;

    const items =
        getCurrentCostCalculation().items;

    if (!items.length) {

        container.innerHTML = `
            <p>Aucun article ajouté</p>
        `;

        return;
    }

    container.innerHTML = items.map((item, index) => `

        <div class="cost-item-card">

            <div class="cost-item-header">

                <strong>
                    📦 ${item.productName}
                </strong>

                <button
                    class="cost-delete-btn"
                    onclick="removeCostItemByIndex(${index})">
                    🗑️
                </button>

            </div>

            <div>
                Qté : ${item.quantity}
            </div>

            <div>
                Achat : ${formatPrice(item.purchasePrice)} GNF
            </div>

        </div>

    `).join("");

}

function prepareExtraCosts() {

    currentCostCalculation.extraCosts = [];

    const transport =
        Number(
            document.getElementById("transportCost")
                ?.value || 0
        );

    const customs =
        Number(
            document.getElementById("customsCost")
                ?.value || 0
        );

    const other =
        Number(
            document.getElementById("otherCost")
                ?.value || 0
        );

    if (transport > 0) {
        addExtraCost("Transport", transport);
    }

    if (customs > 0) {
        addExtraCost("Douane", customs);
    }

    if (other > 0) {
        addExtraCost("Divers", other);
    }
}

/*function calculateCostView() {

    prepareExtraCosts();

    const method =
        document.getElementById("costMethod")
            .value;

    const results =
        method === "quantity"
            ? calculateCurrentCostsByQuantity()
            : calculateCurrentCosts();

    const container =
        document.getElementById(
            "costResults"
        );

    if (!results.length) {

        container.innerHTML =
            "<p>Aucun résultat</p>";

        return;
    }

    container.innerHTML = results.map(r => `

    <div class="cost-item-card">

      <strong>
        📦 ${r.productName}
      </strong>

      <div>
        Prix achat :
        ${formatPrice(r.purchasePrice)}
        GNF
      </div>

      <div>
        Frais/unité :
        ${formatPrice(
        r.allocatedCostPerUnit
    )}
        GNF
      </div>

      <div style="font-weight:bold;color:#2ecc71;">

        Coût réel :
        ${formatPrice(
        r.realUnitCost
    )}
        GNF

      </div>

    </div>

  `).join("");

}*/
/*************************************************
 * CALCULER ET ENREGISTRER LE CALCUL
 *************************************************/
function calculateCostView() {

    // Vérifier qu'il y a au moins un article
    const items =
        getCurrentCostCalculation().items;

    if (!items.length) {

        showToast(
            "Ajoutez au moins un article"
        );

        return;
    }

    // Vérifier les frais annexes
    const transport = Number(
        document.getElementById(
            "transportCost"
        ).value || 0
    );

    const customs = Number(
        document.getElementById(
            "customsCost"
        ).value || 0
    );

    const other = Number(
        document.getElementById(
            "otherCost"
        ).value || 0
    );

    const totalExtraCosts =
        transport +
        customs +
        other;

    if (totalExtraCosts <= 0) {

        showToast(
            "Veuillez renseigner au moins un frais annexe"
        );

        return;
    }

    // Charger les frais annexes
    prepareExtraCosts();

    // Méthode sélectionnée
    const method =
        document.getElementById(
            "costMethod"
        ).value;

    // Calcul
    const results =
        method === "quantity"
            ? calculateCurrentCostsByQuantity()
            : calculateCurrentCosts();

    // Aucun résultat
    if (!results.length) {

        showToast(
            "Aucun résultat à calculer"
        );

        return;
    }

    // Affichage résultats
    renderCostResults(results);

    // Sauvegarde calcul
    const success =
        saveCurrentCalculation(method);

    if (!success) {

        showToast(
            "Erreur lors de l'enregistrement"
        );

        return;
    }

    // Message succès
    showToast(
        "✅ Calcul enregistré et stock mis à jour"
    );

    // Attendre quelques secondes pour
    // permettre de consulter le résultat
    /*setTimeout(() => {

        startNewCostCalculation();

    }, 2000);*/

}

function saveCalculationView() {

    const method =
        document.getElementById("costMethod")
            .value;

    const success =
        saveCurrentCalculation(method);

    if (success) {

        showToast?.(
            "✅ Calcul enregistré"
        );

    } else {

        showToast?.(
            "❌ Rien à enregistrer"
        );

    }
}

function startNewCostCalculation() {

    resetCurrentCostCalculation();

    renderCostItems();

    const results =
        document.getElementById("costResults");

    if (results) {
        results.innerHTML = "";
    }

    document.getElementById("transportCost").value = "";
    document.getElementById("customsCost").value = "";
    document.getElementById("otherCost").value = "";

    document.getElementById("costMethod").value = "value";

    showToast?.("✅ Nouveau calcul démarré");
}

function showCostHistory() {

    document
        .querySelectorAll(".view-section")
        .forEach(section => {
            section.style.display = "none";
        });

    document.getElementById(
        "costHistorySection"
    ).style.display = "block";

    costHistoryLimit;

    renderCostHistory();

}

function showMoreCostHistory() {

    costHistoryLimit += 3;

    renderCostHistory();

}
function renderCostHistory() {

    const container =
        document.getElementById(
            "costHistoryList"
        );

    if (!container) return;

    const calculations =
        getCostCalculations()
            .slice()
            .reverse();

    if (!calculations.length) {

        container.innerHTML = `
            <p>Aucun calcul enregistré</p>
        `;

        return;
    }

    const visibleCalculations =
        calculations.slice(
            0,
            costHistoryLimit
        );

    let html = visibleCalculations
        .map(calc => `

            <div class="cost-item-card">

                <strong>
                    📅 ${formatDateFR(calc.date)}
                </strong>

                <div>
                    Méthode :
                    ${calc.allocationMethod === "quantity"
                ? "Quantité"
                : "Prorata"
            }
                </div>

                <div>
                    Frais :
                    ${formatPrice(
                calc.totalExtraCosts || 0
            )} GNF
                </div>

                <div>
                    Articles :
                    ${calc.results?.length || 0}
                </div>

                <div
                    style="
                        display:flex;
                        gap:10px;
                        margin-top:10px;
                    ">

                    <button
                        onclick="viewCostCalculation('${calc.id}')">

                        👁 Voir

                    </button>

                    <button
                       onclick="exportCostCalculationPDF('${calc.id}')">
                       📄 PDF
                    </button>

                    <button
                        onclick="deleteCostCalculationView('${calc.id}')">

                        🗑 Supprimer

                    </button>

                </div>

            </div>

        `)
        .join("");

    if (
        calculations.length >
        costHistoryLimit
    ) {

        html += `

            <div class="cost-history-load-more">

                <button
                    onclick="showMoreCostHistory()">

                    📜 Afficher plus

                </button>

            </div>

        `;
    }

    container.innerHTML = html;

}

function deleteCostCalculationView(id) {

    if (
        !confirm(
            "Supprimer ce calcul ?"
        )
    ) {
        return;
    }

    deleteCostCalculation(id);

    renderCostHistory();

    showToast?.(
        "✅ Calcul supprimé"
    );
}
function viewCostCalculation(id) {

    const calculation =
        getCostCalculations().find(
            c => c.id === id
        );

    if (!calculation) return;

    let message =
        `📦 Calcul du ${formatDateFR(
            calculation.date
        )
        }\n\n`;

    calculation.results.forEach(r => {

        message +=
            `${r.productName}

Qté : ${r.quantity}
Achat : ${formatPrice(r.purchasePrice)}
Coût réel : ${formatPrice(r.realUnitCost)}

`;
    });

    alert(message);
}


function openCostImport() {

    document
        .getElementById("costExcelFile")
        .click();

}

/**************************************************
 * RECHERCHE TEMPS * ÉEL
    *************************************************/
function filterCostProducts() {

    const search = document
        .getElementById("costProductSearch")
        .value
        .toLowerCase()
        .trim();

    const dropdown = document.getElementById(
        "costProductDropdown"
    );

    if (!search) {

        dropdown.innerHTML = "";
        dropdown.style.display = "none";

        return;
    }

    const results = products.filter(product => {

        const productName =
            String(product.name || "")
                .toLowerCase();

        return productName.includes(search);

    });

    if (!results.length) {

        dropdown.innerHTML = `
            <div class="cost-product-no-result">
                Aucun produit trouvé
            </div>
        `;

        dropdown.style.display = "block";

        return;
    }

    dropdown.innerHTML = results
        .slice(0, 15)
        .map(product => `
            <div
                class="cost-product-option"
                onclick="selectCostProduct('${product.name}')">

                📦 ${product.name}

            </div>
        `)
        .join("");

    dropdown.style.display = "block";
}
/*************************************************
 * Sélectionner un produit
 *************************************************/
function selectCostProduct(productName) {

    selectedCostProduct = productName;

    document.getElementById(
        "costProductSearch"
    ).value = productName;

    document.getElementById(
        "costProductDropdown"
    ).style.display = "none";
}

/*************************************************
 * AJOUTER UN ARTICLE AU CALCUL
 *************************************************/
function addCostItemFromForm() {

    // Si des résultats existent,
    // démarrer un nouveau calcul
    const resultsContainer =
        document.getElementById("costResults");

    if (
        resultsContainer &&
        resultsContainer.innerHTML.trim() !== ""
    ) {

        startNewCostCalculation();

    }

    // Vérifier qu'un produit est sélectionné
    if (!selectedCostProduct) {

        showToast(
            "Veuillez sélectionner un produit"
        );

        return;
    }

    // Récupération des valeurs
    const quantity = Number(
        document.getElementById(
            "costQuantity"
        ).value
    );

    const purchasePrice = Number(
        document.getElementById(
            "costPurchasePrice"
        ).value
    );

    // Contrôle quantité
    if (quantity <= 0) {

        showToast(
            "Quantité invalide"
        );

        return;
    }

    // Contrôle prix achat
    if (purchasePrice <= 0) {

        showToast(
            "Prix d'achat invalide"
        );

        return;
    }

    // Ajout de l'article
    const success = addCostItem(
        selectedCostProduct,
        quantity,
        purchasePrice
    );

    if (!success) {

        showToast(
            "Produit introuvable"
        );

        return;
    }

    // Rafraîchir la liste des articles
    renderCostItems();

    // Réinitialiser uniquement le formulaire
    selectedCostProduct = null;

    document.getElementById(
        "costProductSearch"
    ).value = "";

    document.getElementById(
        "costQuantity"
    ).value = "";

    document.getElementById(
        "costPurchasePrice"
    ).value = "";

    document.getElementById(
        "costProductDropdown"
    ).innerHTML = "";

    document.getElementById(
        "costProductDropdown"
    ).style.display = "none";

    showToast(
        "✅ Article ajouté"
    );
}

/*************************************************
 * Fermer la liste déroulante
 *************************************************/
document.addEventListener(
    "click",
    function (event) {

        const dropdown =
            document.getElementById(
                "costProductDropdown"
            );

        const searchInput =
            document.getElementById(
                "costProductSearch"
            );

        if (
            !dropdown?.contains(event.target) &&
            event.target !== searchInput
        ) {

            dropdown.style.display =
                "none";
        }
    }
);

/*************************************************
 * AFFICHAGE DES RESULTATS
 *************************************************/
function renderCostResults(results) {

    const container =
        document.getElementById(
            "costResults"
        );

    if (!container) return;

    if (!results.length) {

        container.innerHTML = `
            <p>Aucun résultat</p>
        `;

        return;
    }

    container.innerHTML = results.map(result => `

        <div class="cost-result-card">

            <strong>
                📦 ${result.productName}
            </strong>

            <div>
                Quantité :
                ${result.quantity}
            </div>

            <div>
                Prix achat :
                ${formatPrice(
        result.purchasePrice
    )} GNF
            </div>

            <div>
                Coût réel :
                ${formatPrice(
        result.realUnitCost
    )} GNF
            </div>

        </div>

    `).join("");
}

function exportCostCalculationPDF(id) {

    const calculation =
        getCostCalculations().find(
            c => c.id === id
        );

    if (!calculation) {

        showToast(
            "Calcul introuvable"
        );

        return;
    }

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();

    let y = 15;

    //------------------------------------------------
    // FORMAT PRIX
    //------------------------------------------------
    function formatPricePDF(value) {

        return Number(value || 0)
            .toFixed(2)
            .replace(
                /\B(?=(\d{3})+(?!\d))/g,
                " "
            );

    }

    //------------------------------------------------
    // CALCULS
    //------------------------------------------------
    const totalPurchase =
        calculation.results.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.purchasePrice) *
                    Number(item.quantity)
                ),
            0
        );

    const totalFinal =
        calculation.results.reduce(
            (sum, item) =>
                sum +
                (
                    Number(item.realUnitCost) *
                    Number(item.quantity)
                ),
            0
        );

    const totalExtraCosts =
        Number(
            calculation.totalExtraCosts || 0
        );

    const documentNumber =
        "CA-" +
        new Date(
            calculation.date
        ).getTime();

    //------------------------------------------------
    // EN-TETE
    //------------------------------------------------
    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(18);

    doc.text(
        "CALCUL DES COUTS D'ACHAT",
        105,
        y,
        {
            align: "center"
        }
    );

    y += 8;

    doc.setFontSize(11);

    doc.setTextColor(
        120,
        120,
        120
    );

    doc.text(
        documentNumber,
        105,
        y,
        {
            align: "center"
        }
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    y += 15;

    //------------------------------------------------
    // INFORMATIONS DU CALCUL
    //------------------------------------------------
    doc.setFillColor(
        245,
        245,
        245
    );

    doc.roundedRect(
        10,
        y - 5,
        190,
        28,
        3,
        3,
        "F"
    );

    doc.setFontSize(13);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "INFORMATIONS DU CALCUL",
        12,
        y + 2
    );

    doc.setFontSize(10);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        `Date : ${formatDateFR(calculation.date)}`,
        12,
        y + 10
    );

    doc.text(
        `Utilisateur : ${localStorage.getItem(
            "username"
        ) || "Inconnu"
        }`,
        105,
        y + 10
    );

    doc.text(
        `Méthode : ${calculation.allocationMethod ===
            "quantity"
            ? "Quantité"
            : "Prorata"
        }`,
        12,
        y + 18
    );

    doc.text(
        `Articles : ${calculation.results.length
        }`,
        105,
        y + 18
    );

    y += 40;

    //------------------------------------------------
    // DETAIL DES FRAIS
    //------------------------------------------------
    const transport =
        Number(
            calculation.transportCost || 0
        );

    const customs =
        Number(
            calculation.customsCost || 0
        );

    const other =
        Number(
            calculation.otherCost || 0
        );

    doc.setFontSize(13);

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        "DETAIL DES FRAIS",
        10,
        y
    );

    y += 8;

    doc.setFontSize(10);

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.text(
        `Transport : ${formatPricePDF(transport)} GNF`,
        15,
        y
    );

    y += 6;

    doc.text(
        `Douane : ${formatPricePDF(customs)} GNF`,
        15,
        y
    );

    y += 6;

    doc.text(
        `Divers : ${formatPricePDF(other)} GNF`,
        15,
        y
    );

    y += 6;

    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.text(
        `Total frais : ${formatPricePDF(totalExtraCosts)} GNF`,
        15,
        y
    );

    y += 12;

    //------------------------------------------------
    // TABLEAU PRODUITS
    //------------------------------------------------
    doc.setFontSize(13);

    doc.text(
        "TABLEAU PRODUITS",
        10,
        y
    );

    y += 4;

    doc.autoTable({

        startY: y,

        head: [[
            "Produit",
            "Qté",
            "Prix Achat",
            "Part Frais",
            "Coût Réel",
            "Valeur Stock"
        ]],

        body: calculation.results.map(
            item => {

                const partFrais =
                    Number(
                        item.realUnitCost
                    ) -
                    Number(
                        item.purchasePrice
                    );

                const totalLine =
                    Number(
                        item.realUnitCost
                    ) *
                    Number(
                        item.quantity
                    );

                return [

                    item.productName,

                    item.quantity,

                    formatPricePDF(
                        item.purchasePrice
                    ) + " GNF",

                    formatPricePDF(
                        partFrais
                    ) + " GNF",

                    formatPricePDF(
                        item.realUnitCost
                    ) + " GNF",

                    formatPricePDF(
                        totalLine
                    ) + " GNF"

                ];

            }
        ),

        theme: "grid",

        styles: {
            fontSize: 9
        },

        headStyles: {
            fillColor: [44, 62, 80]
        }

    });

    y =
        doc.lastAutoTable.finalY + 12;

    //------------------------------------------------
    // RESUME FINANCIER
    //------------------------------------------------
    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(13);

    doc.text(
        "RESUME FINANCIER",
        10,
        y
    );

    y += 10;

    doc.setTextColor(
        0,
        0,
        0
    );

    doc.text(
        `Valeur achat : ${formatPricePDF(totalPurchase)} GNF`,
        15,
        y
    );

    y += 8;

    doc.setTextColor(
        41,
        128,
        185
    );

    doc.text(
        `Frais annexes : ${formatPricePDF(totalExtraCosts)} GNF`,
        15,
        y
    );

    y += 8;

    doc.setTextColor(
        39,
        174,
        96
    );

    doc.setFontSize(14);

    doc.text(
        `Valeur finale : ${formatPricePDF(totalFinal)} GNF`,
        15,
        y
    );

    doc.setTextColor(
        0,
        0,
        0
    );

    y += 15;

    //------------------------------------------------
    // MOUVEMENTS DE STOCK GENERES
    //------------------------------------------------
    doc.setFont(
        "helvetica",
        "bold"
    );

    doc.setFontSize(13);

    doc.text(
        "MOUVEMENTS DE STOCK GENERES",
        10,
        y
    );

    y += 8;

    doc.setFont(
        "helvetica",
        "normal"
    );

    doc.setFontSize(10);

    calculation.results.forEach(
        item => {

            doc.text(
                `+ ${item.quantity} ${item.productName}`,
                15,
                y
            );

            y += 6;

        }
    );

    y += 8;

    //------------------------------------------------
    // PIED DE PAGE
    //------------------------------------------------
    doc.text(
        "Document généré depuis le module Coût d'achat",
        10,
        y
    );

    //------------------------------------------------
    // EXPORT PDF
    //------------------------------------------------
    doc.save(
        `Calcul-Cout-${formatDateFR(calculation.date)}.pdf`
    );

}
