/************************************************************
 * 📦 MODULE : VENTES / PANIER / HISTORIQUE
 * ==========================================================
 * 🎯 RESPONSABILITÉS :
 * - Gestion du panier (ajout / suppression / modification)
 * - Validation des ventes
 * - Dashboard des ventes du jour
 * - Historique des ventes (jour + détail)
 * - Pagination des données
 *
 * 🔹 Panier & ventes :
 * - vendre(index)              → ajouter produit au panier
 * - renderCart()               → afficher le panier
 * - updateQty(i, val)          → modifier quantité
 * - removeItem(i)              → supprimer produit
 * - validerPanier()            → valider une vente
 *
 * 🔹 Dashboard :
 * - renderDashboard()          → ventes du jour
 * - updateCartBadge()          → badge panier
 *
 * 🔹 Historique :
 * - renderSalesByDay()         → liste CA par jour
 * - showDetail(date)           → afficher détail d’un jour
 * - filterSalesByDate()        → KPI + analyse jour
 * - onChangeHistoryDate()      → changement date
 * - updateHistoryInput()       → type filtre (day/month/year)
 *
 * 🔹 Pagination :
 * - renderPaginationToday()    → pagination ventes jour
 * - renderPaginationDetail()   → pagination détail
 * - renderPaginationHistory()  → pagination historique
 * - changePageHistory()        → navigation pages
 *
 * 🔹 Maintenance :
 * - fixSales()                 → recalcul CA historique
 *
 ************************************************************/

const today = new Date().toISOString().split("T")[0];
document.getElementById("filterDate").value = today;

//EVENT FILTRE CREDIT
document.getElementById("searchCredit").addEventListener("input", renderCreditDashboard);

const inputCredit = document.getElementById("searchCredit");
const clearBtnCredit = document.getElementById("clearSearchCredit");

// Afficher / cacher la croix
inputCredit.addEventListener("input", () => {
  clearBtnCredit.style.display = inputCredit.value ? "block" : "none";
});

// Action clic croix
clearBtnCredit.addEventListener("click", () => {
  inputCredit.value = "";
  clearBtnCredit.style.display = "none";
  renderCreditDashboard(); // recharge ta liste
});


/************************************************************
 * 🛒 AJOUT PRODUIT AU PANIER
 * ----------------------------------------------------------
 * Ajoute un produit avec gestion :
 * - stock
 * - promo
 * - validation quantité
 ************************************************************/
/*function vendre(index, btn){

  const produit = products[index];

  // ✅ calcul promo
  const promo = Number(produit.promo) || 0;
  const price = Number(produit.price) || 0;

  const finalPrice = promo > 0
    ? price * (1 - promo / 100)
    : price;

  // ✅ quantité par défaut
  const q = 1;

  // ✅ vérification stock
  if(produit.stock <= 0){
    alert("❌ Stock épuisé");
    return;
  }

  const exist = cart.find(i => i.index === index);

  // ✅ si déjà dans panier → vérifier cumul
  if(exist){

    if(exist.quantity + q > produit.stock){
      alert(`❌ Stock insuffisant\nDisponible : ${produit.stock}`);
      return;
    }

    exist.quantity += q;

  } else {

    if(q > produit.stock){
      alert(`❌ Stock insuffisant\nDisponible : ${produit.stock}`);
      return;
    }

    cart.push({
      index,
      name: produit.name,
      price: parseFloat(finalPrice),
      quantity: q
    });
  }
  
  // ✅ ✅ CHANGEMENT VISUEL DU BOUTON
  btn.innerText = "✅ Ajouté";
  btn.style.background = "#2ecc71";

  // ✅ revenir à l’état initial après 1 seconde
  setTimeout(() => {
    btn.innerText = "Ajouter au panier";
    btn.style.background = "#3498db";
  }, 1000);


  // ✅ sauvegarde + UI
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartBadge();
}*/

/*GET PRODUCT PRICE*/
function getProductPrice(product, quantity) {

  const promo = Number(product.promo) || 0;

  // ✅ Prix détail avec promo
  const detailPrice = promo > 0
    ? Number(product.price) * (1 - promo / 100)
    : Number(product.price);

  // ✅ Prix gros sans promo
  const wholesalePrice =
    Number(product.wholesalePrice) || 0;

  const wholesaleMinQty =
    Number(product.wholesaleMinQty) || 0;

  if (
    wholesalePrice > 0 &&
    wholesaleMinQty > 0 &&
    quantity >= wholesaleMinQty
  ) {

    return {
      price: wholesalePrice,
      isWholesale: true
    };

  }

  return {
    price: detailPrice,
    isWholesale: false
  };

}

/*Nouvelle version compatible Mobile*/
function vendreWithQty(index, btn) {

  // ✅ support desktop + mobile
  let input =
    document.getElementById(`qty-${index}`) ||
    document.getElementById(`qty-mobile-${index}`);

  if (!input) {
    console.warn("Input non trouvé", index);
    return;
  }

  let q = parseInt(input.value || input.innerText) || 1;

  const produit = products[index];

  if (produit.stock <= 0) {
    showToast("❌ Stock épuisé");
    return;
  }

  /*const promo = Number(produit.promo) || 0;
  const price = Number(produit.price) || 0;

  const finalPrice = promo > 0
    ? price * (1 - promo / 100)
    : price;
    */
  const pricing = getProductPrice(produit, q);

  const exist = cart.find(i => i.index === index);

  if (exist) {

    const qtyToAdd =
      window.matchMedia("(min-width: 712px)").matches
        ? 1
        : q;

    if (exist.quantity + qtyToAdd > produit.stock) {
      showToast(
        `❌ Stock insuffisant\nDisponible : ${produit.stock}`
      );

      return;
    }

    exist.quantity += qtyToAdd;

    const pricing =
      getProductPrice(
        produit,
        exist.quantity
      );

    exist.price = pricing.price;
    exist.isWholesale = pricing.isWholesale;

  } else {

    if (q > produit.stock) {
      showToast(`❌ Stock insuffisant\nDisponible : ${produit.stock}`);
      return;
    }

    cart.push({
      index,
      name: produit.name,
      //price: parseFloat(finalPrice),
      price: pricing.price,
      quantity: q,
      isWholesale: pricing.isWholesale
    });
  }

  // ✅ feedback visuel (sécurisé 🔥)
  if (btn && btn.style) {
    btn.innerText = "✅";
    btn.style.background = "#2ecc71";

    setTimeout(() => {
      btn.innerText = "Ajouter";
      btn.style.background = "";
    }, 800);
  }

  // ✅ reset quantité
  if (input.tagName === "INPUT") {
    input.value = 1;
  } else {
    input.innerText = 1;
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartBadge();
  updateFloatingCart(); // ✅ important pour mobile
}

//--------------------------------------
// ✅ RECHERCHE PRODUIT PAR QR
//-------------------------------------

function addProductByBarcode(code) {

  const index = products.findIndex(
    p => p.barcode === code
  );

  if (index === -1) {
    showToast("❌ Produit introuvable");
    return;
  }

  const produit = products[index];

  // ✅ Aucun stock disponible
  if ((produit.stock || 0) <= 0) {

    showToast(
      `❌ Plus de stock disponible\n\nProduit : ${produit.name}`
    );

    return;
  }

  const exist = cart.find(
    i => i.index === index
  );

  if (
    exist &&
    exist.quantity >= produit.stock
  ) {

    if (
      lastScanned !== `STOCK-${produit.barcode}`
    ) {

      lastScanned =
        `STOCK-${produit.barcode}`;

      showToast(
        `❌ Plus de stock disponible\n\nProduit : ${produit.name}\nStock disponible : ${produit.stock}`
      );

      return;
    }

    return;
  }

  if (exist) {
    exist.quantity++;

    const pricing =
      getProductPrice(
        produit,
        exist.quantity
      );

    exist.price = pricing.price;
    exist.isWholesale =
      pricing.isWholesale;

  } else {
    const pricing =
      getProductPrice(
        produit,
        1
      );

    cart.push({
      index,
      name: produit.name,
      quantity: 1,
      price: pricing.price,
      isWholesale:
        pricing.isWholesale
    });

  }

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  renderCart();
  updateCartBadge();
  updateFloatingCart();
  updateCartMobileBtn();
}

// OUVERTURE SCANNER

/*function openQrScanner() {

  document.getElementById(
    "qrScannerModal"
  ).style.display = "flex";

  qrScanner = new Html5Qrcode(
    "qr-reader"
  );

  qrScanner.start(

    { facingMode: "environment" },

    {
      fps: 10,
      qrbox: 250
    },

    (decodedText) => {

      console.log(
        "QR détecté :",
        decodedText
      );

    },

    () => { }

  )
    .catch(err => {
      console.error(
        "Erreur caméra :",
        err
      );
    });

}*/
let qrScanner = null;

let lastScanned = "";
let lastScanTime = 0;

function openQrScanner() {

  document.getElementById(
    "qrScannerModal"
  ).style.display = "flex";

  qrScanner = new Html5Qrcode(
    "qr-reader"
  );

  qrScanner.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: 250
    },

    (decodedText) => {
      // ✅ évite les doubles scans
      if (
        decodedText === lastScanned &&
        Date.now() - lastScanTime < 1000
      ) {
        return;
      }
      lastScanned = decodedText;
      lastScanTime = Date.now();

      console.log(
        "QR détecté :",
        decodedText
      );

      // ✅ ajout produit
      addProductByBarcode(
        decodedText.trim()
      );

      showToast(
        "✅ Produit ajouté"
      );
    },

    () => { }

  )
    .catch(err => {
      console.error(
        "Erreur caméra :",
        err
      );
      showToast(
        "❌ Impossible d'accéder à la caméra"
      );
    });

}


function closeQrScanner() {

  if (!qrScanner) {
    document.getElementById(
      "qrScannerModal"
    ).style.display = "none";
    return;
  }
  qrScanner.stop()
    .then(() => {
      qrScanner.clear();
      qrScanner = null;
      document.getElementById(
        "qrScannerModal"
      ).style.display = "none";

    })
    .catch(console.error);

}

//--------------------------------------
// ✅ AJOUT MANUEL SI SCAN PAS OK
//-------------------------------------
function searchBarcodeManual() {

  const code = document
    .getElementById("manualBarcode")
    .value
    .trim();

  if (!code) return;

  addProductByBarcode(code);

  document.getElementById(
    "manualBarcode"
  ).value = "";

}


function changeQty(index, delta) {

  let el = document.getElementById(`qty-mobile-${index}`);
  if (!el) {
    el = document.getElementById(`qty-${index}`);
  }
  if (!el) {
    console.warn("❌ qty introuvable:", index);
    return;
  }

  let value;

  if (el.tagName === "INPUT") {
    value = parseInt(el.value) || 0;
  } else {
    value = parseInt(el.innerText) || 0;
  }

  const produit = products[index];
  const max = produit?.stock || 0;

  //const isTablet = window.matchMedia("(min-width: 712px) and (max-width: 1280px)").matches;
  const isTablet = window.matchMedia("(min-width: 712px)").matches;

  // ✅ ✅ TABLETTE → PAS DE VALUE MANUEL
  if (!isTablet) {
    value += delta;

    if (value < 0)
      value = 0;
    if (value >= max && delta > 0) {
      value = max;
      showToast(
        `❌ Stock insuffisant\nDisponible : ${max}`
      );
    }
    /*if (value > max)
      value = max;*/

    if (el.tagName === "INPUT") {
      el.value = value;
    } else {
      el.innerText = value;
    }
  }
  // console.log("✅ qty updated:", index, value);

  if (isTablet) {

    if (delta > 0) {

      vendreWithQty(index, null);

    } else {

      let existing =
        cart.find(item => item.index === index);

      if (existing) {
        existing.quantity -= 1;

        if (existing.quantity <= 0) {

          cart = cart.filter(item => item.index !== index);
        }
      }
    }

    // ✅ ✅ 🔥 SYNCHRO UI AVEC CART

    const existing = cart.find(item => item.index === index);
    const realQty = existing ? existing.quantity : 0;

    if (el.tagName === "INPUT") {
      el.value = realQty;
    } else {
      el.innerText = realQty;
    }
  }

  // ✅ UI toujours
  updateAddToCartButton();
  updateCartMobileBtn();

}

/************************************************************
 * 🛒 AFFICHAGE PANIER
 * ----------------------------------------------------------
 * Affiche les lignes du panier avec :
 * - image produit
 * - quantité modifiable
 * - total ligne
 ************************************************************/
function renderCart() {

  const table = document.querySelector("#cartSection table");
  const mobileDiv = document.getElementById("cartMobileList");

  table.style.display = "none";
  mobileDiv.style.display = "block";

  renderCartMobile();
  return;

  const totalEl = document.getElementById("total");

  // ✅ sécurité globale
  if (cart.length === 0) {
    creditData = null; // 🔥 reset automatique

    // ✅ redirection automatique vers produits
    setTimeout(() => {
      showSection("products");
    }, 300);

  }

  if (getPaymentMethod() === "credit" && creditData) {

    // ✅ total NET recalculé (IMPORTANT)
    const totalNet = cart.reduce((sum, i) => {
      const brut = i.price * i.quantity;
      const remise = Math.min(i.remise || 0, brut);
      return sum + (brut - remise);
    }, 0);

    // ✅ payé
    const paid = (creditData.payments || [])
      .reduce((sum, p) => sum + p.amount, 0);

    // ✅ ✅ restant correct
    const remaining = Math.max(0, totalNet - paid);


    totalEl.innerHTML = `
    <div><strong>💰 Total :</strong> ${formatPrice(total)} GNF</div>
    <div style="color:#2ecc71;"><strong>✅ Payé :</strong> ${formatPrice(paid)} GNF</div>
    <div style="color:#e74c3c;"><strong>📋 Restant :</strong> ${formatPrice(remaining)} GNF</div>
  `;

  } else {

    totalEl.innerHTML = `
    <div><strong>💰 Total :</strong> ${formatPrice(total)} GNF</div>
  `;

  }

  mobileDiv.style.display = "none";
  table.style.display = "table";
}


function updateRemise(index, value) {

  let remise = parseFloat(value) || 0;

  const item = cart[index];
  const brut = item.price * item.quantity;

  if (remise > brut) remise = brut;
  if (remise < 0) remise = 0;

  cart[index].remise = remise;

  localStorage.setItem("cart", JSON.stringify(cart));

  renderCart(); // ✅ uniquement ici
}



/************************************************************
 * 🔄 MODIFIER QUANTITÉ PANIER
 ************************************************************/
function updateQty(i, val) {

  let newQty = parseInt(val) || 1;

  const product = products[cart[i].index];
  const max = product?.stock || 0;

  // ✅ minimum bloqué à 1
  if (newQty < 1) newQty = 1;

  // ✅ maximum stock
  if (newQty > max) newQty = max;

  cart[i].quantity = newQty;

  // ✅ Gestion automatique prix gros
  const pricing = getProductPrice(
    product,
    newQty
  );

  cart[i].price = pricing.price;

  cart[i].isWholesale = pricing.isWholesale;

  localStorage.setItem(
    "cart",
    JSON.stringify(cart)
  );

  renderCart();
  updateCartBadge();
  updateFloatingCart();
  updateCartMobileBtn();

}

/************************************************************
 * ❌ SUPPRIMER PRODUIT PANIER
 ************************************************************/
function removeItem(i) {
  cart.splice(i, 1);

  // ✅ reset crédit si panier vide
  if (cart.length === 0) {
    creditData = null;
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartBadge();
  updateFloatingCart();
  updateCartMobileBtn();
}

/************************************************************
 * ✅ VALIDATION PANIER / VENTE
 * ----------------------------------------------------------
 * - met à jour stock
 * - enregistre vente
 * - enregistre logs
 * - reset panier
 ************************************************************/
async function validerPanier() {

  let total = 0;
  let totalItems = 0;

  let totalBrut = 0;
  let totalRemise = 0;
  let totalNet = 0;

  let clientPhone =
    document.getElementById("ticketPhone")?.value.trim() || "";

  // ✅ Normalisation WhatsApp Guinée
  clientPhone = clientPhone
    ? formatWhatsAppPhone(clientPhone)
    : "";

  //const paymentMethod = document.getElementById("paymentMethod").value;
  const paymentMethod = getPaymentMethod();

  // ✅ sécurité panier vide
  if (cart.length === 0) {
    showToast("❌ Panier vide, impossible de valider la vente");
    return;
  }

  // ✅ 1. CALCUL + STOCK
  for (const item of cart) {

    const product = products[item.index];

    if (product.stock < item.quantity) {
      showToast(`❌ Stock insuffisant pour ${product.name}`);
      return;
    }

    product.stock -= item.quantity;

    if (product.sold === undefined) {
      product.sold = 0;
    }

    product.sold += item.quantity;

    //Derniere vente
    product.lastSaleAt = new Date().toISOString();

    //Synchronisation supabase
    await updateProductSupabase(product);



    // ✅ ✅ ✅ CALCUL ICI (UNE SEULE FOIS)

    const brut = item.price * item.quantity;
    const remise = Math.min(item.remise || 0, brut);
    const net = brut - remise;

    totalBrut += brut;
    totalRemise += remise;
    totalNet += net;

    totalItems += item.quantity;

    stockLogs.unshift({
      product: item.name,
      type: "VENTE",
      quantity: item.quantity,
      date: new Date().toLocaleString()
    });
  }

  // ✅ sécurité total
  if (totalNet === 0) {
    showToast("❌ Le montant de la vente est nul");
    return;
  }

  // ✅ ✅ ✅ GESTION MODE DE PAIEMENT (VERSION PRO)
  let paymentDetails = null;

  if (paymentMethod === "credit") {

    if (!creditData) {
      showToast("❌ Veuillez saisir les infos crédit");
      return;
    }

    // ✅ 🔥 MISE À NIVEAU (sécurité si ancien modèle)
    if (!creditData.payments) {

      creditData.payments = creditData.paidNow > 0 ? [{
        amount: creditData.paidNow,
        date: new Date().toISOString()
      }] : [];

      creditData.total = totalNet;

      const totalPaid = creditData.payments
        .reduce((sum, p) => sum + p.amount, 0);

      creditData.remaining = totalNet - totalPaid;

      creditData.status =
        creditData.remaining <= 0 ? "PAYÉ" : "EN ATTENTE";
    }

    paymentDetails = creditData;
  }

  if (paymentMethod === "mobile") {
    paymentDetails = {
      type: "mobile",
      total: totalNet,
      status: "PAYÉ"
    };
  }

  if (paymentMethod === "cash") {
    paymentDetails = {
      type: "cash",
      total: totalNet,
      status: "PAYÉ"
    };
  }

  // ✅ sauvegarde logs
  localStorage.setItem("stockLogs", JSON.stringify(stockLogs));

  // ✅ ✅ ✅ ENREGISTREMENT VENTE (PRO)
  const salePhone =
    paymentMethod === "credit"
      ? creditData?.clientPhone || ""
      : clientPhone;

  sales.push({

    id: Date.now(),
    user: localStorage.getItem("username"),
    role: localStorage.getItem("userRole"),
    items: cart.map(item => ({
      name: item.name,
      quantity: item.quantity,
      // ✅ prix réellement appliqué
      price: item.price,
      // ✅ informations tarifaires
      isWholesale: item.isWholesale || false,
      detailPrice: products[item.index]?.price || 0,
      wholesalePrice: products[item.index]?.wholesalePrice || 0,
      remise: item.remise || 0,
      total: (item.price * item.quantity) - (item.remise || 0)

    })),

    totalBrut,
    totalRemise,
    total: totalNet,
    clientPhone: salePhone,

    payment: {
      ...paymentDetails,
      total: totalNet, // ✅ crédit basé sur net
      remaining: totalNet - (paymentDetails.payments?.reduce((s, p) => s + p.amount, 0) || 0)
    },

    date: new Date()
  });

  //console.log("PAYMENT SAVED:", paymentMethod);


  // ✅ sauvegardes
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("sales", JSON.stringify(sales));


  // ✅ reset panier
  cart = [];
  localStorage.setItem("cart", JSON.stringify([]));

  // ✅ reset crédit
  creditData = null;

  // ✅ refresh UI
  renderCart();
  renderProducts();
  renderDashboard();
  renderSalesByDay();
  updateCartBadge();
  renderStatsTables();
  filterSalesByDate();
  renderLowStock();
  updateCartMobileBtn();

  showToast("✅ Vente validée avec succès");

  document.querySelector('input[name="paymentMethod"][value="cash"]').checked = true;
  document.getElementById("ticketPhone").value = "";

}


/************************************************************
 * 🔔 BADGE PANIER
 * ----------------------------------------------------------
 * Met à jour le nombre d’articles affiché
 ************************************************************/

function updateCartBadge() {

  const btn = document.getElementById("cartBtn");

  let totalItems = 0;

  cart.forEach(item => {
    totalItems += item.quantity;
  });

  // ✅ texte bouton
  btn.innerHTML = `
    Panier 🛒 
    <span class="cart-badge">${totalItems}</span>
   `;

  // ✅ actif si panier non vide
  if (totalItems > 0) {

    // ✅ couleur active
    btn.classList.add("cart-active");

    // ✅ animation pulse
    btn.classList.add("cart-pulse");

    setTimeout(() => {
      btn.classList.remove("cart-pulse");
    }, 400);

  } else {
    btn.classList.remove("cart-active");
  }
}

/************************************************************
 * 📊 DASHBOARD VENTES DU JOUR
 * ----------------------------------------------------------
 * - CA total
 * - nb articles
 * - top produits
 ************************************************************/

function renderDashboard() {

  const salesList = document.getElementById("salesList");
  salesList.innerHTML = "";

  // ✅ KPI
  let caEncaisse = 0;
  let encours = 0;
  let caTotal = 0;
  let totalItems = 0;
  let totalRemise = 0;
  let caTotalbrut = 0;
  let caNet = 0;
  let totalTickets = 0;

  const today = new Date().toDateString();

  document.getElementById("todayDate").innerText = formatDateFR(new Date());
  //formatDate(new Date().toLocaleDateString());

  const summary = {};

  // ✅ 1. LOOP VENTES
  sales.forEach(sale => {

    if (new Date(sale.date).toDateString() === today) {

      totalTickets++; // ✅ 1 ticket = 1 vente

      const saleTotal = sale.payment?.total || sale.total || 0;

      caTotal += saleTotal;

      // ✅ PAIEMENT
      let totalPaid = 0;

      if (sale.payment?.type === "credit") {

        const payments = sale.payment.payments || [];

        totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

        caEncaisse += totalPaid;

        // ✅ encours calcul propre
        const creditRemaining = Math.max(0, saleTotal - totalPaid);

        encours += creditRemaining;

      } else {

        totalPaid = saleTotal;
        caEncaisse += saleTotal;
      }

      //NOUVEAU CALCUL REMISE (AU NIVEAU VENTE)
      const totalRemiseSale = sale.totalRemise ?? sale.items.reduce((sum, item) => {
        const brut = item.price * item.quantity;
        const net = item.total || brut;
        return sum + (brut - net);
      }, 0);

      totalRemise += totalRemiseSale;
      //const CaNet = brut - totalRemise;


      // ✅ recherche
      const search = document.getElementById("searchInput")
        .value.toLowerCase().trim();

      sale.items.forEach(item => {

        if (search && !item.name.toLowerCase().includes(search)) {
          return;
        }

        totalItems += item.quantity;

        if (!summary[item.name]) {
          summary[item.name] = {
            quantity: 0,
            total: 0,       // ✅ payé uniquement
            totalNet: 0,    // ✅ total réel
            price: item.price,
            rawTotal: 0,
            remise: 0
          };
        }

        // ✅ total brut produit

        const brut = item.price * item.quantity;
        caTotalbrut += brut;
        const net = item.total || (brut - (item.remise || 0));

        summary[item.name].quantity += item.quantity;
        summary[item.name].rawTotal += brut;
        summary[item.name].remise += item.remise || 0;

        // ✅ répartition encaissé proportionnelle
        //const ratio = saleTotal > 0 ? totalPaid / saleTotal : 0;

        //summary[item.name].total += net * ratio;
        //summary[item.name].total += net;
        // ✅ total réel produit
        summary[item.name].totalNet += net;

        // ✅ ratio paiement (simple et stable)
        const ratio = saleTotal > 0 ? totalPaid / saleTotal : 0;

        // ✅ payé uniquement
        summary[item.name].total += net * ratio;


      });

    }

  });

  encours = Math.max(0, caTotal - caEncaisse);
  const CaNet = caTotalbrut - totalRemise;
  // ✅ KPI affichage
  const remiseEl = document.getElementById("totalRemise");

  document.getElementById("caEncaisse").innerText = formatPrice(caEncaisse);
  document.getElementById("encours").innerText = formatPrice(encours);
  document.getElementById("caBrut").innerText = formatPrice(caTotalbrut);
  document.getElementById("caNet").innerText = formatPrice(CaNet);
  remiseEl.innerHTML = `<span style="color:red;">- ${formatPrice(totalRemise)}</span>`;
  document.getElementById("todayTickets").innerText = totalTickets;
  document.getElementById("todayItems").innerText = totalItems;

  document.querySelector("#todaySection table").style.display = "none";

  const mobileList = document.getElementById("salesListMobile");
  if (mobileList) mobileList.style.display = "flex";

  renderSalesMobile();


}


/************************************************************
 * 📅 LISTE VENTES PAR JOUR
 * ----------------------------------------------------------
 * Regroupe les ventes par date
 ************************************************************/
function renderSalesByDay() {

  const container = document.getElementById("salesByDay");
  container.innerHTML = "";

  const today = new Date().toISOString().split("T")[0];

  const summary = {};

  sales.forEach(sale => {

    const d = new Date(sale.date);
    const key = d.toISOString().split("T")[0];

    if (!summary[key]) {
      summary[key] = {
        brut: 0,
        remise: 0,
        net: 0,
        encaisse: 0,
        credit: 0
      };
    }

    const saleTotal = sale.payment?.total || sale.total || 0;

    // ✅ recalcul brut
    let brutSale = 0;

    sale.items.forEach(item => {
      brutSale += item.price * item.quantity;
    });

    const netSale = saleTotal;
    const remiseSale = brutSale - netSale;

    // ✅ cumul
    summary[key].brut += brutSale;
    summary[key].remise += remiseSale;
    summary[key].net += netSale;

    // ✅ crédit / encaissé
    if (sale.payment?.type === "credit") {
      const payments = sale.payment.payments || [];

      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

      summary[key].encaisse += totalPaid;
      summary[key].credit += (netSale - totalPaid);

    } else {
      summary[key].encaisse += netSale;
    }
  });

  let dates = Object.keys(summary);

  // ✅ forcer la date sélectionnée
  const selectedDate = document.getElementById("filterDate").value;

  if (selectedDate && !dates.includes(selectedDate)) {
    dates.unshift(selectedDate);

    // ✅ créer ligne vide
    summary[selectedDate] = {
      brut: 0,
      remise: 0,
      net: 0,
      encaisse: 0,
      credit: 0
    };
  }

  if (!dates.includes(today)) {
    dates.unshift(today);
  }

  const sortedDates = dates.sort((a, b) => {
    if (a === today) return -1;
    if (b === today) return 1;
    return b.localeCompare(a);
  });

  const start = (currentPageHistory - 1) * itemsPerPageHistory;
  const paginatedDates = sortedDates.slice(start, start + itemsPerPageHistory);

  // ✅ RESPONSIVE SWITCH
  const isMobileOrTablet = window.matchMedia("(max-width: 1024px)").matches;
  //const isMobile = window.innerWidth <= 768;


  const table = document.getElementById("salesByDay").closest("table");
  const mobile = document.getElementById("historyMobileList");

  if (isMobileOrTablet) {
    if (table)
      table.style.display = "none";
    if (mobile)
      mobile.style.display = "flex";

    // ✅ transformer les données pour mobile
    /*const mobileData = paginatedDates.map(date => ({
                date: formatDateFR(new Date(date)),
                caBrut: summary[date].brut,
                remise: summary[date].remise,
                caNet: summary[date].encaisse,
                credit: summary[date].credit
            }));*/
    const mobileData = paginatedDates.map(date => ({
      rawDate: date, // ✅ IMPORTANT
      date: formatDateFR(new Date(date)),
      caBrut: summary[date].brut,
      remise: summary[date].remise,
      caNet: summary[date].encaisse,
      credit: summary[date].credit
    }));

    renderHistoryMobile(mobileData);

    // ✅ pagination (IDENTIQUE desktop)
    // renderPaginationHistory(sortedDates.length);


    return; // ✅ STOP ici → ne pas rendre le tableau
  } else {
    if (table)
      table.style.display = "table";
    if (mobile)
      mobile.style.display = "none";
  }

  paginatedDates.forEach(date => {

    const row = document.createElement("tr");

    //const displayDate = new Date(date).toLocaleDateString();
    const displayDate = formatDateFR(new Date(date));

    const caEncaisse = summary[date]?.caEncaisse || 0;
    const encours = summary[date]?.encours || 0;

    row.innerHTML = `
       <td><span class="price-cell">${displayDate}</span></td>
 
       <td>
         <strong class="price-cell">${formatPrice(summary[date].brut)} GNF</strong>
       </td>
 
      <td style="${summary[date].remise > 0 ? 'color:red;' : 'color:#999;'}">
       ${summary[date].remise > 0
        ? `- ${formatPrice(summary[date].remise)} GNF`
        : "-"
      }
     </td>
 
    <td>
     <strong class="price-cell">✅ ${formatPrice(summary[date].encaisse)} GNF encaissé</strong>
 
     ${summary[date].credit > 0 ? `
       <div style="color:orange; font-size:12px;">
         🟠 ${formatPrice(summary[date].credit)} crédit
       </div>
     ` : ""}
   </td>
 
   <td>
   <button onclick="showDetail('${date}')">
       Voir détail
     </button>
   </td>
 `;

    // ✅ mise en évidence aujourd’hui
    if (date === today) {
      row.style.background = "#d4edda";
      row.style.fontWeight = "bold";
    }

    container.appendChild(row);
  });

  renderPaginationHistory(sortedDates.length);
}

/************************************************************
 * 🔍 DÉTAIL JOURNÉE
 * ----------------------------------------------------------
 * Affiche :
 * - KPI du jour
 * - top produits
 * - comparaison jour précédent
 ************************************************************/
function showDetail(date) {

  document.getElementById("filterDate").value = date;

  currentPageDetail = 1;

  filterSalesByDate();

  // ✅ afficher le bloc détail
  document.getElementById("detailSection").style.display = "block";

  document.getElementById("historyKPI").scrollIntoView({
    behavior: "smooth"
  });
}



/************************************************************
 * 📄 PAGINATION VENTES JOUR
 ************************************************************/
function renderPaginationToday(totalItems) {

  const container = document.getElementById("paginationToday");
  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPageToday) || 1;

  // ⬅️
  const prev = document.createElement("button");
  prev.innerText = "⬅️";
  prev.disabled = currentPageToday === 1;
  prev.onclick = () => {
    currentPageToday--;
    renderDashboard();
    // ✅ SCROLL AUTOMATIQUE
    document.getElementById("salesList").parentElement.scrollIntoView({
      behavior: "smooth"
    });
  };
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPageToday) {
      btn.style.background = "#2ecc71";
    }

    btn.onclick = () => {
      currentPageToday = i;
      renderDashboard();
      // ✅ SCROLL AUTOMATIQUE
      document.getElementById("salesList").parentElement.scrollIntoView({
        behavior: "smooth"
      });
    };

    container.appendChild(btn);
  }

  // ➡️
  const next = document.createElement("button");
  next.innerText = "➡️";
  next.disabled = currentPageToday === totalPages;
  next.onclick = () => {
    currentPageToday++;
    renderDashboard();
    // ✅ SCROLL AUTOMATIQUE
    document.getElementById("salesList").parentElement.scrollIntoView({
      behavior: "smooth"
    });
  };
  container.appendChild(next);
}


/************************************************************
 * 📄 PAGINATION DÉTAIL
 ************************************************************/
function renderPaginationDetail(totalItems) {

  const container = document.getElementById("paginationDetail");
  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPageDetail) || 1;

  // ⬅️
  const prev = document.createElement("button");
  prev.innerText = "⬅️";
  prev.disabled = currentPageDetail === 1;
  prev.onclick = () => {
    currentPageDetail--;
    filterSalesByDate();
    // ✅ SCROLL AUTOMATIQUE
    document.getElementById("salesDetail").parentElement.scrollIntoView({
      behavior: "smooth"
    });
  };
  container.appendChild(prev);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPageDetail) {
      btn.style.background = "#2ecc71";
    }

    btn.onclick = () => {
      currentPageDetail = i;
      filterSalesByDate();

      // ✅ SCROLL AUTOMATIQUE
      document.getElementById("salesDetail").parentElement.scrollIntoView({
        behavior: "smooth"
      });
    };

    container.appendChild(btn);
  }

  // ➡️
  const next = document.createElement("button");
  next.innerText = "➡️";
  next.disabled = currentPageDetail === totalPages;
  next.onclick = () => {
    currentPageDetail++;
    filterSalesByDate();
    // ✅ SCROLL AUTOMATIQUE
    document.getElementById("salesDetail").parentElement.scrollIntoView({
      behavior: "smooth"
    });
  };
  container.appendChild(next);
}

/************************************************************
 * 📄 PAGINATION HISTORIQUE
 ************************************************************/
function renderPaginationHistory(totalItems) {

  const container = document.getElementById("paginationHistory");
  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.ceil(totalItems / itemsPerPageHistory) || 1;

  // ⬅️
  const prevBtn = document.createElement("button");
  prevBtn.innerText = "⬅️";
  prevBtn.disabled = currentPageHistory === 1;
  prevBtn.onclick = () => changePageHistory(currentPageHistory - 1);
  container.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPageHistory) {
      btn.style.background = "#2ecc71";
    }

    btn.onclick = () => changePageHistory(i);
    container.appendChild(btn);
  }

  // ➡️
  const nextBtn = document.createElement("button");
  nextBtn.innerText = "➡️";
  nextBtn.disabled = currentPageHistory === totalPages;
  nextBtn.onclick = () => changePageHistory(currentPageHistory + 1);
  container.appendChild(nextBtn);
}

/************************************************************
 * 🔄 CHANGEMENT PAGE HISTORIQUE
 ************************************************************/

function changePageHistory(page) {
  window.fromPagination = true;
  currentPageHistory = page;
  renderSalesByDay();
  window.fromPagination = false;

}

/************************************************************
 * 📅 CHANGEMENT DATE HISTORIQUE
 ************************************************************/

function onChangeHistoryDate() {

  currentPageHistory = 1;

  // ✅ mettre à jour uniquement le tableau
  renderSalesByDay();

  // ✅ cacher le détail
  document.getElementById("detailSection").style.display = "none";
}

/************************************************************
 * 🛠️ CORRECTION HISTORIQUE CA
 * ----------------------------------------------------------
 * Recalcule le CA des ventes existantes
 ************************************************************/
function fixSales() {

  sales.forEach(sale => {
    sale.total = sale.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  });

  localStorage.setItem("sales", JSON.stringify(sales));

  showToast("✅ CA corrigé !");
}

/************************************************************
 * 🔧 CONFIGURATION FILTRE HISTORIQUE
 * ----------------------------------------------------------
 * Change le type d’entrée :
 * - jour
 * - mois
 * - année
 ************************************************************/
function updateHistoryInput() {

  const mode = document.getElementById("historyMode").value;
  const input = document.getElementById("filterDate");

  if (mode === "day") {
    input.type = "date";
  }

  if (mode === "month") {
    input.type = "month";
  }

  if (mode === "year") {
    input.type = "number";
    input.placeholder = "Ex: 2026";
  }

  // reset
  input.value = "";
}

function onPaymentChange() {

  const mode = getPaymentMethod();

  // ✅ ❌ BLOQUER DIRECT SI PANIER VIDE
  if (mode === "credit" && cart.length === 0) {
    showToast("🛒 Ajoutez un produit avant d'utiliser le crédit");

    // ✅ revenir sur comptant
    document.querySelector('input[name="paymentMethod"][value="cash"]').checked = true;

    return;
  }

  // ✅ ouvrir modal seulement si OK
  if (mode === "credit") {
    openCreditModal();
  }

}


function openCreditModal() {


  // ✅ ✅ ✅ RESET TOTAL CRÉDIT
  creditData = null;
  document.getElementById("clientName").value = "";
  document.getElementById("clientPhone").value = "";
  document.getElementById("dueDate").value = "";


  const modal = document.getElementById("creditModal");

  // ✅ sécurité panier vide (double protection)
  if (cart.length === 0) {
    showToast("🛒 Le panier est vide");

    document.querySelector('input[name="paymentMethod"][value="cash"]').checked = true;
    return;
  }

  // ✅ affichage modal
  modal.style.display = "flex";

  // ✅ ✅ calcul TOTAL NET (avec remise)
  const total = cart.reduce((sum, i) => {

    const price = Number(i.price) || 0;
    const qty = Number(i.quantity) || 0;

    const brut = price * qty;
    const remise = Math.min(Number(i.remise) || 0, brut);

    return sum + (brut - remise);

  }, 0);

  // ✅ inputs
  const paidInput = document.getElementById("paidNow");
  const remainingInput = document.getElementById("remaining");

  // ✅ reset valeurs
  paidInput.value = 0;
  remainingInput.value = total;

  // ✅ ✅ ✅ EVENT ULTRA IMPORTANT (fix principal)
  paidInput.oninput = function () {

    let paid = Number(this.value) || 0;

    // ✅ empêcher dépassement
    if (paid > total) {
      paid = total;
      this.value = total;
    }

    const remaining = total - paid;

    // ✅ update UI
    remainingInput.value = remaining;


    // ✅ ✅ ✅ UPDATE UI EN DIRECT

    // ✅ ✅ ✅ NOUVEL OBJET PROPRE (PAS DE MERGE)
    creditData = {
      type: "credit",
      total: total,
      payments: paid > 0 ? [{
        amount: paid
      }
      ] : [],
      remaining: remaining
    };


    renderCart(); // 🔥 MAJ visuelle instant

    // ✅ BONUS : couleur dynamique
    if (remaining === 0) {
      remainingInput.style.color = "#2ecc71"; // vert
    } else {
      remainingInput.style.color = "#e74c3c"; // rouge
    }
  };

  // ✅ BONUS UX : focus automatique
  setTimeout(() => {
    paidInput.focus();
  }, 100);
}

function closeCreditModal() {

  document.getElementById("creditModal").style.display = "none";

  // reset si annulation
  //reset vers comptant
  document.querySelector('input[name="paymentMethod"][value="cash"]').checked = true;


  // ✅ ✅ ✅ RESET CREDIT
  creditData = null;

  renderCart(); // 🔥 refresh UI

}

function confirmCredit() {

  const paidNow = Number(document.getElementById("paidNow").value) || 0;

  // ✅ TOTAL AVEC REMISE (IMPORTANT)
  const total = cart.reduce((sum, i) => {
    const brut = i.price * i.quantity;
    const remise = Math.min(i.remise || 0, brut);
    return sum + (brut - remise);
  }, 0);

  const dueDate = document.getElementById("dueDate").value;
  const clientName = document.getElementById("clientName").value.trim();
  const clientPhone = document.getElementById("clientPhone").value.trim();

  if (!clientName) {
    showToast("❌ Nom client obligatoire");
    return;
  }

  // ✅ ✅ ✅ SÉCURITÉ MONTANT
  if (paidNow > total) {
    showToast("❌ Le montant payé dépasse le total");
    return;
  }

  const remaining = total - paidNow;

  // ✅ ✅ ✅ DATA CREDIT PROPRE
  creditData = {
    type: "credit",
    total: total,

    payments: paidNow > 0 ? [{
      amount: paidNow,
      date: new Date().toISOString()
    }] : [],

    remaining: remaining,

    clientName,
    clientPhone,
    dueDate,
    createdAt: new Date().toISOString(),

    status: remaining > 0 ? "EN ATTENTE" : "PAYÉ"
  };

  // ✅ reset visuel (important UX)
  document.getElementById("remaining").value = remaining;

  document.getElementById("creditModal").style.display = "none";

  renderCart(); // ✅ rafraîchit affichage total crédit
}

function filterCredits(credits) {

  const search = document
    .getElementById("searchCredit")
    ?.value
    ?.toLowerCase()
    ?.trim() || "";

  if (!search) return credits;

  const clean = s => (s || "")
    .toLowerCase()
    .replace(/\s+/g, "");

  return credits.filter(c =>
    clean(c.clientName).includes(clean(search)) ||
    clean(c.clientPhone).includes(clean(search))
  );
}



function renderCreditDashboard() {

  const container = document.getElementById("creditList");
  const totalDiv = document.getElementById("totalCredit");

  container.innerHTML = "";

  let totalCredit = 0;

  const today = new Date();

  const credits = [];

  sales.forEach((sale, index) => {

    if (sale.payment && sale.payment.type === "credit") {

      //const remaining = sale.payment.remaining || 0;
      // ✅ recalcul total NET depuis les items
      const totalNet = (sale.items || []).reduce((sum, item) => {
        const brut = item.price * item.quantity;
        const remise = item.remise || 0;
        return sum + (brut - remise);
      }, 0);

      // ✅ total payé
      const totalPaid = (sale.payment.payments || [])
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // ✅ ✅ remaining fiable
      const remaining = Math.max(0, totalNet - totalPaid);

      // ✅ garder TOUS les crédits
      credits.push({
        index,
        ...sale.payment,
        remaining,
        total: totalNet, // ✅ AJOUT IMPORTANT
        payments: sale.payment.payments || []// ✅ sécurité
      });


      // ✅ total seulement si restant
      if (remaining > 0) {
        totalCredit += remaining;
      }

    }

  });

  //FILTRE CREDITS

  const filteredCredits = filterCredits(credits);

  // ✅ TRI
  //credits.sort((a, b) => {

  filteredCredits.sort((a, b) => {

    const today = new Date();

    const dateA = a.dueDate ? new Date(a.dueDate) : new Date("2100-01-01");
    const dateB = b.dueDate ? new Date(b.dueDate) : new Date("2100-01-01");

    const aPaid = a.remaining <= 0;
    const bPaid = b.remaining <= 0;

    const aLate = dateA < today && !aPaid;
    const bLate = dateB < today && !bPaid;

    // ✅ 1. EN RETARD en premier
    if (aLate && !bLate) return -1;
    if (!aLate && bLate) return 1;

    // ✅ 2. ENSUITE crédits actifs (non payés)
    if (!aPaid && bPaid) return -1;
    if (aPaid && !bPaid) return 1;

    // ✅ 3. TRI PAR DATE
    return dateA - dateB;

  });

  const table = document.getElementById("creditList").closest("table");
  const mobile = document.getElementById("creditMobileList");

  if (table)
    table.style.display = "none";
  if (mobile)
    mobile.style.display = "flex";

  // ✅ on envoie les données déjà calculées
  renderCreditMobile(credits, totalCredit);

  return; // ✅ PLus d'affichage tableau un affichage unique mobile/desktop

}


function addPayment(index) {

  const sale = sales[index];

  if (!sale.payment || sale.payment.type !== "credit") return;

  // ✅ calcul réel avant affichage
  const totalPaid = (sale.payment.payments || [])
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const total = sale.payment.total || 0;
  const remaining = Math.max(0, total - totalPaid);

  // ✅ si déjà payé → block
  if (remaining <= 0) {
    alert("✅ Ce crédit est déjà soldé");
    return;
  }

  let amount = prompt(
    `💰 Montant payé (reste : ${formatPrice(remaining)} GNF) :`,
    0
  );

  amount = Number(amount);

  if (!amount || amount <= 0) {
    showToast("❌ Montant invalide");
    return;
  }

  // ✅ ✅ ✅ BLOQUER SI DÉPASSEMENT
  if (amount > remaining) {
    showToast(`❌ Le montant dépasse la dette (${formatPrice(remaining)} GNF)`);
    return;
  }

  // ✅ init si vide
  if (!sale.payment.payments) {
    sale.payment.payments = [];
  }

  // ✅ ajouter paiement
  sale.payment.payments.push({
    amount: amount,
    date: new Date().toISOString()
  });

  // ✅ recalcul final
  const newTotalPaid = sale.payment.payments
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const newRemaining = Math.max(0, total - newTotalPaid);

  sale.payment.remaining = newRemaining;

  sale.payment.status =
    newRemaining <= 0 ? "PAYÉ" : "EN ATTENTE";

  // ✅ sauvegarde
  localStorage.setItem("sales", JSON.stringify(sales));

  // ✅ refresh UI
  renderCreditDashboard();

  showToast("✅ Paiement enregistré");
}

// Mode de paiement Radio
function getPaymentMethod() {
  const selected = document.querySelector('input[name="paymentMethod"]:checked');
  return selected ? selected.value : "cash";
}

document.getElementById("paidNow").addEventListener("input", function () {

  const total = cart.reduce((sum, i) => {
    const brut = i.price * i.quantity;
    const remise = Math.min(i.remise || 0, brut);
    return sum + (brut - remise);
  }, 0);

  const paid = Number(this.value) || 0;

  const remaining = total - paid;

  document.getElementById("remaining").value =
    remaining >= 0 ? remaining : 0;
});


document.addEventListener("DOMContentLoaded", () => {

  const savedCart = localStorage.getItem("cart");

  if (savedCart) {
    cart = JSON.parse(savedCart);
  }

  renderCart();
  updateCartBadge();

});

/************************************************************
 * Gestion de rôle
 ************************************************************/

document.addEventListener("DOMContentLoaded", () => {

  const role = localStorage.getItem("userRole");

  if (role === "vendeur") {

    const btnHistory = document.getElementById("btnHistory");
    const btnStats = document.getElementById("btnStats");

    if (btnHistory) btnHistory.style.display = "none";
    if (btnStats) btnStats.style.display = "none";
  }

});