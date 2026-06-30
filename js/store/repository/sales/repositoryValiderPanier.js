function saveAllData({ sales, products, cart, stockLogs }){

  localStorage.setItem("sales", JSON.stringify(sales));
  localStorage.setItem("products", JSON.stringify(products));
  localStorage.setItem("cart", JSON.stringify(cart));
  localStorage.setItem("stockLogs", JSON.stringify(stockLogs));
}