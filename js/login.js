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
  localStorage.setItem(
    "currentProfile",
    JSON.stringify(user)
  );

}

/************************************************************** 
 FUNCTION : Sauvegarde les informations pour le mode offline
***************************************************************/
function saveOfflineUser(profile, password) {

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
 FUNCTION : Connexion offline via IndexeDB
***************************************************************/
async function loginOffline(username, password) {

  const profiles = await db.profiles.toArray();

  const profile =
    profiles.find(
      p =>
        p.username === username
    );

  if (!profile) {
    return null;
  }

  const encodedPassword = btoa(password.trim());

  if (
    profile.password !== encodedPassword
  ) {
    return null;
  }

  return profile;

}

/************************************************************** 
 FUNCTION : Redirection selon le rôle utilisateur
***************************************************************/
async function redirectByRole(role) {

  if (
    role === "admin" ||
    role === "super_admin"
  ) {

    await bootstrapData();

    window.location.href = "admin.html";

  } else {

    await bootstrapData();

    window.location.href = "home.html";

  }

}

// ✅ LOGIN

async function login() {


  //console.log("🚀 login appelé");

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

    //console.log("🌐 tentative ONLINE...");

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

      //console.log("✅ Profil sauvegardé dans IndexedDB");
      //console.log("PROFILE =", profile);
      //console.log("ROLE =", profile.role);
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
    redirectByRole(profile.role);

    return;
  }

  // ✅ ✅ ✅ FALLBACK OFFLINE
  //console.log("📴 MODE OFFLINE");

  const offlineUser = JSON.parse(localStorage.getItem("offlineUser"));

  //console.log("👤 offlineUser:", offlineUser);

  if (!offlineUser) {
    errorEl.innerText = "❌ Aucun utilisateur offline";
    return;
  }

  const inputUsername = username.toLowerCase().trim();
  const inputPassword = btoa(password.trim());

  const storedUsername = offlineUser.username.toLowerCase().trim();
  const storedPassword = offlineUser.password;

  //console.log("🔍 INPUT:", inputUsername, inputPassword);
  //console.log("🔍 STORED:", storedUsername, storedPassword);

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

  //console.log("✅ LOGIN OFFLINE OK");

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

  // ✅ LIAISON BOUTON RESET PASSWORD

  const btnResetPassword = document.getElementById("btnResetPassword");
  if (btnResetPassword) {
    btnResetPassword.addEventListener(
      "click",
      resetPassword
    );
  }

  // ✅ touche ENTER
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      login();
    }
  });

});

//Reinitialisation du mot de passe 

async function resetPassword() {
  try {
    const phone = document.getElementById("resetPhone").value.trim();
    const formule = document.getElementById("resetFormule").value.trim();
    const amount = Number(document.getElementById("resetAmount").value);
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!phone) {
      showError("Veuillez renseigner le téléphone du magasin.");
      return;
    }

    if (!formule) {
      showError("Veuillez renseigner la formule.");
      return;
    }

    if (!amount || amount <= 0) {
      showError("Veuillez renseigner le montant.");
      return;
    }

    if (newPassword.length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Les mots de passe ne correspondent pas.");
      return;
    }

    // Recherche du magasin
    const { data: shop, error: shopError } =
      await supabaseClient
        .from("shops")
        .select("*")
        .eq("phone", phone)
        .single();

    if (shopError || !shop) {
      showError("Aucun magasin trouvé avec ce numéro.");
      return;
    }

    // Vérification formule
    if ((shop.subscription_plan || "").toLowerCase() !== formule.toLowerCase()) {
      showError("La formule saisie ne correspond pas.");
      return;
    }

    // Vérification montant
    if (Number(shop.monthly_price || 0) !== amount) {
      showError("Le montant saisi ne correspond pas.");
      return;
    }

    // Recherche du profil admin
    const { data: adminProfile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("*")
        .eq("shop_id", shop.id)
        .eq("role", "admin")
        .single();

    if (profileError || !adminProfile) {
      showError("Aucun administrateur associé à ce magasin.");
      return;
    }
    if (!adminProfile.active) {
      showError("Le compte administrateur est désactivé.");
      return;

    }

    // Appel Edge Function ou API de réinitialisation
    const { data, error } = await supabaseClient.functions.invoke(
      "reset-password",
      {
        body: {
          userId: adminProfile.id,
          newPassword
        }
      }
    );

    if (error) {
      throw error;
    }

    showToast("Mot de passe réinitialisé avec succès.", "success");

    document.getElementById("resetPhone").value = "";
    document.getElementById("resetFormule").value = "";
    document.getElementById("resetAmount").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);

  } catch (error) {
    console.error("Erreur reset password :", error);
    showError(error.message || "Erreur lors de la réinitialisation.");
  }
}

document.getElementById("initPassword").addEventListener("click", () => {

  const btn = document.getElementById("initPassword");
  const form = document.getElementById("resetPasswordForm");

  form.classList.toggle("hidden");

  btn.textContent = form.classList.contains("hidden")
    ? "🔑 Mot de passe oublié ?"
    : "❌ Fermer";
});
