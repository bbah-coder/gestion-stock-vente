/* =========================================================
   MODULE : STATS VIEW
   RESPONSABILITÉ :
   - Affichage KPI global
   - Manipulation DOM uniquement
   ========================================================= */

/* =========================================================
   VIEW : KPI GLOBAL
========================================================= */

function renderGlobalKPI(stats, context) {

  // ✅ SAFE
  if (!context || !stats) {
    console.error("❌ context ou stats undefined", context, stats);
    return;
  }

  const {
    total,
    totalBrut,
    totalRemise,
    encoursCurrent,
    currentTickets,
    nbDays,
    caNet
  } = stats;

  const {
    isMonth,
    isYear,
    monthLabel,
    yearLabel
  } = context;

  // ✅ reconstitution titre complet (comme avant)
  const title = isMonth
    ? `📊 Ventes - ${monthLabel}`
    : `📊 Ventes - ${yearLabel}`;

  const header = document.getElementById("statsTitle");
  if (header) {
    header.innerText = title;
  }


  document.getElementById("globalTotal").innerHTML = `
    <div style="line-height:1.7;">

     

      <div>💰 <strong>CA brut :</strong> ${formatPrice(totalBrut)} GNF</div>

      <div style="color:red;">
        💸 <strong>Remise :</strong>
        ${totalRemise > 0 ? "- " + formatPrice(totalRemise) : "-"}
      </div>

      <div>
        📊 <strong>CA net :</strong>
        ${formatPrice(caNet)} GNF
      </div>

      <div style="color:green;">
        ✅ <strong>CA encaissé :</strong>
        ${formatPrice(total)} GNF
      </div>

      <div style="color:orange;">
        🟠 <strong>Encours crédit :</strong>
        ${formatPrice(encoursCurrent)} GNF
      </div>

      <div>
        🧾 <strong>Tickets :</strong> ${currentTickets}
      </div>

      <div>
        📅 <strong>Jours ouverts :</strong> ${nbDays}
      </div>

    </div>
  `;
}



/* =========================================================
   VIEW : MOBILE STATS
   RESPONSABILITÉ :
   - Affichage mobile uniquement
   ========================================================= */

function renderStatsMobile(stats, context) {

  if (!context || !stats) {
    console.error("❌ context ou stats undefined", context, stats);
    return;
  }

  const {
    total,
    totalBrut,
    totalRemise,
    encoursCurrent,
    currentTickets,
    prevTotalCA,
    lastYearTotalCA,
    productStatsMonth,
    productStatsYear,
    caNet
  } = stats;

  const {
    isMonth,
    monthLabel,
    yearLabel,
    prevMonthValue,
    prevYearValue
  } = context;

  const sourceProducts = isMonth
    ? stats.productStatsMonth
    : stats.productStatsYear;

  const top3 = Object.entries(sourceProducts || {})
    .sort((a, b) => b[1].encaisse - a[1].encaisse)
    .slice(0, 3);

  const topHTML = top3.map((p, i) =>
    `<div>${i + 1}. ${p[0]} — ${formatPrice(p[1].encaisse)} GNF</div>`
  ).join("");



  const labelCompare = isMonth
    ? formatMonthLabel(prevMonthValue)
    : prevYearValue;

  document.getElementById("globalTotal").innerHTML = `
    <div class="mobile-detail-card">

      <div class="header">
        ${isMonth ? monthLabel : yearLabel}
      </div>

      <div class="bloc">
        💰 CA brut : <strong>${formatPrice(totalBrut)} GNF</strong><br>
        <span style="color:red;">
          💸 Remise : - ${formatPrice(totalRemise)} GNF
        </span><br>
        📊 Net : <strong>${formatPrice(caNet)} GNF</strong><br>
        ✅ Encaissé : <strong>${formatPrice(total)} GNF</strong><br>
        🟠 Crédit : <strong>${formatPrice(encoursCurrent)} GNF</strong>
      </div>

      <div class="bloc">
        🧾 Tickets : ${currentTickets || 0}<br>
        📅 Jours ouverts : ${stats.nbDays}
      </div>

      <div class="bloc">
        📊 Vs ${labelCompare} :

        <div>
          ${formatPrice(total)} GNF vs ${isMonth ? formatPrice(prevTotalCA) : formatPrice(lastYearTotalCA)
    } GNF
        </div>

        <strong>
          ${getEvolution(
      total,
      isMonth ? prevTotalCA : lastYearTotalCA
    )}
        </strong>
      </div>

      <div class="bloc">
        🔥 Top 3 produits :
        ${topHTML}
      </div>

    </div>
  `;

  // ✅ masquage UI
  document.getElementById("blockMonth").style.display = "none";
  document.getElementById("blockYear").style.display = "none";
  document.getElementById("blockCategoryMonth").style.display = "none";
  document.getElementById("blockCategoryYear").style.display = "none";
  document.getElementById("topProducts").style.display = "none";
}

/* =========================================================
   VIEW : COMPARAISON MEME MOIS ANNEE PRECEDENTE
========================================================= */
function renderStatsComparisonTable(stats, context) {

  if (!context || !stats) {
    console.error("❌ context ou stats undefined", context, stats);
    return;
  }

  const {
    total,
    currentTickets,
    nbDays,
    encoursCurrent,

    lastYearTotalCA,
    lastYearTickets,
    lastYearDays,

    // ✅ provenant du service
    perDayCurrent,
    perDayPrev,
    evolutionCA,
    evolutionTickets,
    evolutionPerDay

  } = stats;

  const isMonth = context.isMonth;

  const currentLabel = isMonth
    ? context.monthLabel
    : context.yearLabel;

  const prevLabel = isMonth
    ? formatMonthLabel(getSameMonthLastYear(context.monthValue))
    : (Number(context.yearLabel) - 1).toString();

  const container = document.getElementById("kpiMonthYearComparison");
  if (!container) return;

  container.innerHTML = `
    <h3>📊 Comparaison ${currentLabel} vs ${prevLabel}</h3>

    <table>
      <thead>
        <tr>
          <th>KPI</th>
          <th>${prevLabel}</th>
          <th>${currentLabel}</th>
          <th>Evolution</th>
        </tr>
      </thead>

      <tbody>

        <!-- CA NET -->
        <tr>
          <td>CA net</td>

          <td>
            ✅ <strong>${formatPrice(lastYearTotalCA)} GNF encaissé</strong>
          </td>

          <td>
            ✅ <strong>${formatPrice(total)} GNF encaissé</strong>
           ${encoursCurrent > 0
      ? `<div style="color:orange; font-size:12px;">
                   🟠 ${formatPrice(encoursCurrent)} crédit
                 </div>`
      : ""
    }
          </td>

          <td>${evolutionCA}</td>
        </tr>

        <!-- TICKETS -->
        <tr>
          <td>📄 Nb tickets</td>
          <td>${lastYearTickets}</td>
          <td>${currentTickets}</td>
          <td>${evolutionTickets}</td>
        </tr>

        <!-- JOURS -->
        <tr>
          <td>📅 Nb jours ouverts</td>
          <td>${lastYearDays ?? 0}</td>
          <td>${nbDays}</td>
          <td></td>
        </tr>

        <!-- CA / JOUR -->
        <tr>
          <td>📊 CA net / jour ouvert</td>

          <td>
            ✅ <strong>${formatPrice(perDayPrev)} GNF</strong>
          </td>

          <td>
            ✅ <strong>${formatPrice(perDayCurrent)} GNF</strong>

           ${encoursCurrent > 0
      ? `<div style="color:orange; font-size:12px;">
                   🟠 ${formatPrice(encoursCurrent / (nbDays || 1))} crédit
                 </div>`
      : ""
    }
          </td>

          <td>${evolutionPerDay}</td>
        </tr>

      </tbody>
    </table>
  `;
}


/*=========================================================
   VIEW : COMPARAISON KPI MOIS EN COURS ET MOIS PRECEDENT
========================================================= */
function renderComparisonMonthTable(stats, context) {

  if (!stats || !context) {
    console.error("❌ stats ou context undefined");
    return;
  }

  const {
    total,
    currentTickets,
    nbDays,
    encoursCurrent,
    prevTotalCA,
    prevTickets,
    prevDays
  } = stats;

  const { monthLabel, monthValue } = context;

  const prevMonthValue = getPreviousMonth(monthValue);
  const prevLabel = formatMonthLabel(prevMonthValue);

  function calcDiff(current, prev) {
    if (!prev) return "0%";
    return ((current - prev) / prev * 100).toFixed(1) + "%";
  }

  const encaisseCurrent = total;
  const encaissePrev = prevTotalCA;

  const perDayCurrent = nbDays ? encaisseCurrent / nbDays : 0;
  const perDayPrev = prevDays ? encaissePrev / prevDays : 0;

  const container = document.getElementById("kpiMonthComparison");
  if (!container) return;

  container.innerHTML = `
    <h3>📊 Comparaison ${monthLabel} vs ${prevLabel}</h3>

    <table>
      <thead>
        <tr>
          <th>KPI</th>
          <th>Mois précédent</th>
          <th>Mois en cours</th>
          <th>Evolution</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>CA net</td>
          <td><strong>✅ ${formatPrice(encaissePrev)} GNF encaissé </strong></td>
          <td><strong>
            ✅ ${formatPrice(encaisseCurrent)} GNF encaissé </strong>
            <div style="color:orange; font-size:12px;">🟠 ${formatPrice(encoursCurrent)} crédit</div>
          </td>
          <td>${calcDiff(encaisseCurrent, encaissePrev)}</td>
        </tr>

        <tr>
          <td>📄 Nb tickets</td>
          <td>${prevTickets}</td>
          <td>${currentTickets}</td>
          <td>${calcDiff(currentTickets, prevTickets)}</td>
        </tr>

        <tr>
          <td>📅 Nb jours ouverts</td>
          <td>${prevDays}</td>
          <td>${nbDays}</td>
          <td>—</td>
        </tr>

        <tr>
          <td>📊 CA net / jour ouvert</td>
          <td><strong class="price-cell">✅ ${formatPrice(perDayPrev)} GNF encaissé</strong></td>
          <td><strong>✅ ${formatPrice(perDayCurrent)} GNF encaissé</strong>
            <div style="color:orange;font-size:12px;">
              🟠 ${formatPrice(encoursCurrent / (nbDays || 1))} crédit
            </div>
          
          </td>
          <td>${calcDiff(perDayCurrent, perDayPrev)}</td>
        </tr>

      </tbody>
    </table>
  `;
}

/*=========================================================
   VIEW : KPI MOIS / ANNEE
========================================================= */
function renderSummaryTable(stats, context) {

  if (!stats || !context) return;

  const {
    total,
    totalBrut,
    totalRemise,
    currentTickets,
    nbDays,
    encoursCurrent
  } = stats;

  const isMonth = context.isMonth;
  const label = isMonth ? context.monthLabel : context.yearLabel;
  const value = isMonth ? context.monthValue : context.yearLabel;

  const container = document.getElementById("kpiMonthSummary");
  if (!container) return;

  const title = isMonth
    ? `CA mois de - ${label}`
    : `CA année - ${label}`;

  const firstCol = isMonth ? "Mois" : "Année";

  container.innerHTML = `
    <h3>${title}</h3>

    <table>
      <thead>
        <tr>
          <th>${firstCol}</th>
          <th>CA brut</th>
          <th>Remise</th>
          <th>CA net</th>
          <th>Nb tickets</th>
          <th>Nb jours ouvrés</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${value}</td>
          <td><strong>${formatPrice(totalBrut)} GNF</strong></td>
          <td style="color:red;">
            ${totalRemise > 0 ? "- " + formatPrice(totalRemise) : "-"}
          </td>
          <td>
            ✅ <strong>${formatPrice(total)} GNF encaissé</strong>
            ${encoursCurrent > 0
      ? `<div style="color:orange;font-size:12px;">
                   🟠 ${formatPrice(encoursCurrent)} crédit
                 </div>`
      : ""
    }
          </td>
          <td>${currentTickets}</td>
          <td>${nbDays}</td>
        </tr>
      </tbody>
    </table>
  `;
}



/*=========================================================
   VIEW : CATÉGORIES MOIS / ANNEE
========================================================= */

function renderCategoryTable(stats, context) {

  const isMonth = context.isMonth;

  const data = isMonth ? stats.categoryMonth : stats.categoryYear;
  const label = isMonth ? context.monthLabel : context.yearLabel;

  const container = document.getElementById(
    isMonth ? "tableCategoryMonth" : "tableCategoryYear"
  );

  const title = document.getElementById(
    isMonth ? "categoryMonthTitle" : "categoryYearTitle"
  );

  if (!container) return;

  if (title) {
    title.innerText = `💰 CA par catégorie - ${label}`;
  }

  container.innerHTML = "";

  const sorted = Object.entries(data || {})
    .sort((a, b) => b[1].encaisse - a[1].encaisse);

  sorted.forEach(([cat, value], index) => {

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index === 0 ? "🥇 " : ""}${cat}</td>
      <td><strong>${formatPrice(value.brut)} GNF</strong></td>
      <td style="color:red;">
        ${value.remise > 0 ? "- " + formatPrice(value.remise) : "-"}
      </td>
      <td>
        ✅ <strong>${formatPrice(value.encaisse)} GNF encaissé</strong>
        ${value.credit > 0
        ? `<div style="color:orange;font-size:12px;">
               🟠 ${formatPrice(value.credit)} crédit
             </div>`
        : ""
      }
      </td>
      <td style="color:${value.color};font-weight:bold;">
        ${value.percent}%
      </td>
    `;

    container.appendChild(row);
  });
}

/*=========================================================
   VIEW : TOP PRODUIT EN CA et QTE
========================================================= */

function renderTopProducts(stats, context) {

  if (!stats || !context) return;

  const isMonth = context.isMonth;
  const label = isMonth ? context.monthLabel : context.yearLabel;

  const container = document.getElementById("topProducts");
  if (!container) return;

  const data = isMonth
    ? stats.productStatsMonth
    : stats.productStatsYear;

  const entries = Object.entries(data || {});

  if (entries.length === 0) {
    container.innerHTML = "";
    return;
  }

  // ✅ TITRES DYNAMIQUES (COMME TON SCRIPT LEGACY)
  const topTitle = isMonth
    ? `🏆 Top produits - ${label}`
    : `🏆 Top produits - ${label}`;

  const subTitle = isMonth
    ? "📅 Analyse mensuelle"
    : "📅 Analyse annuelle";

  // ✅ TOP QUANTITÉ
  const topQty = [...entries]
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 10);

  // ✅ TOP CA
  const topCA = [...entries]
    .sort((a, b) => b[1].encaisse - a[1].encaisse)
    .slice(0, 10);

  const totalCA = entries.reduce((sum, [, v]) => sum + v.encaisse, 0);

  container.innerHTML = `
    <h3 style="margin-top:30px;">${topTitle}</h3> 
    <h4 style="margin:10px 0 20px 0;">${subTitle}</h4>
   <table class="stats-table">
      <thead>
        <tr>
          <th colspan="3">📦 Top 10 Produits (Quantité)</th>
        </tr>
        <tr>
          <th>Produit</th>
          <th><span class="price-cell">Quantité vendue </span></th>
          <th>Stock restant</th>
        </tr>
      </thead>
      <tbody>
        ${topQty.map(([name, v], i) => {

    const product = products.find(p => p.name === name);
    const stock = product?.stock ?? "-";

    return `
          <tr>
            <td>${i < 3 ? ["🥇", "🥈", "🥉"][i] : (i + 1) + ". "} ${name}</td>
            <td><strong>${v.quantity}</strong></td>
            <td>${stock}</td>
          </tr>`;
  }).join("")}
      </tbody>
    </table>

       <table class="stats-table">
      <thead>
        <tr>
          <th colspan="6">💰 Top 10 Produits (CA)</th>
        </tr>
        <tr>
          <th>Produit</th>
          <th>CA brut</th>
          <th>Remise</th>
          <th>CA net</th> 
          <th>%CA</th>
          <th>Stock restant</th>
        </tr>
      </thead>
      <tbody>
        ${topCA.map(([name, v], i) => {

    const percent = totalCA
      ? ((v.encaisse / totalCA) * 100).toFixed(1)
      : 0;

    const product = products.find(p => p.name === name);
    const stock = product?.stock ?? "-";

    return `
          <tr>
            <td>${i < 3 ? ["🥇", "🥈", "🥉"][i] : (i + 1) + ". "} ${name}</td>

            <td><strong>${formatPrice(v.brut)} GNF</strong></td>

            <td style="color:red;">${v.remise > 0
        ? `- ${formatPrice(v.remise)} GNF`
        : "-"
      }
            </td>
            
            <td>
              <strong class="price-cell">✅ ${formatPrice(v.encaisse)} GNF encaissé</strong>
                ${v.credit > 0 ? `
                <div style="color:orange; font-size:12px;">
                   🟠 ${formatPrice(v.credit)} crédit
                </div>` : ""}
            </td>

            <td style="color:${getPercentColor(percent)};">${percent}%</td>
            <td>${stock}</td>
          </tr>`;
  }).join("")}
      </tbody>
    </table>
  `;
}
