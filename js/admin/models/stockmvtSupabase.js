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
                        movement.date
                            ? new Date(movement.date)
                            : new Date()
                }])
                .select();

        if (error) {
            console.error(
                "Erreur insertion mouvement",
                error
            );
            return null;
        }

        return data[0];

    } catch (err) {

        console.error(err);

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
            console.error(
                "Erreur chargement mouvements",
                error
            );

            return [];
        }

        return data || [];

    } catch (err) {

        console.error(err);

        return [];

    }

}

//--------------------------------------
// ✅ Chargement sécurisé des mouvements
//--------------------------------------
/*async function loadStockMovements() {

    try {
        const movements =
            await getStockMovementsSupabase();

        console.log(
            `✅ ${movements.length} mouvements chargés depuis Supabase`
        );

        return movements;

    } catch (error) {

        console.error(error);

        return JSON.parse(
            localStorage.getItem(
                "stockMovements"
            )
        ) || [];

    }

}*/
async function loadStockMovements() {

    try {
        const movements =
            await getStockMovementsSupabase();

        console.log(
            `✅ ${movements.length} mouvements chargés depuis Supabase`
        );

        return movements.map(m => ({
            ...m,
            // Compatibilité ancien code
            product: m.product_name,
            barcode: m.product_barcode,
            user: m.username,
            role: m.role,
            date: new Date(
                m.movement_date || m.created_at
            ).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })

        }));

    } catch (error) {

        console.error(error);

        return JSON.parse(
            localStorage.getItem(
                "stockMovements"
            )
        ) || [];

    }

}