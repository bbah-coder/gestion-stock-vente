/************************************************************
 * Export PDF
 ************************************************************/

function drawSectionTitle(doc, text, y){

  // ✅ fond
  doc.setFillColor(44,62,80);
  doc.rect(14, y, 180, 8, "F");

  // ✅ texte blanc
  doc.setTextColor(255,255,255);
  doc.setFontSize(11);
  doc.setFont(undefined,"bold");

  // ✅ largeur page A4 jsPDF = 210 → centre = 105
  doc.text(text, 105, y + 5.5, { align: "center" });

  // ✅ reset
  doc.setTextColor(0,0,0);

  return y + 10;
}

function ExportProduitPDF(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFont("helvetica","normal");

  let y = 15;

  const selectedDate = document.getElementById("pdfDate")?.value;
  const currentDate = selectedDate ? new Date(selectedDate) : new Date();
  const todayStr = currentDate.toDateString();

  function formatPrice(val){
    return Math.round(Number(val || 0))
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " GNF";
  }

  function getColor(percent){
    percent = Number(percent);
    if(percent >= 40) return [39,174,96];
    if(percent >= 20) return [243,156,18];
    if(percent < 5) return [231,76,60];
    return [0,0,0];
  }

  //-----------------------------
  // ✅ DATA
  //-----------------------------
  //let totalCA = 0;
  let totalItems = 0;
  let nbTickets = 0;

  let totalEncaisse = 0;
  let totalCredit = 0;
  let totalBrut = 0;
  let totalRemise = 0;

  const categoryStats = {};
  const productCA = {};
  const productQty = {};

sales.forEach(sale => {

  if(new Date(sale.date).toDateString() === todayStr){

    const saleItems = sale.items || [];

    let saleBrut = 0;
    let saleRemise = 0;

    // ✅ 1. CALCUL BRUT + REMISE
    saleItems.forEach(i => {
        const brut = i.price * i.quantity;
        const remise = i.remise || 0;
        const net = brut - remise;

        // ✅ FIX IMPORTANT
        saleBrut += brut;
        saleRemise += remise;

      });

    const saleNet = saleBrut - saleRemise;

    // ✅ 2. PAIEMENT
    let totalPaid = 0;

    if(sale.payment?.type === "credit"){
      const payments = sale.payment.payments || [];
      totalPaid = payments.reduce((sum,p)=> sum + (p.amount || 0), 0);
    } else {
      totalPaid = saleNet;
    }

    const encaisse = totalPaid;
    const credit = Math.max(0, saleNet - totalPaid);

    // ✅ KPI GLOBAUX
    totalEncaisse += encaisse;
    totalCredit += credit;
    totalBrut += saleBrut;
    totalRemise += saleRemise;

    nbTickets++;
    totalItems += saleItems.length;

    // ✅ 3. PRODUITS (SANS CASSE)
    saleItems.forEach(i => {

      const brut = i.price * i.quantity;
      const remise = i.remise || 0;
      const net = brut - remise;

      // ✅ ratio PROPRE (basé sur NET ✅)
      const ratio = saleNet > 0 ? totalPaid / saleNet : 0;

      const encaisseItem = net * ratio;
      const creditItem = net * (1 - ratio);

      // ✅ CATEGORY
      const product = products.find(p => p.name === i.name);
      const category = product ? (product.category || "Autre") : "Autre";

      if (!categoryStats[category]) {
          categoryStats[category] = {
              brut: 0,
              remise: 0,
              net: 0,
              encaisse: 0,
              credit: 0
          };
      }

      // ✅ AJOUT KPI
      categoryStats[category].brut += brut;
      categoryStats[category].remise += remise;
      categoryStats[category].net += net;
      categoryStats[category].encaisse += encaisseItem;
      categoryStats[category].credit += creditItem;

      // ✅ PRODUCT CA
      if(!productCA[i.name]){
        productCA[i.name] = {
            brut: 0,
            remise: 0,
            net: 0,
            encaisse: 0,
            credit: 0
        };
      }

      productCA[i.name].brut += brut;
      productCA[i.name].remise += remise;
      productCA[i.name].net += net;
      productCA[i.name].encaisse += encaisseItem;
      productCA[i.name].credit += creditItem;


      // ✅ QTE
      productQty[i.name] = (productQty[i.name] || 0) + i.quantity;

    });

  }

});

// ✅ ✅ TOTAL GLOBAL FINAL
const totalNet = totalBrut - totalRemise;

//-----------------------------
// ✅ DERNIER JOUR ACTIF ✅ FIX
//-----------------------------
//-----------------------------
// ✅ DERNIER JOUR ACTIF (FIX PRO)
//-----------------------------
let lastDate = null;

// ✅ regrouper CA par jour
const caByDate = {};

sales.forEach(s => {

    const d = new Date(s.date);

    // ✅ ignorer les dates >= jour courant
    if (d >= currentDate)
        return;

    const key = d.toDateString();

    if (!caByDate[key]) {
        caByDate[key] = 0;
    }

    // ✅ recalcul CA réel depuis items
    s.items.forEach(i => {
        caByDate[key] += i.price * i.quantity;
    });

});

// ✅ chercher le dernier jour avec CA > 0
const sortedDates = Object.keys(caByDate)
    .sort((a, b) => new Date(b) - new Date(a));

for (let d of sortedDates) {
    if (caByDate[d] > 0) {
        lastDate = new Date(d);
        break;
    }
}

 let lastBrut = 0;
 let lastRemise = 0;
 let lastNet = 0;
 let lastEncaisse = 0;
 let lastCredit = 0;
 let lastTickets = 0;

if(lastDate){

  sales.forEach(s => {

    if(new Date(s.date).toDateString() === lastDate.toDateString()){

      const items = s.items || [];

      let saleBrut = 0;
      let saleRemise = 0;

      items.forEach(i => {
        const brut = i.price * i.quantity;
        const remise = i.remise || 0;

        saleBrut += brut;
        saleRemise += remise;
      });

      const saleNet = saleBrut - saleRemise;

      let totalPaid = 0;

      if(s.payment?.type === "credit"){
        const payments = s.payment.payments || [];
        totalPaid = payments.reduce((sum,p)=>sum+(p.amount||0),0);
      } else {
        totalPaid = saleNet;
      }

      const credit = Math.max(0, saleNet - totalPaid);

      // ✅ cumul
      lastBrut += saleBrut;
      lastRemise += saleRemise;
      lastNet += saleNet;
      lastEncaisse += totalPaid;
      lastCredit += credit;

      lastTickets++;
    }

  });
}


  function calcDiff(a,b){
    if(!b) return "0%";
    return ((a-b)/b*100).toFixed(1) + "%";
  }

  //-----------------------------
  // ✅ HEADER
  //-----------------------------
  doc.setFontSize(16);
  doc.setFont(undefined,"bold");
  doc.text("RAPPORT JOURNALIER",14,y);

  y+=8;

  doc.setFontSize(10);
  doc.setFont(undefined,"normal");
  doc.text("Date : "+currentDate.toLocaleDateString(),14,y);

  y+=8;

  //-----------------------------
  // ✅ KPI BANDEAU PREMIUM
  //-----------------------------
 doc.setFillColor(230, 230, 230);
 doc.roundedRect(14, y, 180, 20, 2, 2, "F"); // ✅ 16 → 20

 doc.setFontSize(10);
 doc.setFont(undefined, "bold");

 // ✅ LIGNE 1
 doc.text(`CA brut : ${formatPrice(totalBrut)}`, 18, y + 6);
 doc.text(`CA net : ${formatPrice(totalNet)}`, 105, y + 6);

 // ✅ LIGNE 2
 doc.text(`Remise : -${formatPrice(totalRemise)}`, 18, y + 12);
 doc.text(`Encaissé : ${formatPrice(totalEncaisse)}`, 105, y + 12);

 // ✅ LIGNE 3
 doc.text(`Crédit : ${formatPrice(totalCredit)}`, 18, y + 17);
 doc.text(`Tickets : ${nbTickets} | Articles : ${totalItems}`, 105, y + 17);

 y += 24; // ✅ adapté à la nouvelle hauteur
 
 
 // ✅ espace visuel (saut de ligne)
 y += 6;



  //-----------------------------
  // ✅ TABLE KPI
  //-----------------------------
  doc.setFontSize(12);
  doc.setFont(undefined,"bold");
  doc.text("CA du jour avec comparaison au dernier jour actif : " + (lastDate ? lastDate.toLocaleDateString() : "N/A"),14,y);

  y+=6;

  doc.autoTable({
    startY:y,
    head:[["KPI","CA jour","Vs CA jour precedent","Evolution"]],
    body:[

  ["CA brut",
    formatPrice(totalBrut),
    formatPrice(lastBrut),
    calcDiff(totalBrut, lastBrut)
  ],

  ["Remise",
    totalRemise > 0 ? "- " + formatPrice(totalRemise) : "-",
    lastRemise > 0 ? "- " + formatPrice(lastRemise) : "-",
    calcDiff(totalRemise, lastRemise)
  ],

  ["CA net",
    formatPrice(totalNet),
    formatPrice(lastNet),
    calcDiff(totalNet, lastNet)
  ],

  ["CA encaissé",
    formatPrice(totalEncaisse),
    formatPrice(lastEncaisse),
    calcDiff(totalEncaisse, lastEncaisse)
  ],

  ["Crédit",
    formatPrice(totalCredit),
    formatPrice(lastCredit),
    calcDiff(totalCredit, lastCredit)
  ],

  ["Tickets",
    nbTickets,
    lastTickets,
    calcDiff(nbTickets, lastTickets)
  ]

],
    headStyles:{ fillColor:[61,81,102] },
    styles:{ fontSize:9, cellPadding:3 },

    didParseCell: function(data){

  if(data.section === "body" && data.column.index === 3){

    const val = data.cell.raw.toString();

    if(val !== "-" && parseFloat(val) >= 0){
      data.cell.styles.textColor = [39,174,96]; // ✅ vert
      data.cell.styles.fontStyle = "bold";
    } else {
      data.cell.styles.textColor = [231,76,60]; // ✅ rouge
      }

    }
  }

  });

  y = doc.lastAutoTable.finalY + 12;

  //-----------------------------
  // ✅ CA PAR CATEGORIE (TRI ✅)
  //-----------------------------
  doc.text(`CA par categories du jour : ${currentDate.toLocaleDateString()}`,14,y);
  y+=6;

  doc.autoTable({
    startY:y,
    head:[["Categorie","Brut","Remise","Net","Encaissé","Crédit","% CA"]],
    body: Object.entries(categoryStats)
      .sort((a,b)=>b[1].net - a[1].net)
      .map(([cat, val]) => {

     const percent = totalNet > 0
         ? ((val.net / totalNet) * 100).toFixed(1)
         : "0.0";

          return [
              cat,
              formatPrice(val.brut),
              val.remise > 0 ? "- " + formatPrice(val.remise) : "-",
              formatPrice(val.net),
              formatPrice(val.encaisse),
              formatPrice(val.credit),
              percent + "%"
          ];
      }),
    headStyles:{ fillColor:[61,81,102]},
    styles:{ fontSize:8, cellPadding:3 },

    didParseCell:(data)=>{
      if(data.section==="body" && data.column.index===2){
        const p = parseFloat(data.cell.raw);
        data.cell.styles.textColor = getColor(p);
      }
      if (data.section === "body") {

          // ✅ encaissé vert
          if (data.column.index === 4) {
              data.cell.styles.textColor = [39, 174, 96];
          }

          // ✅ crédit rouge
          if (data.column.index === 5) {
              data.cell.styles.textColor = [231, 76, 60];
          }

          // ✅ % couleur dynamique
          if (data.column.index === 6) {
              const p = parseFloat(data.cell.raw);
              data.cell.styles.textColor = getColor(p);
          }

      }
    }
  });

  y = doc.lastAutoTable.finalY + 12;

  //-----------------------------
  // ✅ TOP PRODUITS PREMIUM
  //-----------------------------
doc.text(`Analyse des produits du jour : ${currentDate.toLocaleDateString()}`,14,y);
y += 8;

// ✅ TOP QTE
const topQty = Object.entries(productQty)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
  
y = drawSectionTitle(doc, "Top 10 Produits (Quantité)", y);

doc.autoTable({
  startY: y,
  head: [["Produit", "Quantité Vendue", "Stock"]],
  body: topQty.map((p, index) => {

    let rank = `${index + 1}.`;
    if (index === 0)
        rank = "1";
    else if (index === 1)
        rank = "2";
    else if (index === 2)
        rank = "3";
    else
        rank = `${index + 1}`;


    return [
      `${rank} ${p[0]}`,
      p[1],
      products.find(x => x.name === p[0])?.stock ?? "-"
    ];
  }),
  headStyles: { fillColor: [44, 62, 80] },
  styles: { fontSize: 9, cellPadding: 3 }
});

// ✅ recalcul Y
y = doc.lastAutoTable.finalY + 8;

// ✅ TOP CA (UNE SEULE DECLARATION ✅)
const topCA = Object.entries(productCA)
  .sort((a,b)=> b[1].net - a[1].net)
  .slice(0,10);
  
y = drawSectionTitle(doc, "Top 10 Produits (CA)", y);

doc.autoTable({
  startY: y,
  head:[["Produit","CA brut","Remise","CA net","Encaisse","Crédit","% CA","Stock"]],

  body: topCA.map((p,index)=>{

    const val = p[1];

    const percent = totalNet > 0
      ? ((val.net / totalNet) * 100).toFixed(1)
      : "0";

    const product = products.find(x=>x.name===p[0]);

    let rank = `${index+1}`;

    return [
      `${rank} ${p[0]}`,
      formatPrice(val.brut),
      val.remise > 0 ? "- " + formatPrice(val.remise) : "-",

      formatPrice(val.net),

      formatPrice(val.encaisse),
      formatPrice(val.credit),

      percent + "%",
      product?.stock ?? "-"
    ];
  }),

  headStyles:{ fillColor:[44,62,80]},
  styles:{ fontSize:8, cellPadding:3},
  
  didParseCell:(data)=>{
    if(data.section==="body"){
      
      // ✅ remise rouge
      if(data.column.index===2){
        data.cell.styles.textColor = [231,76,60];
      }
      // ✅ encaisse vert
      if(data.column.index===4){
        data.cell.styles.textColor = [39,174,96];
      }

      // ✅ crédit rouge
      if(data.column.index===5){
        data.cell.styles.textColor = [231,76,60];
      }

      // ✅ % couleur
      if(data.column.index===6){
        const p = parseFloat(data.cell.raw);
        data.cell.styles.textColor = getColor(p);
      }
    }
  }
});

// ✅ update final Y
y = doc.lastAutoTable.finalY + 12;

//--------------------------------------
// ✅ PRODUITS INACTIFS (CORRIGÉ + PRO)
//--------------------------------------

const inactive = [];

products
  .filter(p => p.active !== false)
  .forEach(p => {

    let lastSale = null;
    let totalSold = 0;

    // ✅ 1. Recherche des ventes
    sales.forEach(s => {
      s.items.forEach(i => {

        if(i.name.trim().toLowerCase() === p.name.trim().toLowerCase()){

          totalSold += i.quantity;

          const d = new Date(s.date);

          if(!lastSale || d > lastSale){
            lastSale = d;
          }

        }

      });
    });

    let diff = 0;
    let lastLabel = "";

    // ✅ 2. CAS PRODUIT VENDU
    if(lastSale){

      diff = Math.floor((new Date() - lastSale) / (1000*3600*24));
      lastLabel = lastSale.toLocaleDateString();

    } 

    // ✅ 3. CAS JAMAIS VENDU
    else {

      const created = new Date(p.createdAt);

      diff = Math.floor((new Date() - created) / (1000*3600*24));
      lastLabel = "Jamais vendu";

    }

    // ✅ 4. FILTRE ≥ 7 JOURS
    if(diff >= 7){

      const stock = Number(p.stock || 0);
      const stockInitial = stock + totalSold;

      let oldPrice = formatPrice(p.price);
      let newPrice = "";
      let promo = "-";

      // ✅ gestion promo
      if(p.promo && p.promo > 0){
        const promoPrice = p.price * (1 - p.promo/100);
        newPrice = formatPrice(promoPrice);
        promo = "-" + p.promo + "%";
      }

      inactive.push({
        name: p.name,
        oldPrice,
        newPrice,
        promo,
        stockInitial,
        stock,
        sold: totalSold,
        days: diff,
        lastSale: lastLabel
      });

    }

  });
doc.setFont(undefined,"bold");
doc.text("Produits inactifs (>=7 jours)",14,y);

y += 6;


doc.autoTable({
  startY: y,

  head:[[
    "Produit",
    "Prix",
    "Promo",
    "Stock initial",
    "Stock restant",
    "Vendu",
    "Nb jours",
    "Derniere vente"
  ]],

  body: inactive.map(p => [
    p.name,
    p.newPrice ? (p.oldPrice + "\n" + p.newPrice) : p.oldPrice,
    p.promo,
    p.stockInitial,
    p.stock,
    p.sold,
    p.days,
    p.lastSale
  ]),

  headStyles:{ fillColor:[192,57,43] },

  styles:{
    fontSize: 8,
    cellPadding: 2.5
  },

  columnStyles:{
    0:{ cellWidth:40 },
    1:{ cellWidth:40 }
  },

  didParseCell: function(data){

  const row = inactive[data.row.index];

  if(data.section === "body" && data.column.index === 1 && row.newPrice){
    data.cell.text = ""; // ✅ on bloque le rendu auto
  }

  if(data.section === "body" && data.column.index === 2 && row.promo !== "-"){
    data.cell.styles.textColor = [231,76,60];
    data.cell.styles.fontStyle = "bold";
  }
},

didDrawCell: function(data){

  const row = inactive[data.row.index];

  if(data.section === "body" && data.column.index === 1 && row.newPrice){

    const cell = data.cell;

    const x = cell.x + 2;

    // ✅ positions FIXES (fiables)
    const yOld = cell.y + 4.8;
    const yNew = cell.y + 7.8;

    // ✅ 1. ancien prix (gris)
    doc.setTextColor(130,130,130);
    doc.text(row.oldPrice, x, yOld);

    // ✅ 2. barré (FIN ✅)
    const width = doc.getTextWidth(row.oldPrice);

    doc.setDrawColor(130);
    doc.setLineWidth(0.2); // ✅ ligne très fine (important)

    doc.line(x, yOld - 1, x + width, yOld - 1);

    // ✅ 3. nouveau prix (VERT ✅ corrigé)
    doc.setTextColor(39,174,96);
    doc.text(row.newPrice, x, yNew);
  }
}


});
  
   y = doc.lastAutoTable.finalY + 12;
   
   //--------------------------------------
// ✅ PRODUITS STOCK FAIBLE (VERSION PREMIUM)
//-------------------------------------------

const lowStock = [];

products
  .filter(p => p.active !== false && Number(p.stock) <= 5)
  .forEach(p => {

    let totalSold = 0;

    sales.forEach(s => {
      s.items.forEach(i => {

        if(i.name.trim().toLowerCase() === p.name.trim().toLowerCase()){
          totalSold += i.quantity;
        }

      });
    });

    const stock = Number(p.stock || 0);
    const stockInitial = stock + totalSold;

    let oldPrice = formatPrice(p.price);
    let newPrice = "";
    let promo = "-";

    if(p.promo && p.promo > 0){

      const promoPrice = p.price * (1 - p.promo/100);

      newPrice = formatPrice(promoPrice);
      promo = "-" + p.promo + "%";
    }

    lowStock.push({
      name: p.name,
      oldPrice,
      newPrice,
      promo,
      stockInitial,
      stock,
      sold: totalSold
    });

  });

doc.setFont(undefined,"bold");
doc.text("Produits en stock faible (<=5)",14,y);

y += 6;

doc.autoTable({
  startY: y,

  head:[[
    "Produit",
    "Prix",
    "Promo",
    "Stock initial",
    "Stock restant",
    "Vendu"
  ]],

  body: lowStock.map(p => [
    p.name,
    p.newPrice ? p.oldPrice + "\n" + p.newPrice : p.oldPrice,
    p.promo,
    p.stockInitial,
    p.stock,
    p.sold
  ]),

  headStyles:{ fillColor:[241,196,15] },

  styles:{
    fontSize:8,
    cellPadding:2.5
  },

 didParseCell: function(data){

  const row = lowStock[data.row.index];

  if(data.section === "body" && data.column.index === 1 && row.newPrice){
    data.cell.text = ""; // ✅ on bloque le rendu auto
  }

  if(data.section === "body" && data.column.index === 2 && row.promo !== "-"){
    data.cell.styles.textColor = [231,76,60];
    data.cell.styles.fontStyle = "bold";
  }
},

didDrawCell: function(data){

  const row = lowStock[data.row.index];

  if(data.section === "body" && data.column.index === 1 && row.newPrice){

    const cell = data.cell;

    const x = cell.x + 2;

    // ✅ positions FIXES (fiables)
    const yOld = cell.y + 4.8;
    const yNew = cell.y + 7.8;

    // ✅ 1. ancien prix (gris)
    doc.setTextColor(130,130,130);
    doc.text(row.oldPrice, x, yOld);

    // ✅ 2. barré (FIN ✅)
    const width = doc.getTextWidth(row.oldPrice);

    doc.setDrawColor(130);
    doc.setLineWidth(0.2); // ✅ ligne très fine (important)

    doc.line(x, yOld - 1, x + width, yOld - 1);

    // ✅ 3. nouveau prix (VERT ✅ corrigé)
    doc.setTextColor(39,174,96);
    doc.text(row.newPrice, x, yNew);
  }
}
});

  doc.save("rapport_journalier.pdf");
}
