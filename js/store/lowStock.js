/************************************************************
 * 📦 MODULE : GESTION DES STOCKS FAIBLES
 * - Appliquer filtres (seuil + recherche)
 * - Afficher les produits critiques
 * - Gérer affichage promo + prix
 *
 * 🔹 Fonction principale :
 * - renderLowStock() → affiche les produits sous seuil
 *
 ************************************************************/
 

/************************************************************
 * ⚠️ AFFICHAGE STOCK FAIBLE
 * ----------------------------------------------------------
 * - filtre par seuil (input utilisateur)
 * - filtre par recherche
 * - exclut produits archivés
 * - tri du plus critique au moins critique
 * - affiche promotion + prix recalculé
 ************************************************************/

function renderLowStock(){

  const threshold = parseInt(document.getElementById("stockThreshold").value) || 0;

  const container = document.getElementById("lowStockList");
  container.innerHTML = "";

   // ✅ recherche
  const search = document.getElementById("searchInput")
    .value
    .toLowerCase()
    .trim();
	
  const lowProducts = products.filter(p => 
  p.active !== false &&              // ✅ EXCLURE archivés
  Number(p.stock || 0) <= threshold &&
  p.name.toLowerCase().includes(search)
 );



  if(lowProducts.length === 0){
    container.innerHTML = "<tr><td colspan='5'>Aucun produit en stock faible ✅</td></tr>";
    return;
  }

  lowProducts
    .sort((a,b) => a.stock - b.stock) // ✅ du plus critique au moins critique
    .forEach(p => {

      const row = document.createElement("tr");
	  
	  const promo = Number(p.promo) || 0;
      const price = Number(p.price) || 0;
	  
	  const finalPrice = promo > 0
       ? price * (1 - promo / 100)
       : price;

      row.innerHTML = `
        <td>${p.image ? `<div class="img-container"><img src="${p.image}"></div> ` : ""}</td>
        <td>
        <span class="price-cell">${p.name}
        ${promo > 0 
          ? `<span style="color:red;font-size:12px;"> (-${promo}%)</span>`
          : ""
        }
       </span></td>
        <td>
        ${promo > 0 
        ? `
          <span class="price-old">
            ${formatPrice(price)} GNF
          </span><br>
          <span class="price-new">
            ${formatPrice(finalPrice)} GNF
          </span>
        `
        : `${formatPrice(price)} GNF`
        }
      </td>
	  <td>
        ${promo > 0 
          ? `<span style="color:#e74c3c;font-weight:bold;">-${promo}%</span>`
          : `—`
        }
      </td>
        <td><strong style="color:red">${p.stock}</strong></td>
      `;

      container.appendChild(row);
    });
}