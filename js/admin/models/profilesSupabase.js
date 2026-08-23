async function getProfilesSupabase(shopId = null) {

    try {

        shopId ??= await getCurrentShopId();

        if (!shopId) {

            console.error("Aucun magasin associé");

            return [];
        }

        const { data, error } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq("shop_id", shopId)
                .order("username");

        if (error) {

            console.error(
                "Erreur chargement profils",
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