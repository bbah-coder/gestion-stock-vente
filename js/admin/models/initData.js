/************************************************************** 
 FUNCTION : Init Data chargement des données depuis supabase
***************************************************************/

async function initializeLocalData() {
    try {

        const shopId = await getCurrentShopId();

        if (!shopId) {
            console.error("Aucun magasin associé");
            return false;
        }

        console.log("🔄 Initialisation des données...");

        // Produits
        const products = await getProductsSupabase(shopId);

        if (products?.length) {
            await db.products.bulkPut(products);
            console.log(`✅ ${products.length} produits importés`);
        }

        // Mouvements de stock
        const stockMovements = await getStockMovementsSupabase(shopId);

        if (stockMovements?.length) {
            await db.stockMovements.bulkPut(stockMovements);
            console.log(`✅ ${stockMovements.length} mouvements importés`);
        }

        // Profils
        const profiles = await getProfilesSupabase(shopId);

        if (profiles?.length) {
            await db.profiles.bulkPut(profiles);
            console.log(`✅ ${profiles.length} profils importés`);
        }

        localStorage.setItem(
            "first_sync_done",
            "true"
        );

        console.log("✅ Initialisation terminée");

        return true;

    } catch (error) {
        console.error(
            "Erreur initialisation",
            error
        );
        return false;
    }
}

/************************************************************** 
 FUNCTION : Init Data prémiere connexion
***************************************************************/
async function bootstrapData() {

    const productsCount = await db.products.count();
    const profilesCount = await db.profiles.count();
    const movementsCount = await db.stockMovements.count();

    if (
        productsCount === 0 ||
        profilesCount === 0 ||
        movementsCount === 0
    ) {
        await initializeLocalData();
    }
}