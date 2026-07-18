/************************************************************
 * 📊 STOCK / HISTORIQUE
 ************************************************************/
//CREE  MOUVEMENTS STOCK
let stockMovements = JSON.parse(
  localStorage.getItem("stockMovements") || "[]"
);

let currentMovementProductIndex = null;

/************************************************************
 * FUNCTION : ajout stock
 ************************************************************/
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

/************************************************************
 * FUNCTION : Historique des mouvements
 ************************************************************/
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

/************************************************************
 * FUNCTION : Pagination historique mouvement de stock
 ************************************************************/
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

/************************************************************
 * FUNCTION : Gestion des mouvement de stock (nouvelle version)
 ************************************************************/
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


/************************************************************
 * FUNCTION : Fermer le modal mouvements de stock
 ************************************************************/
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

/************************************************************
* FUNCTION : Gestion des motifs du mouvement de stock
************************************************************/
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

      <option value="don">
        Don
      </option>
    `;
  }

}

/************************************************************
 * FUNCTION : Enregistre le mouvement
 ************************************************************/
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

/************************************************************
 * FUNCTION : PERMET D'APPLIQUER LE MOUVEMENT
 ************************************************************/
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
  p.don ??= 0;

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

      case "don":
        p.don += quantity;
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

    user: localStorage.getItem("username"),

    role: localStorage.getItem("userRole"),

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


/************************************************************
 * FUNCTION : La vue des mouvements de stock
 ************************************************************/
function showProductHistory(productName) {

  const historyList =
    document.getElementById("historyList");

  historyList.innerHTML = "";

  const product = products.find(
    p => p.name === productName
  );

  const historySummary =
    document.getElementById("historySummary");

  historySummary.innerHTML = `
  <div class="history-summary">

    <div>
      <strong>📦 Produit :</strong>
      ${product?.name || ""}
    </div>

    <div>
      <strong>📦 Stock réel :</strong>
      ${product?.stock || 0}
    </div>

    <div>
      <strong>📦 Stock initial :</strong>
      ${product?.initialStock || 0}
    </div>

    <div>
      <strong>🛒 Ventes :</strong>
      ${product?.sold || 0}
    </div>

  </div>
`;

  let movements = stockMovements.filter(
    m => m.product === productName
  );

  // ✅ Ajouter le stock initial
  if (product?.initialStock > 0) {

    movements.unshift({
      reason: "initial_stock",
      quantity: product.initialStock,
      user: product.createdBy,
      role: product.createdRole,
      date: new Date(
        product.createdAt || "Date inconnu"
      ).toLocaleString("fr-FR"),
      comment: ""
    });

  }

  // ✅ Ajouter les ventes
  //TOUTES LES VENTES DU PRODUIT
  const salesMovements =
    sales.filter(sale =>
      sale.items.some(
        item => item.name === product.name
      )
    );

  /*if (product.name === "Coca") {
    product.sold = 3;

    localStorage.setItem(
      "products",
      JSON.stringify(products)
    );
  }

  render();*/

  // TRIE DES DATES DES VENTES
  salesMovements.sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  //PERMET DE CREER UNE ENTREE PAR VENTE
  salesMovements.forEach(sale => {

    const items = sale.items.filter(
      i => i.name === product.name
    );


    items.forEach(item => {

      movements.push({

        reason: "sale",

        quantity: item.quantity,

        user: sale.user,

        role: sale.role,

        date: new Date(
          sale.date
        ).toLocaleString("fr-FR")

      });

    });
  });

  if (movements.length === 0) {

    historyList.innerHTML =
      "<p>Aucun mouvement</p>";

  } else {

    const grouped = {};

    movements.forEach(m => {

      if (!grouped[m.reason]) {
        grouped[m.reason] = [];
      }

      grouped[m.reason].push(m);

    });

    Object.entries(grouped)
      .forEach(([reason, items]) => {

        const totalQuantity =
          items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

        const div =
          document.createElement("div");

        div.className = "history-item";

        div.innerHTML = `
          <div class="history-title">

            ${getMovementIcon(reason)}

            ${formatReason(reason)}
                (${items.length})
          </div>

          <div class="history-total">

            <!--Mouvements : ${items.length} <br>-->
            Total : ${totalQuantity}

          </div>
        `;

        items.forEach(item => {

          div.innerHTML += `
            <div class="history-detail">
              
              <div>
                📦 Quantité :
                ${item.quantity}
              </div>

              <div>
                👤 ${item.user || "Inconnu"}
             </div>

            <div>
              ${formatRole(item.role)}
            </div>

              <div>
                📅 ${item.date}
              </div>

              ${item.comment
              ? `
                  <div>
                    📝 ${item.comment}
                  </div>
                `
              : ""
            }

            </div>
          `;

        });

        historyList.appendChild(div);

      });

  }

  document.getElementById(
    "historyModal"
  ).style.display = "flex";

}

// FERMER LE MODAL HISTORIQUE DES MOUVEMENTS
function closeHistoryModal() {

  document.getElementById(
    "historyModal"
  ).style.display = "none";

}

//ICONES DES MOUVEMENTS
function getMovementIcon(reason) {

  switch (reason) {

    case "initial_stock":
      return "📦";

    case "sale":
      return "🛒";

    case "achat":
      return "📥";

    case "retour":
      return "↩️";

    case "broken":
      return "🔨";

    case "expired":
      return "⏰";

    case "lost":
      return "❓";

    case "stolen":
      return "🚨";

    case "don":
      return "🎁";

    default:
      return "📦";

  }

}

//LES LIBELLES DES MOUVEMENTS

function formatReason(reason) {

  const labels = {

    initial_stock: "Stock initial",

    sale: "Ventes",

    achat: "Achat fournisseur",

    retour: "Retour client",

    broken: "Cassé",

    expired: "Périmé",

    lost: "Perdu",

    stolen: "Vol",

    don: "Don"

  };

  return labels[reason] || reason;
}

/************************************************************
 * FUNCTION : Le label des rôles
 ************************************************************/
function formatRole(role) {

  const labels = {
    super_admin: "👑 Super Admin",
    admin: "🛠️ Admin",
    vendeur: "🛒 Vendeur"
  };

  return labels[role] || role;
}