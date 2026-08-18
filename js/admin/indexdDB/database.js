const db = new Dexie("POS_DB");

db.version(2).stores({

    products: `
        id,
        shop_id,
        name,
        barcode,
        updated_at,
        category
    `,

    stockMovements: `
        id,
        shop_id,
        movement_date,
        updated_at,
        product_name,
        product_barcode
    `,

    profiles: `
        id,
        username,
        shop_id
    `,

    shops: `
        id,
        active
    `,

    settings: `
        key
    `
});


async function getSetting(key) {

    const setting =
        await db.settings.get(key);

    return setting?.value || null;
}

async function setSetting(key, value) {

    await db.settings.put({
        key,
        value
    });

}

// database/import.js

async function importProductsToIndexedDB() {

    const products = await getProductsSupabase();

    await db.products.bulkPut(products);

    if (products.length > 0) {

        const newestUpdatedAt =
            products.reduce(
                (max, product) =>
                    product.updated_at > max
                        ? product.updated_at
                        : max,
                products[0].updated_at
            );

        await setSetting("products_last_sync", newestUpdatedAt);

        console.log("✅ Mouvement sauvegardé dans IndexedDB");
    }
}

//Sync produit
async function syncProducts() {
    try {

        //Synchro vers supabase des produits en offline
        await uploadPendingProducts();

        const lastSync = await getSetting("products_last_sync");

        if (!lastSync) {
            console.warn("Aucune date de synchro");

            return;
        }

        const { data, error } =
            await supabaseClient
                .from("products")
                .select("*")
                .gt(
                    "updated_at",
                    lastSync
                );

        if (error) {

            console.error(error);

            return;
        }

        const products =
            (data || []).map(mapProduct);

        if (products.length > 0) {

            await db.products.bulkPut(products);

            const newestUpdatedAt =
                products.reduce(
                    (max, product) =>
                        product.updated_at > max
                            ? product.updated_at
                            : max,
                    lastSync
                );

            await setSetting(
                "products_last_sync", newestUpdatedAt);

        }
        console.log(`✅ ${products.length} produits synchronisés`);

    } catch (error) {

        console.warn("⚠️ Synchronisation impossible", error);

    }

}


async function loadProductsIndexedDB() {

    try {

        const products =
            await db.products
                .orderBy("name")
                .toArray();

        console.log(
            `✅ ${products.length} produits chargés depuis IndexedDB`
        );

        return products;

    } catch (error) {

        console.error(
            "Erreur chargement IndexedDB",
            error
        );

        return [];
    }
}

//Les mouvement des stocks

async function importStockMovementsToIndexedDB() {

    const movements =
        await getStockMovementsSupabase();

    await db.stockMovements.bulkPut(
        movements
    );

    if (movements.length > 0) {

        const newestUpdatedAt =
            movements.reduce(
                (max, movement) =>
                    movement.updated_at > max
                        ? movement.updated_at
                        : max,
                movements[0].updated_at
            );

        await setSetting(
            "stock_movements_last_sync",
            newestUpdatedAt
        );
    }

    console.log(
        `✅ ${movements.length} mouvements importés`
    );

}

async function syncStockMovements() {

    try {
        //Synchro supabase de mvt en offline
        await uploadPendingStockMovements();

        const lastSync = await getSetting("stock_movements_last_sync");

        if (!lastSync) {
            console.warn("Aucune date de synchro mouvements");
            return;
        }
        const { data, error } =
            await supabaseClient
                .from("stock_movements")
                .select("*")
                .gt("updated_at", lastSync);

        if (error) {
            console.error(error);
            return;
        }
        const movements = (data || []).map(mapStockMovement);

        if (movements.length > 0) {

            await db.stockMovements.bulkPut(movements);

            const newestUpdatedAt =
                movements.reduce(
                    (max, movement) =>
                        movement.updated_at > max
                            ? movement.updated_at
                            : max,
                    lastSync
                );

            await setSetting("stock_movements_last_sync", newestUpdatedAt);
        }

        console.log(`✅ ${movements.length} mouvements synchronisés`);

    } catch (error) {

        console.warn(
            "⚠️ Synchronisation mouvements impossible", error);
    }
    stockMovements = await loadStockMovements();

    products = await loadProducts();

    render();
}

//Chrager le mvt en pending offline
async function uploadPendingStockMovements() {

    const pendingMovements = await getPendingStockMovements();

    console.log(`${pendingMovements.length} mouvements à synchroniser`);

    const shopId = await getCurrentShopId();

    if (!shopId) {
        console.error("Aucun magasin associé");
        return;
    }

    for (const movement of pendingMovements) {

        try {

            const { error } =
                await supabaseClient
                    .from("stock_movements")
                    .insert([{
                        id: movement.id,
                        shop_id: shopId,
                        product_name: movement.product,
                        product_barcode:
                            movement.barcode ||
                            null,
                        type: movement.type,
                        reason: movement.reason,
                        quantity: movement.quantity,
                        comment:
                            movement.comment || "",
                        username:
                            movement.user,
                        role:
                            movement.role,
                        movement_date:
                            movement.movement_date
                    }]);

            if (error) {
                console.error("❌ Erreur synchro mouvement", movement.id, error);
                continue;
            }
            await db.stockMovements.update(movement.id,
                {
                    pending_sync: false
                }
            );

            console.log(
                "✅ Mouvement synchronisé", movement.id);

        } catch (error) {

            console.warn("📴 Synchronisation impossible", error);

        }

    }

}

//Recuperer les mvts à synchroniser vers supabase
async function getPendingStockMovements() {
    return await db.stockMovements
        .filter(
            movement =>
                movement.pending_sync === true
        )
        .toArray();
}

//Charger les produits à sync avec supabase
async function uploadPendingProducts() {

    const pendingProducts = await getPendingProducts();

    console.log(`${pendingProducts.length} produits à synchroniser`);

    for (const product of pendingProducts) {

        const updatedProduct = await updateProductSupabase(product);

        if (!updatedProduct) {
            continue;
        }

        await db.products.update(
            product.id,
            {
                pending_sync: false
            }
        );

        console.log(
            "✅ Produit synchronisé", product.name);

    }

}


//Recuperer les produits mise à jour à synchro vers supabase
async function getPendingProducts() {

    return await db.products
        .filter(
            p => p.pending_sync === true
        )
        .toArray();

}

async function importProfilesToIndexedDB() {

    try {

        const currentShop =
            await loadCurrentShop();

        if (!currentShop) {
            return;
        }

        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq(
                    "shop_id",
                    currentShop.id
                );

        if (error) {
            throw error;
        }

        const profiles =
            data || [];

        await db.profiles.bulkPut(
            profiles
        );

        if (profiles.length > 0) {

            const newestUpdatedAt =
                profiles.reduce(
                    (max, profile) =>
                        profile.updated_at > max
                            ? profile.updated_at
                            : max,
                    profiles[0].updated_at
                );

            await setSetting(
                "profiles_last_sync",
                newestUpdatedAt
            );

        }

        console.log(
            `✅ ${profiles.length} profils importés`
        );

    } catch (error) {

        console.error(
            "Erreur import profils",
            error
        );

    }

}

async function syncProfiles() {

    try {

        const lastSync =
            await getSetting(
                "profiles_last_sync"
            );

        if (!lastSync) {

            console.warn(
                "Aucune date de synchro profils"
            );

            return;

        }

        const currentShop =
            await loadCurrentShop();

        if (!currentShop) {
            return;
        }

        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq(
                    "shop_id",
                    currentShop.id
                )
                .gt(
                    "updated_at",
                    lastSync
                );

        if (error) {

            console.error(error);

            return;

        }

        const profiles =
            data || [];

        if (profiles.length > 0) {

            await db.profiles.bulkPut(
                profiles
            );

            const newestUpdatedAt =
                profiles.reduce(
                    (max, profile) =>
                        profile.updated_at > max
                            ? profile.updated_at
                            : max,
                    lastSync
                );

            await setSetting(
                "profiles_last_sync",
                newestUpdatedAt
            );

        }

        console.log(
            `✅ ${profiles.length} profils synchronisés`
        );

    } catch (error) {

        console.warn(
            "⚠️ Synchronisation profils impossible",
            error
        );

    }

}