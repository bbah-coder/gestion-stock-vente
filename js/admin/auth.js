/************************************************************
 * 🔐 AUTHENTIFICATION
 ************************************************************/

function initAuth() {

  const role = localStorage.getItem("userRole");

  if (!role || role !== "admin" && role !== "super_admin") {
    window.location.href = "login.html";
    return false;
  }

  const app = document.getElementById("app");
  if (app) {
    app.style.display = "block";
  }

  return true;
}

/************************************************************
 * 🔐 DECONNEXION
 ************************************************************/

async function logout() {

  if (!confirm("Voulez-vous vous déconnecter ?")) return;
  // ✅ fermer boutique si ouverte
  if (typeof shopWindow !== "undefined" && shopWindow && !shopWindow.closed) {
    shopWindow.close();
  }
  //Déconnexion Supabase
  await supabaseClient.auth.signOut();

  // Vider IndexedDB
  await Promise.all(db.tables.map(table => table.clear()));

  // Vider LocalStorage
  localStorage.clear();
  // Vider SessionStorage
  sessionStorage.clear();

  // ✅ supprimer uniquement la session (IMPORTANT)
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("lastActivity");

  // ✅ redirection vers login
  window.location.href = "login.html";


}