//const SESSION_TIMEOUT = 1000 * 60 * 30;
/********************************************* 
 FUNCTION : Sauvegarde la session utilisateur
**********************************************/
function saveUserSession(user) {

  localStorage.setItem(
    "isLoggedIn",
    "true"
  );

  localStorage.setItem(
    "username",
    user.username
  );

  localStorage.setItem(
    "userRole",
    user.role
  );

  localStorage.setItem(
    "userId",
    user.id || ""
  );

}

/************************************************************** 
 FUNCTION : Sauvegarde les informations pour le mode offline
***************************************************************/
function saveOfflineUser(
  profile,
  password
) {

  localStorage.setItem(
    "offlineUser",
    JSON.stringify({

      username:
        profile.username,

      password:
        btoa(
          password.trim()
        ),

      role:
        profile.role,

      active:
        profile.active,

      id:
        profile.id

    })
  );

}

/************************************************************** 
 FUNCTION : Redirection selon le rôle utilisateur
***************************************************************/
function redirectByRole(role) {

  if (
    role === "admin" ||
    role === "super_admin"
  ) {

    window.location.href =
      "admin";

  } else {

    window.location.href =
      "index";

  }

}

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
        .select("id, username, role, active, shop_id")
        .eq("id", data.user.id)
        .single();

      profile = prof;
      //Sauvegarde dans IndexedDB
      await db.profiles.put(profile);

      console.log("✅ Profil sauvegardé dans IndexedDB");
      console.log("PROFILE =", profile);
      console.log("ROLE =", profile.role);
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

    // Sauvegarder l'utilisateur offline
    saveOfflineUser(
      profile,
      password
    );

    // Sauvegarder la session
    saveUserSession(
      profile
    );

    // ✅ Charger le magasin associé
    const shopResult =
      await loadCurrentShop();

    if (shopResult?.suspended) {

      errorEl.innerText =
        "⛔ Votre magasin est temporairement suspendu. Veuillez contacter votre administrateur ou le support.";

      await supabaseClient.auth.signOut();

      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("username");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");

      return;
    }

    console.log("✅ REDIRECTION");
    console.log("ROLE =", profile.role);


    // ✅ Super Admin et Admin
    // Redirection selon le rôle
    redirectByRole(
      profile.role
    );

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

  // Sauvegarder la session
  saveUserSession(
    offlineUser
  );


  // ✅ Admin et Super Admin
  // Redirection selon le rôle
  redirectByRole(
    offlineUser.role
  );
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
