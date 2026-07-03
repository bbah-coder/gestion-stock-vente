/************************************************************
 * 🎨 UI / RENDER
 ************************************************************/
/*VARIABLE MAGASIN*/
let currentShopId = null;

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

/************************************************************
 * SECTION RENDER PRODUCT
 ***********************************************************/

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

/************************************************************
 * SECTION USER ET INFO MAGASIN
 ***********************************************************/

/*AFFICHER LE FORMULAIRE DE CREATION DE USER COMPTE*/
async function showRegister() {
  //CACHER LES AUTRES SECTIONS
  hideAllSectionsForms();

  document.getElementById("registerForm").style.display = "block";
  document.getElementById("formRegister").style.display = "block";

  //CHARGER LES MAGASIN
  await populateShopsSelect();
}

/*CACHE LE FORMULAIRE DE CREATION DE USER COMPTE*/
function hideRegister() {

  document.getElementById("registerForm").style.display = "none";
  document.getElementById("formRegister").style.display = "none";
}

/*CREATION USER*/

async function createAccount() {

  const usernameEl = document.getElementById("newUsername");
  const passwordEl = document.getElementById("newPassword");
  const roleEl = document.getElementById("role");
  // const shopEl = document.getElementById("userShop");

  const username = usernameEl.value.trim();
  const password = passwordEl.value;
  const role = roleEl.value;

  // ✅ magasin sélectionné
  //const shopId = shopEl?.value || "";
  //const shopId = currentShop?.id || null;
  const currentShop = getCurrentShop();
  const shopId = currentShop?.id || null;

  // ✅ Sauf premier admin
  if (!shopId) {

    showToast(
      "⚠️ Aucun magasin associé à votre compte"
    );

    return;
  }

  // ✅ validations
  if (!username || !password) {
    showToast("⚠️ Remplir tous les champs");
    return;
  }

  if (username.includes(" ")) {
    showToast("❌ Nom utilisateur invalide");
    return;
  }

  const email = toEmail(username);

  try {

    // ✅ 1. Création Auth Supabase
    const { error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      showToast("❌ " + error.message);
      return;
    }

    console.log("✅ User créé Supabase :", email);

    // ✅ 2. Récupération user connecté
    const { data: userData } =
      await supabaseClient.auth.getUser();

    const userId = userData?.user?.id;

    if (!userId) {
      showToast("❌ Impossible de récupérer userId");
      return;
    }

    console.log("✅ USER ID :", userId);

    // ✅ 3. Création profil
    const { data: profileData, error: profileError } =
      await supabaseClient
        .from("profiles")
        .insert([
          {
            id: userId,
            username,
            role,
            active: true,
            shop_id: shopId
          }
        ])
        .select();

    console.log("PROFILE INSERT DATA :", profileData);
    console.log("PROFILE INSERT ERROR :", profileError);

    if (profileError) {
      console.error(profileError);

      showToast(
        "❌ Erreur création profil"
      );

      return;
    }

    // ✅ 4. Cache local
    let users = JSON.parse(
      localStorage.getItem("users") || "[]"
    );

    users.push({
      id: userId,
      username,
      password: btoa(password),
      role,
      active: true,
      shop_id: shopId || null
    });

    localStorage.setItem(
      "users",
      JSON.stringify(users)
    );

    // ✅ Réinitialisation formulaire
    usernameEl.value = "";
    passwordEl.value = "";

    /*if (shopEl) {
      shopEl.value = "";
    }*/

    showToast(
      "✅ Compte créé avec succès",
      "success"
    );

    hideRegister();

    // ✅ Rafraîchir la liste
    if (typeof renderUsers === "function") {
      await renderUsers();
    }

  } catch (err) {

    console.error(err);

    showToast(
      "❌ Erreur réseau",
      "error"
    );
  }
}

/*AFFICHER LES USERS*/
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

       ${isSuperAdmin()
        ? `<br><small>🏪 ${user.shops?.name || "Aucun magasin"}</small>`
        : ""
      }
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
  console.log("✅ renderUsers appelé");

  const container = document.getElementById("usersList");

  container.innerHTML = "";

  // ✅ ONLINE → Supabase
  if (navigator.onLine) {

    const {
      data: { user }
    } = await supabaseClient.auth.getUser();

    console.log("USER CONNECTÉ :", user);

    const {
      data: { session }
    } = await supabaseClient.auth.getSession();

    console.log("SESSION :", session);


    /*const currentShop = getCurrentShop();

    const { data: users, error } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("shop_id", currentShop.id);*/

    const currentShop = getCurrentShop();

    let query = supabaseClient
      .from("profiles")
      .select(`
        *,
        shops(name)
       `);

    // ✅ SUPER ADMIN
    if (!isSuperAdmin()) {

      query = query
        .eq("shop_id", currentShop.id)
        .neq("role", "super_admin");

    }

    const { data: users, error } =
      await query;

    console.log("USERS SUPABASE :", users);
    console.log("ERROR SUPABASE :", error);

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

  const currentShop = getCurrentShop();

  if (!isSuperAdmin() && !currentShop?.id) {

    showToast("❌ Magasin introuvable");

    return;
  }

  const currentUserId = localStorage.getItem("userId");

  // ✅ Empêcher l'auto-désactivation
  if (currentUserId === userId) {

    showToast(
      "⚠️ Impossible de désactiver votre propre compte"
    );

    return;
  }

  let fetchQuery = supabaseClient
    .from("profiles")
    .select("id, username, role, active")
    .eq("id", userId);

  if (!isSuperAdmin()) {

    fetchQuery = fetchQuery.eq(
      "shop_id",
      currentShop.id
    );
  }

  const {
    data: profile,
    error: fetchError
  } = await fetchQuery.single();

  if (fetchError) {
    console.error(fetchError);
    return;
  }

  if (!profile) {
    showToast("❌ Utilisateur introuvable");
    return;
  }

  // ✅ Seul le super-admin peut gérer les super-admin
  if (
    profile.role === "super_admin" &&
    !isSuperAdmin()
  ) {

    showToast(
      "❌ Action non autorisée"
    );

    return;
  }

  // ✅ Protection compte principal
  if (profile.username === "bbah-admin") {

    showToast(
      "⚠️ Impossible de désactiver le compte principal"
    );

    return;
  }

  const newStatus = !profile.active;

  let updateQuery = supabaseClient
    .from("profiles")
    .update({
      active: newStatus
    })
    .eq("id", userId);

  if (!isSuperAdmin()) {

    updateQuery = updateQuery.eq(
      "shop_id",
      currentShop.id
    );
  }

  const { error } = await updateQuery;

  if (error) {
    console.error(error);
    showToast("❌ Erreur mise à jour");
    return;
  }

  let users = JSON.parse(
    localStorage.getItem("users") || "[]"
  );

  users = users.map(u => {

    if (u.id === userId) {
      u.active = newStatus;
    }

    return u;
  });

  localStorage.setItem(
    "users",
    JSON.stringify(users)
  );

  showToast("✅ Statut utilisateur modifié");

  await renderUsers();
}
/*SUPPRIMER UN USER*/

/*async function deleteUser(userId) {

  console.log("🗑 Suppression userId:", userId);

  const currentShop = getCurrentShop();

  if (!currentShop?.id) {
    showToast("❌ Magasin introuvable");
    return;
  }

  // ✅ empêcher l'auto-suppression
  const currentUserId = localStorage.getItem("userId");

  if (currentUserId === userId) {

    showToast(
      "⚠️ Impossible de supprimer votre propre compte"
    );

    return;
  }

  // ✅ sécurité id
  if (!userId || userId === "undefined") {
    console.warn("⚠️ ID invalide, suppression ignorée");
    showToast("Utilisateur déjà supprimé ou invalide");
    return;
  }

  if (!confirm("Supprimer cet utilisateur ?")) return;

  try {

    const { data, error } = await supabaseClient
      .from("profiles")
      .delete()
      .eq("id", userId)
      .eq("shop_id", currentShop.id)
      .select(); // ✅ important pour voir résultat réel

    if (error) {
      console.error("❌ Supabase delete error:", error);
      showToast("❌ Erreur suppression");
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
    showToast("❌ Erreur réseau");
  }
}*/
async function deleteUser(userId) {

  console.log("🗑 Suppression userId:", userId);

  const currentShop = getCurrentShop();

  if (!isSuperAdmin() && !currentShop?.id) {

    showToast("❌ Magasin introuvable");

    return;
  }

  const currentUserId = localStorage.getItem("userId");

  // ✅ Empêcher l'auto-suppression
  if (currentUserId === userId) {

    showToast(
      "⚠️ Impossible de supprimer votre propre compte"
    );

    return;
  }

  if (!userId || userId === "undefined") {

    showToast(
      "Utilisateur invalide"
    );

    return;
  }

  let profileQuery = supabaseClient
    .from("profiles")
    .select("id, username, role")
    .eq("id", userId);

  if (!isSuperAdmin()) {

    profileQuery = profileQuery.eq(
      "shop_id",
      currentShop.id
    );
  }

  const {
    data: profile,
    error: profileError
  } = await profileQuery.single();

  if (profileError || !profile) {

    showToast(
      "❌ Utilisateur introuvable"
    );

    return;
  }

  // ✅ Seul le super-admin peut gérer les super-admin
  if (
    profile.role === "super_admin" &&
    !isSuperAdmin()
  ) {

    showToast(
      "❌ Action non autorisée"
    );

    return;
  }

  // ✅ Protection compte principal
  if (profile.username === "bbah-admin") {

    showToast(
      "⚠️ Impossible de supprimer le compte principal"
    );

    return;
  }

  if (
    !confirm(
      `Supprimer ${profile.username} ?`
    )
  ) {
    return;
  }

  let deleteQuery = supabaseClient
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (!isSuperAdmin()) {

    deleteQuery = deleteQuery.eq(
      "shop_id",
      currentShop.id
    );
  }

  const { data, error } =
    await deleteQuery.select();

  if (error) {

    console.error(error);

    showToast(
      "❌ Erreur suppression"
    );

    return;
  }

  let users = JSON.parse(
    localStorage.getItem("users") || "[]"
  );

  users = users.filter(
    u => u.id !== userId
  );

  localStorage.setItem(
    "users",
    JSON.stringify(users)
  );

  showToast(
    "✅ Utilisateur supprimé",
    "success"
  );

  await renderUsers();
}

/*SECTION USERS*/
function showUsers() {
  //CACHER LES AUTRES SECTIONS
  hideAllSectionsForms();
  document.getElementById("usersSection").style.display = "block";

  renderUsers(); // ✅ recharge la liste
}
/*CACHER LA SECTION USER*/
function hideUsers() {
  //document.getElementById("usersSection").classList.add("hidden");
  document.getElementById("usersSection").style.display = "none";
}
/*CACHE TOUTES LES SECTION : INFO MAG, USER, FORM CREATION USER*/
function hideAllSectionsForms() {
  document.getElementById("infoShop").style.display = "none";
  document.getElementById("formRegister").style.display = "none";
  document.getElementById("usersSection").style.display = "none";
}

/************************************************************
 * INFO MAGASIN POUR HEADER TICKET DE CAISSE
 ***********************************************************/

function showStoreInfo() {
  // ✅ cacher les autres sections si besoin

  hideAllSectionsForms();
  // ✅ afficher la section magasin
  document.getElementById("infoShop").style.display = "block";

  loadStoreForm();

}

/************************************************************
 * PERMET DE CHARGER LES MAGASINS
 ***********************************************************/
async function populateShopsSelect() {

  const select = document.getElementById("userShop");

  if (!select) return;

  try {

    const { data: shops, error } = await supabaseClient
      .from("shops")
      .select("*")
      .order("name");

    if (error) throw error;

    select.innerHTML =
      '<option value="">Choisir un magasin</option>';

    shops.forEach(shop => {

      select.innerHTML += `
        <option value="${shop.id}">
          ${shop.name}
        </option>
      `;

    });

  } catch (err) {

    console.error(err);

  }
}

/************************************************************
 * INFO MAGASIN FORM REGISTER
 ***********************************************************/

async function saveStoreInfo() {

  const name = document.getElementById("storeName").value.trim();
  const phone = document.getElementById("storePhone").value.trim();
  const address = document.getElementById("storeAddress").value.trim();

  // ✅ Compter les champs renseignés
  let filledFields = 0;

  if (name) filledFields++;
  if (phone) filledFields++;
  if (address) filledFields++;

  // ✅ Au moins 2 champs requis
  if (filledFields < 2) {
    showToast("⚠️ Minimum 2 champs requis", "warning");
    return;
  }

  const store = {
    name,
    phone,
    address
  };

  try {

    // ✅ Création d'un nouveau magasin
    if (!currentShopId) {

      const { data, error } = await supabaseClient
        .from("shops")
        .insert([store])
        .select()
        .single();

      if (error) throw error;

      currentShopId = data.id;

      //PROFIL ADMIN
      const profile = await getCurrentProfile();

      if (profile &&
        profile.role === "admin" &&
        !profile.shop_id) {

        const { error: profileError } =
          await supabaseClient
            .from("profiles")
            .update({
              shop_id: data.id
            })
            .eq("id", profile.id);

        if (!profileError) {

          console.log(
            "✅ Admin associé au magasin"
          );

        }
      }
      await loadCurrentShop();

      localStorage.setItem(
        "storeInfo",
        JSON.stringify(data)
      );

      showToast("✅ Magasin créé", "success");

    }

    // ✅ Mise à jour magasin existant
    else {

      const { error } = await supabaseClient
        .from("shops")
        .update(store)
        .eq("id", currentShopId);

      if (error) throw error;

      localStorage.setItem(
        "storeInfo",
        JSON.stringify({
          id: currentShopId,
          ...store
        })
      );

      showToast("✅ Magasin mis à jour", "success");
    }

    console.log("✅ Magasin sauvegardé :", store);

    closeStoreInfo();

  } catch (error) {

    console.error(error);

    showToast(
      "❌ Erreur lors de la sauvegarde",
      "error"
    );

  }

}

/*CHANGER LE MAGASIN EXISTANT */
function loadStoreForm() {

  const store = JSON.parse(
    localStorage.getItem("storeInfo") || "{}"
  );

  if (!store.name) return;

  currentShopId = store.id || null;

  document.getElementById("storeName").value =
    store.name || "";

  document.getElementById("storePhone").value =
    store.phone || "";

  document.getElementById("storeAddress").value =
    store.address || "";

}

/*BOUTON RETOUR*/
function closeStoreInfo() {
  document.getElementById("infoShop").style.display = "none";
}


function getCurrentShop() {

  return JSON.parse(
    localStorage.getItem("storeInfo") || "{}"
  );

}

/************************************************************
 * ON RECUPERE LE PROFIL ADMIN
 ***********************************************************/
async function getCurrentProfile() {

  const username = localStorage.getItem("username");

  if (!username) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

/************************************************************
 * AFFICHE UNE NOTIFICATION TEMPORAIRE A L'UTILISATEUR
 ***********************************************************/
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


