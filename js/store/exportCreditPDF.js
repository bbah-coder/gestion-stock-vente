function exportCreditPDF(index) {

  const sale = sales[index];
  if (!sale || !sale.payment) return;

  const payment = sale.payment;
  const items = sale.items || [];
  const payments = payment.payments || [];
  const invoiceNumber = sale.invoiceNumber;

  const store = getStoreInfo();


  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  // ✅ FORMAT PRIX
  function formatPricePDF(value) {
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

  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  // INFOS MAGASIN
  y += 9;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(store.name || "Boutique Manager", 105, y, {
    align: "center"
  });

  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    store.address || "",
    105,
    y,
    { align: "center" }
  );

  y += 4;

  doc.text(
    store.phone || "",
    105,
    y,
    { align: "center" }
  );

  y += 5;

  // Ligne séparatrice
  doc.setDrawColor(180);
  doc.line(10, y, 200, y);

  y += 8;

  // ✅ INFOS CLIENT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text("CLIENT", 10, y);
  doc.text("FACTURE", 120, y);

  y += 8;

  doc.setFont("helvetica", "normal");

  doc.text(
    `Nom : ${payment.clientName || "-"}`,
    10,
    y
  );

  doc.setFont("helvetica", "bold");

  doc.text(
    `N° : ${invoiceNumber || "-"}`,
    120,
    y
  );

  y += 6;

  doc.setFont("helvetica", "normal");

  doc.text(
    `Téléphone : ${payment.clientPhone || "-"}`,
    10,
    y
  );

  doc.text(
    `Souscription : ${formatDateISO(payment.createdAt)}`,
    120,
    y
  );

  y += 6;

  doc.text(
    `Échéance : ${formatDateISO(payment.dueDate)}`,
    120,
    y
  );

  y += 4;

  doc.line(10, y, 200, y);

  y += 10;

  // ✅ ✅ ✅ BLOC FINANCE ULTRA PRO
  doc.setFont("helvetica", "bold");

  doc.setTextColor(0, 0, 0);
  doc.text(`Total brut : ${formatPricePDF(totalBrut)} GNF`, 10, y); y += 6;

  doc.setTextColor(200, 0, 0);
  doc.text(totalRemise > 0
    ? `Remise : -${formatPricePDF(totalRemise)} GNF`
    : `Remise : `,
    10,
    y); y += 6;

  doc.setTextColor(0, 0, 0);
  doc.text(`Total net : ${formatPricePDF(totalNet)} GNF`, 10, y); y += 6;

  doc.setTextColor(0, 128, 0);
  doc.text(`Montant payé : ${formatPricePDF(totalPaid)} GNF`, 10, y); y += 6;

  doc.setTextColor(255, 140, 0);
  doc.text(`Montant restant : ${formatPricePDF(remaining)} GNF`, 10, y);

  doc.setTextColor(0, 0, 0); // reset couleur

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

  if (payments.length > 0) {
    doc.autoTable({
      startY: y,
      head: [["Date", "Mode de paiement", "Montant"]],
      body: payments.length > 0
        ? payments.map(p => [
          formatDateISO(p.date),
          p.paymentMethod === "cash"
            ? "Comptant"
            : p.paymentMethod === "mobile"
              ? "Mobile Money"
              : p.paymentMethod === "check"
                ? "Chèque"
                : "-",
          formatPricePDF(p.amount) + " GNF"
        ])
        : [["Aucun paiement", "-", "-"]],
      foot: [[
        "",
        "TOTAL PAYÉ",
        formatPricePDF(totalPaid) + " GNF"
      ]],

      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        2: { halign: "right" }
      }
    });
    y = doc.lastAutoTable.finalY + 10;
  } else {

    doc.setFont("helvetica", "italic");

    doc.text(
      "Aucun paiement enregistré.",
      10,
      y
    );

    doc.setFont("helvetica", "normal");

    y += 15;

  }

  //INFO Chéque

  const chequePayments =
    payments.filter(
      p => p.paymentMethod === "check"
    );

  if (chequePayments.length) {

    y = doc.lastAutoTable.finalY + 8;

    doc.setFont("helvetica", "bold");
    doc.text("INFORMATIONS CHÈQUES", 10, y);

    y += 8;

    chequePayments.forEach(p => {

      doc.setDrawColor(200);

      doc.rect(10, y - 4, 190, 24);

      doc.setFont("helvetica", "normal");

      doc.text(
        `Banque : ${p.bankName || "-"}`,
        15,
        y + 2
      );

      doc.text(
        `N° Chèque : ${p.chequeNumber || "-"}`,
        15,
        y + 8
      );

      doc.text(
        `Date du chèque : ${formatDateISO(p.chequeDate)}`,
        15,
        y + 14
      );

      doc.setFont("helvetica", "bold");

      doc.text(
        `Montant : ${formatPricePDF(p.amount)} GNF`,
        120,
        y + 14
      );

      doc.setFont("helvetica", "normal");

      y += 30;

    });

  }

  // Si on arrive trop bas dans la page
  const pageHeight = doc.internal.pageSize.height;

  if (y + 60 > pageHeight) {
    doc.addPage();
    y = 20;
  }
  // ✅ FOOTER
  // ✅ SIGNATURES
  y += 15;

  doc.line(20, y, 80, y);
  doc.text("Signature client", 25, y + 8);

  doc.line(130, y, 190, y);
  doc.text("Signature vendeur", 135, y + 8);

  // ✅ PIED DE PAGE
  y += 45;

  doc.setFontSize(9);
  doc.setTextColor(100);

  doc.text(
    `Document édité le ${formatDateISO(new Date())}`,
    105,
    y,
    { align: "center" }
  );

  y += 6;

  doc.setFontSize(10);
  doc.text(
    "Merci pour votre confiance",
    105,
    y,
    { align: "center" }
  );

  doc.setTextColor(0);

  doc.save(`Credit-${payment.clientName}.pdf`);
}

function exportGlobalCreditPDF() {

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let y = 10;

  function formatPricePDF(value) {
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

    if (sale.payment && sale.payment.type === "credit") {

      const payment = sale.payment;
      const items = sale.items || [];

      const invoiceNumber = sale.invoiceNumber;

      const totalBrut = items.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0);

      const totalRemise = items.reduce((sum, item) =>
        sum + (item.remise || 0), 0);

      const totalNet = totalBrut - totalRemise;

      const totalPaid = (payment.payments || [])
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const remaining = Math.max(0, totalNet - totalPaid);

      if (remaining <= 0) return;

      totalEncaisse += totalPaid;
      totalEncours += remaining;

      rows.push([
        invoiceNumber,
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
        invoiceNumber,
        totalBrut,
        totalRemise,
        totalNet,
        totalPaid,
        remaining
      });
    }
  });

  // ✅ KPI
  doc.text(`Total encaissé : ${formatPricePDF(totalEncaisse)} GNF`, 10, y); y += 6;
  doc.text(`Encours total : ${formatPricePDF(totalEncours)} GNF`, 10, y); y += 6;
  doc.text(`Nombre de clients : ${rows.length}`, 10, y);

  y += 10;

  // ✅ TABLE GLOBAL
  doc.autoTable({
    startY: y,
    head: [["Facture", "Client", "Brut", "Remise", "Net", "Payé", "Restant"]],
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
      invoiceNumber,
      totalBrut,
      totalRemise,
      totalNet,
      totalPaid,
      remaining
    } = entry;

    if (y > 250) {
      doc.addPage();
      y = 10;
    }

    // ✅ EN-TÊTE CLIENT / FACTURE

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text("CLIENT", 10, y);
    doc.text("FACTURE", 120, y);

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(
      `Nom : ${payment.clientName || "-"}`,
      10,
      y
    );

    doc.setFont("helvetica", "bold");

    doc.text(
      invoiceNumber || "-",
      120,
      y
    );

    y += 8;

    doc.setFont("helvetica", "normal");

    doc.text(
      `Téléphone : ${payment.clientPhone || "-"}`,
      10,
      y
    );

    doc.text(
      `Souscription : ${formatDateISO(payment.createdAt)}`,
      120,
      y
    );

    y += 8;

    doc.text(
      `Échéance : ${formatDateISO(payment.dueDate)}`,
      120,
      y
    );

    y += 4;

    // Ligne de séparation
    doc.setDrawColor(220);
    doc.line(10, y, 200, y);

    y += 10;
    // ✅ FINANCE
    doc.setTextColor(0, 0, 0);
    doc.text(`Total brut : ${formatPricePDF(totalBrut)} GNF`, 10, y); y += 5;

    if (totalRemise > 0) {
      doc.setTextColor(200, 0, 0);
      doc.text(`Remise : -${formatPricePDF(totalRemise)} GNF`, 10, y);
    } else {
      doc.setTextColor(120, 120, 120);
      doc.text(`Remise : `, 10, y);
    }
    y += 5;

    doc.setTextColor(0, 0, 0);
    doc.text(`Total net : ${formatPricePDF(totalNet)} GNF`, 10, y); y += 5;

    doc.setTextColor(0, 128, 0);
    doc.text(`Payé : ${formatPricePDF(totalPaid)} GNF`, 10, y); y += 5;

    doc.setTextColor(255, 140, 0);
    doc.text(`Restant : ${formatPricePDF(remaining)} GNF`, 10, y);

    doc.setTextColor(0, 0, 0);

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

      head: [[
        "Date",
        "Mode de paiement",
        "Montant"
      ]],

      body: paymentsList.length > 0

        ? paymentsList.map(p => [

          formatDateISO(p.date),

          p.paymentMethod === "cash"
            ? "Comptant"
            : p.paymentMethod === "mobile"
              ? "Mobile Money"
              : p.paymentMethod === "check"
                ? "Chèque"
                : "-",

          formatPricePDF(p.amount) + " GNF"

        ])

        : [["Aucun paiement", "-", "-"]],

      theme: "grid",

      styles: {
        fontSize: 10
      },

      headStyles: {
        fillColor: [39, 174, 96],
        textColor: 255
      },

      columnStyles: {
        2: {
          halign: "right"
        }
      }

    });

    y = doc.lastAutoTable.finalY + 6;

    y = doc.lastAutoTable.finalY + 6;

    // ✅ TOTAL PAIEMENTS
    const totalPaidLocal = paymentsList.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);

    doc.text(
      `Total payé : ${formatPricePDF(totalPaidLocal)} GNF`,
      190,
      y,
      {
        align: "right"
      }
    );

    y += 12;

    // ✅ INFOS CHÈQUES

    const chequePayments =
      paymentsList.filter(
        p => p.paymentMethod === "check"
      );

    if (chequePayments.length) {

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);

      doc.text(
        "INFORMATIONS CHÈQUES",
        10,
        y
      );

      y += 8;

      chequePayments.forEach(p => {

        doc.setDrawColor(220);

        doc.rect(
          10,
          y - 4,
          190,
          24
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.text(
          `Banque : ${p.bankName || "-"}`,
          15,
          y + 2
        );

        doc.text(
          `N° Chèque : ${p.chequeNumber || "-"}`,
          15,
          y + 8
        );

        doc.text(
          `Date du chèque : ${formatDateISO(p.chequeDate)}`,
          15,
          y + 14
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.text(
          `Montant : ${formatPricePDF(p.amount)} GNF`,
          120,
          y + 14
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        y += 30;

      });

      y += 5;

    }


  });

  doc.save(`Rapport-Credit-Detail-${today}.pdf`);
}