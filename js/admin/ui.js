/************************************************************
 * 🎨 UI / RENDER
 ************************************************************/

function updateUserInfo() {

  const role = localStorage.getItem("userRole");
  const label = document.getElementById("userInfo");

  if (!label) return;

  if (role === "admin") {
    label.innerText = "👑 Admin";
    label.style.color = "#2c3e50";
  } else {
    label.innerText = "🛒 Vendeur";
    label.style.color = "#27ae60";
  }
}


function updateUserUI() {

  const username = localStorage.getItem("username");
  const role = localStorage.getItem("userRole");

  // ✅ HEADER
  const userEl = document.getElementById("userInfo");

  if (userEl) {

    if (role === "admin") {
      userEl.innerText = "👑 Admin";
    } else if (role === "vendeur") {
      userEl.innerText = "🛒 Vendeur";
    } else if (username) {
      userEl.innerText = `👤 ${username}`;
    } else {
      userEl.innerText = "👤 Utilisateur";
    }
  }

  // ✅ FOOTER USER
  const footerUser = document.getElementById("footerUser");

  if (footerUser) {
    footerUser.innerText = username || "Utilisateur";
  }

  // ✅ FOOTER DATE
  const footerDate = document.getElementById("footerDate");

  if (footerDate) {
    footerDate.innerText = formatDateFR(new Date());
  }

  // ✅ FOOTER YEAR
  const yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.innerText = new Date().getFullYear();
  }
}

function switchUser() {

  if (!confirm("Voulez-vous changer de compte ?")) return;

  localStorage.removeItem("userRole");
  localStorage.removeItem("lastActivity");

  window.location.href = "login.html";
}

function updateUI() {

  const btn = document.getElementById("btnSettings");

  if (!btn) return;

  if (isLoggedIn) {
    btn.style.display = "inline-block"; // ✅ visible
  } else {
    btn.style.display = "none"; // ❌ caché
  }
}

function updateLastActivity() {
  localStorage.setItem("lastActivity", Date.now());
}

function initPDFDate() {

  const pdfInput = document.getElementById("pdfDate");

  if (!pdfInput) return;

  // ✅ ne pas écraser si déjà rempli
  if (pdfInput.value) return;

  // ✅ date du jour fiable
  const today = new Date();
  const formatted = today.toISOString().split("T")[0];

  pdfInput.value = formatted;

}


function render() {

  hideAllSections();

  // ✅ RÉAFFICHER
  document.getElementById("searchContainer").style.display = "block";
  document.getElementById("pdfContainer").style.display = "flex";

  document.getElementById("tableCard").style.display = "block";
  document.getElementById("historyCard").style.display = "block";

  document.getElementById("filterCategoryAdmin").style.display = "inline-block";
  document.getElementById("pagination").style.display = "flex";
  document.getElementById("archivedHeader").style.display = "none";


  const selectedCategory = document.getElementById("filterCategoryAdmin")?.value || "all";
  const list = document.getElementById("list");

  document.getElementById("tableHead").innerHTML = `
  <tr>
     <th>QR Code</th>
     <th>Image</th>
     <th>Nom</th>
     <th>Prix</th>
	 <th>Promo(%)</th>
     <th>Stock Restant</th>
     <th>Stock initial</th>
     <th>Vendu</th>
     <th>Action</th>
  </tr>`;

  list.innerHTML = "";

  // ✅ 1. Recherche

  const inputDesktop = document.getElementById("searchInput");
  const inputMobile = document.getElementById("searchInputAdmin");

  const search = (
    inputDesktop?.value?.trim() ||
    inputMobile?.value?.trim() ||
    "").toLowerCase();

  /*const search = document.getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();*/

  // ✅ 2. Filtre
  const filtered = products.filter(p => {

    // ✅ sécurisation
    const name = (p.name || "").toLowerCase();
    const price = (p.price || 0).toString();
    const stock = (p.stock ?? 0).toString();
    const category = (p.category || "Autre");
    //const promo = Number(p.promo) || 0;

    // ✅ recherche (UTILISE les variables sécurisées ✅)
    const matchSearch =
      name.includes(search) ||
      price.includes(search) ||
      stock.includes(search);

    /*const matchSearch =
      p.name.toLowerCase().includes(search) ||
      p.price.toString().includes(search) ||
      p.stock.toString().includes(search);*/

    const matchCategory =
      selectedCategory === "all" ||
      (p.category || "Autre") === selectedCategory;

    return matchSearch && matchCategory && p.active !== false;
  });

  // ✅ ✅ TRI PAR PROMO EN HAUT / STOCK FAIBLE
  filtered.sort((a, b) => {

    const aPromo = (Number(a.promo) || 0) > 0;
    const bPromo = (Number(b.promo) || 0) > 0;

    // ✅ 1. Priorité promo
    if (aPromo !== bPromo) {
      return bPromo - aPromo;
    }

    // ✅ 2. Si promo → trier par % décroissant
    if (aPromo && bPromo) {
      return (b.promo || 0) - (a.promo || 0);
    }

    const aLow = a.stock <= LOW_STOCK_THRESHOLD;
    const bLow = b.stock <= LOW_STOCK_THRESHOLD;

    // ✅ 3. Priorité stock faible
    if (aLow !== bLow) {
      return bLow - aLow;
    }

    // ✅ 4. Stock faible → du plus critique au moins critique
    if (aLow && bLow) {
      return a.stock - b.stock;
    }

    // ✅ 5. RESTE → trier par stock croissant ✅ (CORRECTION CLÉ)
    return a.stock - b.stock;

  });

  // ✅ 3. Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(start, start + itemsPerPage);

  // ✅ 4. Aucun résultat
  if (paginated.length === 0) {
    list.innerHTML = "<tr><td colspan='8'>Aucun produit trouvé 🔍</td></tr>";
    return;
  }

  // ✅ switch mobile / desktop
  //const isMobile = window.innerWidth <= 768 && window.outerWidth === window.innerWidth;
  //const isMobile = window.innerWidth <= 768;
  const isMobileOrTablet = window.matchMedia("(max-width: 1024px)").matches;

  if (isMobileOrTablet) {

    document.getElementById("tableStock").style.display = "none";   // ✅ cache table
    document.getElementById("mobileList").style.display = "block";  // ✅ affiche cards

    renderCards(paginated);

    renderPagination(filtered.length);
    renderStockHistory();
    populateCategories();

    return;
  }
  else {
    document.getElementById("tableStock").style.display = "table";
    document.getElementById("mobileList").style.display = "none";
  }


  // ✅ 5. Affichage + QR
  paginated.forEach((p) => {

    const promo = Number(p.promo) || 0;
    const price = Number(p.price) || 0;

    const finalPrice = promo > 0
      ? price * (1 - promo / 100)
      : price;

    const realIndex = products.indexOf(p); // ✅ clé
    const row = document.createElement("tr");
    const qrId = "qr_" + realIndex;

    row.innerHTML = `
      <td><div id="${qrId}"></div></td>
	  <td>${p.image ? `<div class="img-container"><img src="${p.image}"></div> ` : `<div class="no-image">📦</div>`}</td>

      <td>
        ${p.name}
        ${promo > 0
        ? `<span style="color:red;font-size:12px;"> (-${promo}%)</span>`
        : ""
      }
      </td>
      <td>
        ${promo > 0
        ? `
          <span class="price-old">
            ${formatPrice(price)} GNF
          </span><br>
          <span class="price-new">
            ${formatPrice(finalPrice)} GNF
          </span>
        `
        : `${formatPrice(price)} GNF`
      }
      </td>
	  <td>
        ${promo > 0
        ? `<span style="color:#e74c3c;font-weight:bold;">-${promo}%</span>`
        : `—`
      }
      </td>
      <td> ${p.stock} 
           ${p.stock <= LOW_STOCK_THRESHOLD
        ? '<span style="background:red;color:white;padding:2px 6px;border-radius:5px;margin-left:5px;">Faible</span>'
        : ''
      }
      </td>

	  <td>${p.initialStock || p.stock}</td>
      <td>${p.sold || 0}</td>
     <td>
  <div class="action-buttons">
    
    <button class="btn-edit tooltip" onclick="editProduct(${realIndex})">
      ✏️
      <span class="tooltiptext">Modifier</span>
    </button>

    <button class="btn-add tooltip" onclick="addStock(${realIndex})">
      ➕
      <span class="tooltiptext">Ajouter stock</span>
    </button>

    <button class="btn-delete tooltip" onclick="archiveProduct(${realIndex})">
      📦
      <span class="tooltiptext">Archiver</span>
    </button>

  </div>

    </td>`;

    // ✅ STOCK FAIBLE → couleur
    if (p.stock <= LOW_STOCK_THRESHOLD) {
      //row.style.background = "#f8d7da";   // rouge clair
      row.style.fontWeight = "bold";
    }


    list.appendChild(row);

    new QRCode(document.getElementById(qrId), {
      text: encodeURIComponent(
        p.name + "|" + parseFloat(formatPrice(p.price)) + "GNF"
      ),
      width: 60,
      height: 60
    });

  });

  // ✅ 6. Affichage pagination
  renderPagination(filtered.length);
  renderStockHistory();
  populateCategories();

}


function displayUsers(users) {

  const container = document.getElementById("usersList");

  container.innerHTML = "";

  users.forEach(user => {

    const div = document.createElement("div");
    div.className = "user-item";

    div.innerHTML = `
      <div>
        <strong>${user.username}</strong>
        <small>(${user.role})</small>
      </div>

      <div class="actions">
        <button onclick="toggleUser('${user.id}')">
          ${user.active ? "✅" : "⛔"}
        </button>

        <button onclick="deleteUser('${user.id}')">
          🗑
        </button>
      </div>
    `;

    container.appendChild(div);
  });
}

/*LISTE USERS*/

async function renderUsers() {

  const container = document.getElementById("usersList");

  container.innerHTML = "";

  // ✅ ONLINE → Supabase
  if (navigator.onLine) {

    const { data: users, error } = await supabaseClient
      .from("profiles")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    // ✅ mettre à jour localStorage (sync)
    localStorage.setItem("users", JSON.stringify(users));

    displayUsers(users);

  } else {

    // ✅ OFFLINE → fallback local
    const users = JSON.parse(localStorage.getItem("users") || "[]");

    displayUsers(users);
  }
}


/*ACTIVER/DESACTIVER USER*/
async function toggleUser(userId) {

  console.log("✅ toggleUser appelé avec:", userId);


  const { data: profile, error: fetchError } = await supabaseClient
    .from("profiles")
    .select("active")
    .eq("id", userId)
    .single();

  if (fetchError) {
    console.error("❌ fetch error:", fetchError);
    return;
  }

  if (!profile) {
    console.error("❌ profile introuvable pour id:", userId);
    return;
  }

  const newStatus = !profile.active;

  console.log("🔄 Nouveau statut:", newStatus);

  const { error } = await supabaseClient
    .from("profiles")
    .update({ active: newStatus })
    .eq("id", userId);


  if (error) {
    console.error("❌ update error:", error);
    return;
  }

  console.log("✅ Supabase updated");

  let users = JSON.parse(localStorage.getItem("users") || "[]");

  users = users.map(u => {
    if (u.id === userId) {
      u.active = newStatus;
    }
    return u;
  });

  localStorage.setItem("users", JSON.stringify(users));


  renderUsers();
}

/*SUPPRIMER UN USER*/

async function deleteUser(userId) {

  console.log("🗑 Suppression userId:", userId);

  // ✅ sécurité id
  if (!userId || userId === "undefined") {
    console.warn("⚠️ ID invalide, suppression ignorée");
    alert("Utilisateur déjà supprimé ou invalide");
    return;
  }

  if (!confirm("Supprimer cet utilisateur ?")) return;

  try {

    const { data, error } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId)
      .select(); // ✅ important pour voir résultat réel

    if (error) {
      console.error("❌ Supabase delete error:", error);
      alert("❌ Erreur suppression");
      return;
    }

    // ✅ cas où rien n’est supprimé
    if (!data || data.length === 0) {
      console.warn("⚠️ Aucun user supprimé (déjà supprimé)");
    } else {
      console.log("✅ Supabase supprimé:", data);
    }

    let users = JSON.parse(localStorage.getItem("users") || "[]");

    users = users.filter(u => u.id !== userId);

    localStorage.setItem("users", JSON.stringify(users));

    // ✅ sync UI
    renderUsers();

  } catch (err) {
    console.error("❌ ERROR:", err);
    alert("❌ Erreur réseau");
  }
}



/*SECTION USERS*/
function showUsers() {
  hideAllSectionsUser();
  document.getElementById("usersSection").classList.remove("hidden");

  renderUsers(); // ✅ recharge la liste
}

function hideUsers() {
  document.getElementById("usersSection").classList.add("hidden");
}


function hideAllSectionsUser() {

  document.getElementById("registerForm")?.classList.add("hidden");
  document.getElementById("usersSection")?.classList.add("hidden");
  document.getElementById("settingsSection")?.classList.add("hidden");

}

/************************************************************
 * INFO MAGASIN POUT HEADER TICKET DE CAISSE
 ***********************************************************/

function showStoreInfo() {
  // ✅ cacher les autres sections si besoin
  //hideAllSections();

  // ✅ afficher la section magasin
  document.getElementById("infoShop").style.display = "block";
}


function saveStoreInfo() {

  const name = document.getElementById("storeName").value.trim();
  const phone = document.getElementById("storePhone").value.trim();
  const address = document.getElementById("storeAddress").value.trim();

  // ✅ compter champs remplis
  let filledFields = 0;

  if (name) filledFields++;
  if (phone) filledFields++;
  if (address) filledFields++;

  // ✅ au moins 2 champs requis
  if (filledFields < 2) {
    showToast("⚠️ Minimum 2 champs requis");
    return;
  }

  // ✅ sauvegarde
  const store = { name, phone, address };

  localStorage.setItem("storeInfo", JSON.stringify(store));

  console.log("✅ store sauvegardé:", store);

  showToast("✅ Infos magasin sauvegardées");

  // ✅ reset form
  document.getElementById("storeName").value = "";
  document.getElementById("storePhone").value = "";
  document.getElementById("storeAddress").value = "";

  closeStoreInfo()
}



//BOUTON RETOUR
function closeStoreInfo() {
  document.getElementById("infoShop").style.display = "none";
}


function showToast(message, type = "info") {

  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.innerText = message;

  // ✅ couleur selon type
  switch (type) {
    case "success":
      toast.style.background = "#28a745";
      break;
    case "error":
      toast.style.background = "#dc3545";
      break;
    case "warning":
      toast.style.background = "#ff9800";
      break;
    default:
      toast.style.background = "#333";
  }

  // ✅ afficher
  toast.classList.add("show");

  // ✅ cacher après 2.5s
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
