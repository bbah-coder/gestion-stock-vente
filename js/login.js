//const SESSION_TIMEOUT = 1000 * 60 * 30;

// ✅ LOGIN


async function login() {

  const userEl = document.getElementById("username");
  const passEl = document.getElementById("password");
  const errorEl = document.getElementById("error");

  const username = userEl.value.trim();
  const password = passEl.value;

  errorEl.innerText = "";

  const email = toEmail(username);

  try {

    // ✅ ✅ ✅ ONLINE → Supabase
    if (navigator.onLine) {

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data.user) {
        errorEl.innerText = "❌ Identifiants incorrects";
        return;
      }

      const user = data.user;

      console.log("✅ Supabase connecté");

      // ✅ récupérer profil
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("role, username, active")
        .eq("id", user.id)
        .single();

      // ✅ sécurité
      if (!profile) {
        errorEl.innerText = "❌ Profil introuvable";
        return;
      }

      // ✅ 🔥 bloquer si désactivé
      if (profile.active === false) {
        await supabaseClient.auth.signOut();
        errorEl.innerText = "⛔ Compte désactivé";
        return;
      }

      // ✅ session
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("userId", user.id);
      localStorage.setItem("email", user.email);
      localStorage.setItem("username", profile.username);
      localStorage.setItem("userRole", profile.role);

      window.location.href = profile.role === "admin" ? "admin" : "index";
      return;
    }

    // ✅ ✅ ✅ OFFLINE → fallback local
    console.log("📴 Mode offline → fallback");

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    const user = users.find(u =>
      u.username === username &&
      u.password === btoa(password)
    );

    if (!user) {
      errorEl.innerText = "❌ Identifiants incorrects";
      return;
    }

    // ✅ vérifier actif
    if (user.active === false) {
      errorEl.innerText = "⛔ Compte désactivé";
      return;
    }

    // ✅ session offline
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("username", user.username);
    localStorage.setItem("userRole", user.role);

    window.location.href = user.role === "admin" ? "admin" : "index";

  } catch (err) {

    console.error("❌ ERROR:", err);
    errorEl.innerText = "❌ Erreur réseau";

  }
}


// ✅ reset erreur quand user tape
document.getElementById("username")?.addEventListener("input", () => {
  document.getElementById("error").innerText = "";
});

document.getElementById("password")?.addEventListener("input", () => {
  document.getElementById("error").innerText = "";
});


// ✅ LIAISON BOUTON (ULTRA FIABLE)
document.addEventListener("DOMContentLoaded", function () {

  const btn = document.getElementById("loginBtn");

  if (btn) {
    btn.addEventListener("click", login);
  } else {
    alert("Bouton login introuvable ❌");
  }

});

document.getElementById("password").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    document.getElementById("loginBtn").click();
  }
});
