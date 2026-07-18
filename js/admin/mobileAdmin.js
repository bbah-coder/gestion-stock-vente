/************************************************************
 * MOBILE HEADER APP JS
 ************************************************************/
function toggleMenu() {
  const menu = document.getElementById("mobileMenu");

  if (menu.style.display === "flex") {
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}

/************************************************************
 * FUNTION : La barre de recherche
 ************************************************************/
function openSearch() {
  const bar = document.getElementById("searchBar");
  const input = document.getElementById("searchInputAdmin");


  const isOpening = !bar.classList.contains("active");

  bar.classList.toggle("active");

  if (isOpening) {
    input.value = "";
    render();

    setTimeout(() => input.focus(), 100);
  } else {
    input.value = "";
    render();
  }
}

/************************************************************
 * FUNCTION : Cache la barre de recherche
 ************************************************************/
function closeSearch() {
  const overlay = document.getElementById("searchOverlay");
  overlay.classList.remove("active");

  document.getElementById("searchInputAdmin").value = "";
  render(); // reset
}

/************************************************************
 * FUNCTION : Le bouton clean form recherche
 ************************************************************/
function toggleClearBtn() {
  const input = document.getElementById("searchInputAdmin");
  const btn = document.querySelector(".clear-btn-mobile-admin");

  if (input.value.length > 0) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
}

/************************************************************
 * FUNCTION : Clean barre de recherche
 ************************************************************/
function clearSearchMobile() {
  const input = document.getElementById("searchInputAdmin");

  input.value = "";
  render();     // reset
  toggleClearBtn();   // cache X
  input.focus();      // reste actif
}

/************************************************************
 * FUNCTION : Fermer le menu
 ************************************************************/
function closeMobileMenu() {
  const menu = document.getElementById("mobileMenu");
  if (menu) {
    menu.style.display = "none";
  }
}

document.addEventListener("click", function (e) {

  const menu = document.getElementById("mobileMenu");
  const burger = document.querySelector(".mobile-icons span:last-child");

  const searchBar = document.getElementById("searchBar");
  const searchBtn = document.querySelector(".mobile-icons span:first-child");

  // ✅ MENU BURGER
  if (menu && burger) {
    if (menu.style.display === "flex") {
      if (!menu.contains(e.target) && !burger.contains(e.target)) {
        menu.style.display = "none";
      }
    }
  }

  // ✅ SEARCH BAR
  if (searchBar && searchBtn) {
    if (searchBar.classList.contains("active")) {
      if (!searchBar.contains(e.target) && !searchBtn.contains(e.target)) {
        searchBar.classList.remove("active");
      }
    }
  }

});

/************************************************************
 * MOBILE PRODUCT CARDS 
 ************************************************************/

function renderCards(productsList) {

  const list = document.getElementById("mobileList");
  list.innerHTML = "";

  productsList.forEach((p) => {

    const promo = Number(p.promo) || 0;

    const detailPrice =
      Number(p.price) || 0;

    const wholesalePrice =
      Number(p.wholesalePrice) || 0;

    // ✅ Promo uniquement sur le détail
    const finalDetailPrice =
      promo > 0
        ? detailPrice * (1 - promo / 100)
        : detailPrice;

    const realIndex = products.indexOf(p);

    const card = document.createElement("div");
    card.className = "product-card";


    card.innerHTML = `

    <div class="card-top">
      <div class="card-image">
        ${p.image
        ? `<img src="${p.image}" class="card-img">`
        : `<div class="no-image">📦</div>`
      }
      </div>
   
      <div class="card-info">
         <!--<div class="card-name">${p.name}</div>-->
         <div class="card-name">${p.name}
            ${promo > 0
        ? `<span class="promo-badge">(-${promo}%)</span>`
        : ""
      }
         </div>
         
      <div class="card-price">
     
       <div>🛒 Détail :
       ${promo > 0
        ? `
        <span class="price-old">
          ${formatPrice(detailPrice)} GNF
        </span>

        <span class="price-new">
          ${formatPrice(finalDetailPrice)} GNF
        </span>
      `
        : `
        <span class="price-new">
          ${formatPrice(detailPrice)} GNF
        </span>
      `
      }
      </div>

     ${(wholesalePrice || 0) > 0
        ? `
      <div class="price-wholesale">
        📦 Gros :
        <span class="price-gros">
          ${formatPrice(wholesalePrice)} GNF
        </span>
        <div class="price-threshold">
         📦 Dès ${p.wholesaleMinQty || 0} unités
        </div>

      </div>
    `
        : ""
      }

   </div>

     <div class="card-stock">
     <!--div>Stock initial : ${p.initialStock}</div> -->

     <div class="stock-real">
       📦 Stock réel : ${p.stock || 0}  </div>
      ${p.stock <= LOW_STOCK_THRESHOLD
        ? `<span class="badge-danger">Faible</span>`
        : ""
      }

     ${(p.entries || 0) > 0
        ? `<div>📥 Entrées : ${p.entries}</div>`
        : ""
      }

       ${(p.sold || 0) > 0
        ? `<div>🛒 Vendu : ${p.sold}</div>`
        : ""
      }
      
     ${(p.broken || 0) > 0
        ? `<div>🔨 Cassé : ${p.broken}</div>`
        : ""
      }

     ${(p.expired || 0) > 0
        ? `<div>⏰ Périmé : ${p.expired}</div>`
        : ""
      }

    ${(p.lost || 0) > 0
        ? `<div>❓ Perdu : ${p.lost}</div>`
        : ""
      }

    ${(p.stolen || 0) > 0
        ? `<div class="stock-loss">🚨 Vol : ${p.stolen}</div>`
        : ""
      }

    ${(p.don || 0) > 0
        ? `<div>🎁 Don : ${p.don}</div>`
        : ""
      }
      
     </div>

     </div>

    </div>

  <div class="card-footer">
     <button class="btn-edit" onclick="editProduct(${realIndex})">Modifier️</button>
     <button class="btn-add" onclick="openStockMovement(${realIndex})">📦 Mouvement</button>
     <button class="btn-qr" onclick="showProductQr(${realIndex})">🧾 QR </button>
     <button class="btn-history" onclick="showProductHistory('${p.name}')">📜 Historique </button>
  </div>
`;

    list.appendChild(card);

  });

}


/* PRODUIT INACTIF MOBILE */
/************************************************************
 * FUNCTION : Render Produits inactifs
 ************************************************************/

function renderInactiveCards(listData) {

  const container = document.getElementById("mobileList");
  container.innerHTML = "";

  listData.forEach(p => {

    const promo = Number(p.promo) || 0;

    const detailPrice =
      Number(p.price) || 0;

    const wholesalePrice =
      Number(p.wholesalePrice) || 0;

    // ✅ Promo uniquement sur le détail
    const finalDetailPrice =
      promo > 0
        ? detailPrice * (1 - promo / 100)
        : detailPrice;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `

      <div class="card-content">

        <div class="card-top">

          <div class="card-image">
            ${p.image
        ? `<img src="${p.image}" class="card-img">`
        : `<div class="no-image">📦</div>`
      }
          </div>

          <div class="card-info">

            <!--<div class="card-name">${p.name}</div>-->
            <div class="card-name">${p.name}
            ${promo > 0
        ? `<span class="promo-badge">(-${promo}%)</span>`
        : ""
      }
         </div>
            
      <div class="card-price">
     
       <div>🛒 Détail :
       ${promo > 0
        ? `
        <span class="price-old">
          ${formatPrice(detailPrice)} GNF
        </span>

        <span class="price-new">
          ${formatPrice(finalDetailPrice)} GNF
        </span>
      `
        : `
        <span class="price-new">
          ${formatPrice(detailPrice)} GNF
        </span>
      `
      }
      </div>

     ${(wholesalePrice || 0) > 0
        ? `
      <div class="price-wholesale">

        📦 Gros :

        <span class="price-gros">
          ${formatPrice(wholesalePrice)} GNF
        </span>

      </div>
    `
        : ""
      }

   </div>
            <div class="card-stock">
     <!--div>Stock initial : ${p.initialStock}</div> -->

     <div class="stock-real">
       📦 Stock réel : ${p.stock || 0}  </div>
      ${p.stock <= LOW_STOCK_THRESHOLD
        ? `<span class="badge-danger">Faible</span>`
        : ""
      }

     ${(p.entries || 0) > 0
        ? `<div>📥 Entrées : ${p.entries}</div>`
        : ""
      }

       ${(p.sold || 0) > 0
        ? `<div>🛒 Vendu : ${p.sold}</div>`
        : ""
      }
      
     ${(p.broken || 0) > 0
        ? `<div>🔨 Cassé : ${p.broken}</div>`
        : ""
      }

     ${(p.expired || 0) > 0
        ? `<div>⏰ Périmé : ${p.expired}</div>`
        : ""
      }

    ${(p.lost || 0) > 0
        ? `<div>❓ Perdu : ${p.lost}</div>`
        : ""
      }

    ${(p.stolen || 0) > 0
        ? `<div class="stock-loss">🚨 Vol : ${p.stolen}</div>`
        : ""
      }

    ${(p.don || 0) > 0
        ? `<div>🎁 Don : ${p.don}</div>`
        : ""
      }
      
     </div>

     </div>

    </div>

            <div class="card-meta inactive">
              ⚠️ ${p.days} jours sans vente
            </div>

          </div>

        </div>

      </div>

      <div class="card-footer">

         <!-- ✅ Promo (badge bleu) -->
       <button 
      class="btn-promo" 
        onclick="openPromoPopup(${p.index}, ${promo})">
         🔥 ${promo || 0}%
      </button>

     <!-- ✅ Archiver -->
     <button 
        class="btn-archive" 
        onclick="archiveProduct(${p.index})">
       📦 Archiver
     </button>

</div>

    `;

    container.appendChild(card);
  });
}


/************************************************************
 * FUNCTION : Render produits archivés
 ************************************************************/
function renderArchivedCards(listData) {

  const container = document.getElementById("mobileList");
  container.innerHTML = "";

  listData.forEach(p => {

    const promo = Number(p.promo) || 0;

    const detailPrice =
      Number(p.price) || 0;

    const wholesalePrice =
      Number(p.wholesalePrice) || 0;

    // ✅ Promo uniquement sur le détail
    const finalDetailPrice =
      promo > 0
        ? detailPrice * (1 - promo / 100)
        : detailPrice;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `

      <div class="card-content">

        <div class="card-top">

          <div class="card-image">
            ${p.image
        ? `<img src="${p.image}" class="card-img">`
        : `<div class="no-image">📦</div>`
      }
          </div>

          <div class="card-info">

            <div class="card-name">${p.name}
            ${promo > 0
        ? `<span class="promo-badge">(-${promo}%)</span>`
        : ""
      }
         </div>

             <div class="card-price">
     
       <div>🛒 Détail :
       ${promo > 0
        ? `
        <span class="price-old">
          ${formatPrice(detailPrice)} GNF
        </span>

        <span class="price-new">
          ${formatPrice(finalDetailPrice)} GNF
        </span>
      `
        : `
        <span class="price-new">
          ${formatPrice(detailPrice)} GNF
        </span>
      `
      }
      </div>

     ${(wholesalePrice || 0) > 0
        ? `
      <div class="price-wholesale">

        📦 Gros :

        <span class="price-gros">
          ${formatPrice(wholesalePrice)} GNF
        </span>

      </div>
    `
        : ""
      }

   </div>
            <div class="card-stock">
     <!--div>Stock initial : ${p.initialStock}</div> -->

     <div class="stock-real">
       📦 Stock réel : ${p.stock || 0}  </div>
      ${p.stock <= LOW_STOCK_THRESHOLD
        ? `<span class="badge-danger">Faible</span>`
        : ""
      }

     ${(p.entries || 0) > 0
        ? `<div>📥 Entrées : ${p.entries}</div>`
        : ""
      }

       ${(p.sold || 0) > 0
        ? `<div>🛒 Vendu : ${p.sold}</div>`
        : ""
      }
      
     ${(p.broken || 0) > 0
        ? `<div>🔨 Cassé : ${p.broken}</div>`
        : ""
      }

     ${(p.expired || 0) > 0
        ? `<div>⏰ Périmé : ${p.expired}</div>`
        : ""
      }

    ${(p.lost || 0) > 0
        ? `<div>❓ Perdu : ${p.lost}</div>`
        : ""
      }

    ${(p.stolen || 0) > 0
        ? `<div class="stock-loss">🚨 Vol : ${p.stolen}</div>`
        : ""
      }

    ${(p.don || 0) > 0
        ? `<div>🎁 Don : ${p.don}</div>`
        : ""
      }
      
     </div>

     </div>

    </div>

              <div style="font-size:12px;color:#555;">
                  Date d'archivage : ${p.deletedAt ? formatDate(p.deletedAt) : "-"}
                </div>
              
            </div>

          </div>

        </div>

      </div>

      <div class="card-footer">

        <button onclick="restoreProduct(${products.indexOf(p)})">
          🔄 Restaurer le produit
        </button>

        <button class="btn-delete-product" onclick="deletePhysicalProduct(${products.indexOf(p)})">
          🗑 Supprimer le produit
        </button>
        
      </div>
    `;

    container.appendChild(card);
  });

}


/************************************************************
 * FUNCTION : QR-code produit
 ************************************************************/
function showProductQr(index) {

  const product = products[index];

  document.getElementById(
    "qrProductModal"
  ).style.display = "flex";

  document.getElementById(
    "productQrName"
  ).innerHTML = `
  <h3>${product.name}</h3>

  <div class="qr-code-id">
    ${product.barcode}
  </div>
`;

  const container =
    document.getElementById(
      "productQrContainer"
    );

  container.innerHTML = "";

  new QRCode(container, {

    text: product.barcode,

    width: 220,

    height: 220

  });

}

/************************************************************
 * FUNCTION : Fermer la fenêtre QR-Code
 ************************************************************/
function closeProductQr() {

  document.getElementById(
    "qrProductModal"
  ).style.display = "none";

}

/************************************************************
 * FUNCTION : Bouton pour imprimer le QR-CODE
 ************************************************************/
function printProductQr() {

  window.print();

}

//CODE MIGRATION
/*products.forEach((p, index) => {

  if (!p.barcode ||
    p.barcode.includes("-")) {

    p.barcode =
      `PRD-${String(index + 1).padStart(4, "0")}`;

  }

});

localStorage.setItem(
  "products",
  JSON.stringify(products)
);*/
