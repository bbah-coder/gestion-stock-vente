/************************************************************
 * 📂 FILTRE DES VENTES PAR DATE
 * ----------------------------------------------------------
 * Rôle :
 * - Récupérer uniquement les ventes du jour sélectionné
 *
 * Entrée :
 * → date (YYYY-MM-DD)
 *
 * Sortie :
 * → tableau filtré des ventes du jour
 ************************************************************/

function getSalesByDate(date){
  return sales.filter(s =>
    new Date(s.date).toISOString().split("T")[0] === date
  );
}


/************************************************************
 * 📊 CALCUL DES STATISTIQUES DU JOUR
 * ----------------------------------------------------------
 * Rôle :
 * - Calculer tous les KPI métier
 *
 * KPI calculés :
 * ✅ CA encaissé
 * ✅ Crédit (encours)
 * ✅ CA brut / remise
 * ✅ Nombre de tickets
 * ✅ Nombre d'articles vendus
 * ✅ CA par catégorie
 * ✅ Top produits (quantité + CA)
 *
 * Important :
 * → Gère le ratio encaissement/crédit
 * → Source unique de vérité des stats
 *
 * Sortie :
 * → objet "stats"
 ************************************************************/

function computeSalesStats(daySales, selectedCategory, search){

  let totalCA = 0;
  let encours = 0;
  let totalItems = 0;
  let totalBrut = 0;
  let totalRemise = 0;
  let nbTickets = 0;

  const productStatsQty = {};
  const productStatsCA = {};
  const categoryStats = {};

  daySales.forEach(sale => {

    nbTickets++;

    const saleTotal = sale.payment?.total || sale.total || 0;
    let totalPaid = 0;

    if (sale.payment?.type === "credit") {
      totalPaid = (sale.payment.payments || [])
        .reduce((sum,p)=> sum + (p.amount||0),0);

      totalCA += totalPaid;
      encours += (saleTotal - totalPaid);
    } else {
      totalPaid = saleTotal;
      totalCA += saleTotal;
    }

    sale.items.forEach(item => {

      if(search && !item.name.toLowerCase().includes(search)) return;

      const product = products.find(p =>
        p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );

      const category = product?.category || "Autre";
      if(selectedCategory !== "all" && category !== selectedCategory) return;

      const brut = item.price * item.quantity;
      const net = item.total || brut;
      const remise = brut - net;

      totalItems += item.quantity;
      totalBrut += brut;
      totalRemise += remise;

      const ratio = saleTotal ? totalPaid / saleTotal : 0;

      // ✅ CATEGORY
      categoryStats[category] ??= { brut:0, remise:0, encaisse:0, credit:0 };

      categoryStats[category].brut += brut;
      categoryStats[category].remise += remise;
      categoryStats[category].encaisse += net * ratio;
      categoryStats[category].credit += net * (1-ratio);

      // ✅ QTY
      productStatsQty[item.name] =
        (productStatsQty[item.name] || 0) + item.quantity;

      // ✅ CA
      productStatsCA[item.name] ??= { brut:0, remise:0, encaisse:0, credit:0 };

      productStatsCA[item.name].brut += brut;
      productStatsCA[item.name].remise += remise;
      productStatsCA[item.name].encaisse += net * ratio;
      productStatsCA[item.name].credit += net * (1-ratio);

    });

  });

  return {
    totalCA, encours, totalItems,
    totalBrut, totalRemise, nbTickets,
    productStatsQty, productStatsCA, categoryStats
  };
}

/************************************************************
 * 📊 COMPARAISON AVEC LE DERNIER JOUR ACTIF
 * ----------------------------------------------------------
 * Rôle :
 * - Trouver le DERNIER jour avec CA > 0
 * - Calculer les métriques de ce jour
 *
 * KPI calculés :
 * ✅ CA précédent
 * ✅ Crédit précédent
 * ✅ Nombre de tickets précédent
 * ✅ Différence CA (%)
 *
 * Important :
 * ❌ NE compare PAS avec "hier"
 * ✅ Compare avec dernier jour réel d’activité
 *
 * Sortie :
 * → objet "comparison"
 ************************************************************/

function computeComparison(selectedDate, totalCA){

  let lastDate = null;

  // ✅ 1. TRI DESC (important)
  const sorted = [...sales].sort(
    (a,b) => new Date(b.date) - new Date(a.date)
  );

  // ✅ 2. TROUVER DERNIER JOUR ACTIF
  for (let sale of sorted){

    const d = new Date(sale.date).toISOString().split("T")[0];

    if (d >= selectedDate) continue;

    const saleTotal = sale.payment?.total || sale.total || 0;

    let totalPaid = 0;

    if(sale.payment?.type === "credit"){
      totalPaid = (sale.payment.payments || [])
        .reduce((sum,p)=> sum + (p.amount||0),0);
    } else {
      totalPaid = saleTotal;
    }

    if (totalPaid > 0){
      lastDate = d;
      break;
    }
  }

  // ✅ 3. SI RIEN TROUVÉ → RETURN N/A
  if (!lastDate){
    return {
      lastDate: null,
      caYesterday: 0,
      encoursYesterday: 0,
      lastTickets: 0,
      diff: "—",
      ticketDiff: "—"
    };
  }

  // ✅ 4. RECALCUL COMPLET
  let lastCA = 0;
  let lastEncours = 0;
  let lastTickets = 0;

  sales.forEach(s => {

    const d = new Date(s.date).toISOString().split("T")[0];
    if (d !== lastDate) return;

    lastTickets++;

    const saleTotal = s.payment?.total || s.total || 0;

    let totalPaid = 0;

    if(s.payment?.type === "credit"){

      totalPaid = (s.payment.payments || [])
        .reduce((sum,p)=> sum + (p.amount||0),0);

      lastCA += totalPaid;
      lastEncours += (saleTotal - totalPaid);

    } else {
      lastCA += saleTotal;
    }
  });

  return {
    lastDate,
    caYesterday: lastCA,
    encoursYesterday: lastEncours,
    lastTickets,
    diff: calcDiff(totalCA, lastCA)
  };
}
