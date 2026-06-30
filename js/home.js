/************************************************************
 * INIT USER DEFAULT
 ***********************************************************/

function goLogin() {
  window.location.href = "login.html";
}

function goRegister() {
  window.location.href = "register.html";
}


function showRegister() {
  document.getElementById("registerForm").classList.remove("hidden");
}

function hideRegister() {
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("formRegister").classList.add("hidden");
}


// ✅ CREATE ACCOUNT COMPLET
async function createAccount() {

  const usernameEl = document.getElementById("newUsername");
  const passwordEl = document.getElementById("newPassword");
  const roleEl = document.getElementById("role");

  const username = usernameEl.value.trim();
  const password = passwordEl.value;
  const role = roleEl.value;

  if (!username || !password) {
    alert("⚠️ Remplir tous les champs");
    return;
  }

  if (username.includes(" ")) {
    alert("❌ Nom utilisateur invalide");
    return;
  }

  const email = toEmail(username);

  try {

    // ✅ 1. Signup
    const { error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      alert("❌ " + error.message);
      return;
    }

    console.log("✅ User créé Supabase :", email);

    // ✅ 2. RÉCUPÉRER USER CONNECTÉ (SOLUTION FIABLE)
    const { data: userData } = await supabaseClient.auth.getUser();

    const userId = userData?.user?.id;

    if (!userId) {
      alert("❌ Impossible de récupérer userId");
      return;
    }

    console.log("✅ USER ID:", userId);

    // ✅ 3. INSERT PROFILE
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .insert([
        {
          id: userId,
          username,
          role
        }
      ])
      .select();

    console.log("PROFILE INSERT DATA:", profileData);
    console.log("PROFILE INSERT ERROR:", profileError);

    if (profileError) {
      console.error(profileError);
      alert("❌ Erreur création profil");
      return;
    }

    // ✅ 4. fallback local
    let users = JSON.parse(localStorage.getItem("users") || "[]");

    users.push({
      id: userId,
      username,
      password: btoa(password),
      role,
      active: true
    });

    localStorage.setItem("users", JSON.stringify(users));

    alert("✅ Compte créé");

    usernameEl.value = "";
    passwordEl.value = "";

    hideRegister();

    if (typeof renderUsers === "function") {
      renderUsers();
    }

  } catch (err) {

    console.error(err);
    alert("❌ Erreur réseau");

  }
}
