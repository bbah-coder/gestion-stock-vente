/************************************************************
 * INIT USER DEFAULT
 ***********************************************************/

function goLogin() {
  window.location.href = "login.html";
}

function goRegister() {
  window.location.href = "register.html";
}

async function registerAccount() {
  try {
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const userCompte = document.getElementById("userCompte");

    userCompte.innerText = "";

    if (!username || !password) {
      showToast("Veuillez renseigner tous les champs.");
      return;
    }

    // Vérifier si le nom utilisateur existe déjà
    const { data: existingProfile, error: checkError } =
      await supabaseClient
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

    if (checkError) {
      throw checkError;
    }

    if (existingProfile) {
      showToast("Ce nom d'utilisateur existe déjà. Veuillez choisir un autre identifiant!!");
      return;
    }

    // Génération email technique
    const email = toEmail(username);

    // Création Auth Supabase
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) throw error;

    const userId = data.user?.id;

    if (!userId) {
      throw new Error(
        "Impossible de récupérer l'identifiant utilisateur."
      );
    }

    // Création profil
    const { error: profileError } = await supabaseClient
      .from("profiles")
      .insert({
        id: userId,
        username,
        role: "admin",
        active: false
      });

    if (profileError) throw profileError;

    userCompte.innerText =
      "Compte créé avec succès.\n\nVotre compte est en attente de validation par le Super Administrateur.";

    document.getElementById("registerUsername").value = "";
    document.getElementById("registerPassword").value = "";

  } catch (error) {
    console.error("Erreur création compte :", error);

    showToast(
      error.message || "Erreur lors de la création du compte.",
      "error"
    );
  }
}




