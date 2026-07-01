/************************************************************
 * 📦 LES PRODUITS EN LIGNE
 * ==========================================================
 * 🎯 Gestion complète des produits côté boutique
 *
 * 🔹 Rendu & affichage :
 * - renderProducts()              → affiche la liste produits
 * - renderPagination()            → pagination produits
 * - changePage()                  → changement de page
 *
 * 🔹 Filtres & catégories :
 * - populateCategories()          → filtre catégorie produits
 * - populateCategoriesHistory()   → filtre catégorie historique
 *
 * 🔹 Promo :
 * - filterPromoOnly()             → activer/désactiver filtre promo
 * - showPromo()                   → afficher uniquement les promos
 *
 * 🔹 Utilitaires :
 * - clearSearch()                 → reset recherche
 *
 ************************************************************/

let products = JSON.parse(localStorage.getItem("products") || "[]");

let showPromoOnly = false;
let promoMode = false;


/************************************************************
 * 🎨 RENDER PRODUITS
 * ----------------------------------------------------------
 * Affiche la liste des produits avec :
 * - filtre recherche
 * - filtre catégorie
 * - filtre promo
 * - tri stock faible
 * - pagination
 ************************************************************/

function renderProducts() {

  updateProductTitle();

  const data = getFilteredProducts();

  const sorted = sortProducts(data);

  const paginated = paginateProducts(sorted);

  const vm = computeProductVM(paginated);

  const isMobile = window.matchMedia("(max-width: 1200px)").matches;

  if (isMobile) {
    renderMobileProducts(vm);
  } else {
    renderDesktopProducts(vm);
  }

  renderPagination(sorted.length);
}

function updateProductTitle() {

  const title = document.querySelector("#productsSection h2");

  if (title) {
    title.innerText = showPromoOnly
      ? "🔥Produits en promotion"
      : "Produits";
  }
}

function getFilteredProducts() {

  const selectedCategory =
    document.getElementById("filterCategoryProduct")?.value || "all";

  const search = (
    document.getElementById("searchInput")?.value ||
    document.getElementById("searchInputMobile")?.value ||
    ""
  ).toLowerCase().trim();

  return products.filter(p => {

    const name = (p.name || "").toLowerCase();
    const price = (p.price || 0).toString();
    const stock = (p.stock ?? 0).toString();
    const promo = Number(p.promo) || 0;

    const matchSearch =
      name.includes(search) ||
      price.includes(search) ||
      stock.includes(search);

    const matchCategory =
      selectedCategory === "all" ||
      (p.category || "Autre") === selectedCategory;

    const matchPromo = !showPromoOnly || promo > 0;

    const isActive = p.active !== false;

    return matchSearch && matchCategory && matchPromo && isActive;
  });
}

function sortProducts(filtered) {

  return filtered.sort((a, b) => {

    const promoA = Number(a.promo) || 0;
    const promoB = Number(b.promo) || 0;

    const stockA = Number(a.stock) || 0;
    const stockB = Number(b.stock) || 0;

    const lowA = stockA <= LOW_STOCK_THRESHOLD;
    const lowB = stockB <= LOW_STOCK_THRESHOLD;

    if (promoA > 0 && promoB === 0) return -1;
    if (promoA === 0 && promoB > 0) return 1;

    if (promoA !== promoB) return promoB - promoA;

    if (lowA && !lowB) return -1;
    if (!lowA && lowB) return 1;

    if (stockA !== stockB) return stockA - stockB;

    return a.name.localeCompare(b.name);
  });
}

function paginateProducts(data) {

  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

  if (currentPage > totalPages) {
    currentPage = 1;
  }

  const start = (currentPage - 1) * itemsPerPage;

  return data.slice(start, start + itemsPerPage);
}

function computeProductVM(data) {

  return data.map(p => {

    const promo = Number(p.promo) || 0;
    const price = Number(p.price) || 0;

    const finalPrice = promo > 0
      ? price * (1 - promo / 100)
      : price;

    const realIndex = products.findIndex(prod => prod.name === p.name);

    return {
      ...p,
      promo,
      price,
      finalPrice,
      realIndex,
      isLowStock: (p.stock ?? 0) <= LOW_STOCK_THRESHOLD
    };
  });
}

function renderDesktopProducts(data) {

  const container = document.getElementById("productList");
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = "<tr><td colspan='7'>Aucun produit 🔍</td></tr>";
    return;
  }

  data.forEach(p => {

    const row = document.createElement("tr");

    const qrId = "qr_" + p.realIndex;

    row.innerHTML = `
  <td class="qr-cell">
    <div id="${qrId}"></div>
  </td>

  <td>
    ${p.image ? `<div class="img-container"><img src="${p.image}"></div>` : `<div class="no-image">📦</div>`}
  </td>

  <td>
    ${p.name}
    ${p.promo > 0 ? `<span style="color:red;font-size:12px;">(-${p.promo}%)</span>` : ""}
  </td>

  <td>
    ${p.promo > 0
        ? `
        <span class="price-old">${formatPrice(p.price)} GNF</span><br>
        <span class="price-new">${formatPrice(p.finalPrice)} GNF</span>
      `
        : `${formatPrice(p.price)} GNF`
      }
  </td>

  <td>
    ${p.promo > 0 ? `<span style="color:#e74c3c;">-${p.promo}%</span>` : "—"}
  </td>

  <td>
    ${p.stock}
    ${p.isLowStock
        ? '<span style="background:red;color:white;padding:2px 6px;border-radius:5px;margin-left:5px;">Faible</span>'
        : ''
      }
  </td>

  <td>
    <div class="action-qty">

      <div class="qty-control">
        <button onclick="changeQty(${p.realIndex}, -1)">-</button>

        <input type="number"
          id="qty-${p.realIndex}"
          value="1"
          min="1"
          max="${p.stock}"
        >

        <button onclick="changeQty(${p.realIndex}, 1)">+</button>
      </div>

      <button class="btn-add" onclick="vendreWithQty(${p.realIndex}, this)">
        Ajouter
      </button>

    </div>
  </td>
`;

    if (p.isLowStock) {
      //row.style.background = "#f8d7da";
      row.style.fontWeight = "bold";
    }

    container.appendChild(row);

    // Génération QR code
    const qrEl = document.getElementById(qrId);

    if (qrEl) {

      qrEl.innerHTML = "";

      const qrData = JSON.stringify({
        name: p.name,
        price: Number(p.price)
      });

      new QRCode(qrEl, {
        text: encodeURIComponent(qrData),
        width: 60,
        height: 60
      });
    }

  });
}


/************************************************************
 * MOBILE Products APP JS
 ************************************************************/
function renderMobileProducts(products) {

  const container = document.getElementById("mobileProductList");
  if (!container)
    return;

  container.innerHTML = "";

  products.forEach(p => {

    //Les produits en promo
    const promo = Number(p.promo) || 0;
    const price = Number(p.price) || 0;

    const finalPrice = promo > 0
      ? price * (1 - promo / 100)
      : price;

    container.innerHTML += `
      <div class="product-card">

        <!-- ✅ IMAGE -->
        <div class="product-img">
          <div class="img-container">
            ${p.image
        ? `<img src="${p.image}" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
        : ""
      }
            <div class="default-icon" style="${p.image ? 'display:none' : 'display:flex'}">
              📦
            </div>
          </div>
        </div>

        <!-- ✅ INFOS -->
        <div class="product-info">
          <!--<div class="product-name">${p.name}</div>-->
         <!-- Prise en compte des l'affichage des produits en promo-->
         
          <div class="product-name">${p.name}
            ${promo > 0
        ? `<span class="promo-badge">(-${promo}%)</span>`
        : ""
      }
         </div>

       <div class="product-price">
          ${promo > 0
        ? `
        <span class="price-old">${formatPrice(price)} GNF</span>
        <span class="price-new">${formatPrice(finalPrice)} GNF</span>
         `
        : `${formatPrice(price)} GNF`
      }
        </div>


       <div class="product-stock ${p.stock <= 5 ? 'stock-low' : ''}">
            Stock: ${p.stock}
          </div>
        </div>

        <!-- ✅ ACTIONS -->
        <div class="product-actions">

          <button onclick="event.stopPropagation(); changeQty(${p.realIndex}, -1)">−</button>

          <span class="qty-display" id="qty-mobile-${p.realIndex}">
            0
          </span>

          <button onclick="event.stopPropagation(); changeQty(${p.realIndex}, 1)">+</button>

        </div>

      </div>
    `;
  });
  updateAddToCartButton();
}


/************************************************************
 * 📄 PAGINATION
 * ----------------------------------------------------------
 * Génère les boutons de pagination produits
 ************************************************************/
function renderPagination(totalItems) {

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const container = document.getElementById("pagination");

  if (!container) return;

  container.innerHTML = "";

  const prevBtn = document.createElement("button");
  prevBtn.innerText = "⬅️";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => changePage(currentPage - 1);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPage) {
      btn.style.background = "#2ecc71";
    }

    btn.onclick = () => changePage(i);
    container.appendChild(btn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.innerText = "➡️";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => changePage(currentPage + 1);
  container.appendChild(nextBtn);
}


/************************************************************
 * 🔄 CHANGEMENT DE PAGE
 * ----------------------------------------------------------
 * Met à jour la page courante et recharge les produits
 ************************************************************/
function changePage(page) {
  currentPage = page;
  renderProducts();
}


/************************************************************
 * 🧩 FILTRES CATÉGORIES PRODUITS
 ************************************************************/
function populateCategories() {

  const select = document.getElementById("filterCategoryProduct");
  if (!select) return;

  const categories = [...new Set(
    products.map(p => p.category || "Autre")
  )];

  const current = select.value;

  select.innerHTML = `<option value="all">Toutes catégories</option>`;

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  if (current) {
    select.value = current;
  }
}


/************************************************************
 * 🧩 FILTRES CATÉGORIES HISTORIQUE
 ************************************************************/
function populateCategoriesHistory() {

  const select = document.getElementById("filterCategoryHistory");
  if (!select) return;

  const categories = [...new Set(
    products.map(p => p.category || "Autre")
  )];

  const current = select.value;

  select.innerHTML = `<option value="all">Toutes catégories</option>`;

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });

  if (current) {
    select.value = current;
  }
}


/************************************************************
 * 🔥 FILTRE PROMO
 ************************************************************/
function filterPromoOnly() {

  showPromoOnly = !showPromoOnly;

  const btn = document.querySelector("button[onclick='filterPromoOnly()']");

  if (showPromoOnly) {
    btn.classList.add("active");
  } else {
    btn.classList.remove("active");
  }

  currentPage = 1;
  renderProducts();
}


/************************************************************
 * 🔥 AFFICHAGE MODE PROMO
 ************************************************************/
function showPromo() {

  // ✅ passe par showSection avec option
  showSection("products", { promo: true });

  // ✅ bouton actif spécial
  document.querySelectorAll(".menu button")
    .forEach(btn => btn.classList.remove("active"));

  const btn = document.querySelector(
    `.menu button[onclick="showPromo()"]`
  );

  if (btn) btn.classList.add("active");
}



/************************************************************
 * 🔍 RESET RECHERCHE
 ************************************************************/
function clearSearch() {

  const input = document.getElementById("searchInput");
  input.value = "";

  renderProducts();
  renderLowStock?.(); // ✅ compat admin
}