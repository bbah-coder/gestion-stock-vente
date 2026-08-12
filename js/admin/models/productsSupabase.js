
/*************************************************
 *FUNCTION : ✅ Charger les produits Supabase
 *************************************************/
async function getProductsSupabase() {
    try {
        const { data, error } =
            await supabaseClient
                .from("products")
                .select("*")
                .order("name");
        if (error) {
            console.error(
                "Erreur chargement produits",
                error
            );
            return [];
        }
        return (data || []).map(mapProduct);

    } catch (err) {

        console.error(err);

        return [];
    }

}
/*async function getProductsSupabase() {
    try {

        const { data, error } =
            await supabaseClient
                .from("products")
                .select("*")
                .order("name");
        if (error) {

            console.error(
                "Erreur chargement produits",
                error
            );

            return [];
        }
        return data || [];
    } catch (err) {

        console.error(err);

        return [];
    }
}*/

// --------------------------------------
// ✅ Ajouter un produit dans Supabase
// --------------------------------------
async function saveProductSupabase(product) {

    try {
        const { data, error } = await supabaseClient
            .from("products")
            .insert([product])
            .select();

        if (error) {
            console.error(
                "Erreur insertion produit",
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

// --------------------------------------
// ✅ Ajouter un produit dans Supabase
// --------------------------------------

async function saveProductToSupabase(product) {

    try {
        const shopId = await getCurrentShopId();

        if (!shopId) {
            console.error("Aucun magasin associé");
            return;
        }

        const productSupabase = {

            shop_id: shopId,
            name: product.name,
            price: product.price,
            wholesale_price: product.wholesalePrice || 0,
            wholesale_min_qty: product.wholesaleMinQty || 0,
            stock: product.stock || 0,
            barcode: product.barcode,
            image_url: product.image || null,
            category: product.category || "Autre",
            is_archived: product.isArchived || false,
            archived_at: product.archivedAt || null,
            last_sale_at: product.lastSaleAt || null,
            promo_percent: product.promo || 0,
            created_by: product.createdBy || null,
            created_role: product.createdRole || null,

        };

        await saveProductSupabase(productSupabase);

        console.log("✅ Produit sauvegardé dans Supabase");

    } catch (error) {

        console.error(error);
    }
}

// --------------------------------------
// ✅ Retourne le shopId d'un user
// --------------------------------------
async function getCurrentShopId() {

    try {

        // ✅ Offline
        if (!navigator.onLine) {

            const username =
                localStorage.getItem("username");

            if (!username) {
                return null;
            }

            const profile =
                (await db.profiles.toArray())
                    .find(
                        p => p.username === username
                    );

            return profile?.shop_id || null;

        }

        // ✅ Online
        const {
            data: { user }
        } = await supabaseClient.auth.getUser();

        if (!user) {
            return null;
        }

        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select("shop_id")
                .eq("id", user.id)
                .single();

        if (error) {

            console.error(error);

            return null;

        }

        return data?.shop_id || null;

    } catch (error) {

        console.error(error);

        return null;

    }

}
/*async function getCurrentShopId() {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    const { data, error } =
        await supabaseClient
            .from("profiles")
            .select("shop_id")
            .eq("id", user.id)
            .single();

    if (error) {
        console.error(error);
        return null;
    }

    return data.shop_id;
}*/

// --------------------------------------
// ✅ Modifier un produit dans Supabase
// --------------------------------------
async function updateProductSupabase(product) {

    try {

        const { data, error } =
            await supabaseClient
                .from("products")
                .update({
                    name: product.name,
                    price: product.price,
                    wholesale_price: product.wholesalePrice || 0,
                    wholesale_min_qty: product.wholesaleMinQty || 0,
                    stock: product.stock || 0,
                    barcode: product.barcode,
                    image_url: product.image || null,
                    category: product.category || "Autre",
                    sold: product.sold || 0,
                    entries: product.entries || 0,
                    broken: product.broken || 0,
                    expired: product.expired || 0,
                    lost: product.lost || 0,
                    stolen: product.stolen || 0,
                    don: product.don || 0,
                    is_archived:
                        product.isArchived ??
                        product.is_archived ??
                        false,

                    archived_at:
                        product.archivedAt !== undefined
                            ? product.archivedAt
                            : product.archived_at,

                    last_sale_at:
                        product.lastSaleAt !== undefined
                            ? product.lastSaleAt
                            : product.last_sale_at,

                    promo_percent:
                        product.promo ??
                        product.promo_percent ??
                        0,
                    created_by:
                        product.createdBy ??
                        product.created_by ??
                        null,

                    created_role:
                        product.createdRole ??
                        product.created_role ??
                        null,
                })
                .eq("barcode", product.barcode)
                .select();

        if (error) {
            console.warn("📴 Produit modifié localement. Synchronisation automatique au retour de la connexion");
            return null;
        }
        console.log("✅ Produit mis à jour", data);

        return data[0];

    } catch (err) {
        console.warn("📴 Produit modifié localement, synchronisation différée");

        return null;

    }

}

// --------------------------------------
// ✅ Supprimer un produit dans Supabase
// --------------------------------------
async function deleteProductSupabase(barcode) {

    try {

        const { error } =
            await supabaseClient
                .from("products")
                .delete()
                .eq("barcode", barcode);

        if (error) {
            console.error(
                "Erreur suppression produit",
                error
            );
            return false;
        }

        return true;

    } catch (err) {

        console.error(err);
        return false;

    }

}

//--------------------------------------
// ✅ Chargement sécurisé des produits
//--------------------------------------

async function loadProducts() {

    try {

        const shopId = await getCurrentShopId();

        if (!shopId) {
            return [];
        }

        const products =
            await db.products
                .filter(
                    p => p.shop_id === shopId
                )
                .toArray();

        console.log(`✅ ${products.length} produits chargés pour le magasin ${shopId}`);

        return products;

    } catch (error) {

        console.error(
            "Erreur chargement IndexedDB",
            error
        );

        return [];

    }

}

/*async function loadProducts() {
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

}*/

// --------------------------------------
// ✅ Map Product
// --------------------------------------
function mapProduct(product) {

    return {
        ...product,

        isArchived: product.is_archived ?? false,
        archivedAt: product.archived_at,
        lastSaleAt: product.last_sale_at,

        promo: product.promo_percent ?? 0,

        createdBy: product.created_by,
        createdRole: product.created_role
    };

}
//--------------------------------------
// ✅ Synchronisation unique vers Supabase
//--------------------------------------


/*async function syncProductsToSupabase() {

    for (const product of products) {

        await updateProductSupabase(product);

        console.log(
            "Synchronisé :",
            product.name
        );
    }

    showToast(
        "✅ Synchronisation terminée"
    );
}*/
/*async function testProductsSupabase() {

    const produits =
        await getProductsSupabase();

    console.log(
        "Produits Supabase :",
        produits
    );

    console.log(
        "Nombre :",
        produits.length
    );
}*/