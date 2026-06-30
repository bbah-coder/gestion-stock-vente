/************************************************************
 * INIT USER DEFAULT
 ***********************************************************/

document.addEventListener("DOMContentLoaded", () => {
  initDefaultUser();
});

function initDefaultUser(){

  let users = JSON.parse(localStorage.getItem("users") || "[]");

  // ✅ si aucun utilisateur → créer admin par défaut
  if(users.length === 0){

    const defaultUser = {
      username: "admin",
      password: btoa("1234"),
      role: "admin",
      active: true
    };

    users.push(defaultUser);

    localStorage.setItem("users", JSON.stringify(users));

    console.log("✅ Admin par défaut créé");
  }
}


function goLogin(){
  window.location.href = "login.html";
}

function goRegister(){
  window.location.href = "register.html";
}


function showRegister(){
  document.getElementById("registerForm").classList.remove("hidden");
}

function hideRegister(){
  document.getElementById("registerForm").classList.add("hidden");
  document.getElementById("formRegister").classList.add("hidden");
}


//CREATION COMPTE userAgent
function createAccount(){

  const username = document.getElementById("newUsername").value.trim();
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("role").value;

  if(!username || !password){
    alert("⚠️ Remplir tous les champs");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users") || "[]");

  const exists = users.find(u => u.username === username);

  if(exists){
    alert("❌ Utilisateur déjà existant");
    return;
  }

  users.push({
    username,
    password: btoa(password),
    role,
    active: true
  });

  localStorage.setItem("users", JSON.stringify(users));

  alert("✅ Compte créé");

  // reset form
  document.getElementById("newUsername").value = "";
  document.getElementById("newPassword").value = "";

  hideRegister();
}



