
/************************************************************
 * 🖥️ RENDU COMPLET DESKTOP
 * ----------------------------------------------------------
 * Rôle :
 * - Afficher la vue complète desktop
 *
 * Sections rendues :
 * ✅ Header date
 * ✅ KPI global
 * ✅ Tableau comparaison
 * ✅ CA par catégorie
 * ✅ Top produits
 *
 * Fonctions appelées :
 * ✅ renderHeader()
 * ✅ renderKPIBlock()
 * ✅ renderSalesComparisonTable()
 * ✅ renderCategoryTable()
 * ✅ renderTopTables()
 ************************************************************/

function renderDesktopFull(stats, comparison, selectedDate){

  const kpiContainer = document.getElementById("historyKPI");
  const topContainer = document.getElementById("topProductsHistory");

  const dateStr = formatDateFR(new Date(selectedDate));

  // ✅ Header
  renderHeader(dateStr);

  // ✅ KPI
  kpiContainer.innerHTML = `
    ${renderKPIBlock(stats)}
    ${renderSalesComparisonTable(stats, comparison)}
  `;

  // ✅ Tables
  topContainer.innerHTML = `
    ${renderCategoryTable(stats, dateStr)}
    ${renderTopTables(stats, dateStr)}
  `;
}

/************************************************************
 * 📅 HEADER DATE (DESKTOP)
 * ----------------------------------------------------------
 * Rôle :
 * - Mettre à jour la date affichée en haut
 ************************************************************/

function renderHeader(dateStr){
  const el = document.getElementById("detailDate");
  if(el) el.innerText = dateStr;
}

/************************************************************
 * 📊 KPI GLOBAL (BLOC ROSE)
 * ----------------------------------------------------------
 * Rôle :
 * - Afficher résumé global des ventes
 *
 * KPI :
 * ✅ CA brut
 * ✅ Remise
 * ✅ CA net
 * ✅ CA encaissé
 * ✅ Crédit
 * ✅ Tickets
 * ✅ Articles
 * ✅ Références
 ************************************************************/

function renderKPIBlock(stats){

  const caNet = stats.totalBrut - stats.totalRemise;
  const nbProduits = Object.keys(stats.productStatsQty || {}).length;

  return `
    <div style="
      background:#eecfcf;
      padding:10px;
      border-radius:8px;
      font-weight:bold;
      margin-bottom:10px;
    ">
      💰 CA brut : ${formatPrice(stats.totalBrut)} |
      💸 Remise : ${stats.totalRemise > 0 ? `<span style="color:red;">- ${formatPrice(stats.totalRemise)} GNF</span>`  : "-"} |
      💰 CA net : ${formatPrice(caNet)} |
      ✅ CA encaissé : ${formatPrice(stats.totalCA)} |
      🟠 Crédit : ${formatPrice(stats.encours)} |
      🎟️ Tickets : ${stats.nbTickets} |
      📦 Articles : ${stats.totalItems} |
      🧩 Références : ${nbProduits}
    </div>
  `;
}

/************************************************************
 * 📊 TABLE COMPARAISON
 *-----------------------------------------------------------
 * Rôle :
 * - Comparer jour courant vs dernier jour actif
 *
 * KPI affichés :
 * ✅ CA encaissé + crédit
 * ✅ Evolution (%)
 * ✅ Tickets
 *
 * Sécurité :
 * ✅ Gère les cas N/A (pas de data précédente)
 * ✅ Évite division par zéro
 ************************************************************/

function renderSalesComparisonTable(stats, comparison){  

  const diff = comparison.diff || "—";

  const lastCA = comparison.caYesterday || 0;
  const lastEncours = comparison.encoursYesterday || 0;
  const lastTickets = comparison.lastTickets || 0;

  const safeDate = comparison.lastDate
       ? formatDateFR(new Date(comparison.lastDate))
       : "N/A";

  const hasComparison = comparison.lastDate && comparison.caYesterday > 0;

  const ticketDiff = hasComparison
       ? calcDiff(stats.nbTickets, comparison.lastTickets)
      : "—";

  return `
    <h2>
      CA du jour avec comparaison au dernier jour actif : 
      ${safeDate}
    </h2>

    <table style="width:100%; text-align:center;">
      
      <tr>
        <th>KPI</th>
        <th>CA net du jour</th>
        <th>Vs CA net du dernier jour ouvert</th>
        <th>Evolution</th>
      </tr>

      <!-- ✅ CA -->
      <tr>
        <td>💰 CA</td>

        <td>
          <strong class="price-cell">
            ✅ ${formatPrice(stats.totalCA)} GNF encaissé
          </strong>

          ${stats.encours > 0 ? `
            <div style="color:orange; font-size:12px;">
              🟠 ${formatPrice(stats.encours)} crédit
            </div>
          ` : ""}
        </td>

        <td>
          <strong class="price-cell">
            ✅ ${formatPrice(lastCA)} GNF encaissé
          </strong>

          ${lastEncours > 0 ? `
            <div style="color:orange; font-size:12px;">
              🟠 ${formatPrice(lastEncours)} crédit
            </div>
          ` : ""}
        </td>

        <td style="color:${colorDiff(diff)}; font-weight:bold;">
          ${diff === "—" ? "—" : diff}
        </td>
      </tr>

      <!-- ✅ TICKETS -->
      <tr>
        <td>🧾 Tickets</td>

        <td>
          <strong>${stats.nbTickets}</strong>
        </td>

        <td>
          <strong>${lastTickets > 0 ? lastTickets : "-"}</strong>
        </td>

        <td style="color:${colorDiff(ticketDiff)}; font-weight:bold;">
          ${ticketDiff === "—" ? "—" : ticketDiff}
        </td>

      </tr>

    </table>
  `;
}

/************************************************************
 * 📊 TABLE CA PAR CATÉGORIE
 * ----------------------------------------------------------
 * Rôle :
 * - Afficher la répartition du CA par catégorie
 *
 * Colonnes :
 * ✅ CA brut
 * ✅ Remise
 * ✅ CA net encaissé
 * ✅ Crédit
 * ✅ % du CA global
 *
 * UX :
 * ✅ Couleur dynamique sur %
 ************************************************************/
function renderCategoryTable(stats, dateStr){

  let totalNet = 0;

  Object.values(stats.categoryStats).forEach(v => {
    totalNet += v.encaisse + v.credit;
  });

  let html = `
    <h3>💰 CA par catégorie du jour : ${dateStr}</h3>
    <table>
      <tr>
        <th>Catégorie</th>
        <th>CA brut</th>
        <th>Remise</th>
        <th>CA net</th>
        <th>% CA</th>
      </tr>
  `;

  Object.entries(stats.categoryStats).forEach(([cat, val]) => {

    const net = val.encaisse + val.credit;
    const percent = totalNet ? ((net / totalNet)*100).toFixed(1) : 0;

    html += `
      <tr>
        <td><span class="price-cell">${cat}</span></td>
        <td><strong class="price-cell">${formatPrice(val.brut)} GNF</strong></td>        
        <td style="color:red">
          ${val.remise > 0 ? `- ${formatPrice(val.remise)} GNF` : "-"}
        </td>
        <td>
          <strong class="price-cell">
            ✅ ${formatPrice(val.encaisse)} GNF encaissé
          </strong>

          ${val.credit > 0 ? `
            <div style="color:orange; font-size:12px;">
              🟠 ${formatPrice(val.credit)} crédit
            </div>
          ` : ""}
        </td>

        <td style="font-weight:bold; color:${getPercentColor(percent)};">
          ${percent}%
        </td>
      </tr>
    `;
  });

  return html + "</table>";
}


/************************************************************
 * 🏆 TABLES TOP PRODUITS
 * ----------------------------------------------------------
 * Rôle :
 * - Générer les 2 blocs :
 *   ✅ Top produits (Quantité)
 *   ✅ Top produits (CA)
 *
 * Fonctions appelées :
 * ✅ renderTopQtyTable()
 * ✅ renderTopCATable()
 ************************************************************/
function renderTopTables(stats, dateStr){

  const topQty = Object.entries(stats.productStatsQty)
    .sort((a,b)=> b[1]-a[1])
    .slice(0,10);

  const topCA = Object.entries(stats.productStatsCA)
    .sort((a,b)=> b[1].encaisse - a[1].encaisse)
    .slice(0,10);

  return `
    <h2>🏆 Analyse des produits du jour : ${dateStr}</h2>

    <div class="stats-flex">

      ${renderTopQtyTable(topQty)}

      ${renderTopCATable(topCA)}

    </div>
  `;
}

/************************************************************
 * 📦 TOP PRODUITS PAR QUANTITÉ
 * ----------------------------------------------------------
 * Rôle :
 * - Afficher classement des produits vendus
 *
 * Features :
 * ✅ Badge Top 3 (🥇🥈🥉)
 * ✅ Stock restant
 ************************************************************/
function renderTopQtyTable(data){

  return `
    <div class="stats-card">
      <table style="width:100%">
        <tr><th colspan="3">🔥 Top Produits (Quantité)</th></tr>

        <tr>
          <th>Produit</th>
          <th>Quantité</th>
          <th>Stock</th>
        </tr>

        ${data.map(([name,val], i)=>{

          const stock = products.find(p => p.name === name)?.stock || "-";

          // ✅ BADGE TOP 3
          let badge = "";
          if(i === 0) badge = "🥇 ";
          else if(i === 1) badge = "🥈 ";
          else if(i === 2) badge = "🥉 ";

          return `
            <tr>
              <td>
                <span class="price-cell">
                  ${badge}${i+1}. ${name}
                </span>
              </td>

              <td><strong>${val}</strong></td>

              <td>${stock}</td>
            </tr>
          `;
        }).join("")}

      </table>
    </div>
  `;
}


/************************************************************
 * 💎 TOP PRODUITS PAR CA
 * ----------------------------------------------------------
 * Rôle :
 * - Afficher les meilleurs produits en CA
 *
 * Features :
 * ✅ Badge Top 3 (🥇🥈🥉)
 * ✅ CA brut / remise / net
 * ✅ Crédit
 * ✅ % de contribution au CA global
 * ✅ Stock restant
 ************************************************************/

function renderTopCATable(data){

  // ✅ total CA global (encaissé + crédit)
  let totalCA = 0;

  data.forEach(([_, val]) => {
    totalCA += val.encaisse + val.credit;
  });

  return `
    <div class="stats-card">
      <table style="width:100%">

        <tr><th colspan="6">💎 Top Produits (CA)</th></tr>

        <tr>
          <th>Produit</th>
          <th>CA brut</th>
          <th>Remise</th>
          <th>CA net</th>
          <th>% CA</th>   <!-- ✅ AJOUT -->
          <th>Stock restant</th>
        </tr>

        ${data.map(([name,val], i)=>{

          const stock = products.find(p => p.name === name)?.stock || "-";

          // ✅ BADGE TOP 3
          let badge = "";
          if(i === 0) badge = "🥇 ";
          else if(i === 1) badge = "🥈 ";
          else if(i === 2) badge = "🥉 ";

          // ✅ % CA
          const net = val.encaisse + val.credit;

          const percent = totalCA
            ? ((net / totalCA) * 100).toFixed(1)
            : 0;

          return `
            <tr>

              <td>
                <span class="price-cell">
                  ${badge}${i+1}. ${name}
                </span>
              </td>

              <td>
                <strong class="price-cell">
                  ${formatPrice(val.brut)} GNF
                </strong>
              </td>

              <td style="color:red">
                ${val.remise > 0 ? `- ${formatPrice(val.remise)} GNF` : "-"}  
              </td>
              
              <td>
                <strong class="price-cell">✅ ${formatPrice(val.encaisse)} GNF encaissé</strong>
                ${val.credit > 0 ? `
                 <div style="color:orange; font-size:12px;">
                   🟠 ${formatPrice(val.credit)} crédit
               </div>
              ` : ""}
             </td>

              <!-- ✅ COLONNE % -->
              <td style="font-weight:bold; color:${getPercentColor(percent)};">
                ${percent}%
              </td>

              <td>${stock}</td>

            </tr>
          `;
        }).join("")}

      </table>
    </div>
  `;
}

/************************************************************
 * 📱 RENDU MOBILE / TABLETTE
 * ----------------------------------------------------------
 * Rôle :
 * - Afficher une version compacte des KPI
 *
 * Sections :
 * ✅ CA (brut / net / encaissé / crédit)
 * ✅ Tickets / Articles
 * ✅ Comparaison
 * ✅ Top 3 produits
 *
 * Optimisation :
 * ✅ UI simplifiée
 * ✅ performance mobile
 ************************************************************/

function renderMobileKPI(stats, comparison, selectedDate){

  const kpiContainer = document.getElementById("historyKPI");
  const topContainer = document.getElementById("topProductsHistory");
  const container = document.getElementById("salesDetail");
  document.getElementById("detailDate").innerText = formatDateFR(new Date(selectedDate));

  const {
    totalBrut,
    totalRemise,
    totalCA,
    encours,
    nbTickets,
    totalItems,
    productStatsCA
  } = stats;

  const caNet = totalBrut - totalRemise;

  const lastCA = comparison.caYesterday || 0;
  const lastDate = comparison.lastDate
    ? formatDateFR(new Date(comparison.lastDate))
    : "N/A";

  const diff = comparison.diff || "—";
  
  const displayDiff = diff === "—" ? "—" : diff;

  
  // ✅ TOP 3
  const top3 = Object.entries(productStatsCA || {})
    .sort((a,b) => b[1].encaisse - a[1].encaisse)
    .slice(0,3);

  const topHTML = top3.map((p, i) => {
    return `<div>${i+1}. ${p[0]} — ${formatPrice(p[1].encaisse)} GNF</div>`;
  }).join("");

  let kpiHTML = `
    <div class="mobile-detail-card">

      <div class="header">
        ${formatDateFR(new Date(selectedDate))}
      </div>

      <div class="bloc">
        <div>Brut : <strong>${formatPrice(totalBrut)} GNF</strong></div>
        <div style="color:red;">
          💸 Remise : - ${formatPrice(totalRemise)} GNF
        </div>
        <div>💰 CA Net : <strong>${formatPrice(caNet)} GNF</strong></div>
        <div>✅ Encaissé : <strong>${formatPrice(totalCA)} GNF</strong></div>

        ${encours > 0 ? `
          <div>🟠 Crédit : <strong>${formatPrice(encours)} GNF</strong></div>
        ` : ""}
      </div>

      <div class="bloc">
        🎟️ Tickets : <strong>${nbTickets}</strong>  
        📦 Articles : <strong>${totalItems}</strong>
      </div>

      <div class="bloc">
        📊 Vs ${lastDate} :

        <div>
          ${formatPrice(totalCA)} GNF vs ${formatPrice(lastCA)} GNF
        </div>

        <strong style="color:${colorDiff(diff)}">
          ${displayDiff}
        </strong>
      </div>

      <div class="bloc">
        🔥 Top 3 produits :
        ${topHTML}
      </div>

    </div>
  `;

  kpiContainer.innerHTML = kpiHTML;

  // ✅ sécurité
  if(topContainer) topContainer.innerHTML = "";
  if(container) container.style.display = "none";

  const detail = document.getElementById("detailProducts");
  if(detail) detail.style.display = "none";
}
