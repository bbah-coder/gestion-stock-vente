/**
 * =========================================================
 * CONTROLLER : VALIDATION PANIER
 * =========================================================
 */
function validerPanier(){

  const paymentMethod = getPaymentMethod();

  // ✅ sécurité panier vide
  if(cart.length === 0){
    alert("❌ Panier vide, impossible de valider la vente");
    return;
  }

  // ✅ 1. PROCESS CART
  const result = processCart(cart, products, stockLogs);

  if(result.error){
    alert(result.error);
    return;
  }

  const {
    totalBrut,
    totalRemise,
    totalNet
  } = result;

  // ✅ 2. PAYMENT
  const paymentDetails = buildPaymentDetails(
    paymentMethod,
    totalNet,
    creditData
  );

  if(paymentDetails.error){
    alert(paymentDetails.error);
    return;
  }

  // ✅ 3. CREATE SALE
  const sale = {
    id: Date.now(),

    items: cart.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      remise: item.remise || 0,
      total: (item.price * item.quantity) - (item.remise || 0)
    })),

    totalBrut,
    totalRemise,
    total: totalNet,

    payment: {
      ...paymentDetails,
      total: totalNet,
      remaining: totalNet - (
        paymentDetails.payments?.reduce((s,p)=>s+p.amount,0) || 0
      )
    },

    date: new Date()
  };

  sales.push(sale);

  // ✅ 4. SAVE
  saveAllData({
    sales,
    products,
    cart: [],
    stockLogs
  });

  // ✅ 5. RESET STATE
  cart = [];
  creditData = null;

  // ✅ 6. REFRESH UI
  renderCart(); 
  renderProducts();
  renderDashboard();
  renderSalesByDay();
  updateCartBadge();
  renderStatsTables();
  filterSalesByDate();
  renderLowStock();
  updateCartMobileBtn();

  alert("✅ Vente validée avec succès");

  document.querySelector(
    'input[name="paymentMethod"][value="cash"]'
  ).checked = true;
}