/* =========================================================
   MODULE : STATS SERVICE
   RESPONSABILITÉ :
   - Calculer toutes les statistiques
   - Agréger les données ventes
   - NE PAS manipuler le DOM
   ========================================================= */

function computeStatsData(sales, context){

  /* =========================================================
     CONTEXTE
     ========================================================= */
  const { monthValue, yearValue, isMonth, isYear } = context;

  /* =========================================================
     KPI GLOBAL
     ========================================================= */
  let total = 0;
  let totalBrut = 0;
  let totalRemise = 0;
  let encoursCurrent = 0;
  let currentTickets = 0;

  /* =========================================================
     COMPARAISONS
     - Mois précédent
     - Année N-1
     ========================================================= */
  let prevTotalCA = 0;
  let prevTickets = 0;
  let prevDaysSet = new Set();

  let lastYearTotalCA = 0;
  let lastYearTickets = 0;
  let lastYearDaysSet = new Set();

  const lastYearMonthValue = getSameMonthLastYear(monthValue);
  const prevMonthValue = getPreviousMonth(monthValue);
  const prevYearValue = (Number(yearValue) - 1).toString();

  /* =========================================================
     AGRÉGATS
     ========================================================= */

  // ✅ Catégories
  const categoryMonth = {};
  const categoryYear = {};

  // ✅ Produits (Top 10)
  const productStatsMonth = {};
  const productStatsYear = {};

  // ✅ Jours ouverts (dynamique mois / année)
  const daysSet = new Set();

  /* =========================================================
     PARCOURS DES VENTES
     ========================================================= */
  sales.forEach(sale => {

    /* =========================
       CALCUL TOTAL VENTE
    ========================= */
    const totalNet = (sale.items || []).reduce((sum, item) => {
      const brut = item.price * item.quantity;
      const remise = item.remise || 0;
      return sum + (brut - remise);
    }, 0);

    /* =========================
       ENCAISSÉ vs CRÉDIT
    ========================= */
    let totalPaid = 0;

    if(sale.payment?.type === "credit"){
      totalPaid = (sale.payment.payments || [])
        .reduce((sum,p) => sum + Number(p.amount || 0), 0);
    } else {
      totalPaid = totalNet;
    }

    const remaining = Math.max(0, totalNet - totalPaid);

    /* =========================
       DATE
    ========================= */
    const d = new Date(sale.date);
    const monthKey = d.toISOString().slice(0,7);
    const yearKey = d.getFullYear().toString();
    const dayKey = d.toISOString().split("T")[0];

    /* =========================
       FILTRE ACTIF (MOIS / ANNÉE)
    ========================= */
    const isInScope =
      (isMonth && monthKey === monthValue) ||
      (isYear && yearKey === yearValue);

    /* =========================
       KPI GLOBAL
    ========================= */
    if(isInScope){
      currentTickets++;
      daysSet.add(dayKey);
    }

    /* =========================
       COMPARAISON MOIS PRÉCÉDENT
    ========================= */
    if(monthKey === prevMonthValue){
      prevTotalCA += totalPaid;
      prevTickets++;
      prevDaysSet.add(dayKey);
    }

    /* =========================
       COMPARAISON ANNÉE N-1
    ========================= */
    if(
      (isMonth && monthKey === lastYearMonthValue) ||
      (isYear && yearKey === prevYearValue)
    ){
      lastYearTotalCA += totalPaid;
      lastYearTickets++;
      lastYearDaysSet.add(dayKey);
    }

    /* =========================
       SORTIE SI HORS FILTRE
    ========================= */
    if(!isInScope) return;

    total += totalPaid;
    encoursCurrent += remaining;

    /* =========================================================
       PARCOURS DES PRODUITS
       ========================================================= */
    (sale.items || []).forEach(item => {

      /* =========================
         CALCUL LIGNE (UNE SEULE FOIS)
      ========================= */
      const brut = item.price * item.quantity;
      const net = item.total || brut;
      const remise = brut - net;

      /* =========================
         RATIO (répartition encaisse/crédit)
      ========================= */
      const ratio = totalNet > 0 ? (net / totalNet) : 0;

      totalBrut += brut;
      totalRemise += remise;

      /* =========================================================
         PRODUITS (TOP 10)
         ========================================================= */
      const productTarget = isMonth
        ? productStatsMonth
        : productStatsYear;

      productTarget[item.name] ??= {
        quantity: 0,
        brut: 0,
        remise: 0,
        encaisse: 0,
        credit: 0
      };

      productTarget[item.name].quantity += item.quantity;
      productTarget[item.name].brut += brut;
      productTarget[item.name].remise += remise;

      // ✅ encaisse RÉEL (important)
      productTarget[item.name].encaisse += totalPaid * ratio;
      productTarget[item.name].credit += remaining * ratio;

      /* =========================================================
         CATÉGORIES
         ========================================================= */
      const product = products.find(p => p.name === item.name);
      const category = product?.category || "Autre";

      const categoryTarget = isMonth
           ? categoryMonth
          : categoryYear;

      if(categoryTarget){

        categoryTarget[category] ??= {
          brut: 0,
          remise: 0,
          encaisse: 0,
          credit: 0
        };

        categoryTarget[category].brut += brut;
        categoryTarget[category].remise += remise;
        categoryTarget[category].encaisse += net;
        categoryTarget[category].credit += remaining * ratio;
        // ✅ calcul % (on fera total plus bas)
        categoryTarget[category].percent = 0;
        categoryTarget[category].color = "";
        }

    });

  });

  /* =========================================================
     CALCULS DERIVÉS (POUR VIEW PROPRE)
     ========================================================= */
     
  const caNet = totalBrut - totalRemise;

  const nbDays = daysSet.size;
  const lastYearDays = lastYearDaysSet.size;

  const perDayCurrent = nbDays ? total / nbDays : 0;
  const perDayPrev = lastYearDays ? lastYearTotalCA / lastYearDays : 0;
 

  const calcDiff = (current, prev) => {
    if(!prev) return "0%";
    return ((current - prev) / prev * 100).toFixed(1) + "%";
  };

  const evolutionCA = calcDiff(total, lastYearTotalCA);
  const evolutionTickets = calcDiff(currentTickets, lastYearTickets);
  const evolutionPerDay = calcDiff(perDayCurrent, perDayPrev);

  const applyCategoryMetrics = (categories) => {

      const totalEncaisse = Object.values(categories)
          .reduce((sum, v) => sum + v.encaisse, 0);

      Object.values(categories).forEach(v => {

          const percent = totalEncaisse > 0
               ? (v.encaisse / totalEncaisse) * 100
               : 0;

          v.percent = percent.toFixed(1);

          v.color =
              percent >= 50 ? "#16a34a" :
              percent >= 20 ? "#f59e0b" :
              "#ef4444";
      });
  };

  // ✅ appliquer sur les 2
  applyCategoryMetrics(categoryMonth);
  applyCategoryMetrics(categoryYear);


  /* =========================================================
     RETURN FINAL
     ========================================================= */
  return {
    total,
    totalBrut,
    totalRemise,
    encoursCurrent,
    currentTickets,

    categoryMonth,
    categoryYear,

    productStatsMonth,
    productStatsYear,

    nbDays,

    lastYearTotalCA,
    lastYearTickets,
    lastYearDays,

    prevTotalCA,
    prevTickets,
    prevDays: prevDaysSet.size,

    // ✅ nouveaux champs (VIEW PROPRE)
    perDayCurrent,
    perDayPrev,
    evolutionCA,
    evolutionTickets,
    evolutionPerDay,
    caNet
  };
}



