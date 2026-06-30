function exportCreditPDF(index){

  const sale = sales[index];
  if(!sale || !sale.payment) return;

  const payment = sale.payment;
  const items = sale.items || [];
  const payments = payment.payments || [];

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  // ✅ FORMAT PRIX
  function formatPricePDF(value){
    return Number(value || 0)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  // ✅ CALCULS PROPRES
  const totalBrut = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  const totalRemise = items.reduce((sum, item) => {
    return sum + (item.remise || 0);
  }, 0);

  const totalNet = totalBrut - totalRemise;

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const remaining = totalNet - totalPaid;

  // ✅ TITRE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("FICHE CREDIT CLIENT", 105, y, { align: "center" });

  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // ✅ INFOS CLIENT
  doc.text(`Nom : ${payment.clientName}`, 10, y); y += 6;
  doc.text(`Téléphone : ${payment.clientPhone || "-"}`, 10, y); y += 6;
  doc.text(`Date souscription : ${formatDateISO(payment.createdAt)}`, 10, y); y += 6;
  doc.text(`Date échéance : ${formatDateISO(payment.dueDate)}`, 10, y);

  y += 10;

  // ✅ ✅ ✅ BLOC FINANCE ULTRA PRO
  doc.setFont("helvetica", "bold");

  doc.setTextColor(0,0,0);
  doc.text(`Total brut : ${formatPricePDF(totalBrut)} GNF`, 10, y); y += 6;

  doc.setTextColor(200,0,0);
  doc.text(totalRemise > 0
    ? `Remise : -${formatPricePDF(totalRemise)} GNF`
    : `Remise : `,
   10,
   y);y += 6;

  doc.setTextColor(0,0,0);
  doc.text(`Total net : ${formatPricePDF(totalNet)} GNF`, 10, y); y += 6;

  doc.setTextColor(0,128,0);
  doc.text(`Montant payé : ${formatPricePDF(totalPaid)} GNF`, 10, y); y += 6;

  doc.setTextColor(255,140,0);
  doc.text(`Montant restant : ${formatPricePDF(remaining)} GNF`, 10, y);

  doc.setTextColor(0,0,0); // reset couleur

  y += 10;

  // ✅ TABLE PRODUITS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TABLE PRODUITS", 10, y);

  y += 6;

  doc.autoTable({
    startY: y,
    head: [["Produit", "Qté", "Prix", "Remise", "Total"]],
    body: items.map(item => {

      const brut = item.price * item.quantity;
      const remise = item.remise || 0;
      const net = brut - remise;

      return [
        item.name,
        item.quantity,
        formatPricePDF(item.price) + " GNF",
        remise > 0 
          ? "- " + formatPricePDF(remise) + " GNF"
          : "",
        formatPricePDF(net) + " GNF"
      ];
    }),
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [44, 62, 80] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" }
    }
  });

  y = doc.lastAutoTable.finalY + 10;

  // ✅ TABLE PAIEMENTS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TABLE PAIEMENTS", 10, y);

  y += 6;

  doc.autoTable({
    startY: y,
    head: [["Date", "Montant"]],
    body: payments.length > 0
      ? payments.map(p => [
          formatDateISO(p.date),
          formatPricePDF(p.amount) + " GNF"
        ])
      : [["Aucun paiement", "-"]],
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      1: { halign: "right" }
    }
  });

  // ✅ FOOTER
  y = doc.lastAutoTable.finalY + 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Merci pour votre confiance", 10, y);

  doc.save(`Credit-${payment.clientName}.pdf`);
}

function exportGlobalCreditPDF(){

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  function formatPricePDF(value){
    return Number(value || 0)
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  const today = new Date().toISOString().split("T")[0];

  // ✅ TITRE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RAPPORT CREDIT CLIENTS", 105, y, { align: "center" });

  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Date : " + today, 10, y);

  y += 10;

  let totalEncaisse = 0;
  let totalEncours = 0;

  const rows = [];
  const creditSales = [];

  // ✅ COLLECT DATA
  sales.forEach(sale => {

    if(sale.payment && sale.payment.type === "credit"){

      const payment = sale.payment;
      const items = sale.items || [];

      const totalBrut = items.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0);

      const totalRemise = items.reduce((sum, item) =>
        sum + (item.remise || 0), 0);

      const totalNet = totalBrut - totalRemise;

      const totalPaid = (payment.payments || [])
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const remaining = Math.max(0, totalNet - totalPaid);

      if(remaining <= 0) return;

      totalEncaisse += totalPaid;
      totalEncours += remaining;

      rows.push([
        payment.clientName,
        formatPricePDF(totalBrut),
        totalRemise > 0
          ? "- " + formatPricePDF(totalRemise)
          : "",
        formatPricePDF(totalNet),
        formatPricePDF(totalPaid),
        formatPricePDF(remaining)
      ]);

      creditSales.push({
        sale,
        payment,
        totalBrut,
        totalRemise,
        totalNet,
        totalPaid,
        remaining
      });
    }
  });

  // ✅ KPI
  doc.text(`Total encaissé : ${formatPricePDF(totalEncaisse)} GNF`, 10, y); y+=6;
  doc.text(`Encours total : ${formatPricePDF(totalEncours)} GNF`, 10, y); y+=6;
  doc.text(`Nombre de clients : ${rows.length}`, 10, y);

  y += 10;

  // ✅ TABLE GLOBAL
  doc.autoTable({
    startY: y,
    head: [["Client", "Brut", "Remise", "Net", "Payé", "Restant"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [44, 62, 80] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" }
    }
  });

  y = doc.lastAutoTable.finalY + 10;

  // ✅ DETAIL PAR CLIENT
  creditSales.forEach(entry => {

    const {
      sale,
      payment,
      totalBrut,
      totalRemise,
      totalNet,
      totalPaid,
      remaining
    } = entry;

    if(y > 250){
      doc.addPage();
      y = 10;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`CLIENT : ${payment.clientName}`, 10, y);

    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(`Téléphone : ${payment.clientPhone || "-"}`, 10, y); y+=5;

    // ✅ FINANCE
    doc.setTextColor(0,0,0);
    doc.text(`Total brut : ${formatPricePDF(totalBrut)} GNF`, 10, y); y+=5;

    if(totalRemise > 0){
      doc.setTextColor(200,0,0);
      doc.text(`Remise : -${formatPricePDF(totalRemise)} GNF`, 10, y);
    } else {
      doc.setTextColor(120,120,120);
      doc.text(`Remise : `, 10, y);
    }
    y += 5;

    doc.setTextColor(0,0,0);
    doc.text(`Total net : ${formatPricePDF(totalNet)} GNF`, 10, y); y+=5;

    doc.setTextColor(0,128,0);
    doc.text(`Payé : ${formatPricePDF(totalPaid)} GNF`, 10, y); y+=5;

    doc.setTextColor(255,140,0);
    doc.text(`Restant : ${formatPricePDF(remaining)} GNF`, 10, y);

    doc.setTextColor(0,0,0);

    y += 6;

    // ✅ TABLE PRODUITS
    doc.setFont("helvetica", "bold");
    doc.text("TABLE PRODUITS", 10, y);
    y += 5;

    doc.autoTable({
      startY: y,
      head: [["Produit", "Qté", "Prix", "Remise", "Total"]],
      body: sale.items.map(item => {

        const brut = item.price * item.quantity;
        const remise = item.remise || 0;
        const net = brut - remise;

        return [
          item.name,
          item.quantity,
          formatPricePDF(item.price) + " GNF",
          remise > 0 ? "-" + formatPricePDF(remise) + " GNF" : "",
          formatPricePDF(net) + " GNF"
        ];
      }),
      styles: { fontSize: 9 },
      theme: "grid"
    });

    y = doc.lastAutoTable.finalY + 5;

    // ✅ ✅ ✅ TABLE PAIEMENTS (FIX BUG ICI)
    const paymentsList = payment.payments || [];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("TABLE PAIEMENTS", 10, y);

    y += 6;

    doc.autoTable({
      startY: y,
      head: [["Date", "Montant"]],
      body: paymentsList.length > 0
        ? paymentsList.map(p => [
            formatDateISO(p.date),
            formatPricePDF(p.amount) + " GNF"
          ])
        : [["Aucun paiement", "-"]],
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: [39, 174, 96],
        textColor: 255
      },
      columnStyles: {
        1: { halign: "right" }
      }
    });

    y = doc.lastAutoTable.finalY + 6;

    // ✅ TOTAL PAIEMENTS
    const totalPaidLocal = paymentsList.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    doc.setFont("helvetica", "bold");
    doc.text(
      `Total payé : ${formatPricePDF(totalPaidLocal)} GNF`,
      200,
      y,
      { align: "right" }
    );

    y += 10;

  });

  doc.save(`Rapport-Credit-Detail-${today}.pdf`);
}