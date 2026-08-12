//--------------------------------------
// ✅ Ajouter un mouvement dans Supabase
//--------------------------------------
async function saveStockMovementSupabase(movement) {

    try {
        const shopId = await getCurrentShopId();

        if (!shopId) {
            console.error("Aucun magasin associé");
            return;
        }

        const { data, error } =
            await supabaseClient
                .from("stock_movements")
                .insert([{
                    shop_id: shopId,
                    product_name: movement.product,
                    product_barcode: movement.barcode || null,
                    type: movement.type,
                    reason: movement.reason,
                    quantity: movement.quantity,
                    comment: movement.comment || "",
                    username: movement.user,
                    role: movement.role,
                    movement_date:
                        movement.movement_date
                }])
                .select();

        if (error) {
            console.warn("📴 Mouvement enregistré localement. Synchronisation automatique au retour de la connexion");

            return null;
        }

        return data[0];

    } catch (err) {
        console.warn("📴 Mode offline - mouvement en attente de synchronisation");
        return null;

    }

}



//--------------------------------------
// ✅ Charger les mouvements Supabase
//--------------------------------------
async function getStockMovementsSupabase() {

    try {

        const { data, error } =
            await supabaseClient
                .from("stock_movements")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

        if (error) {
            console.error("Erreur chargement mouvements", error);
            return [];
        }

        return (data || [])
            .map(mapStockMovement);

    } catch (err) {

        console.error(err);

        return [];
    }

}

//--------------------------------------
// ✅ Chargement sécurisé des mouvements
//--------------------------------------

async function loadStockMovements() {

    try {

        const shopId =
            await getCurrentShopId();

        if (!shopId) {
            return [];
        }

        const movements =
            (await db.stockMovements
                .toArray())
                .filter(
                    movement =>
                        movement.shop_id === shopId
                )
                .sort(
                    (a, b) =>
                        new Date(b.movement_date) -
                        new Date(a.movement_date)
                );

        console.log(
            `✅ ${movements.length} mouvements chargés pour le magasin ${shopId}`
        );

        return movements;

    } catch (error) {

        console.error(
            "Erreur chargement IndexedDB",
            error
        );

        return [];

    }

}

/*async function loadStockMovements() {

    try {
        const movements =
            await db.stockMovements
                .orderBy("movement_date")
                .reverse()
                .toArray();

        console.log(
            `✅ ${movements.length} mouvements chargés depuis IndexedDB`
        );

        return movements;

    } catch (error) {

        console.error(
            "Erreur chargement IndexedDB",
            error
        );

        return [];
    }

}*/

function mapStockMovement(movement) {

    return {
        ...movement,

        // Compatibilité ancien code
        product: movement.product_name,
        barcode: movement.product_barcode,
        user: movement.username,
        role: movement.role,

        date: new Date(
            movement.movement_date ||
            movement.created_at
        ).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    };

}