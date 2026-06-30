//const SESSION_TIMEOUT = 1000 * 60 * 30;

// ✅ LOGIN

function login(){

  const userEl = document.getElementById("username");
  const passEl = document.getElementById("password");
  const errorEl = document.getElementById("error");

  if(!userEl || !passEl){
    alert("Erreur HTML : input introuvable");
    return;
  }

  const username = userEl.value.trim();
  const password = passEl.value;

  // ✅ reset erreur
  errorEl.innerText = "";

  // ✅ récupération users
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  // ✅ checkpoint : aucun compte
  if(users.length === 0){
    errorEl.innerText = "⚠️ Aucun compte trouvé, créez-en un";
    return;
  }

  // ✅ recherche utilisateur
  const user = users.find(u =>
    u.username === username &&
    u.password === btoa(password)
  );

  // ❌ utilisateur non trouvé
  if (!user) {
      errorEl.innerText = "❌ Identifiants incorrects";
      return;
  }
  // ✅ bloque si désactivé
  if (user.active === false) {
      errorEl.innerText = "⛔ Compte désactivé";
      return;
  }
  // ✅ session
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userRole", user.role);
  localStorage.setItem("username", user.username);

  console.log("✅ Connecté :", user.username);

  // ✅ redirection
  if(user.role === "admin"){
    window.location.href = "admin";
  }else{
    window.location.href = "index.html";
  }

}

// ✅ reset erreur quand user tape
document.getElementById("username")?.addEventListener("input", () => {
  document.getElementById("error").innerText = "";
});

document.getElementById("password")?.addEventListener("input", () => {
  document.getElementById("error").innerText = "";
});

/*function login(){

  const userEl = document.getElementById("username");
  const passEl = document.getElementById("password");
  const errorEl = document.getElementById("error");

  if(!userEl || !passEl){
    alert("Erreur HTML : input introuvable");
    return;
  }

  const user = userEl.value.trim();
  const pass = passEl.value.trim();

  console.log("login cliqué", user);

  // ✅ ADMIN
  if(user === "admin" && pass === "1234"){
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", "admin");
    localStorage.setItem("username", user);

    window.location.href = "admin.html";
    return;
  }

  // ✅ VENDEUR
  if(user === "vendeur" && pass === "1234"){
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", "vendeur");
    localStorage.setItem("username", user);

    window.location.href = "index.html";
    return;
  }

  // ❌ ERREUR
  errorEl.innerText = "Identifiants incorrects";
}*/

// ✅ LIAISON BOUTON (ULTRA FIABLE)
document.addEventListener("DOMContentLoaded", function(){

  const btn = document.getElementById("loginBtn");

  if(btn){
    btn.addEventListener("click", login);
  } else {
    alert("Bouton login introuvable ❌");
  }

});

document.getElementById("password").addEventListener("keypress", function(e){
  if(e.key === "Enter"){
    document.getElementById("loginBtn").click();
  }
});
