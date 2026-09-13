/************************************************************
 * 📦 PRODUITS
 ************************************************************/

//let products = JSON.parse(localStorage.getItem("products") || "[]");
let products = [];
let currentPromoIndex = null;
let editIndex = null;

/*function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at", Date.now());
}*/

//--------------------------------------
// ✅ INIT PRODUITS
//--------------------------------------

async function initProducts() {

  try {

    // ✅ Premier démarrage ou IndexedDB vide
    const lastSync = await getSetting("products_last_sync");

    const productsCount = await db.products.count();

    if (!lastSync || productsCount === 0) {

      console.log("📥 Import initial des produits...");

      await importProductsToIndexedDB();

    }

    // ✅ Chargement local instantané
    products = await loadProducts();

    // ✅ Synchronisation arrière-plan
    await syncProducts()
      .catch(error => {

        console.warn(
          "⚠️ Synchronisation produits impossible", error);

      });

    // ✅ Compatibilité ancien modèle
    let updated = false;

    products.forEach(product => {

      if (!product.category) {
        product.category = "Autre";
        updated = true;
      }

      if (product.initialStock === undefined) {
        product.initialStock = product.stock;
        updated = true;
      }

      if (product.sold === undefined) {
        product.sold = 0;
        updated = true;
      }

      if (!product.createdAt) {
        product.createdAt =
          product.created_at ||
          new Date().toISOString();

        updated = true;
      }

      if (product.isArchived === undefined) {
        product.isArchived =
          product.is_archived ?? false;
      }

      if (product.archivedAt === undefined) {
        product.archivedAt =
          product.archived_at ?? null;
      }

      if (product.lastSaleAt === undefined) {
        product.lastSaleAt =
          product.last_sale_at ?? null;
      }

      if (product.promo === undefined) {
        product.promo =
          product.promo_percent ?? 0;
      }

    });

    console.log(`✅ ${products.length} produits initialisés`);

  } catch (error) {

    console.error("❌ Erreur initProducts", error);

    products = [];

  }

}

//--------------------------------------
// ✅ CATEGORIE PRODUIT
//--------------------------------------
function populateCategories() {

  const selects = [
    document.getElementById("filterCategoryAdmin"),
    document.getElementById("filterCategoryProduct")
  ];

  const categories = [...new Set(
    products.map(p => p.category || "Autre")
  )];

  selects.forEach(select => {

    if (!select) return;

    const current = select.value;

    select.innerHTML = `<option value="all">Toutes catégories</option>`;

    categories.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });

    // ✅ garder sélection
    if (current) {
      select.value = current;
    }

  });
}

//--------------------------------------------------------------------
//✅ CRUD PRODUIT
// ✅ FUNCTION Enregistrement du Produit depuis le formulaire d'ajout
//--------------------------------------------------------------------
async function saveProduct() {

  if (!navigator.onLine) {
    showToast("📴 L'ajout d'une fiche produit nécessite une connexion Internet");
    return;
  }

  const productId = crypto.randomUUID();

  const shopId = await getCurrentShopId();

  const category = capitalizeWords(document.getElementById("category").value.trim());
  const name = capitalizeWords(document.getElementById("name").value.trim());

  const price =
    Number(document.getElementById("price").value);

  const wholesalePrice =
    Number(document.getElementById("wholesalePrice").value) || 0;

  const wholesaleMinQty =
    Number(document.getElementById("wholesaleMinQty").value) || 0;

  const stock =
    parseInt(document.getElementById("stock").value);

  if (!name || !price || isNaN(stock)) {
    showToast("Remplir tous les champs");
    return;
  }

  let image = null;

  const file =
    document.getElementById("image").files[0];

  // ✅ Lecture image si présente

  if (file) {
    image = await uploadProductImage(
      file,
      productId,
      shopId
    );
  }

  const normalizedName =
    name.toLowerCase().trim();

  const existingIndex = products.findIndex(
    p =>
      p.name.toLowerCase().trim() === normalizedName
      && p.shop_id === shopId
  );

  //--------------------------------------
  // ✅ MODE MODIFICATION
  //--------------------------------------
  if (editIndex !== null) {

    const existing = products[editIndex];

    existing.name = name;
    existing.price = price;
    existing.stock = stock;
    existing.category = category || "Autre";
    existing.wholesalePrice = wholesalePrice;
    existing.wholesaleMinQty = wholesaleMinQty;

    if (image) {
      existing.image = image;
    }

    const sold = existing.sold || 0;

    existing.initialStock =
      stock + sold;

    await db.products.put(existing);

    await updateProductSupabase(existing);

    showToast("✅ Produit modifié");

  }

  //--------------------------------------
  // ✅ MODE AJOUT
  //--------------------------------------
  else {

    if (existingIndex !== -1) {

      const existingProduct =
        products[existingIndex];

      const confirmUpdate = confirm(
        `⚠️ Produit "${existingProduct.name}" existe déjà\n\n` +
        `Stock actuel : ${existingProduct.stock}\n` +
        `Stock ajouté : ${stock}\n\n` +
        `Voulez-vous continuer ?`
      );

      if (!confirmUpdate) {
        return;
      }

      if (
        Number(existingProduct.price) !== Number(price)
      ) {

        const confirmPrice = confirm(
          `⚠️ Prix différent détecté\n\n` +
          `Ancien : ${existingProduct.price}\n` +
          `Nouveau : ${price}\n\n` +
          `Mettre à jour le prix ?`
        );

        if (confirmPrice) {
          existingProduct.price = price;
        }
      }

      existingProduct.stock += stock;
      existingProduct.initialStock += stock;

      if (image) {
        existingProduct.image = image;
      }

      await db.products.put(existingProduct);

      await updateProductSupabase(existingProduct);

      showToast("✅ Stock mis à jour avec succès");

    } else {

      // ✅ NOUVEAU PRODUIT
      const newProduct = {
        id: productId,
        shop_id: shopId,
        name,
        price,
        stock,
        image,
        category: category || "Autre",
        wholesalePrice,
        wholesaleMinQty,
        barcode:
          "PRD-" + Date.now().toString().slice(-6),

        initialStock: stock,
        sold: 0,

        createdAt: new Date().toISOString(),
        createdBy:
          localStorage.getItem("username"),
        createdRole:
          localStorage.getItem("userRole")
      };

      await db.products.put(newProduct);

      const initialMovement = {
        id: crypto.randomUUID(),
        shop_id: shopId,

        product: newProduct.name,
        barcode: newProduct.barcode,

        type: "entry",
        reason: "initial_stock",

        quantity: stock,

        user: newProduct.createdBy,
        role: newProduct.createdRole,

        movement_date:
          new Date().toISOString(),

        date:
          new Date().toLocaleString("fr-FR"),

        comment: ""
      };

      await db.stockMovements.put(initialMovement);


      await saveProductToSupabase(newProduct);

      await saveStockMovementSupabase(initialMovement);
      //await db.stockMovements.put(saveStockmvt);

      showToast("✅ Produit ajouté avec succès");
    }
  }

  //--------------------------------------
  // ✅ RECHARGEMENT
  //--------------------------------------
  //products = await loadProducts();

  //stockMovements = await loadStockMovements();

  //--------------------------------------
  // ✅ RAFRAICHISSEMENT
  //--------------------------------------
  render();

  //--------------------------------------
  // ✅ RESET FORMULAIRE
  //--------------------------------------
  clearForm();

  editIndex = null;

  document.getElementById("saveBtn").innerText =
    "Enregistrer";

  document.getElementById("formSection").style.border =
    "none";

  document
    .getElementById("tableCard")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Permet d'editer un produit (en mode modification)
//--------------------------------------------------------------------
function editProduct(index) {

  const p = products[index];

  document.getElementById("saveBtn").innerText = "Modifier";
  document.getElementById("formTitle").innerText = "✏️ Modifier le produit";
  document.getElementById("archiveBtn").style.display = "inline-block";

  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("wholesalePrice").value = p.wholesalePrice || 0;
  document.getElementById("wholesaleMinQty").value = p.wholesaleMinQty || 0;
  document.getElementById("stockLabel").innerHTML = 'Stock <small style="color:#e67e22">📦 Le stock se modifie via Mouvement</small>';

  const stockInput = document.getElementById("stock");


  stockInput.value = p.stock || 0;
  stockInput.readOnly = true;

  const categoryEl = document.getElementById("category");

  if (categoryEl) {
    categoryEl.value = p.category || "Autre";
  }

  editIndex = index;

  // ✅ AFFICHER FORMULAIRE
  showAdminSection("form");

  const form = document.getElementById("formSection");

  // ✅ scroll vers formulaire
  form.scrollIntoView({ behavior: "smooth" });

  // ✅ highlight visuel
  form.style.border = "2px solid #f39c12";
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Suppression logique d'un produit sans vente
//--------------------------------------------------------------------

function deleteProduct(index) {

  // ✅ Popup confirmation
  const confirmDelete = confirm("Voulez-vous vraiment supprimer ce produit ?");

  // ✅ Si l'utilisateur annule → on arrête
  if (!confirmDelete) {
    return;
  }

  // ✅ Desactivation Produit
  products[index].isArchived = false;
  products[index].archivedAt = new Date().toISOString();

  //localStorage.setItem("products", JSON.stringify(products));

  render();

  // ✅ Sauvegarde
  //localStorage.setItem("products", JSON.stringify(products));
  // localStorage.setItem("products_updated_at", Date.now() + "_" + Math.random());


  // ✅ Rafraîchir affichage
  render();
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Suppression physique d'un produit sans vente
//--------------------------------------------------------------------
async function deletePhysicalProduct(index) {

  if (!navigator.onLine) {

    showToast(
      "📴 La suppression d'une fiche produit nécessite une connexion Internet"
    );

    return;
  }

  const product = products[index];

  if (!product) return;

  if ((product.sold || 0) > 0) {

    showToast(
      "❌ Impossible de supprimer un produit ayant déjà des ventes.\n\nUtilisez Archiver."
    );

    return;
  }

  const confirmDelete = confirm(
    `⚠️ Supprimer définitivement "${product.name}" ?`
  );

  if (!confirmDelete) {
    return;
  }

  try {

    // ✅ Suppression mouvements Supabase
    await deleteStockMovementsSupabase(product.barcode);

    //console.log("Produit à supprimer de supabase :", product.name);

    // ✅ Supprimer dans Supabase
    await deleteProductSupabase(product.barcode);

    // ✅ Supprimer dans IndexedDB
    await db.products.delete(product.id);

    // ✅ Supprimer les mouvements associés

    // ✅ Supprimer dans IndexedDB
    await db.stockMovements
      .where("product_barcode")
      .equals(product.barcode)
      .delete();

    // ✅ Supprimer du tableau mémoire
    products.splice(index, 1);

    // ✅ Rafraîchir les mouvements
    stockMovements = await loadStockMovements();

    render();

    showToast(`✅ ${product.name} supprimé avec succès`);

  } catch (error) {

    console.error(
      "Erreur suppression produit", error);

    showToast("❌ Erreur lors de la suppression");
  }
}

/*async function deletePhysicalProduct(index) {

  if (!navigator.onLine) {
    showToast("📴 La suppression d'une fiche produit nécessite une connexion Internet");

    return;
  }

  const p = products[index];

  if (!p) return;

  if ((p.sold || 0) > 0) {

    showToast(
      "❌ Impossible de supprimer un produit ayant déjà des ventes.\n\nUtilisez Archiver."
    );

    return;
  }

  const confirmDelete = confirm(
    `⚠️ Supprimer définitivement "${p.name}" ?`
  );

  if (!confirmDelete) {
    return;
  }

  products.splice(index, 1);

  // ✅ Synchronisation Supabase
  await deleteProductSupabase(p.barcode);

  localStorage.setItem(
    "products",
    JSON.stringify(products)
  );

  localStorage.setItem(
    "products_updated_at",
    Date.now() + "_" + Math.random()
  );

  render();

}*/

//--------------------------------------------------------------------
// ✅ FUNCTION : Annulation d'un ajout ou modification d'un produit
//--------------------------------------------------------------------
function cancelEdit() {

  clearForm();

  document.getElementById("formTitle").innerText = "➕ Ajouter un produit";
  render();
  document.getElementById("tableCard").scrollIntoView({
    behavior: "smooth"
  });

}


//---------------------------------------------------------------------------------
// ✅ FUNCTION : Netteyage des champs du formulaire aprés un ajout ou modification
//---------------------------------------------------------------------------------

function clearForm() {

  document.getElementById("category").value = "";
  document.getElementById("name").value = "";
  document.getElementById("price").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("wholesalePrice").value = "";
  document.getElementById("wholesaleMinQty").value = "";

  document.getElementById("stockLabel").innerHTML = 'Stock';


  document.getElementById("stock").readOnly = false;

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

//--------------------------------------------------------------------
// ✅ FUNCTION : Affichage du formulaire d'ajout d'un produit
//--------------------------------------------------------------------
function openAddProduct() {

  editIndex = null;

  clearForm();

  document.getElementById("saveBtn").innerText = "Enregistrer";

  document.getElementById("formTitle").innerText = "➕ Ajouter un produit";

  document.getElementById("formSection").style.border = "none";

  document.getElementById("stock").readOnly = false;

  document.getElementById("stockLabel").innerHTML = "Stock";

  document.getElementById("archiveBtn").style.display = "none";

  showAdminSection("form");

}
//--------------------------------------------------------------------
// ✅ FUNCTION : Charegement des produits depuis un fichier CSV
//--------------------------------------------------------------------

async function importCSV() {

  if (!navigator.onLine) {

    showToast(
      "📴 L'import des produits nécessite une connexion Internet"
    );

    return;
  }

  const input =
    document.getElementById("fileInput");

  const file = input.files[0];

  if (!file) {

    showToast(
      "Aucun fichier sélectionné"
    );

    return;
  }

  const shopId =
    await getCurrentShopId();

  const profile =
    await getCurrentProfile();

  const reader =
    new FileReader();

  reader.onload = async function (e) {

    const content =
      e.target.result;

    const lines = content
      .replace(/\r/g, "")
      .split("\n");

    let count = 0;

    for (const [index, line] of lines.entries()) {

      const clean =
        line.trim();

      if (!clean) continue;

      if (index === 0) continue;

      const parts =
        clean.split(/[,;]/);

      if (parts.length < 5) continue;

      const name =
        capitalizeWords(
          parts[0].trim()
        );

      const price =
        parseFloat(parts[1]);

      const wholesalePrice =
        parseFloat(parts[2]) || 0;

      const wholesaleMinQty =
        parseInt(parts[3]) || 0;

      const stock =
        parseInt(parts[4]);

      const image =
        parts[5]
          ? parts[5].trim()
          : null;

      const category =
        capitalizeWords(
          parts[6]
            ? parts[6].trim()
            : "Autre"
        );

      if (
        !name ||
        isNaN(price) ||
        isNaN(stock)
      ) {
        continue;
      }

      const normalizedName =
        name.toLowerCase().trim();

      const existingIndex =
        products.findIndex(
          p =>
            p.name
              .toLowerCase()
              .trim() === normalizedName
        );

      //--------------------------------------
      // ✅ PRODUIT EXISTANT
      //--------------------------------------
      if (existingIndex !== -1) {

        const existingProduct =
          products[existingIndex];

        existingProduct.stock += stock;

        existingProduct.entries ??= 0;
        existingProduct.entries += stock;

        if (
          existingProduct.initialStock ===
          undefined
        ) {

          existingProduct.initialStock =
            existingProduct.stock - stock;
        }

        existingProduct.sold ??= 0;

        if (image) {
          existingProduct.image = image;
        }

        existingProduct.category =
          category;

        const movement = {

          id: crypto.randomUUID(),
          shop_id: shopId,
          product:
            existingProduct.name,
          barcode:
            existingProduct.barcode,
          type: "entry",
          reason: "achat",
          quantity: stock,
          user:
            profile?.username ||
            localStorage.getItem(
              "username"
            ) ||
            "Inconnu",
          role:
            profile?.role ||
            localStorage.getItem(
              "userRole"
            ) ||
            "Inconnu",
          movement_date:
            new Date()
              .toISOString(),
          date:
            new Date()
              .toLocaleString(
                "fr-FR"
              ),
          comment:
            "Import CSV"
        };

        await db.stockMovements.put(
          movement
        );

        await saveStockMovementSupabase(
          movement
        );

        await db.products.put(
          existingProduct
        );

        await updateProductSupabase(
          existingProduct
        );
      }

      //--------------------------------------
      // ✅ NOUVEAU PRODUIT
      //--------------------------------------
      else {

        const newProduct = {
          id:
            crypto.randomUUID(),
          shop_id:
            shopId,
          name,
          price,
          wholesalePrice,
          wholesaleMinQty,
          stock,
          initialStock:
            stock,
          sold: 0,
          barcode:
            "PRD-" +
            Date.now()
              .toString()
              .slice(-6),
          image,
          category,
          createdAt:
            new Date()
              .toISOString(),
          createdBy:
            profile?.username ||
            localStorage.getItem(
              "username"
            ) ||
            "Inconnu",

          createdRole:
            profile?.role ||
            localStorage.getItem(
              "userRole"
            ) ||
            "Inconnu"
        };

        await db.products.put(
          newProduct
        );

        await saveProductToSupabase(
          newProduct
        );

        const initialMovement = {

          id:
            crypto.randomUUID(),

          shop_id:
            shopId,

          product:
            newProduct.name,

          barcode:
            newProduct.barcode,

          type:
            "entry",

          reason:
            "initial_stock",

          quantity:
            newProduct.stock,

          user:
            newProduct.createdBy,

          role:
            newProduct.createdRole,

          movement_date:
            new Date()
              .toISOString(),

          date:
            new Date()
              .toLocaleString(
                "fr-FR"
              ),

          comment:
            "Import CSV"
        };

        await db.stockMovements.put(
          initialMovement
        );

        await saveStockMovementSupabase(
          initialMovement
        );

        products.push(
          newProduct
        );

        count++;
      }
    }

    products =
      await loadProducts();

    stockMovements =
      await loadStockMovements();

    render();

    showToast(
      `${count} nouveaux produits importés ✅`
    );
  };

  reader.onerror =
    function () {

      showToast(
        "Erreur lecture fichier"
      );

    };

  reader.readAsText(file);

  document.getElementById(
    "fileInput"
  ).value = "";

  document
    .getElementById("tableCard")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}


//--------------------------------------------------------------------
// ✅ FUNCTION : Application d'une promo sur un produit
//--------------------------------------------------------------------

function openPromoPopup(index, currentValue) {

  if (index === undefined || index === -1) {
    console.error("❌ index invalide :", index);
    return;
  }

  currentPromoIndex = index;

  const p = products[index];

  document.getElementById("promoProductName").innerText = p.name;
  document.getElementById("promoInput").value = currentValue || 0;

  document.getElementById("promoModal").style.display = "flex";
}
//--------------------------------------------------------------------
// ✅ FUNCTION : Mise à jour d'une promo
//--------------------------------------------------------------------
/*async function updatePromo(index, value) {

  let promo = parseInt(value);

  if (isNaN(promo) || promo < 0) {
    promo = 0;
  }

  if (promo > 100) {
    promo = 100;
  }

  products[index].promo = promo;

  console.log("Promo avant update :", products[index].promo);

  localStorage.setItem("products", JSON.stringify(products));

  //Synchronisation supaBase
  await updateProductSupabase(products[index]);

  // ✅ refresh écran pour recalcul prix
  updateInactiveProducts();
}*/

//--------------------------------------------------------------------
// ✅ FUNCTION : Confirmation du promo lors d'une édition
//--------------------------------------------------------------------
async function confirmPromo() {

  let value = parseInt(document.getElementById("promoInput").value);

  if (isNaN(value) || value < 0) {
    value = 0;
  }

  if (value > 100) {
    value = 100;
  }

  products[currentPromoIndex].promo = value;

  localStorage.setItem("products", JSON.stringify(products));

  // ✅ Synchronisation Supabase

  await updateProductSupabase(products[currentPromoIndex]);

  closePromoPopup();

  updateInactiveProducts(); // ✅ refresh UI
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Fermeture du modal promo
//--------------------------------------------------------------------
function closePromoPopup() {
  document.getElementById("promoModal").style.display = "none";
}


//--------------------------------------------------------------------------------------
// ✅ FUNCTION : Permet d'archiver un produit inactif (sans vente depuis un certain jour)
//---------------------------------------------------------------------------------------

async function archiveProduct(index) {

  const confirmAction = confirm("Archiver ce produit ?");

  if (!confirmAction) {
    return;
  }

  const product = products[index];

  product.isArchived = true;

  product.archivedAt = new Date().toISOString();

  // ✅ Mise à jour locale immédiate
  await db.products.put(product);

  // ✅ Tentative de synchronisation Supabase
  const updatedProduct = await updateProductSupabase(product);

  if (updatedProduct) {

    await db.products.update(
      product.id,
      {
        pending_sync: false
      }
    );

  } else {

    await db.products.update(
      product.id,
      {
        pending_sync: true
      }
    );

    showToast("📴 Produit archivé localement. Synchronisation en attente.");

  }

  render();

}


//--------------------------------------------------------------------
// ✅ FUNCTION : Reactive un produit archivé
//--------------------------------------------------------------------

async function restoreProduct(index) {

  const product = products[index];

  product.isArchived = false;

  product.archivedAt = null;

  // ✅ Mise à jour locale immédiate
  await db.products.put(product);

  // ✅ Tentative de synchronisation Supabase
  const updatedProduct = await updateProductSupabase(product);

  if (updatedProduct) {

    await db.products.update(
      product.id,
      {
        pending_sync: false
      }
    );

  } else {

    await db.products.update(
      product.id,
      {
        pending_sync: true
      }
    );

    showToast("📴 Produit restauré localement. Synchronisation en attente.");

  }

  render();

}

//--------------------------------------------------------------------
// ✅ FUNCTION : La vue des produits archivés
//--------------------------------------------------------------------
function showArchived() {

  const list = document.getElementById("list");
  const mobileList = document.getElementById("mobileList");
  const header = document.getElementById("archivedHeader");

  mobileList.innerHTML = "";

  // ✅ HEADER
  header.innerHTML = `
    <strong>🗂️ Produits archivés</strong>
    <button onclick="render()">⬅️ Retour</button>
  `;
  header.style.display = "flex";

  document.getElementById("pagination").style.display = "none";
  document.getElementById("filterCategoryAdmin").style.display = "none";

  const archived = products.filter(p => p.isArchived === true);

  // ✅ AUCUN RESULTAT
  if (archived.length === 0) {
    mobileList.innerHTML = "<p>✅ Aucun produit archivé</p>";
    return;
  }

  // ✅ ✅ ✅ MODE MOBILE + DESKTOP (NOUVEAU PROPRE)
  renderArchivedCards(archived);

}

//--------------------------------------------------------------------
// ✅ FUNCTION : Réinitiliser les ventes
//--------------------------------------------------------------------
function resetSalesOnly() {

  const step1 = confirm("Réinitialiser la vente en cours ?");

  if (!step1) return;

  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if (!step2) return;

  cart = [];

  // ❌ ON NE SUPPRIME PLUS sales
  localStorage.removeItem("cart");

  renderCart();
  updateCartBadge();

  showToast("✅ Panier réinitialisé");
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Réinitialiser les stocks (Mettre à zero tous les stocks des produits)
//--------------------------------------------------------------------
function resetStockOnly() {

  const step1 = confirm("Réinitialiser les stocks ?");

  if (!step1) return;

  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if (!step2) return;

  products.forEach(p => {

    // ✅ on force un fallback fiable
    if (!p.initialStock || isNaN(p.initialStock)) {
      p.initialStock = p.stock + (p.sold || 0);
    }

    // ✅ reset propre
    p.stock = Number(p.initialStock);
    p.sold = 0;
  });

  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("products_updated_at", Date.now() + "_" + Math.random());


  render();

  showToast("✅ Stocks réinitialisés");
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Réinitialisation glable (Stock+vente)
//--------------------------------------------------------------------
function resetAll() {

  const step1 = confirm("⚠️ Reset stock + panier ?");
  if (!step1) return;

  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if (!step2) return;

  products.forEach(p => {

    if (!p.initialStock) {
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
  localStorage.setItem("products_updated_at", Date.now() + "_" + Math.random());


  render();
  updateCartBadge();

  showToast("✅ Stock réinitialisé + historique conservé");
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Suppression physique des produits
//--------------------------------------------------------------------
function resetProducts() {

  const step1 = confirm("⚠️ Supprimer tous les produits ?\nLa boutique sera vide");
  if (!step1) return;

  const step2 = confirm("🚨 DERNIÈRE confirmation ?");
  if (!step2) return;

  // ✅ vider produits
  products = [];

  // ✅ nettoyer stockage
  localStorage.removeItem("products");
  localStorage.setItem("products_updated_at", Date.now() + "_" + Math.random());

  render();

  showToast("✅ Tous les produits supprimés");
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Desavtiver un produitS
//--------------------------------------------------------------------
function updateInactiveProducts() {

  const days = parseInt(document.getElementById("inactiveDays").value);
  const list = document.getElementById("list");

  const inactive = getInactiveProducts(days);

  const mobileList = document.getElementById("mobileList");

  mobileList.innerHTML = "";


  // ✅ aucun résultat
  if (inactive.length === 0) {
    mobileList.innerHTML = "<p>✅ Aucun produit inactif</p>";
    return;
  }

  renderInactiveCards(inactive);

}

/************************************************************
 * FUNCTION : La vue des produits inactifs
 *************************************************************/
function showInactiveProducts() {

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


  // ✅ Affichage MOBILE ET DESKTOP
  document.getElementById("mobileList").style.display = "block";
  document.getElementById("tableStock").style.display = "none";

  updateInactiveProducts();
}

/************************************************************
 * FUNCTION : RENDER INCTIF PRODUCT
 *************************************************************/

function getInactiveProducts(days) {

  const today = new Date();

  return products
    .filter(p => !p.isArchived)
    .map(p => {

      let lastSaleDate = null;

      // ✅ Priorité au champ du produit
      if (p.lastSaleAt) {

        lastSaleDate =
          new Date(p.lastSaleAt);

      }

      // ✅ Compatibilité anciens produits
      else {
        sales.forEach(sale => {
          sale.items.forEach(item => {

            if (
              item.name.toLowerCase().trim() ===
              p.name.toLowerCase().trim()
            ) {

              const saleDate =
                new Date(sale.date);

              if (
                !lastSaleDate ||
                saleDate > lastSaleDate
              ) {

                lastSaleDate =
                  saleDate;
              }

            }

          });

        });

      }

      let diffDays = 0;

      // ✅ Produit déjà vendu
      if (lastSaleDate) {

        diffDays = Math.floor(
          (today - lastSaleDate)
          / (1000 * 60 * 60 * 24)
        );

      }

      // ✅ Jamais vendu
      else {

        const createdDate =
          new Date(p.createdAt);

        diffDays = Math.floor(
          (today - createdDate)
          / (1000 * 60 * 60 * 24)
        );

      }

      return {

        ...p,

        index: products.indexOf(p),

        days: diffDays,

        label: lastSaleDate
          ? `${diffDays} jours sans vente`
          : `Jamais vendu (${diffDays} jours)`

      };

    })
    .filter(p => p.days >= days)
    .sort((a, b) => b.days - a.days);

}

//---------------------------------------------------------
// ✅ FUNCTION : Modofication jours
//---------------------------------------------------------

function changeDays(delta) {

  const input = document.getElementById("inactiveDays");

  let value = parseInt(input.value) || 1;

  value += delta;

  if (value < 1) value = 1;

  input.value = value;

  updateInactiveProducts(); // ✅ refresh auto
}

//--------------------------------------------------------------------
// ✅ FUNCTION : Ouvrir le fichier Excel
//--------------------------------------------------------------------
function openExcelImport() {

  document.getElementById(
    "importExcelFile"
  ).click();

}

//------------------------------------------------
// ✅ FONCTION : Import produit via fichier Excel
//------------------------------------------------

async function importExcelProducts(event) {

  if (!navigator.onLine) {

    showToast("📴 L'import des produits nécessite une connexion Internet");

    return;
  }

  const file = event.target.files[0];

  if (!file) {

    showToast("Aucun fichier sélectionné");

    return;
  }

  const shopId = await getCurrentShopId();

  const profile = await getCurrentProfile();

  const reader = new FileReader();

  reader.onload = async function (e) {

    const data =
      new Uint8Array(
        e.target.result
      );

    const workbook =
      XLSX.read(data, {
        type: "array"
      });

    const sheet =
      workbook.Sheets[
      workbook.SheetNames[0]
      ];

    const rows =
      XLSX.utils.sheet_to_json(
        sheet,
        {
          defval: ""
        }
      );

    let count = 0;

    for (const row of rows) {

      const name =
        capitalizeWords(
          String(
            row["Nom"] || ""
          ).trim()
        );

      const price =
        parseFloat(
          row["Prix"] || 0
        );

      const wholesalePrice =
        parseFloat(
          row["Prix Gros"] || 0
        ) || 0;

      const wholesaleMinQty =
        parseInt(
          row["Seuil Gros"] || 0
        ) || 0;

      const stock =
        parseInt(
          row["Stock"] || 0
        );

      const image =
        String(
          row["Image"] || ""
        ).trim();

      const category =
        capitalizeWords(
          String(
            row["Catégorie"] || "Autre"
          ).trim()
        );

      if (
        !name ||
        isNaN(price) ||
        isNaN(stock)
      ) {
        continue;
      }

      const normalizedName =
        name.toLowerCase().trim();

      const existingIndex =
        products.findIndex(
          p =>
            p.name
              .toLowerCase()
              .trim() ===
            normalizedName
        );

      //--------------------------------------
      // ✅ PRODUIT EXISTANT
      //--------------------------------------
      if (existingIndex !== -1) {

        const existingProduct = products[existingIndex];

        existingProduct.stock += stock;

        existingProduct.entries ??= 0;
        existingProduct.entries += stock;

        if (
          existingProduct.initialStock ===
          undefined
        ) {

          existingProduct.initialStock = existingProduct.stock - stock;
        }

        existingProduct.sold ??= 0;

        if (image) {
          existingProduct.image = image;
        }

        existingProduct.category = category;

        const movement = {
          id: crypto.randomUUID(),
          shop_id: shopId,
          product: existingProduct.name,
          barcode: existingProduct.barcode,
          type: "entry",
          reason: "achat",
          quantity: stock,
          comment:
            "Import Excel",
          user:
            profile?.username ||
            localStorage.getItem(
              "username"
            ) ||
            "Inconnu",
          role:
            profile?.role ||
            localStorage.getItem(
              "userRole"
            ) ||
            "Inconnu",
          movement_date:
            new Date()
              .toISOString(),
          date:
            new Date()
              .toLocaleString(
                "fr-FR"
              )
        };

        await db.stockMovements.put(movement);

        await saveStockMovementSupabase(movement);

        await db.products.put(existingProduct);

        await updateProductSupabase(existingProduct);

      }

      //--------------------------------------
      // ✅ NOUVEAU PRODUIT
      //--------------------------------------
      else {

        const newProduct = {
          id:
            crypto.randomUUID(),
          shop_id:
            shopId,
          name,
          price,
          wholesalePrice,
          wholesaleMinQty,
          stock,
          initialStock:
            stock,
          sold: 0,
          barcode:
            "PRD-" +
            Date.now()
              .toString()
              .slice(-6) +
            Math.floor(
              Math.random() * 100
            ),
          image:
            image || null,
          category,
          createdAt:
            new Date()
              .toISOString(),
          createdBy:
            profile?.username ||
            localStorage.getItem(
              "username"
            ) ||
            "Inconnu",
          createdRole:
            profile?.role ||
            localStorage.getItem(
              "userRole"
            ) ||
            "Inconnu"
        };

        await db.products.put(newProduct);

        await saveProductToSupabase(newProduct);

        const initialMovement = {
          id:
            crypto.randomUUID(),
          shop_id:
            shopId,
          product:
            newProduct.name,
          barcode:
            newProduct.barcode,
          type:
            "entry",
          reason:
            "initial_stock",
          quantity:
            newProduct.stock,
          comment:
            "Import Excel",
          user:
            newProduct.createdBy,
          role:
            newProduct.createdRole,
          movement_date:
            new Date()
              .toISOString(),
          date:
            new Date()
              .toLocaleString("fr-FR")
        };

        await db.stockMovements.put(initialMovement);

        await saveStockMovementSupabase(initialMovement);

        products.push(
          newProduct
        );

        count++;
      }
    }

    products =
      await loadProducts();

    stockMovements =
      await loadStockMovements();

    render();

    showToast(
      `${count} nouveaux produits importés ✅`
    );
  };

  reader.onerror = function () {

    showToast(
      "Erreur lecture fichier"
    );

  };

  reader.readAsArrayBuffer(file);

  document.getElementById(
    "importExcelFile"
  ).value = "";

  document
    .getElementById("tableCard")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}

