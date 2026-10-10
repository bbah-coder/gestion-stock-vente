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

function getSalesByDate(date) {
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

function computeSalesStats(daySales, dayReturns, selectedCategory, search) {

  let totalCA = 0;
  let encours = 0;
  let totalItems = 0;
  let totalBrut = 0;
  let totalRemise = 0;
  let totalRefunds = 0;
  let nbTickets = 0;

  let totalCADetail = 0;
  let totalCAGros = 0;

  //Compteur tickets détail/gros et articles
  let detailTickets = 0;
  let wholesaleTickets = 0;

  let detailArticles = 0;
  let wholesaleArticles = 0;

  const productStatsQty = {};
  const productStatsCA = {};
  const categoryStats = {};

  //Retours client
  (dayReturns || [])

    .filter(
      r => r.return_type === "refund"
    )

    .forEach(retour => {

      totalRefunds += Number(
        retour.total_amount || 0
      );

    });

  daySales.forEach(sale => {

    nbTickets++;

    //Competeur tickets gros/detail
    const hasWholesale =
      sale.items?.some(
        item => item.isWholesale
      );
    if (hasWholesale) {
      wholesaleTickets++;
    } else {
      detailTickets++;
    }

    const saleTotal = sale.payment?.total || sale.total || 0;
    let totalPaid = 0;

    if (sale.payment?.type === "credit") {
      totalPaid = (sale.payment.payments || [])
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      totalCA += totalPaid;
      encours += (saleTotal - totalPaid);
    } else {
      totalPaid = saleTotal;
      totalCA += saleTotal;
    }

    sale.items.forEach(item => {

      if (search && !item.name.toLowerCase().includes(search)) return;

      const product = products.find(p =>
        p.name.toLowerCase().trim() === item.name.toLowerCase().trim()
      );

      const category = product?.category || "Autre";
      if (selectedCategory !== "all" && category !== selectedCategory) return;

      const brut = item.price * item.quantity;
      const net = item.total || brut;
      const remise = brut - net;

      // ✅ CA détail / gros
      if (item.isWholesale) {
        totalCAGros += net;
      } else {
        totalCADetail += net;
      }

      totalItems += item.quantity;
      //Compteur Articles(détail/gros)
      if (item.isWholesale) {
        wholesaleArticles += item.quantity;
      } else {
        detailArticles += item.quantity;
      }

      totalBrut += brut;
      totalRemise += remise;

      const ratio = saleTotal ? totalPaid / saleTotal : 0;

      // ✅ CATEGORY
      categoryStats[category] ??= {
        brut: 0,
        remise: 0,
        retours: 0,
        encaisse: 0,
        encaisseNet: 0,
        credit: 0
      };

      categoryStats[category].brut += brut;
      categoryStats[category].remise += remise;
      categoryStats[category].encaisse += net * ratio;
      categoryStats[category].credit += net * (1 - ratio);

      // ✅ QTY
      productStatsQty[item.name] =
        (productStatsQty[item.name] || 0) + item.quantity;

      // ✅ CA
      productStatsCA[item.name] ??= {
        brut: 0,
        remise: 0,
        retours: 0,
        encaisse: 0,
        encaisseNet: 0,
        credit: 0
      };

      productStatsCA[item.name].brut += brut;
      productStatsCA[item.name].remise += remise;
      productStatsCA[item.name].encaisse += net * ratio;
      productStatsCA[item.name].credit += net * (1 - ratio);

    });


  });

  //Retour categorie
  (dayReturns || [])

    .filter(r => r.return_type === "refund")

    .forEach(retour => {
      const product = products.find(
        p => p.id === retour.product_id
      );

      if (!product) return;
      const category = product.category || "Autre";

      if (!categoryStats[category]) return;

      categoryStats[category].retours += Number(retour.total_amount || 0);

    });

  Object.values(categoryStats)
    .forEach(cat => {
      cat.encaisseNet =
        Number(cat.encaisse || 0) -
        Number(cat.retours || 0);

    });

  //Retour render produit 
  (dayReturns || [])

    .filter(
      r => r.return_type === "refund"
    )
    .forEach(retour => {

      const product = products.find(
        p => p.id === retour.product_id
      );

      if (!product) return;

      if (!productStatsCA[product.name])
        return;
      productStatsCA[product.name].retours +=
        Number(retour.total_amount || 0);
    });

  Object.values(productStatsCA)
    .forEach(prod => {
      prod.encaisseNet =
        Number(prod.encaisse || 0) -
        Number(prod.retours || 0);

    });

  const caNet = totalBrut - totalRemise - totalRefunds;

  const totalEncaisseNet = totalCA - totalRefunds;

  return {
    totalCA,
    totalRefunds,
    totalEncaisseNet,
    caNet,

    encours,
    totalItems,
    totalBrut,
    totalRemise,
    nbTickets,

    totalCADetail,
    totalCAGros,

    detailTickets,
    wholesaleTickets,

    detailArticles,
    wholesaleArticles,

    productStatsQty,
    productStatsCA,
    categoryStats
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

function computeComparison(selectedDate, totalCA, saleReturns) {

  let lastDate = null;

  // ✅ 1. TRI DESC (important)
  const sorted = [...sales].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // ✅ 2. TROUVER DERNIER JOUR ACTIF
  for (let sale of sorted) {

    const d = new Date(sale.date).toISOString().split("T")[0];

    if (d >= selectedDate) continue;

    const saleTotal = sale.payment?.total || sale.total || 0;

    let totalPaid = 0;

    if (sale.payment?.type === "credit") {
      totalPaid = (sale.payment.payments || [])
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    } else {
      totalPaid = saleTotal;
    }

    if (totalPaid > 0) {
      lastDate = d;
      break;
    }
  }

  // ✅ 3. SI RIEN TROUVÉ → RETURN N/A
  if (!lastDate) {
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
  let lastRefunds = 0;

  sales.forEach(s => {

    const d = new Date(s.date).toISOString().split("T")[0];
    if (d !== lastDate) return;

    lastTickets++;

    const saleTotal = s.payment?.total || s.total || 0;

    let totalPaid = 0;

    if (s.payment?.type === "credit") {

      totalPaid = (s.payment.payments || [])
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      lastCA += totalPaid;
      lastEncours += (saleTotal - totalPaid);

    } else {
      lastCA += saleTotal;
    }
  });

  //Retours client
  (saleReturns || [])

    .filter(
      r =>
        r.return_type === "refund" &&
        r.created_at?.slice(0, 10) === lastDate
    )

    .forEach(retour => {

      lastRefunds += Number(
        retour.total_amount || 0
      );

    });

  const lastCANet = lastCA - lastRefunds;

  return {
    lastDate,
    caYesterday: lastCANet,
    refundsYesterday: lastRefunds,
    encoursYesterday: lastEncours,
    lastTickets,
    diff: calcDiff(totalCA, lastCANet)
  };
}
