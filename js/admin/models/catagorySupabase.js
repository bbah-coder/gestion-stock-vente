/*************************************************
 *FUNCTION : Renvoie les catégories
 *************************************************/
async function getCategoriesSupabase() {
    const { data, error } =
        await supabase
            .from('categories')
            .select('*')
            .order('name');

    if (error) {
        console.error(error);
        return [];
    }

    return data || [];
}

/*************************************************
 *FUNCTION : Ajouter une catégorie
 *************************************************/
async function addCategorySupabase(category) {

    const { data, error } =
        await supabase
            .from('categories')
            .insert([category])
            .select();

    if (error) {
        console.error(error);
        return null;
    }

    return data[0];
}

/*************************************************
 *FUNCTION : Lecture depuis Supabase
 *************************************************/
async function loadCategories() {

    const categories =
        await getCategoriesSupabase();

    renderCategories(categories);
}