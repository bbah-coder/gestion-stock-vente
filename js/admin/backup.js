/************************************************************
 * 💾 BACKUP / RESTORE
 ************************************************************/

// ✅ lancer toutes les 5 minutes
setInterval(autoBackup, 5 * 60 * 1000);

function generateBackup(){
  return {
    products,
    stockLogs,
    sales: JSON.parse(localStorage.getItem("sales") || "[]"),
    date: new Date().toISOString()
  };
}

function autoBackup(){

  const backup = generateBackup();

  localStorage.setItem("backup_auto", JSON.stringify(backup));
  localStorage.setItem("lastBackupTime", Date.now());
}

// ✅ toutes les 5 min
setInterval(autoBackup, 5 * 60 * 1000);


//EXPORT MANUEL (BOUTON)

function downloadBackup(){

  const data = generateBackup();

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;

  const date = new Date().toISOString().split("T")[0];

  a.download = "backup_" + date + ".json";
  a.click();
}

// RESTORE (IMPORT FICHIER)
function handleRestore(event){

  console.log("🔥 handleRestore déclenché");

  const file = event.target.files[0];

  if(!file){
    console.log("❌ aucun fichier");
    return;
  }

  restoreBackup(file);
}

//Alerte si pas sauvegarde
function checkBackupReminder(){

  const last = localStorage.getItem("lastBackupTime");

  if(!last){
    alert("⚠️ Pensez à faire une sauvegarde !");
    return;
  }

  const diff = Date.now() - last;

  // 1 heure sans backup
  if(diff > 60 * 60 * 1000){
    alert("⚠️ Aucune sauvegarde récente (1h)");
  }
}

function restoreBackup(file){

  console.log("✅ restore lancé");

  const reader = new FileReader();

  reader.onload = function(e){

    console.log("✅ fichier lu");

    try {

      const data = JSON.parse(e.target.result);

      console.log("✅ JSON OK", data);

      if(data.products){
        localStorage.setItem("products", JSON.stringify(data.products));
      }

      if(data.sales){
        localStorage.setItem("sales", JSON.stringify(data.sales));
      }

      if(data.stockLogs){
        localStorage.setItem("stockLogs", JSON.stringify(data.stockLogs));
      }

      alert("✅ Restauration réussie");
      location.reload();

    } catch(err){
      console.error("❌ Erreur JSON", err);
      alert("❌ Fichier invalide");
    }

  };

  reader.readAsText(file);
}