// --------------------------------------
// ✅ Map sales entête
// --------------------------------------

function mapSale(row) {
    return {
        id: row.id,
        shop_id: row.shop_id,
        user: row.user_name,
        role: row.user_role,
        items: row.items || [],
        totalBrut: row.total_brut || 0,
        totalRemise: row.total_remise || 0,
        total: row.total_net || 0,
        clientPhone: row.client_phone || "",
        payment: row.payment || {},
        date:
            row.created_at

    };

}

// --------------------------------------
// ✅ Map sales détail
// --------------------------------------

function mapSaleItem(row) {

    return {
        id: row.id,
        sale_id: row.sale_id,
        product_id: row.product_id,
        product_name: row.product_name,
        barcode: row.barcode,
        quantity: row.quantity,
        unit_price: row.unit_price,
        wholesale_price: row.wholesale_price,
        applied_price: row.applied_price,
        discount: row.discount,
        total: row.total,
        created_at: row.created_at

    };

}

//--------------------------------------
// ✅ Chargement sécurisé des ventes
//--------------------------------------

async function loadSales() {

    try {

        const shopId = await getCurrentShopId();

        if (!shopId) {
            return [];
        }

        const sales = await db.sales
            .where("shop_id")
            .equals(shopId)
            .toArray();

        console.log(
            `✅ ${sales.length} ventes chargéess pour le magasin ${shopId}`
        );

        return sales;

    } catch (error) {

        console.error("❌ Erreur chargement ventes", error);

        return [];

    }

}

//------------------------------------------------
// ✅ Chargement sécurisé des lignes de ventes
//------------------------------------------------

async function loadSaleItems() {

    try {

        const items = await db.saleItems.toArray();

        console.log(`✅ ${items.length} lignes de vente chargées`);

        return items;

    } catch (error) {

        console.error("❌ Erreur chargement lignes de vente", error);

        return [];

    }

}

//-----------------------------------------------------------
// ✅ Chargement sécurisé des lignes de ventes avec shopId
//-----------------------------------------------------------
async function loadSaleItems() {

    try {

        const shopId = await getCurrentShopId();

        if (!shopId) {
            return [];
        }

        const items = await db.saleItems
            .where("shop_id")
            .equals(shopId)
            .toArray();

        console.log(`✅ ${items.length} lignes de vente chargées`);

        return items;

    } catch (error) {

        console.error("❌ Erreur chargement lignes de vente", error);

        return [];

    }

}

//--------------------------------------
// ✅ chargement des ventes dans Supabase
//--------------------------------------

async function saveSaleToSupabase(sale) {

    try {

        const { data, error } =
            await supabaseClient
                .from("sales")
                .insert([{
                    id: sale.id,
                    shop_id:
                        sale.shop_id,
                    user_name:
                        sale.user,
                    user_role:
                        sale.role,
                    items:
                        sale.items,
                    total_brut:
                        sale.totalBrut,
                    total_remise:
                        sale.totalRemise,
                    total_net:
                        sale.total,
                    total_items:
                        sale.totalItems,
                    client_phone:
                        sale.clientPhone,
                    payment_method:
                        sale.paymentMethod,
                    payment:
                        sale.payment,
                    status:
                        sale.status || "paid",
                    created_at:
                        sale.date ||
                        sale.created_at ||
                        new Date().toISOString(),
                }])
                .select()
                .single();

        if (error) {

            console.error("❌ Erreur Supabase vente :", error);

            return null;
        }

        console.log("✅ Vente enregistrée dans Supabase", data.id);

        return data;

    } catch (error) {

        console.error("❌ Exception saveSaleToSupabase :", error);

        return null;

    }

}

async function getSalesSupabase(shopId) {

    try {

        shopId = await getCurrentShopId();

        if (!shopId) {

            console.error("Aucun magasin associé");

            return [];

        }

        const { data, error } = await supabaseClient
            .from("sales")
            .select("*")
            .eq("shop_id", shopId)
            .order("created_at", {
                ascending: false
            });

        if (error) {

            console.error(
                "❌ Erreur chargement ventes Supabase",
                error
            );

            return [];
        }

        console.log(
            `✅ ${data.length} ventes récupérées depuis Supabase`
        );

        return data;

    } catch (error) {

        console.error(
            "❌ Erreur getSalesSupabase",
            error
        );

        return [];

    }

}

async function updateSaleSupabase(sale) {

    try {

        if (!sale?.id) {

            console.error("❌ updateSaleSupabase : id de vente manquant", sale);

            return null;
        }

        const { data, error } =
            await supabaseClient
                .from("sales")
                .update({
                    user_name: sale.user,
                    user_role: sale.role,
                    items: sale.items,
                    total_brut: sale.totalBrut,
                    total_remise: sale.totalRemise,
                    total_net: sale.total,
                    total_items: sale.totalItems,
                    client_phone: sale.clientPhone,
                    payment_method: sale.paymentMethod,
                    payment: sale.payment,
                    status: sale.status,
                    updated_at:
                        new Date().toISOString()

                })
                .eq("id", sale.id)
                .eq("shop_id", sale.shop_id)
                .select()
                .single();

        if (error) {

            console.error("❌ Erreur updateSaleSupabase :", error);

            return null;
        }

        console.log(
            "✅ Vente mise à jour dans Supabase :", sale.id);

        return data;

    } catch (error) {

        console.error("❌ Exception updateSaleSupabase :", error);

        return null;
    }

}