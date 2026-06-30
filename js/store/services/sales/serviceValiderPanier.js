/**
 * =========================================================
 * SERVICE : CALCUL + VALIDATION PANIER
 * RESPONSABILITÉ :
 * - Vérifier stock
 * - Calculer brut / remise / net
 * - Mettre à jour stock
 * - Générer logs
 * =========================================================
 */
function processCart(cart, products, stockLogs){

  let totalBrut = 0;
  let totalRemise = 0;
  let totalNet = 0;
  let totalItems = 0;

  for (const item of cart) {

    const product = products[item.index];

    if (product.stock < item.quantity) {
      return { error: `❌ Stock insuffisant pour ${product.name}` };
    }

    // ✅ update stock
    product.stock -= item.quantity;
    product.sold = (product.sold || 0) + item.quantity;

    // ✅ calcul
    const brut = item.price * item.quantity;
    const remise = Math.min(item.remise || 0, brut);
    const net = brut - remise;

    totalBrut += brut;
    totalRemise += remise;
    totalNet += net;
    totalItems += item.quantity;

    // ✅ log
    stockLogs.unshift({
      product: item.name,
      type: "VENTE",
      quantity: item.quantity,
      date: new Date().toLocaleString()
    });
  }

  if(totalNet === 0){
    return { error: "❌ Le montant de la vente est nul" };
  }

  return {
    totalBrut,
    totalRemise,
    totalNet,
    totalItems
  };
}
