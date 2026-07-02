/************************************************************
 * MOBILE OR TABLETTE HEADER APP JS
 ************************************************************/
/*VARIABLES AFFICHAGE */

let showAllCredits = false;
const creditPerPage = 4;


let showAllHistory = false;
const historyPerPage = 4;



function toggleMenu() {
  const menu = document.getElementById("mobileMenu");

  if (menu.style.display === "flex") {
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}


/*function focusSearch(){
  const input = document.getElementById("searchInputMobile");
  if(input) input.focus();
}

function syncSearch(){
  const mobileInput = document.getElementById("searchInputMobile");
  const desktopInput = document.getElementById("searchInput");

  if(mobileInput && desktopInput){
    desktopInput.value = mobileInput.value;
    globalSearch(); // ✅ relance la recherche
  }
}*/

function openSearch() {
  const bar = document.getElementById("searchBar");
  const input = document.getElementById("searchInputMobile");

  const isOpening = !bar.classList.contains("active");

  bar.classList.toggle("active");

  if (isOpening) {
    input.value = "";
    globalSearch();

    setTimeout(() => input.focus(), 100);
  } else {
    input.value = "";
    globalSearch();
  }
}


function closeSearch() {
  const overlay = document.getElementById("searchOverlay");
  overlay.classList.remove("active");

  document.getElementById("searchInputMobile").value = "";
  globalSearch(); // reset
}

function toggleClearBtn() {
  const input = document.getElementById("searchInputMobile");
  const btn = document.querySelector(".clear-btn-mobile-boutique");

  if (input.value.length > 0) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
}

function clearSearchMobile() {
  const input = document.getElementById("searchInputMobile");

  input.value = "";
  globalSearch();     // reset
  toggleClearBtn();   // cache X
  input.focus();      // reste actif
}


function setupMobileSearch() {

  const searchBar = document.getElementById("searchBar");
  const input = document.getElementById("searchInputMobile");
  const searchBtn = document.querySelector(".mobile-icons span:first-child");

  // ✅ OUVERTURE / FERMETURE via loupe
  window.openSearch = function () {

    const isOpening = !searchBar.classList.contains("active");

    searchBar.classList.toggle("active");

    if (isOpening) {
      input.value = "";
      globalSearch();

      setTimeout(() => input.focus(), 100);
    } else {
      input.value = "";
      globalSearch();
    }
  };

  // ✅ FERMETURE AUTOMATIQUE (clic extérieur)
  document.addEventListener("click", function (e) {

    if (searchBar.classList.contains("active")) {

      if (!searchBar.contains(e.target) && !searchBtn.contains(e.target)) {

        searchBar.classList.remove("active");

        input.value = "";
        globalSearch();
      }
    }

  });

}

document.addEventListener("DOMContentLoaded", function () {
  setupMobileSearch();

  // ✅ LIE le seuil au render responsive
  const input = document.getElementById("stockThreshold");

  if (input) {
    input.addEventListener("input", renderLowStockResponsive);
  }

  // ✅ IMPORTANT : premier rendu
  try {
    renderLowStockResponsive();
  } catch (e) {
    console.warn("Erreur lowStock ignorée", e);
  }

});


document.addEventListener("click", function (e) {
  const menu = document.getElementById("mobileMenu");
  const burger = document.querySelector(".mobile-icons");

  if (!menu.contains(e.target) && !burger.contains(e.target)) {
    menu.style.display = "none";
  }
});



function addAllToCart() {

  const inputs = document.querySelectorAll("[id^='qty-mobile-']");
  let totalAdded = 0;

  inputs.forEach(input => {

    const qty = parseInt(input.innerText) || 0;
    if (qty <= 0) return;

    const index = parseInt(input.id.replace("qty-mobile-", ""), 10);
    if (isNaN(index)) return;

    // ✅ IMPORTANT → UNE SEULE FOIS
    vendreWithQty(index, null);

    totalAdded += qty;
  });

  if (totalAdded > 0) {
    updateFloatingCart();
  }
  // ✅ RESET QTY
  document.querySelectorAll("[id^='qty-mobile-']").forEach(el => {
    if (el.tagName === "INPUT") {
      el.value = 0;
    } else {
      el.innerText = "0";
    }
  });
}

function updateFloatingCart() {

  const cartEl = document.getElementById("floatingCart");
  const countEl = document.getElementById("floatingCartCount");

  if (!countEl) return;

  // ✅ total quantité réelle
  const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  countEl.innerText = total;

  // ✅ afficher / masquer (optionnel)
  if (cartEl) {
    cartEl.style.display = total > 0 ? "flex" : "none";
  }

}


/************************************************************
 * MOBILE RenderPanier Car
 ************************************************************/

function renderCartMobile() {

  const container = document.getElementById("cartMobileList");


  console.log("➡️ renderCartMobile appelé");
  console.log("➡️ cart =", cart);
  console.log("➡️ container =", container);


  if (!container) {
    console.error("❌ container introuvable");
    return;
  }


  container.innerHTML = "";

  let total = 0;

  if (!cart || !Array.isArray(cart)) {
    console.warn("cart invalide");
    return;
  }


  if (cart.length === 0) {

    container.innerHTML = "<p style='text-align:center'>Panier vide 🛒<br>Retour aux produits...</p>";

    document.getElementById("total").innerHTML = "0 GNF";

    updateFloatingCart();

    // ✅ reset crédit (important)
    if (typeof creditData !== "undefined") {
      creditData = null;
    }

    // ✅ redirection SANS casser le reste
    setTimeout(() => {
      showSection("products");
    }, 400);

    return;
  }

  cart.forEach((item, i) => {

    const product = products[item.index];

    const brut = item.price * item.quantity;
    const remise = Math.min(item.remise || 0, brut);
    const net = brut - remise;

    total += net;

    container.innerHTML += `
      <div class="cart-card">

        <!-- IMAGE -->
        <div class="cart-left">
          ${product && product.image
        ? `<img src="${product.image}">`
        : `<div class="default-icon">📦</div>`
      }
        </div>

        <!-- INFOS -->
        <div class="cart-info">
          <div class="cart-name">${item.name}</div>

          <div class="cart-price">
            ${formatPrice(item.price)} GNF
          </div>

          <!-- QTY -->
          <div class="cart-qty">

            <button onclick="updateQty(${i}, ${item.quantity - 1})">−</button>

            <span>${item.quantity}</span>

           <button onclick="updateQty(${i}, ${item.quantity + 1})">+</button>

           </div>

          <!-- REMISE -->
          <div class="cart-remise">
            <span class="remise-label">💸 Remise : </span>
            <input type="number"
             value="${item.remise || 0}"
             min="0"
            oninput="updateRemiseLive(${i}, this)">
            
            <span class="remise-percent" id="remise-${i}">
                (${getRemisePercent(item)}%)
           </span>

          </div>

          <!-- TOTAL -->
         <!-- <div class="cart-total">
            ${formatPrice(net)} GNF
          </div> -->
        </div>

        <!-- DELETE -->
        <div class="cart-actions">
          <button onclick="removeItem(${i})">🗑️</button>
        </div>

      </div>
    `;
  });

  // ✅ TOTAL EXACT (copié de ton desktop)
  const totalEl = document.getElementById("total");

  if (cart.length === 0) {
    creditData = null;
  }

  if (getPaymentMethod() === "credit" && creditData) {

    const totalNet = cart.reduce((sum, i) => {
      const brut = i.price * i.quantity;
      const remise = Math.min(i.remise || 0, brut);
      return sum + (brut - remise);
    }, 0);

    const paid = (creditData.payments || [])
      .reduce((sum, p) => sum + p.amount, 0);

    const remaining = Math.max(0, totalNet - paid);

    totalEl.innerHTML = `
      <div><strong>💰 Total :</strong> ${formatPrice(totalNet)} GNF</div>
      <div style="color:#2ecc71;"><strong>✅ Payé :</strong> ${formatPrice(paid)} GNF</div>
      <div style="color:#e74c3c;"><strong>📋 Restant :</strong> ${formatPrice(remaining)} GNF</div>
    `;

  } else {

    totalEl.innerHTML = `
      <div><strong>💰 Total :</strong> ${formatPrice(total)} GNF</div>
    `;
  }

  updateFloatingCart();
  console.log("cart =", cart);
}

function getRemisePercent(item) {

  const price = Number(item.price) || 0;
  const qty = Number(item.quantity) || 0;
  const remise = Number(item.remise) || 0;

  const brut = price * qty;

  if (brut <= 0) return "0";

  const percent = (remise / brut) * 100;

  if (isNaN(percent)) return "0";

  return percent < 1
    ? percent.toFixed(1)
    : Math.round(percent);
}

function updateRemiseLive(index, input) {

  let remise = parseFloat(input.value) || 0;

  const item = cart[index];
  const brut = item.price * item.quantity;

  if (remise < 0) remise = 0;
  if (remise > brut) {
    remise = brut;
    input.value = brut;
  }

  // ✅ update data
  cart[index].remise = remise;

  // ✅ UPDATE POURCENTAGE
  const percentEl = document.getElementById(`remise-${index}`);
  if (percentEl) {
    percentEl.innerText = getRemisePercent(item) + "%";
  }


  // ✅ SAUVEGARDE IMMÉDIATE 🔥
  localStorage.setItem("cart", JSON.stringify(cart));

  // ✅ update total uniquement
  updateTotalOnly();
}


function updateTotalOnly() {

  let total = 0;

  cart.forEach(item => {
    const brut = item.price * item.quantity;
    const remise = Math.min(item.remise || 0, brut);
    total += (brut - remise);
  });

  const totalEl = document.getElementById("total");

  totalEl.innerHTML = `
    <div><strong>💰 Total :</strong> ${formatPrice(total)} GNF</div>
  `;
}

/* Function pour cacher le bouton ajouter au panier si Qté=0*/


function updateAddToCartButton() {

  const btn = document.querySelector(".floating-add-cart");

  if (!btn) return;

  const inputs = document.querySelectorAll("[id^='qty-mobile-']");

  let hasQty = false;

  inputs.forEach(input => {
    const qty = parseInt(input.innerText) || 0;

    if (qty > 0) {
      hasQty = true;
    }
  });

  console.log("👉 bouton panier visible ?", hasQty);

  btn.style.display = hasQty ? "block" : "none";
  localStorage.setItem("cart", JSON.stringify(cart));
}

/*PANIER TABLETTE*/

function updateCartMobileBtn() {

  const btn = document.getElementById("cartBtnMobile");
  const badge = document.getElementById("cartBadge");

  if (!btn || !badge) return;

  // ✅ ✅ TOTAL QUANTITÉ (FIX BUG)
  const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);

  badge.textContent = total;

  badge.style.display = total > 0 ? "block" : "none";

  // ✅ couleur
  btn.classList.toggle("active", total > 0);
  localStorage.setItem("cart", JSON.stringify(cart));
}



function setActiveMobileMenu(section) {

  // ✅ enlever active sur tous les boutons
  document.querySelectorAll(".mobile-menu-grid button")
    .forEach(btn => btn.classList.remove("active"));

  // ✅ trouver le bon bouton
  const btn = document.querySelector(
    `.mobile-menu-grid button[data-section="${section}"]`
  );

  // ✅ activer si trouvé
  if (btn) {
    btn.classList.add("active");
  }
}

/************************************************************
 * MOBILE RendeMenu
 ************************************************************/

/*Menu Ventes du jour */

function renderSalesMobile() {

  const container = document.getElementById("salesListMobile");
  if (!container) return;

  container.innerHTML = "";

  const today = new Date().toDateString();

  const todaySales = sales.filter(s =>
    new Date(s.date).toDateString() === today
  );

  if (todaySales.length === 0) {
    container.innerHTML = "<p style='text-align:center'>Aucune vente</p>";
    return;
  }

  todaySales
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((sale, index) => {

      // ✅ calcul BRUT / REMISE / NET
      let totalBrut = 0;
      let totalRemise = 0;

      (sale.items || []).forEach(item => {
        const brut = item.price * item.quantity;
        const remise = item.remise || 0;

        totalBrut += brut;
        totalRemise += remise;
      });

      const totalNet = totalBrut - totalRemise;

      // ✅ encaissé
      let totalPaid = 0;

      if (sale.payment?.type === "credit") {
        totalPaid = (sale.payment.payments || [])
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      } else {
        totalPaid = totalNet;
      }

      const remaining = Math.max(0, totalNet - totalPaid);

      const card = document.createElement("div");
      card.className = "sale-card";

      card.innerHTML = `
      <div class="sale-header">
        <strong>🧾 Ticket ${index + 1}</strong>
        <span>${formatDateFR(sale.date)}</span>
      </div>

      <div class="sale-items">
        ${sale.items.map(item => {

        const unit = item.price || 0;
        const qty = item.quantity || 0;
        const total = unit * qty;

        return `
            <div class="sale-item-block">

              <div class="row-line">
                <span><strong>${item.name}</strong> x${qty}</span>
                <span>${formatPrice(total)} GNF</span>
              </div>

              <div class="sale-subline">
                ${qty} × ${formatPrice(unit)} GNF
              </div>

            </div>
          `;
      }).join("")}
      </div>

      <div class="sale-body">

        <div class="row-line">
          <span>💰 Brut</span>
          <span>${formatPrice(totalBrut)} GNF</span>
        </div>

        <div class="row-line remise">
          <span>💸 Remise</span>
          <span>- ${formatPrice(totalRemise)} GNF</span>
        </div>

        <div class="row-line total">
          <span>📊 Net</span>
          <strong>${formatPrice(totalNet)} GNF</strong>
        </div>

        <div class="row-line success">
          <span>✅ Encaissé</span>
          <span>${formatPrice(totalPaid)} GNF</span>
        </div>

        ${remaining > 0 ? `
          <div class="row-line danger">
            <span>🔴 Crédit</span>
            <span>${formatPrice(remaining)} GNF</span>
          </div>
        ` : ""}

      </div>

      <button onclick="exportTicketPDF(${sale.id})">
        📄 Ticket PDF
      </button>
    
    ${sale.clientPhone ? `
      <button class="btn-whatsapp"
        onclick="sendTicketWhatsApp(${sale.id})">
          📱 WhatsApp
      </button>
      ` : ""}
    `;

      container.appendChild(card);
    });
}




/************************************************************
 * MOBILE RenderLowStock
 ************************************************************/

function renderLowStockMobile() {

  const threshold = parseInt(document.getElementById("stockThreshold").value) || 0;
  const container = document.getElementById("lowStockMobileList");
  if (!container) return;

  container.innerHTML = "";

  const search = document.getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();

  const lowProducts = products.filter(p =>
    p.active !== false &&
    Number(p.stock || 0) <= threshold &&
    p.name.toLowerCase().includes(search)
  );

  if (lowProducts.length === 0) {
    container.innerHTML = `<p class="empty">Aucun produit ✅</p>`;
    return;
  }

  lowProducts
    .sort((a, b) => a.stock - b.stock)
    .forEach(p => {

      const promo = Number(p.promo) || 0;
      const price = Number(p.price) || 0;

      const finalPrice = promo > 0
        ? price * (1 - promo / 100)
        : price;

      const card = document.createElement("div");
      card.className = "low-stock-card";

      card.innerHTML = `
  <div class="low-card-left">
    ${p.image
          ? `<img src="${p.image}">`
          : `<div class="default-icon">📦</div>`   /* ✅ fallback */
        }
  </div>

  <div class="low-card-body">

    <div class="low-card-header">
      <span class="name">${p.name}</span>
    </div>

    <div class="low-card-price">
      ${promo > 0
          ? `
            <span class="price-old">${formatPrice(price)} GNF</span>
            <span class="price-new">${formatPrice(finalPrice)} GNF</span>
            <span class="promo-badge">(-${promo}%)</span>
          `
          : `<span class="normal">${formatPrice(price)} GNF</span>`
        }
    </div>

    <div class="low-card-stock">
      <span class="stock ${p.stock <= LOW_STOCK_THRESHOLD ? 'danger' : ''}">
        Stock restant : ${p.stock}
      </span>
    </div>

  </div>
`;
      container.appendChild(card);
    });
}

function renderLowStockResponsive() {

  if (typeof renderLowStock !== "function") {
    console.warn("renderLowStock manquant");
    return;
  }

  if (typeof renderLowStockMobile !== "function") {
    console.warn("renderLowStockMobile manquant");
    return;
  }

  renderResponsive({
    tableSelector: "#lowStockList",
    mobileSelector: "#lowStockMobileList",
    desktopRender: renderLowStock,
    mobileRender: renderLowStockMobile
  });
}

window.addEventListener("resize", renderLowStockResponsive);


function changeThreshold(delta) {

  const input = document.getElementById("stockThreshold");
  if (!input) return;

  let value = parseInt(input.value) || 0;

  value += delta;

  if (value < 0) value = 0; // ✅ sécurité

  input.value = value;

  // ✅ refresh automatique
  renderLowStockResponsive();
}

/************************************************************
 * MOBILE RendeDashBordCredit client
 ************************************************************/

function renderCreditMobile(credits, totalCredit) {

  //FILTRE credit// ✅ appliquer filtre
  credits = filterCredits(credits);

  const container = document.getElementById("creditMobileList");
  const totalDiv = document.getElementById("totalCredit");

  // ✅ recalcul encours total (SAFE)
  const computedTotal = credits.reduce((sum, c) => {
    return sum + (c.remaining || 0);
  }, 0);


  if (!container) return;

  container.innerHTML = "";

  if (credits.length === 0) {
    container.innerHTML = `<p class="empty">✅ Aucun crédit</p>`;
    totalDiv.innerText = "💰 Encours total : 0 GNF";
    return;
  }

  const today = new Date();

  // ✅ tri par date échéance (plus urgent en premier)
  // ✅ TRI SAFE
  const sortedCredits = [...credits].sort((a, b) => {

    const today = new Date();

    const aPaid = a.remaining <= 0;
    const bPaid = b.remaining <= 0;

    const aLate = a.dueDate && new Date(a.dueDate) < today && !aPaid;
    const bLate = b.dueDate && new Date(b.dueDate) < today && !bPaid;

    // ✅ 1. EN RETARD en premier
    if (aLate && !bLate) return -1;
    if (!aLate && bLate) return 1;

    // ✅ 2. ENSUITE ceux en attente
    if (!aPaid && bPaid) return -1;
    if (aPaid && !bPaid) return 1;

    // ✅ 3. tri par date ensuite
    return new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
  });

  // ✅ PAGINATION
  let visibleCredits = showAllCredits
    ? sortedCredits
    : sortedCredits.slice(0, creditPerPage);

  /*GROUPER PAR MOIS */

  const grouped = {};

  visibleCredits.forEach(c => {

    const dateObj = c.dueDate ? new Date(c.dueDate) : new Date();

    const key = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1);

    const label = dateObj.toLocaleString("fr-FR", {
      month: "long",
      year: "numeric"
    });

    if (!grouped[key]) {
      grouped[key] = {
        label,
        items: []
      };
    }

    grouped[key].items.push(c);
  });

  /*AFFICHAGE PAR MOIS */
  Object.values(grouped)
    .sort((a, b) => new Date(a.items[0].dueDate) - new Date(b.items[0].dueDate))
    .forEach(group => {

      // ✅ HEADER MOIS
      const header = document.createElement("div");
      header.className = "credit-month";
      header.textContent = group.label.toUpperCase();

      container.appendChild(header);

      group.items.forEach(c => {

        const dueDate = c.dueDate ? new Date(c.dueDate) : null;

        // ✅ STATUT (comme desktop)
        let statusColor = "orange";
        let statusLabel = "EN ATTENTE";

        if (c.remaining <= 0) {
          statusColor = "green";
          statusLabel = "PAYÉ";
        }
        else if (dueDate && dueDate < today) {
          statusColor = "red";
          statusLabel = "EN RETARD";
        }

        // ✅ DATE PAIEMENT (UNIQUEMENT SI SOLDÉ)
        let paymentDate = "-";
        if (c.remaining <= 0 && c.payments && c.payments.length > 0) {
          const last = c.payments[c.payments.length - 1];
          paymentDate = formatDateFR(last.date);
        }

        const card = document.createElement("div");
        card.className = "credit-card";

        // ✅ effet visuel archivage

        if (c.remaining <= 0) {
          card.classList.add("credit-paid");
        }

        card.innerHTML = `
    <div class="credit-header">
      <div class="client-name">${c.clientName}</div>
      <div class="status" style="color:${statusColor}">
        ${statusLabel}
      </div>
    </div>

    <div class="credit-phone">📞 ${c.clientPhone || "-"}</div>

    <div class="credit-body">
     <div>
      ${c.remaining <= 0
            ? `
        <strong style="text-decoration: line-through; color:#999;">
          💰 ${formatPrice(c.total)} GNF
        </strong>
        <div style="color:#2ecc71; font-size:12px;">✅ Payé</div>
      `
            : `<strong>💰 ${formatPrice(c.remaining)} GNF</strong>`
          }
 </div>
      <div>📅 Échéance : ${c.dueDate ? formatDateFR(c.dueDate) : "-"}</div>
      <div>✅ Paiement : ${paymentDate}</div>
    </div>

    <div class="credit-actions">
      <button onclick="exportCreditPDF(${c.index})">📄 PDF</button>

      ${c.remaining > 0
            ? `<button onclick="addPayment(${c.index})">💰 Payer</button>`
            : `<span style="color:green; font-weight:bold;">✅ Soldé</span>`
          }
    </div>
  `;

        container.appendChild(card);
      });
    });
  const btn = document.getElementById("creditLoadMore");

  if (btn) {
    // ✅ TOUJOURS AFFICHER
    btn.style.display = "block";

    // ✅ texte dynamique
    btn.textContent = showAllCredits
      ? "🔙 Retour"
      : "Afficher plus";
  }

  totalDiv.innerText = `💰 Encours total : ${formatPrice(computedTotal)} GNF`;
}


/************************************************************
 * MOBILE RenderHistory ventes
 ************************************************************/

function renderHistoryMobile(data) {

  const container = document.getElementById("historyMobileList");
  if (!container) return;

  // ✅ garder les données pour toggle
  window.currentHistoryData = data;

  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<p class='empty'>Aucune donnée</p>";
    return;
  }

  // ✅ PIPELINE COMPLET : tri + pagination + groupement
  const grouped = [...data]
    .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate))
    .slice(0, showAllHistory ? data.length : historyPerPage)
    .reduce((acc, day) => {

      const dateObj = new Date(day.rawDate);

      const key = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1);

      const label = dateObj.toLocaleString("fr-FR", {
        month: "long",
        year: "numeric"
      });

      if (!acc[key]) {
        acc[key] = {
          label,
          items: []
        };
      }

      acc[key].items.push(day);

      return acc;

    }, {});

  // ✅ RENDER
  Object.values(grouped)
    .sort((a, b) => new Date(b.items[0].rawDate) - new Date(a.items[0].rawDate))
    .forEach(group => {

      const header = document.createElement("div");
      header.className = "history-month";
      header.textContent = group.label.toUpperCase();

      container.appendChild(header);

      group.items.forEach(day => {

        const card = document.createElement("div");
        card.className = "history-card";

        card.innerHTML = `
        <div class="history-header">
          📅 ${day.date}
        </div>

        <div class="history-main">
          <div class="ca-net">${formatPrice(day.caNet)} GNF</div>
          <div class="label">encaissé ✅</div>
        </div>

        ${day.credit > 0 ? `
          <div class="history-credit">
            🟠 ${formatPrice(day.credit)} GNF crédit
          </div>
        ` : ""}

        <div class="history-details">
          <div>Brut : ${formatPrice(day.caBrut)} GNF</div>
          <div style="color:red;">
            Remise : ${day.remise > 0 ? "- " + formatPrice(day.remise) : "-"} GNF
          </div>
        </div>

        <button onclick="showDetail('${day.rawDate}')">
          📄 Voir détail
        </button>
      `;

        container.appendChild(card);
      });
    });

  // ✅ bouton afficher plus
  const btn = document.getElementById("historyLoadMore");

  if (btn) {
    btn.style.display = "block";

    btn.textContent = showAllHistory
      ? "🔙 Retour"
      : "Afficher plus";
  }
}


/* CLICK BOUTON AFFICHER PLUS Crédit*/
const btn = document.getElementById("creditLoadMore");

if (btn) {
  btn.onclick = () => {

    showAllCredits = !showAllCredits;

    // ✅ IMPORTANT → rappeler le DASHBOARD
    renderCreditDashboard();

    window.scrollTo({ top: 0, behavior: "smooth" });
  };
}
/* CLICK BOUTON AFFICHER PLUS Histo vente*/
document.getElementById("historyLoadMore").onclick = () => {

  showAllHistory = !showAllHistory;

  renderHistoryMobile(window.currentHistoryData || []);

  window.scrollTo({ top: 0, behavior: "smooth" });
};









