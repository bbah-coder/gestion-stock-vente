/************************************************************
 * MOBILE HEADER APP JS
 ************************************************************/


function toggleMenu(){
  const menu = document.getElementById("mobileMenu");

  if(menu.style.display === "flex"){
    menu.style.display = "none";
  } else {
    menu.style.display = "flex";
  }
}


function openSearch(){
  const bar = document.getElementById("searchBar");
  const input = document.getElementById("searchInputAdmin");
  

  const isOpening = !bar.classList.contains("active");

  bar.classList.toggle("active");

  if(isOpening){
    input.value = "";
    render();

    setTimeout(()=> input.focus(), 100);
  } else {
    input.value = "";
    render();
  }
}


function closeSearch(){
  const overlay = document.getElementById("searchOverlay");
  overlay.classList.remove("active");

  document.getElementById("searchInputAdmin").value = "";
  render(); // reset
}

function toggleClearBtn(){
  const input = document.getElementById("searchInputAdmin");
  const btn = document.querySelector(".clear-btn-mobile-admin");

  if(input.value.length > 0){
    btn.style.display = "block";
  }else{
    btn.style.display = "none";
  }
}

function clearSearchMobile(){
  const input = document.getElementById("searchInputAdmin");

  input.value = "";
  render();     // reset
  toggleClearBtn();   // cache X
  input.focus();      // reste actif
}

function closeMobileMenu(){
  const menu = document.getElementById("mobileMenu");
  if(menu){
    menu.style.display = "none";
  }
}

document.addEventListener("click", function(e){

  const menu = document.getElementById("mobileMenu");
  const burger = document.querySelector(".mobile-icons span:last-child");

  const searchBar = document.getElementById("searchBar");
  const searchBtn = document.querySelector(".mobile-icons span:first-child");

  // ✅ MENU BURGER
  if(menu && burger){
    if(menu.style.display === "flex"){
      if(!menu.contains(e.target) && !burger.contains(e.target)){
        menu.style.display = "none";
      }
    }
  }

  // ✅ SEARCH BAR
  if(searchBar && searchBtn){
    if(searchBar.classList.contains("active")){
      if(!searchBar.contains(e.target) && !searchBtn.contains(e.target)){
        searchBar.classList.remove("active");
      }
    }
  }

});

/************************************************************
 * MOBILE PRODUCT CARDS 
 ************************************************************/

function renderCards(productsList){

  const list = document.getElementById("mobileList");
  list.innerHTML = "";

  productsList.forEach((p)=>{

    const promo = Number(p.promo) || 0;
    const price = Number(p.price) || 0;

    const finalPrice = promo > 0
      ? price * (1 - promo / 100)
      : price;

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
         
      <div class="card-price">${promo > 0 ? `
          <span class="price-old">${formatPrice(price)} GNF</span>
          <span class="price-new">${formatPrice(finalPrice)} GNF</span>
        `
        : `${formatPrice(price)} GNF`
      }
      </div>

     <div class="card-stock">
       <div>Vendu : ${p.sold || 0}</div>
      Stock Restant : ${p.stock}
      ${
        p.stock <= LOW_STOCK_THRESHOLD
        ? `<span class="badge-danger">Faible</span>`
        : ""
      }
       <div>Stock initial : ${p.initialStock || p.stock}</div>
      
     </div>

     </div>

    </div>

  <div class="card-footer">
     <button class="btn-edit" onclick="editProduct(${realIndex})">Modifier️</button>
     <button class="btn-add" onclick="addStock(${realIndex})">➕ Ajouter du stock</button>
     <!--<button onclick="archiveProduct(${realIndex})">📦</button>-->
  </div>
`;

    list.appendChild(card);

  });

}


/* PRODUIT INACTIF MOBILE */

function renderInactiveCards(listData){

  const container = document.getElementById("mobileList");
  container.innerHTML = "";

  listData.forEach(p => {

    const promo = Number(p.promo) || 0;
    const price = Number(p.price) || 0;

    const finalPrice = promo > 0
      ? price * (1 - promo / 100)
      : price;

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
              ${
                promo > 0
                ? `
                  <span class="price-old">${formatPrice(price)} GNF</span>
                  <span class="price-new">${formatPrice(finalPrice)} GNF</span>
                `
                : `${formatPrice(price)} GNF`
              }
            </div>

            <div class="card-stock">
              <div> Vendu : ${p.sold}</div>
              Stock restant : ${p.stock}
              <div> Stock initial : ${p.initialStock}</div>
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

/*Produit archivé */
function renderArchivedCards(listData){

  const container = document.getElementById("mobileList");
  container.innerHTML = "";

  listData.forEach(p => {

    const promo = Number(p.promo) || 0;
    const price = Number(p.price) || 0;

    const finalPrice = promo > 0
      ? price * (1 - promo / 100)
      : price;

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
              ${
                promo > 0
                ? `
                  <span class="price-old">${formatPrice(price)} GNF</span>
                  <span class="price-new">${formatPrice(finalPrice)} GNF</span>
                `
                : `${formatPrice(price)} GNF`
              }
            </div>

            <div class="card-meta">
              <div>Vendu : ${p.sold || 0}</div>
              Stock restant : ${p.stock}
              <div>Stock initial : ${p.initialStock || 0}</div>
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

      </div>
    `;

    container.appendChild(card);
  });

}