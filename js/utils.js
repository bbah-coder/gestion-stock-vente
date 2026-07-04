/************************************************************
 * 🧠 MODULE : UTILITAIRES
 * ==========================================================
 * 🎯 RESPONSABILITÉS :
 * - Formatage des prix et nombres
 * - Formatage des dates
 * - Calculs KPI (évolution, pourcentage)
 * - Gestion des périodes (mois N, N-1, N-12)
 * - Fonctions génériques réutilisables
 *
 * 🔹 Format :
 * - formatPrice()              → format prix UI (FR)
 * - formatPricePDF()           → format prix PDF (arrondi)
 * - formatDate()               → format date FR
 *
 * 🔹 KPI / Couleurs :
 * - getPercentColor()          → couleur selon %
 * - getEvolution()             → évolution %
 *
 * 🔹 Dates :
 * - formatMonthLabel()         → mois lisible (Juin 2026)
 * - getPreviousMonth()         → mois N-1
 * - getSameMonthLastYear()     → mois N-12
 *
 * 🔹 Analyse :
 * - getTopProductsWithTie()    → top produits avec égalités
 *
 ************************************************************/
window.addEventListener("online", async () => {

  console.log("🌐 Retour online");

  await checkCurrentUserStatus();

});


const supabaseClient = supabase.createClient(
  "https://amtlfqzhuqwrudaachvy.supabase.co",
  "sb_publishable_fc5s-5QrMhO9Daiw-ADDcQ_OA6HRPpD"
);

/************************************************************
 * SUPPER-ADMIN
 ***********************************************************/
function isSuperAdmin() {

  return (
    localStorage.getItem("userRole") ===
    "super_admin"
  );

}

async function initCurrentUserContext() {

  const isAllowed = await checkCurrentUserStatus();

  if (!isAllowed) return false;

  await loadCurrentShop();

  return true;
}
/************************************************************
 * CHARGE LES MAGS DE L'UTILISATEUR CONNECTE
 ***********************************************************/
async function loadCurrentShop() {

  const username =
    localStorage.getItem("username");

  if (!username) return null;

  // Profil utilisateur
  const { data: profile, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select("shop_id")
      .eq("username", username)
      .single();

  if (profileError || !profile?.shop_id) {
    return null;
  }

  // Magasin associé
  const { data: shop, error: shopError } =
    await supabaseClient
      .from("shops")
      .select("*")
      .eq("id", profile.shop_id)
      .single();

  // ✅ Magasin désactivé
  if (
    !isSuperAdmin() &&
    shop &&
    shop.active === false
  ) {

    return {
      suspended: true
    };
  }
  if (shopError || !shop) {
    return null;
  }

  localStorage.setItem(
    "storeInfo",
    JSON.stringify(shop)
  );

  return shop;
}

//FONCTION FORCE LOGOUT POUR MAGASIN DESACTIVE
async function forceLogout() {

  try {
    await supabaseClient.auth.signOut();
  } catch (e) {
    console.warn(e);
  }

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");

  window.location.href = "login.html";
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


/************************************************************
 * FORMAT WHATSAPP PHONE
 ***********************************************************/
function formatWhatsAppPhone(phone) {

  let cleanPhone = phone.replace(/\D/g, "");

  // Déjà au format international
  if (cleanPhone.startsWith("224")) {
    return cleanPhone;
  }

  // Format local : 0622123456
  if (cleanPhone.startsWith("0")) {
    return "224" + cleanPhone.substring(1);
  }

  // Format local : 622123456
  return "224" + cleanPhone;
}

//INFO MAGASIN 

function getStoreInfo() {

  const store = JSON.parse(localStorage.getItem("storeInfo"));

  return store || {
    name: "MON SHOP",
    phone: "",
    address: ""
  };
}
// ✅ transforme username → email technique
function toEmail(username) {
  return username.trim().toLowerCase() + "@posapp.com";
}
function getPaymentSplit(sale) {

  const saleTotal = sale.payment?.total || sale.total || 0;

  let totalPaid = 0;

  if (sale.payment?.type === "credit") {
    const payments = sale.payment.payments || [];
    totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  } else {
    totalPaid = saleTotal;
  }

  return {
    encaisse: totalPaid,
    credit: saleTotal - totalPaid
  };
}

/************************************************************
* 💰 FORMAT PRIX (UI)
* ----------------------------------------------------------
* - format français
* - 2 décimales
* - remplace virgule par point
************************************************************/
function formatPrice(value) {
  return Number(value)
    .toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    .replace(",", "."); // ✅ remplace la virgule par un point
}

/************************************************************
 * 💰 FORMAT PRIX (PDF)
 * ----------------------------------------------------------
 * - arrondi
 * - séparateur milliers espace
 ************************************************************/
function formatPricePDF(value) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/************************************************************
 * 📅 FORMAT DATE
 * ----------------------------------------------------------
 * - convertit en format FR lisible
 ************************************************************/
function formatDate(date) {

  return new Date(date).toLocaleDateString("fr-FR");
}

function formatDateFR(date) {
  const d = new Date(date);

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

/************************************************************
 * 🎨 COULEUR SELON POURCENTAGE
 * ----------------------------------------------------------
 * - vert : >= 40%
 * - orange : >= 20%
 * - rouge : < 5%
 ************************************************************/
function getPercentColor(percent) {

  percent = Number(percent);

  if (percent >= 40) return "#27ae60"; // ✅ fort (vert)
  if (percent >= 20) return "#f39c12"; // ✅ moyen (orange)
  if (percent < 5) return "#e74c3c";   // ✅ faible (rouge)

  return "black"; // ✅ normal
}

/************************************************************
 * 📅 FORMAT MOIS LISIBLE
 * ----------------------------------------------------------
 * Exemple : "2026-06" → "juin 2026"
 ************************************************************/
function formatMonthLabel(monthValue) {
  if (!monthValue) return "";

  const [year, month] = monthValue.split("-");

  const date = new Date(year, month - 1);

  return date.toLocaleString("fr-FR", {
    month: "long",
    year: "numeric"
  });
}

/************************************************************
 * ⬅️ MOIS PRÉCÉDENT
 * ----------------------------------------------------------
 * Exemple : "2026-06" → "2026-05"
 ************************************************************/
function getPreviousMonth(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);

  const date = new Date(year, month - 1);
  date.setMonth(date.getMonth() - 1);

  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");

  return `${y}-${m}`;
}

/************************************************************
 * 📈 CALCUL ÉVOLUTION (%)
 * ----------------------------------------------------------
 * - retourne variation entre deux valeurs
************************************************************/
function getEvolution(current, prev) {
  if (!prev) return "0%";

  const diff = ((current - prev) / prev) * 100;
  return diff.toFixed(1) + "%";
}


/************************************************************
 * 📅 MÊME MOIS ANNÉE PRÉCÉDENTE
 * ----------------------------------------------------------
 * Exemple : "2026-06" → "2025-06"
 ************************************************************/
function getSameMonthLastYear(monthValue) {
  const [year, month] = monthValue.split("-");
  return `${Number(year) - 1}-${month}`;
}

/************************************************************
 * 🏆 TOP PRODUITS AVEC ÉGALITÉ
 * ----------------------------------------------------------
 * - retourne top N produits
 * - inclut égalités sur dernière position
************************************************************/
function getTopProductsWithTie(stats, limit = 3) {

  const sorted = Object.entries(stats)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return [];

  const result = [];
  let rankValue = null;

  for (let i = 0; i < sorted.length; i++) {

    const [name, qty] = sorted[i];

    if (i < limit) {
      result.push([name, qty]);
      rankValue = qty;
    }
    else if (qty === rankValue) {
      // ✅ inclure égalité
      result.push([name, qty]);
    }
    else {
      break;
    }
  }

  return result;
}

function formatDateISO(date) {

  if (!date) return "-";

  const d = new Date(date);

  if (isNaN(d)) return "-";

  return d.toISOString().split("T")[0]; // ✅ YYYY-MM-DD
}

function calcDiff(current, previous) {

  if (!previous || previous === 0) {
    return "—";
  }

  const diff = ((current - previous) / previous) * 100;

  const formatted = diff.toFixed(1);

  return diff > 0
    ? `+${formatted}%`
    : `${formatted}%`;
}


function colorDiff(value) {

  if (value === "—") return "gray";

  return value.startsWith("-") ? "red" : "green";
}

/************************************************************
 * VERIFIE SI L'UTILISATEUR CONNECTE EST TOUJOURS ACTIF.
 * RETOURNE TRUE SI ACCES AUTORISE
 ***********************************************************/
async function checkCurrentUserStatus() {

  try {

    const username = localStorage.getItem("username");

    if (!username) {
      return true;
    }

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("active")
      .eq("username", username)
      .single();

    if (error) {
      console.error("❌ Vérification compte :", error);
      return true;
    }

    if (!data?.active) {

      showToast(
        "⛔ Votre compte a été désactivé",
        "error"
      );

      setTimeout(async () => {
        await logout();
      }, 1500);

      return false;
    }

    return true;

  } catch (err) {

    console.error("❌ checkCurrentUserStatus :", err);

    return true;
  }
}