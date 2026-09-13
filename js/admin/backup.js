/************************************************************
 * 💾 BACKUP / RESTORE
 ************************************************************/

// ✅ lancer toutes les 5 minutes
setInterval(autoBackup, 5 * 60 * 1000);

function generateBackup() {
  return {
    products,
    //stockLogs,
    stockMovements: JSON.parse(localStorage.getItem("stockMovements") || "[]"),
    sales: JSON.parse(localStorage.getItem("sales") || "[]"),
    date: new Date().toISOString()
  };
}

function autoBackup() {

  const backup = generateBackup();

  localStorage.setItem("backup_auto", JSON.stringify(backup));
  localStorage.setItem("lastBackupTime", Date.now());
}

// ✅ toutes les 5 min
setInterval(autoBackup, 5 * 60 * 1000);


//EXPORT MANUEL (BOUTON)

function downloadBackup() {

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
async function handleRestore(event) {

  console.log("🔥 handleRestore déclenché");

  const file = event.target.files[0];

  if (!file) {
    console.log("❌ aucun fichier");
    return;
  }

  await restoreBackup(file);
}

//Alerte si pas sauvegarde
function checkBackupReminder() {

  const last = localStorage.getItem("lastBackupTime");

  if (!last) {
    showToast("⚠️ Pensez à faire une sauvegarde !");
    return;
  }

  const diff = Date.now() - last;

  // 1 heure sans backup
  if (diff > 60 * 60 * 1000) {
    showToast("⚠️ Aucune sauvegarde récente (1h)");
  }
}

async function restoreBackup(file) {

  console.log("✅ restore lancé");

  const currentShop = getCurrentShop();
  const profile = await getCurrentProfile();

  if (!currentShop?.id) {
    showToast("❌ Aucun magasin sélectionné");
    return;
  }

  const reader = new FileReader();

  reader.onload = async function (e) {

    try {

      const data = JSON.parse(e.target.result);

      console.log("✅ JSON chargé", data);

      // ==========================
      // PRODUITS
      // ==========================
      let restoredProducts = [];

      if (Array.isArray(data.products)) {

        await db.products.clear();

        restoredProducts =
          data.products.map(product => ({
            id: product.id || crypto.randomUUID(),
            ...product,
            image: "",
            barcode:
              "PRD-" +
              Date.now()
                .toString()
                .slice(-6),
            entries: (data.stockLogs || [])
              .filter(log =>
                log.product === product.name &&
                log.type === "AJOUT"
              )
              .reduce(
                (sum, log) =>
                  sum + Number(log.quantity || 0),
                0
              ),
            shop_id: currentShop.id,
            isArchived: product.active === false,
            archivedAt:
              product.deletedAt || null,
            sold: Number(product.sold || 0),
            createdBy:
              profile?.username || "Système",
            createdRole:
              profile?.role || "Admin",
            updated_at: new Date().toISOString()

          }));


        await db.products.bulkPut(restoredProducts);

        for (const product of restoredProducts) {
          try {
            await saveProductToSupabase(product);
          } catch (error) {
            console.error(`❌ Produit ${product.name}`, error);
          }
        }

        console.log(`✅ ${restoredProducts.length} produits restaurés`);

      }

      // ==========================
      // VENTES
      // ==========================
      const productsMap =
        new Map(
          restoredProducts.map(product => [
            product.name,
            product.id
          ])
        );

      if (Array.isArray(data.sales)) {

        await db.sales.clear();

        const restoredSales = data.sales.map(sale => ({
          id: crypto.randomUUID(),
          shop_id: currentShop.id,
          items: (sale.items || []).map(item => ({
            ...item,
            productId:
              productsMap.get(item.name) || null
          })),
          totalBrut:
            Number(
              sale.totalBrut ??
              sale.total ??
              0
            ),
          totalRemise:
            Number(
              sale.totalRemise ?? 0
            ),
          total:
            Number(
              sale.total ?? 0
            ),
          totalItems:
            sale.totalItems ??
            (sale.items || []).reduce(
              (sum, item) =>
                sum + Number(item.quantity || 0),
              0
            ),
          clientPhone:
            sale.clientPhone || "",
          paymentMethod:
            sale.paymentMethod ||
            sale.payment?.type ||
            "cash",
          payment:
            sale.payment || {
              type: "cash",
              total: sale.total || 0,
              status: "PAYÉ",
              remaining: 0
            },
          user:
            sale.user ||
            profile?.username ||
            "Admin",
          role:
            sale.role ||
            profile?.role ||
            "admin",
          status:
            sale.status ||
            sale.payment?.status ||
            (
              sale.payment?.type === "credit"
                ? "pending"
                : "paid"
            ),
          created_at:
            sale.created_at ||
            sale.date ||
            new Date().toISOString(),
          updated_at:
            sale.updated_at ||
            sale.date ||
            new Date().toISOString()

        }));

        await db.sales.bulkPut(restoredSales);

        for (const sale of restoredSales) {
          try {
            await saveSaleToSupabase(sale);
          } catch (error) {
            console.error(`❌ Vente ${sale.id}`, error);
          }
        }

        console.log(`✅ ${restoredSales.length} ventes restaurées`);
      }

      // ==========================
      // STOCKLOGS (ancien format)
      // ==========================

      if (Array.isArray(data.stockLogs)) {

        await db.stockMovements.clear();

        const stockMovements = [];

        // Stock initial
        if (Array.isArray(data.products)) {

          data.products.forEach(product => {

            if (
              Number(product.initialStock || 0) > 0
            ) {

              stockMovements.push({
                id: crypto.randomUUID(),
                shop_id: currentShop.id,
                product: product.name,
                type: "entry",
                reason: "initial_stock",
                quantity:
                  Number(product.initialStock || 0),
                user:
                  profile?.username ||
                  "Système",
                role:
                  profile?.role ||
                  "Admin",
                movement_date:
                  product.createdAt
                    ? new Date(product.createdAt)
                      .toISOString()
                    : new Date()
                      .toISOString(),
                date:
                  product.createdAt
                    ? new Date(product.createdAt)
                      .toLocaleString("fr-FR")
                    : new Date()
                      .toLocaleString("fr-FR")
              });

            }

          });
        }

        // Historique existant
        data.stockLogs.forEach(log => {

          stockMovements.push({
            id: crypto.randomUUID(),
            shop_id: currentShop.id,
            product: log.product,
            type:
              log.type === "AJOUT"
                ? "entry"
                : 'exit',
            reason:
              log.type === "AJOUT"
                ? "achat"
                : "sale",
            quantity:
              Number(log.quantity || 0),
            user:
              profile?.username ||
              "Inconnu",
            role:
              profile?.role ||
              "Inconnu",
            movement_date:
              parseFrenchDate(log.date),
            date:
              parseFrenchDate(log.date)

          });

        });

        await db.stockMovements.bulkPut(stockMovements);

        for (const movement of stockMovements) {
          try {
            await saveStockMovementSupabase(movement);
          } catch (error) {
            console.error(`❌ Mouvement ${movement.id}`, error);
          }
        }

        console.log(`✅ ${stockMovements.length} mouvements restaurés`);
      }

      // ==========================
      // STOCKMOVEMENTS (nouveau format)
      // ==========================

      if (Array.isArray(data.stockMovements)) {

        await db.stockMovements.clear();

        const restoredMovements =
          data.stockMovements.map(movement => ({
            ...movement,
            shop_id: currentShop.id,
            updated_at: new Date().toISOString()
          }));

        await db.stockMovements.bulkPut(restoredMovements);

        for (const movement of restoredMovements) {
          try {
            await saveStockMovementSupabase(movement);
          } catch (error) {
            console.error(`❌ Mouvement ${movement.id}`, error);
          }
        }

        console.log(`✅ ${restoredMovements.length} mouvements restaurés`);
      }

      showToast("✅ Restauration terminée avec succès", "success");

      setTimeout(() => {
        location.reload();
      }, 1000);

    } catch (error) {

      console.error("❌ Erreur restauration", error);

      showToast("❌ Fichier de sauvegarde invalide", "error");
    }

  };

  reader.readAsText(file);
}
