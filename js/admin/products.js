/************************************************************
 * 📦 PRODUITS
 ************************************************************/

let products = JSON.parse(localStorage.getItem("products") || "[]");
let currentPromoIndex = null;
let editIndex = null;

function saveProducts(){
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at", Date.now());
}

//--------------------------------------
// ✅ INIT PRODUITS
//--------------------------------------

function initProducts(){

  let updated = false;

  products.forEach(p => {

    if(p.promo === undefined){
      p.promo = 0;
      updated = true;
    }

    if(!p.category){
      p.category = "Autre";
      updated = true;
    }

    if(p.initialStock === undefined){
      p.initialStock = p.stock;
      updated = true;
    }

    if(p.sold === undefined){
      p.sold = 0;
      updated = true;
    }

    if(p.active === undefined){
      p.active = true;
    }

    if(!p.createdAt){
      p.createdAt = new Date().toISOString();
      updated = true;
    }
	
	if(p.archived === undefined){
      p.archived = false;
}


  });

  if(updated){
    saveProducts();
  }
}

//--------------------------------------
// ✅ CATEGORIE PRODUIT
//--------------------------------------
function populateCategories(){

  const selects = [
    document.getElementById("filterCategoryAdmin"),
    document.getElementById("filterCategoryProduct")
  ];

  const categories = [...new Set(
    products.map(p => p.category || "Autre")
  )];

  selects.forEach(select => {

    if(!select) return;

    const current = select.value;

    select.innerHTML = `<option value="all">Toutes catégories</option>`;

    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    // ✅ garder sélection
    if(current){
      select.value = current;
    }

  });
}
//--------------------------------------
// ✅ CRUD
//--------------------------------------


function saveProduct(){

  const category = document.getElementById("category").value.trim();
  const name = document.getElementById("name").value.trim();
  const price = document.getElementById("price").value;
  const stock = parseInt(document.getElementById("stock").value);

  if(!name || !price || isNaN(stock)){
    alert("Remplir tous les champs");
    return;
  }

  const file = document.getElementById("image").files[0];

  // ✅ CAS AVEC IMAGE
  if(file){
    const reader = new FileReader();

    reader.onload = function(e){

      const product = {
        name: name,
        price: price,
        stock: stock,
        image: e.target.result,
		category: category || "Autre"
      };

      saveFinal(product);
    };

    reader.readAsDataURL(file);
  }

  // ✅ CAS SANS IMAGE
  else {

    const product = {
      name: name,
      price: price,
      stock: stock,
	  category: category || "Autre"
    };

    if(editIndex !== null){
      product.image = products[editIndex].image;
    }

    saveFinal(product);
  }
}

function saveFinal(product){

  const normalizedName = product.name.toLowerCase().trim();

  // ✅ recherche doublon
  const existingIndex = products.findIndex(p =>
    p.name.toLowerCase().trim() === normalizedName
  );

  // ✅ MODE MODIFICATION
if(editIndex !== null){

  const existing = products[editIndex];

  existing.name = product.name;
  existing.price = product.price;
  existing.category = product.category || "Autre";

  // ✅ stock modifié
  existing.stock = product.stock;

  // ✅ NE PAS TOUCHER AUX VENTES
  const sold = existing.sold || 0;

  // ✅ recalcul cohérent du stock initial
  existing.initialStock = product.stock + sold;

  // ✅ NE PAS RESET sold
  // existing.sold = 0 ❌ SUPPRIME CETTE LIGNE

  if(product.image){
    existing.image = product.image;
  }
}

  // ✅ MODE AJOUT
  else {

   if(existingIndex !== -1){

  const existingProduct = products[existingIndex];

  // ✅ MESSAGE COMPLET
  const confirmUpdate = confirm(
    `⚠️ Produit "${existingProduct.name}" existe déjà\n\n` +
    `Stock actuel : ${existingProduct.stock}\n` +
    `Stock ajouté : ${product.stock}\n\n` +
    `Voulez-vous continuer ?`
  );

  if(!confirmUpdate){
    return; // ❌ on annule tout
  }

  // ✅ BONUS : gestion prix différent
  if(parseFloat(existingProduct.price) !== parseFloat(product.price)){
    
    const confirmPrice = confirm(
      `⚠️ Prix différent détecté\n\n` +
      `Ancien : ${existingProduct.price}\n` +
      `Nouveau : ${product.price}\n\n` +
      `Mettre à jour le prix ?`
    );

    if(confirmPrice){
      existingProduct.price = product.price;
    }
  }


  // ✅ fusion stock
  existingProduct.stock += product.stock;
  existingProduct.initialStock += product.stock;

  // ✅ mise à jour image (si nouvelle)
  if(product.image){
    existingProduct.image = product.image;
  }

  alert("✅ Stock mis à jour avec succès");

    } else {

      // ✅ nouveau produit
      product.initialStock = product.stock; // ✅ stock initial
	  product.sold = 0;                    // ✅ vendu
	  product.createdAt = new Date().toISOString(); // ✅ DATE DE CREATION
      products.unshift(product);

    }
  }
  
  // ✅ sauvegarde
  
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at",Date.now() + "_" + Math.random());


  // ✅ refresh tableau
  render();

  // ✅ reset formulaire
  clearForm();

  // ✅ scroll
  document.getElementById("tableCard").scrollIntoView({
    behavior: "smooth"
  });

  // ✅ reset bouton
  document.getElementById("saveBtn").innerText = "Enregistrer";
  
  document.getElementById("formSection").style.border = "none";
}

function editProduct(index){

  const p = products[index];
  
  document.getElementById("saveBtn").innerText = "Modifier ✅";
  document.getElementById("formTitle").innerText = "✏️ Modifier le produit";
  
  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("stock").value = p.stock;

  editIndex = index;
  
// ✅ AFFICHER FORMULAIRE
  showAdminSection("form");

  const form = document.getElementById("formSection");

  // ✅ scroll vers formulaire
  form.scrollIntoView({ behavior: "smooth" });

  // ✅ highlight visuel
  form.style.border = "2px solid #f39c12";
}

function deleteProduct(index){

  // ✅ Popup confirmation
  const confirmDelete = confirm("Voulez-vous vraiment supprimer ce produit ?");

  // ✅ Si l'utilisateur annule → on arrête
  if(!confirmDelete){
    return;
  }

  // ✅ Desactivation Produit
  products[index].active = false;
  products[index].deletedAt = new Date().toISOString();

  localStorage.setItem("products", JSON.stringify(products));

  render();

  // ✅ Sauvegarde
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at",Date.now() + "_" + Math.random());


  // ✅ Rafraîchir affichage
  render();
}

function cancelEdit(){

  clearForm();

  document.getElementById("formTitle").innerText = "➕ Ajouter un produit";

  document.getElementById("tableCard").scrollIntoView({
    behavior: "smooth"
  });
}


//--------------------------------------
// ✅ FORM
//--------------------------------------

function clearForm(){
  document.getElementById("category").value = "";
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("stock").value = ""; 
 
 
// ✅ reset input file
  const imageInput = document.getElementById("image");
  imageInput.value = "";

  // ✅ reset affichage nom fichier
  document.getElementById("fileName").textContent = "Aucune image sélectionnée";

  editIndex = null;
  
  document.getElementById("saveBtn").innerText = "Enregistrer";
  document.getElementById("formTitle").innerText = "➕ Ajouter un produit";
  document.getElementById("formSection").style.border = "none";
}


//--------------------------------------
// ✅ IMPORT
//-------------------------------------

function importCSV(){
  
  const input = document.getElementById("fileInput");
  const file = input.files[0];

  if(!file){
    alert("Aucun fichier sélectionné");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e){

    const content = e.target.result;

    // ✅ normaliser lignes
    const lines = content.replace(/\r/g, "").split("\n");

    let count = 0;

    lines.forEach((line, index) => {

      const clean = line.trim();
      if(!clean) return;

      // ✅ ignorer en-tête
      if(index === 0) return;

      const parts = clean.split(/[,;]/);

      if(parts.length < 3) return;

      const name = parts[0].trim();
      const price = parseFloat(parts[1].trim());
      const stock = parseInt(parts[2]);
      const image = parts[3] ? parts[3].trim() : "";
	  const category = parts[4] ? parts[4].trim() : "Autre";

      if(!name || isNaN(price) || isNaN(stock)) return;

      const normalizedName = name.toLowerCase().trim();

      // ✅ RECHERCHE DOUBLON
      const existingIndex = products.findIndex(p =>
        p.name.toLowerCase().trim() === normalizedName
      );

      if(existingIndex !== -1){

        const existingProduct = products[existingIndex];

        // ✅ CONFIRMATION STOCK
        const confirmStock = confirm(
          `⚠️ Produit "${existingProduct.name}" existe déjà\n\n` +
          `Stock actuel : ${existingProduct.stock}\n` +
          `Stock ajouté : ${stock}\n\n` +
          `Continuer ?`
        );

        if(!confirmStock) return;

        // ✅ CONFIRMATION PRIX
        if(parseFloat(existingProduct.price) !== price){

          const confirmPrice = confirm(
            `⚠️ Prix différent détecté\n\n` +
            `Ancien : ${existingProduct.price}\n` +
            `Nouveau : ${price}\n\n` +
            `Mettre à jour le prix ?`
          );

          if(confirmPrice){
            existingProduct.price = price;
          }
        }

        // ✅ fusion stock
        existingProduct.stock += stock;
       // ✅ mettre à jour stock initial aussi
	   if(existingProduct.initialStock === undefined){
         existingProduct.initialStock = existingProduct.stock;
       }
       existingProduct.initialStock += stock;
      // ✅ sécurité sold
      if(existingProduct.sold === undefined){
        existingProduct.sold = 0;
      }

        // ✅ update image (si fournie)
        if(image){
          existingProduct.image = image;
        }
		if(category && category.trim() !== ""){

         if(existingProduct.category !== category){

         const confirmUpdate = confirm(
         `Mettre à jour la catégorie pour ${existingProduct.name} ?\n\n` +
         `Ancienne : ${existingProduct.category}\n` +
         `Nouvelle : ${category}`
    );

    if(confirmUpdate){
      existingProduct.category = category;
    }

  }
}

      } else {

        // ✅ nouveau produit
        products.push({
          name,
          price,
          stock,
		  initialStock: stock,
		  sold: 0,
          image: image || null,
		  category: category
        });

        count++;
      }

    });

    // ✅ sauvegarde
    localStorage.setItem("products", JSON.stringify(products));
	localStorage.setItem("products_updated_at",Date.now() + "_" + Math.random());


    render();

    alert(count + " nouveaux produits importés ✅");
  };

  reader.onerror = function(){
    alert("Erreur lecture fichier");
  };

  reader.readAsText(file);

  // ✅ reset fichier
  document.getElementById("fileInput").value = "";

  // ✅ scroll
  document.getElementById("tableCard").scrollIntoView({
    behavior: "smooth"
  });
}


//--------------------------------------
// ✅ PROMO
//--------------------------------------

function openPromoPopup(index, currentValue){

  if(index === undefined || index === -1){
    console.error("❌ index invalide :", index);
    return;
  }

  currentPromoIndex = index;

  const p = products[index];

  document.getElementById("promoProductName").innerText = p.name;
  document.getElementById("promoInput").value = currentValue || 0;

  document.getElementById("promoModal").style.display = "flex";
}

function updatePromo(index, value){

  let promo = parseInt(value);

  if(isNaN(promo) || promo < 0){
    promo = 0;
  }

  if(promo > 100){
    promo = 100;
  }

  products[index].promo = promo;

  localStorage.setItem("products", JSON.stringify(products));

  // ✅ refresh écran pour recalcul prix
  updateInactiveProducts();
}

function confirmPromo(){

  let value = parseInt(document.getElementById("promoInput").value);

  if(isNaN(value) || value < 0){
    value = 0;
  }

  if(value > 100){
    value = 100;
  }

  products[currentPromoIndex].promo = value;

  localStorage.setItem("products", JSON.stringify(products));

  closePromoPopup();

  updateInactiveProducts(); // ✅ refresh UI
}

function closePromoPopup(){
  document.getElementById("promoModal").style.display = "none";
}


//--------------------------------------
// ✅ ARCHIVE
//--------------------------------------

function archiveProduct(index){

  const confirmAction = confirm("Archiver ce produit ?");

  if(!confirmAction) return;

  products[index].active = false;
  products[index].deletedAt = new Date().toISOString();

  localStorage.setItem("products", JSON.stringify(products));

  render();
}

function restoreProduct(index){

  const confirmAction = confirm("Réactiver ce produit ?");

  if(!confirmAction) return;

  products[index].active = true;
  delete products[index].deletedAt;

  localStorage.setItem("products", JSON.stringify(products));

  render();
}

function showArchived(){

  //const isMobile = window.innerWidth <= 768;
  const isMobileOrTablet  = window.matchMedia("(max-width: 1200px)").matches;

  const list = document.getElementById("list");
  const mobileList = document.getElementById("mobileList");
  const header = document.getElementById("archivedHeader");

  // ✅ RESET COMPLET (FIX BUG 🔥)
  list.innerHTML = "";
  if(mobileList) mobileList.innerHTML = "";

  // ✅ HEADER
  header.innerHTML = `
    <strong>🗂️ Produits archivés</strong>
    <button onclick="render()">⬅️ Retour</button>
  `;
  header.style.display = "flex";

  document.getElementById("pagination").style.display = "none";
  document.getElementById("filterCategoryAdmin").style.display = "none";

  const archived = products.filter(p => p.active === false);

  // ✅ AUCUN RESULTAT
  if(archived.length === 0){
    if(isMobileOrTablet){
      mobileList.innerHTML = "<p>✅ Aucun produit archivé</p>";
    } else {
      list.innerHTML = `
        <tr>
          <td colspan="8" style="padding:20px;font-weight:bold;">
            Aucun produit archivé 📦
          </td>
        </tr>
      `;
    }
    return;
  }

  // ✅ ✅ ✅ MODE MOBILE (NOUVEAU PROPRE)
  if(isMobileOrTablet){
    renderArchivedCards(archived);
    return;
  }

  // ✅ ✅ ✅ MODE DESKTOP (ton code amélioré)
  document.getElementById("tableHead").innerHTML = `
    <tr>
      <th>QR</th>
      <th>Image</th>
      <th>Nom</th>
      <th>Prix</th>
      <th>Promo</th>
      <th>Stock</th>
      <th>Stock initial</th>
      <th>Vendu</th>
      <th>Date archivage</th>
      <th>Action</th>
    </tr>`;

  archived.forEach(p => {

    const promo = Number(p.promo) || 0;
    const price = Number(p.price) || 0;

    const finalPrice = promo > 0
      ? price * (1 - promo / 100)
      : price;

    const realIndex = products.indexOf(p);

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>—</td>
      <td>📦</td>

      <td>
        ${p.name}
        <br>
        <span style="font-size:11px;color:#888;">Archivé</span>
      </td>

      <td>
        ${
          promo > 0
          ? `
            <span class="price-old">${formatPrice(price)} GNF</span><br>
            <span class="price-new">${formatPrice(finalPrice)} GNF</span>
          `
          : `${formatPrice(price)} GNF`
        }
      </td>

      <td>
        ${
          promo > 0
          ? `<span style="color:#3498db;font-weight:bold;">🔥 ${promo}%</span>`
          : `—`
        }
      </td>

      <td>${p.stock}</td>
      <td>${p.initialStock || 0}</td>
      <td>${p.sold || 0}</td>

      <td style="font-size:12px;color:#555;">
        ${p.deletedAt ? formatDate(p.deletedAt) : "-"}
      </td>

      <td>
        <button onclick="restoreProduct(${realIndex})" style="background:#27ae60;">
          🔄
        </button>
      </td>
    `;

    row.style.background = "#f8f9fa";

    list.appendChild(row);
  });
}

//--------------------------------------
// ✅ REINITIALISATION
//--------------------------------------
function resetSalesOnly(){

  const step1 = confirm("Réinitialiser la vente en cours ?");

  if(!step1) return;
  
  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if(!step2) return;

  cart = [];

  // ❌ ON NE SUPPRIME PLUS sales
  localStorage.removeItem("cart");

  renderCart();
  updateCartBadge();

  alert("✅ Panier réinitialisé");
}


function resetStockOnly(){

  const step1 = confirm("Réinitialiser les stocks ?");

  if(!step1) return;
  
  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if(!step2) return;

  products.forEach(p => {

    // ✅ on force un fallback fiable
    if(!p.initialStock || isNaN(p.initialStock)){
      p.initialStock = p.stock + (p.sold || 0);
    }

    // ✅ reset propre
    p.stock = Number(p.initialStock);
    p.sold = 0;
  });
  
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at",Date.now() + "_" + Math.random());


  render();

  alert("✅ Stocks réinitialisés");
}

function resetAll(){

  const step1 = confirm("⚠️ Reset stock + panier ?");
  if(!step1) return;
  
  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if(!step2) return;

  products.forEach(p => {

    if(!p.initialStock){
      p.initialStock = p.stock + (p.sold || 0);
    }

    p.stock = Number(p.initialStock);
    p.sold = 0;
  });

  // ✅ on garde l'historique
  // ❌ ne pas supprimer sales

  cart = [];
  localStorage.removeItem("cart");

  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at",Date.now() + "_" + Math.random());


  render();
  updateCartBadge();

  alert("✅ Stock réinitialisé + historique conservé");
}

function resetProducts(){

  const step1 = confirm("⚠️ Supprimer tous les produits ?\nLa boutique sera vide");
  if(!step1) return;
  
  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if(!step2) return;

  // ✅ vider produits
  products = [];

  // ✅ nettoyer stockage
  localStorage.removeItem("products");
  localStorage.setItem("products_updated_at",Date.now() + "_" + Math.random());


  render();

  alert("✅ Tous les produits supprimés");
}

//--------------------------------------
// ✅ PRODUITS INACTIFS
//--------------------------------------

function updateInactiveProducts(){
  
  //const isMobile = window.innerWidth <= 768;
  const isMobileOrTablet  = window.matchMedia("(max-width: 1200px)").matches;

  const days = parseInt(document.getElementById("inactiveDays").value);  
  const list = document.getElementById("list");

  const inactive = getInactiveProducts(days);
  
  const mobileList = document.getElementById("mobileList");

  
  list.innerHTML = "";
  mobileList.innerHTML = "";


  // ✅ aucun résultat
  if(inactive.length === 0){
    if(isMobileOrTablet){
      mobileList.innerHTML = "<p>✅ Aucun produit inactif</p>";
    } else {
      list.innerHTML = `<tr><td colspan="10">✅ Aucun produit inactif</td></tr>`;
    }
    return;
  }

  // ✅ SWITCH PRINCIPAL
  if(isMobileOrTablet){
    renderInactiveCards(inactive);
    return;
  }

  inactive.forEach(p => {

    const row = document.createElement("tr");
	const promo = Number(p.promo) || 0;
	const price = Number(p.price) || 0;
    const discountedPrice = promo > 0
       ? price * (1 - promo / 100)
       : price;

row.innerHTML = `
  <td>—</td>
  <td>⚠️</td>

  <td>
    ${p.name}
    <br>
    <span style="font-size:11px;color:#888;">
      ${p.label}
    </span>
  </td>

  <td>
  ${promo > 0 
    ? `
      <span style="text-decoration:line-through;color:#999;">
        ${formatPrice(price)} GNF
      </span>
      <br>
      <strong style="color:#27ae60;">
        ${formatPrice(discountedPrice)} GNF
      </strong>
    `
    : `${formatPrice(price)} GNF`
  }
  </td>

  <td>${p.stock}</td>
  <td>${p.initialStock}</td>
  <td>${p.sold}</td>

  <td>
  <button onclick="openPromoPopup(${p.index}, ${promo})">
    🔥 ${promo || 0}%
  </button>
</td>


  <!-- ✅ INACTIF -->
  <td style="font-weight:bold;color:#c0392b;">
     <span style="font-size:11px;color:#888;">${p.days} jours sans vente</span>
  </td>

  <!-- ✅ ACTION -->
  <td>
    <button class="tooltip"
            onclick="archiveProduct(${p.index})"
            style="background:#e74c3c;">
      📦
      <span class="tooltiptext">Archiver</span>
    </button>
  </td>
`;

    // ✅ couleur dynamique
   
   if(p.days > 30){
     row.style.background = "#f5b7b1"; // 🔴 critique
  }
  else if(p.days > 15){
     row.style.background = "#f9e79f"; // 🟡 moyen
  }
  else{
    row.style.background = "#fdecea"; // léger
  }

    list.appendChild(row);
  });
}


function getInactiveProducts(days){

  const today = new Date();

  return products
  .filter(p => p.active !== false) // ✅ EXCLURE ARCHIVÉS
  .map(p => {


    let lastSaleDate = null;

    // ✅ chercher la dernière vente
    sales.forEach(sale => {

      sale.items.forEach(item => {

        if(item.name.toLowerCase().trim() === p.name.toLowerCase().trim()){

          const saleDate = new Date(sale.date);

          if(!lastSaleDate || saleDate > lastSaleDate){
            lastSaleDate = saleDate;
          }

        }

      });

    });

    let diffDays = 0;

    // ✅ CAS 1 : produit déjà vendu
    if(lastSaleDate){

      diffDays = Math.floor(
        (today - lastSaleDate) / (1000 * 60 * 60 * 24)
      );

    } 

    // ✅ CAS 2 : jamais vendu → utiliser date création
    else {

      const createdDate = new Date(p.createdAt);

      diffDays = Math.floor(
        (today - createdDate) / (1000 * 60 * 60 * 24)
      );
    }

    let label = "";

    if(lastSaleDate){
        label = diffDays + " jours sans vente";
   } else {
      label = "Jamais vendu (" + diffDays + " jours)";
   }


return {
  ...p,
  index: products.indexOf(p), // ✅ OBLIGATOIRE
  days: diffDays,
  label: label
};



  })
  .filter(p => p.days >= days) // ✅ filtre dynamique
  .sort((a,b) => b.days - a.days); // ✅ tri du pire au meilleur
}


function showInactiveProducts(){
  
  //const isMobile = window.innerWidth <= 768;
  const isMobileOrTablet  = window.matchMedia("(max-width: 1200px)").matches;
 
  const list = document.getElementById("list");
  const header = document.getElementById("archivedHeader");
 

  const defaultDays = 7;

 header.innerHTML = `
  <div class="inactive-header">

    <div class="inactive-left">
      <span class="inactive-title">
        ⚠️ Produits sans vente depuis
      </span>

      <div class="inactive-input-group">

   <button onclick="changeDays(-1)" class="btn-step">−</button>

  <input type="number"
         id="inactiveDays"
         value="7"
         min="1"
         readonly>

  <button onclick="changeDays(1)" class="btn-step">+</button>

  <span>jours</span>

</div>


    <button class="btn-back" onclick="render()">
      ⬅️ Retour
    </button>

  </div>
`;

  header.style.display = "flex";

  document.getElementById("filterCategoryAdmin").style.display = "none";
  document.getElementById("pagination").style.display = "none";
  
  
  // ✅ switch vue
  if(isMobileOrTablet){
    document.getElementById("tableStock").style.display = "none";
    document.getElementById("mobileList").style.display = "block";
  } else {
    document.getElementById("tableStock").style.display = "table";
    document.getElementById("mobileList").style.display = "none";

    // ✅ header table desktop
    document.getElementById("tableHead").innerHTML = `
      <tr>
        <th>QR</th>
        <th>Image</th>
        <th>Nom</th>
        <th>Prix</th>
        <th>Stock</th>
        <th>Stock initial</th>
        <th>Vendu</th>
        <th>Promo</th>
        <th>Inactif</th>
        <th>Action</th>
      </tr>`;
  }

  updateInactiveProducts();
}


function changeDays(delta){

  const input = document.getElementById("inactiveDays");

  let value = parseInt(input.value) || 1;

  value += delta;

  if(value < 1) value = 1;

  input.value = value;

  updateInactiveProducts(); // ✅ refresh auto
}





