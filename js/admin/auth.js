/************************************************************
 * 🔐 AUTHENTIFICATION
 ************************************************************/
function initAuth(){

  const role = localStorage.getItem("userRole");

  if (!role || role !== "admin") {
    window.location.href = "login.html";
    return false;
  }

  const app = document.getElementById("app");
  if(app){
    app.style.display = "block";
  }

  return true;
}

// Déconnexion

function logout(){

  if(!confirm("Voulez-vous vous déconnecter ?")) return;
  // ✅ fermer boutique si ouverte
  if(typeof shopWindow !== "undefined" && shopWindow && !shopWindow.closed){
    shopWindow.close();
  }

  // ✅ supprimer uniquement la session (IMPORTANT)
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("lastActivity");

  // ✅ redirection vers login
  //window.location.href = "login.html";
  window.location.href = "home.html";
}