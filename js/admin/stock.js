/************************************************************
 * 📊 STOCK / HISTORIQUE
 ************************************************************/
//CREET MOUVEMENTS STOCK
let stockMovements = JSON.parse(
  localStorage.getItem("stockMovements") || "[]"
);

let currentMovementProductIndex = null;

function addStock(index) {

  const p = products[index];

  const qty = prompt(`Ajouter du stock pour : ${p.name}`);

  // ✅ 1. Annuler ou vide → on quitte sans message
  if (qty === null || qty.trim() === "") {
    return;
  }

  const value = parseInt(qty);

  if (isNaN(value) || value <= 0) {
    alert("Quantité invalide");
    return;
  }

  // ✅ mise à jour stock
  p.stock += value;

  // ✅ mise à jour stock initial (important)
  if (p.initialStock === undefined) {
    p.initialStock = p.stock;
  }

  p.initialStock += value;

  stockLogs.unshift({
    product: p.name,
    type: "AJOUT",
    quantity: value,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("stockLogs", JSON.stringify(stockLogs));

  // ✅ sauvegarde
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at", Date.now() + "_" + Math.random());

  render();

  alert(
    `✅ Stock mis à jour\n\nProduit : ${p.name}\nAjout : +${value}\nNouveau stock : ${p.stock}`
  );

}

function renderStockHistory() {

  const container = document.getElementById("stockHistory");

  const filter = document.getElementById("filterType").value;
  const search = document.getElementById("searchHistory").value.toLowerCase();

  container.innerHTML = "";

  let filteredLogs = stockLogs;

  // ✅ filtre type
  if (filter !== "ALL") {
    filteredLogs = filteredLogs.filter(log => log.type === filter);
  }

  // ✅ filtre produit
  filteredLogs = filteredLogs.filter(log =>
    log.product.toLowerCase().includes(search)
  );

  // ✅ TRI DATE
  filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  // ✅ PAGINATION CALCUL
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPageHistoryStock) || 1;

  if (currentPageHistoryStock > totalPages) {
    currentPageHistoryStock = 1;
  }

  const start = (currentPageHistoryStock - 1) * itemsPerPageHistoryStock;
  const paginated = filteredLogs.slice(start, start + itemsPerPageHistoryStock);

  // ✅ aucun résultat
  if (paginated.length === 0) {
    container.innerHTML = "<tr><td colspan='4'>Aucun résultat</td></tr>";
    renderPaginationHistoryStock(filteredLogs.length);
    return;
  }

  // ✅ affichage
  paginated.forEach(log => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${log.product}</td>
      <td>${log.type}</td>
      <td>
        ${log.type === "VENTE" ? "-" : "+"}${Math.abs(log.quantity)}
      </td>
      <td>${log.date}</td>
    `;

    row.style.color = log.type === "VENTE" ? "red" : "green";

    container.appendChild(row);
  });

  // ✅ pagination UI
  renderPaginationHistoryStock(filteredLogs.length);
}

function renderPaginationHistoryStock(totalItems) {

  const container = document.getElementById("paginationHistoryStock");

  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPageHistoryStock) || 1;

  // ⬅️
  const prev = document.createElement("button");
  prev.innerText = "⬅️";
  prev.disabled = currentPageHistoryStock === 1;

  prev.onclick = () => {
    currentPageHistoryStock--;
    renderStockHistory();
  };

  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {

    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPageHistoryStock) {
      btn.style.background = "#2ecc71";
    }

    btn.onclick = () => {
      currentPageHistoryStock = i;
      renderStockHistory();
    };

    container.appendChild(btn);
  }

  // ➡️
  const next = document.createElement("button");
  next.innerText = "➡️";
  next.disabled = currentPageHistoryStock === totalPages;

  next.onclick = () => {
    currentPageHistoryStock++;
    renderStockHistory();
  };

  container.appendChild(next);
}

function clearHistory() {

  const confirmClear = confirm("⚠️ Supprimer tout l'historique ?");

  if (!confirmClear) return;

  stockLogs = [];

  localStorage.setItem("stockLogs", JSON.stringify(stockLogs));

  renderStockHistory();

  alert("✅ Historique vidé");
}

function openStockMovement(index) {

  currentMovementProductIndex = index;

  document.getElementById(
    "movementType"
  ).value = "entry";

  document.getElementById(
    "movementReason"
  ).value = "achat";

  document.getElementById(
    "movementQuantity"
  ).value = "";

  document.getElementById(
    "movementComment"
  ).value = "";

  document.getElementById(
    "stockMovementModal"
  ).style.display = "flex";

}

// FERMER LA FENETRE
function closeStockMovement() {

  document.getElementById(
    "stockMovementModal"
  ).style.display = "none";

  currentMovementProductIndex = null;

}

// ADAPTER LES MOTIFS SELON LE TYPE 
document
  .getElementById("movementType")
  .addEventListener("change", updateReasons);

function updateReasons() {

  const type =
    document.getElementById(
      "movementType"
    ).value;

  const reasonSelect =
    document.getElementById(
      "movementReason"
    );

  if (type === "entry") {

    reasonSelect.innerHTML = `
      <option value="achat">
        Achat fournisseur
      </option>

      <option value="retour">
        Retour client
      </option>
    `;

  } else {

    reasonSelect.innerHTML = `
      <option value="broken">
        Cassé
      </option>

      <option value="expired">
        Périmé
      </option>

      <option value="lost">
        Perdu
      </option>

      <option value="stolen">
        Vol
      </option>

      <option value="donation">
        Don
      </option>
    `;
  }

}

//SAUVEGARDE LE MOUVEMENT 
function saveStockMovement() {

  const quantity = parseInt(
    document.getElementById(
      "movementQuantity"
    ).value
  );

  if (
    isNaN(quantity) ||
    quantity <= 0
  ) {

    showToast(
      "Quantité invalide"
    );

    return;
  }

  const type =
    document.getElementById(
      "movementType"
    ).value;

  const reason =
    document.getElementById(
      "movementReason"
    ).value;

  applyStockMovement(
    currentMovementProductIndex,
    type,
    quantity,
    reason
  );

  closeStockMovement();

}

//SAVE MOUVEMENT STOCK 
function saveStockMovement() {

  const quantity = parseInt(
    document.getElementById("movementQuantity").value
  );

  if (isNaN(quantity) || quantity <= 0) {

    showToast("Quantité invalide");

    return;
  }

  const type =
    document.getElementById("movementType").value;

  const reason =
    document.getElementById("movementReason").value;

  const comment =
    document.getElementById("movementComment").value.trim();

  applyStockMovement(
    currentMovementProductIndex,
    type,
    quantity,
    reason,
    comment
  );

  closeStockMovement();
}


//FONCTION QUI PERMET D'APPLIQUER LE MOUVEMENT
function applyStockMovement(
  index,
  type,
  quantity,
  reason,
  comment = ""
) {

  const p = products[index];

  p.entries ??= 0;
  p.broken ??= 0;
  p.expired ??= 0;
  p.lost ??= 0;
  p.stolen ??= 0;
  p.donation ??= 0;




  // ✅ Entrées
  if (type === "entry") {

    p.stock += quantity;
    p.entries += quantity;

  }

  // ✅ Sorties
  else {

    if (p.stock < quantity) {

      showToast("Stock insuffisant");

      return;
    }

    p.stock -= quantity;

    console.log("TYPE =", type);
    console.log("REASON =", reason);

    switch (reason) {

      case "broken":
        p.broken += quantity;
        break;

      case "expired":
        p.expired += quantity;
        break;

      case "lost":
        p.lost += quantity;
        break;

      case "stolen":
        p.stolen += quantity;
        break;

      case "donation":
        p.donation += quantity;
        break;


    }

  }

  // Historique (pour la future étape)
  stockMovements.unshift({

    product: p.name,

    type,

    reason,

    quantity,

    comment,

    date: new Date().toLocaleString()

  });

  localStorage.setItem(
    "stockMovements",
    JSON.stringify(stockMovements)
  );

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  render();

  showToast("✅ Mouvement enregistré");
}
