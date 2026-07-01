//const SESSION_TIMEOUT = 1000 * 60 * 30;

// ✅ LOGIN

async function login() {


  console.log("🚀 login appelé");

  const userEl = document.getElementById("username");
  const passEl = document.getElementById("password");
  const errorEl = document.getElementById("error");

  const username = userEl.value.trim();
  const password = passEl.value;
  const email = toEmail(username);

  errorEl.innerText = "";

  let onlineSuccess = false;
  let profile = null;

  // ✅ ✅ ✅ TENTATIVE ONLINE SÉCURISÉE
  try {

    console.log("🌐 tentative ONLINE...");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (!error && data?.user) {

      console.log("✅ LOGIN ONLINE OK");

      const { data: prof } = await supabaseClient
        .from("profiles")
        .select("username, role, active")
        .eq("id", data.user.id)
        .single();

      profile = prof;
      onlineSuccess = true;
    }

  } catch (err) {

    console.warn("⚠️ OFFLINE détecté (fetch failed)");
  }

  // ✅ ✅ ✅ SI ONLINE OK
  if (onlineSuccess && profile) {

    if (profile.active === false) {
      errorEl.innerText = "⛔ Compte désactivé";
      return;
    }

    // ✅ stock OFFLINE
    localStorage.setItem("offlineUser", JSON.stringify({
      username: profile.username,
      password: btoa(password.trim()),
      role: profile.role,
      active: profile.active
    }));

    console.log("💾 offlineUser sauvegardé");

    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", profile.username);
    localStorage.setItem("userRole", profile.role);

    window.location.href = profile.role === "admin" ? "admin" : "index";

    return;
  }

  // ✅ ✅ ✅ FALLBACK OFFLINE
  console.log("📴 MODE OFFLINE");

  const offlineUser = JSON.parse(localStorage.getItem("offlineUser"));

  console.log("👤 offlineUser:", offlineUser);

  if (!offlineUser) {
    errorEl.innerText = "❌ Aucun utilisateur offline";
    return;
  }

  const inputUsername = username.toLowerCase().trim();
  const inputPassword = btoa(password.trim());

  const storedUsername = offlineUser.username.toLowerCase().trim();
  const storedPassword = offlineUser.password;

  console.log("🔍 INPUT:", inputUsername, inputPassword);
  console.log("🔍 STORED:", storedUsername, storedPassword);

  if (
    inputUsername !== storedUsername ||
    inputPassword !== storedPassword
  ) {
    errorEl.innerText = "❌ Identifiants incorrects";
    return;
  }

  if (offlineUser.active === false) {
    errorEl.innerText = "⛔ Compte désactivé";
    return;
  }

  console.log("✅ LOGIN OFFLINE OK");

  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("username", offlineUser.username);
  localStorage.setItem("userRole", offlineUser.role);

  window.location.href = offlineUser.role === "admin" ? "admin" : "index";
}


// ✅ reset erreur quand user tape
document.getElementById("username")?.addEventListener("input", () => {
  document.getElementById("error").innerText = "";
});

document.getElementById("password")?.addEventListener("input", () => {
  document.getElementById("error").innerText = "";
});


// ✅ LIAISON BOUTON (ULTRA FIABLE)
document.addEventListener("DOMContentLoaded", () => {

  const loginBtn = document.getElementById("loginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", login);
  }

  // ✅ touche ENTER
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      login();
    }
  });

});
