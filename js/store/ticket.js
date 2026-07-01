/************************************************************
 * 🧠 Tickets client
************************************************************/

const ticketPerPage = 4; // ✅ 4 tickets par défaut
let showAllTickets = false;

//INITIALISATION SEARCH TICKET VALUE INPUT
const input = document.getElementById("searchPhoneTicket");
const clearBtn = document.getElementById("clearSearch");

if (input && !input.dataset.bound) {
  input.addEventListener("input", renderTickets);
  input.dataset.bound = "true"; // ✅ évite doublons
}

if (input && clearBtn) {

  // ✅ affichage croix
  input.addEventListener("input", () => {

    if (input.value) {
      clearBtn.parentElement.classList.add("active");
    } else {
      clearBtn.parentElement.classList.remove("active");
    }

    renderTickets(); // ✅ ton filtre continue de marcher
  });

  // ✅ clic croix
  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.parentElement.classList.remove("active");

    renderTickets(); // ✅ reset filtre
  });

}


/*NORMALISATION TICKETS*/

function getTickets() {

  const sales = JSON.parse(localStorage.getItem("sales") || "[]");

  return sales.map(s => ({

    //id: s.id || Date.now(),
    //id: s.id,
    id: s.id || (new Date(s.date).getTime()),

    date: s.date,
    time: s.time || "",

    // ✅ ✅ FIX ICI
    payment: s.payment?.type || "cash",

    total: s.total || 0,

    remise: s.totalRemise || 0,
    credit: s.payment?.remaining || 0,

    items: s.items || [],

    clientPhone: s.clientPhone || s.payment?.clientPhone || ""

  }));

}

/* ✅ HELPER PAIEMENT */
function getPaymentLabel(mode) {

  switch (mode) {
    case "cash": return "💵 Comptant";
    case "credit": return "📋 Crédit";
    case "mobile": return "📱 Mobile";
    default: return "Autre";
  }

}

/* ✅ RENDER TICKETS PRO */
function renderTickets() {

  const tickets = getTickets();


  const list = document.getElementById("ticketList");
  list.innerHTML = "";

  /*AJOUT BOUTON RETOUR EN HAUT*/
  list.innerHTML = "";

  // ✅ bouton retour en haut (si mode ALL)
  if (showAllTickets) {

    const topBtn = document.createElement("button");
    topBtn.id = "ticketBackTop";
    topBtn.textContent = "🔙 Retour";

    topBtn.className = "ticket-load-btn";

    topBtn.onclick = () => {
      showAllTickets = false;
      renderTickets();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    };

    list.appendChild(topBtn);
  }


  const dateFilter = document.getElementById("ticketDate").value;
  const paymentFilter = document.getElementById("ticketPayment").value;

  // ✅ GLOBAL DATE (UNE SEULE FOIS)
  const today = new Date().toISOString().split("T")[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split("T")[0];

  // ✅ FILTRE
  // ✅ nettoyer les valeurs
  const clean = (str) =>
    (str || "").toLowerCase().replace(/\s+/g, "");

  // ✅ valeur recherche
  const searchPhoneRaw = document
    .getElementById("searchPhoneTicket")
    ?.value || "";

  const searchPhone = clean(searchPhoneRaw);

  // ✅ filtre
  const filtered = tickets.filter(t => {

    //console.log(t.clientPhone);

    const ticketDate = new Date(t.date).toISOString().split("T")[0];

    const matchDate =
      !dateFilter ? true : ticketDate === dateFilter;

    const matchPayment =
      paymentFilter === "all" || t.payment === paymentFilter;

    // ✅ ✅ NOUVEAU FILTRE TÉLÉPHONE
    const phone = clean(t.clientPhone);

    const matchPhone =
      !searchPhone
        ? true
        : phone.includes(searchPhone);

    return matchDate && matchPayment && matchPhone;
  });


  // ✅ TRI (plus récent en haut)
  filtered.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);

  });

  // ✅ PAGINATION
  let visible;

  if (showAllTickets) {
    visible = filtered; // ✅ tous les tickets
  } else {
    visible = filtered.slice(0, ticketPerPage); // ✅ seulement 4
  }

  /*GROUPER PAR MOIS*/
  const grouped = {};

  visible.forEach(t => {

    const dateObj = new Date(t.date);

    const key = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1);

    const label = dateObj.toLocaleString("fr-FR", {
      month: "long",
      year: "numeric"
    });

    if (!grouped[key]) {
      grouped[key] = {
        label,
        tickets: []
      };
    }

    grouped[key].tickets.push(t);
  });

  // ✅ AFFICHAGE VIDE
  if (visible.length === 0) {

    const empty = document.createElement("div");
    empty.className = "ticket-empty";

    if (dateFilter) {
      empty.innerHTML = `
      📭 Aucun ticket pour cette date<br>
      <small>Essayez une autre date ou changez le filtre</small>
    `;
    } else {
      empty.innerHTML = `
      📭 Aucun ticket trouvé<br>
      <small>Vérifiez vos filtres</small>
    `;
    }

    list.appendChild(empty);

    // ✅ cacher bouton
    const btn = document.getElementById("ticketLoadMore");
    btn.style.display = "none";

    return;
  }

  Object.values(grouped)
    .sort((a, b) => new Date(b.tickets[0].date) - new Date(a.tickets[0].date))
    .forEach(group => {

      const header = document.createElement("div");
      header.className = "ticket-month";
      header.textContent = group.label.toUpperCase();

      list.appendChild(header);

      group.tickets.forEach(t => {

        const card = document.createElement("div");
        card.className = "ticket-card";

        const dateObj = new Date(t.date);
        const time = dateObj.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });

        card.innerHTML = `
      <div class="ticket-header">
            <span class="ticket-title">📄 Ticket</span>
            <span class="ticket-date-right">
           ${dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
           </span>
      </div>

     <div class="ticket-time">
       ${dateObj.toLocaleDateString()} • ${time}
     </div>

     <div class="ticket-payment">
        Paiement : ${getPaymentLabel(t.payment)}
      </div>

      <div class="ticket-total">
        💰 ${formatPrice(t.total)} GNF
      </div>

      <div class="ticket-actions">
        <button onclick="showTicketDetail('${t.id}')">Voir</button>
        <button onclick="exportTicketPDF(${t.id})">PDF</button>
      </div>
    `;

        list.appendChild(card);
      });

    });

  // ✅ BOUTON LOAD MORE
  const btn = document.getElementById("ticketLoadMore");

  // ✅ TOUJOURS AFFICHER LE BOUTON
  btn.style.display = "block";

  btn.textContent = showAllTickets
    ? "🔙 Retour"
    : "Afficher plus";
}


/* DETAIL TICKET */
function showTicketDetail(id) {

  const tickets = getTickets();

  const t = tickets.find(x => String(x.id) === String(id));

  console.log("DETAIL TICKET:", t);

  if (!t) {
    alert("❌ Ticket introuvable");
    return;
  }

  let text = `🧾 Ticket\n`;
  text += `📅 ${new Date(t.date).toLocaleString()}\n`;
  text += `Paiement : ${getPaymentLabel(t.payment)}\n\n`;

  let totalBrut = 0;

  if (!t.items || t.items.length === 0) {
    text += "Aucun produit ❌\n";
  } else {

    t.items.forEach(item => {

      const qty = item.quantity || item.qty || 0;
      const price = item.price || 0;
      const subtotal = qty * price;

      totalBrut += subtotal;

      // ✅ NOUVEAU FORMAT PRO
      text += `${item.name} x ${qty}\n`;
      text += `${qty} x ${formatPrice(price)} GNF = ${formatPrice(subtotal)} GNF\n\n`;

    });
  }

  const remise = t.remise || 0;
  const credit = t.credit || 0;

  const totalNet = t.total || (totalBrut - remise);

  text += "-------------------------\n";
  text += `Total brut : ${formatPrice(totalBrut)}\n`;

  if (remise > 0) {
    text += `Remise : -${formatPrice(remise)}\n`;
  }

  if (t.payment === "credit") {

    const remaining = t.credit || 0;
    const total = t.total || totalBrut;

    const encaisse = total - remaining;

    if (encaisse > 0) {
      text += `✅ Payé : ${formatPrice(encaisse)} GNF\n`;
    }

    if (remaining > 0) {
      text += `🟠 Reste à payer : ${formatPrice(remaining)} GNF\n`;
    }
  }

  text += `\n✅ Total net : ${formatPrice(totalNet)} GNF`;

  alert(text);
}

/*PDF LABEL */

function getPaymentLabelPDF(mode) {
  switch (mode) {
    case "cash": return "COMPTANT";
    case "credit": return "CREDIT";
    case "mobile": return "MOBILE";
    default: return "AUTRE";
  }
}

function cleanText(text) {
  return String(text)
    .replace(/[^\x00-\x7F]/g, "") // ✅ supprime caractères corrompus
    .replace(/\s+/g, " ")         // ✅ nettoie espaces
    .trim();
}

function formatPricePDFTicket(value) {
  return Number(value || 0)
    .toFixed(0)       // ✅ pas de décimales inutiles
    .replace(/,/g, ""); // ✅ évite les séparateurs exotiques
}

/* EXPORT PDF */
function exportTicketPDF(id) {

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF({
    unit: "mm",
    format: [80, 150]
  });

  const tickets = getTickets();
  const t = tickets.find(x => String(x.id) === String(id));

  const store = getStoreInfo();

  if (!t) {
    alert("❌ Ticket introuvable");
    return;
  }

  let y = 6;

  const date = new Date(t.date);

  // ✅ HEADER
  // ✅ NOM MAGASIN
  // ✅ NOM MAGASIN
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(store.name || "MON SHOP", 40, y, { align: "center" });

  y += 5;

  // ✅ TELEPHONE
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (store.phone) {
    doc.text(`Tel: ${store.phone}`, 40, y, { align: "center" });
    y += 4;
  }

  // ✅ ADRESSE
  if (store.address) {
    doc.text(store.address, 40, y, { align: "center" });
    y += 4;
  }

  // ✅ séparation visuelle
  y += 2;
  doc.text("------------------------------", 40, y, { align: "center" });

  y += 6;

  doc.setFontSize(10);
  doc.text(cleanText(`Ticket #${t.id}`), 40, y, { align: "center" });

  y += 5;
  doc.text(
    cleanText(`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`),
    40,
    y,
    { align: "center" }
  );

  y += 5;
  doc.text(cleanText(getPaymentLabelPDF(t.payment)), 40, y, { align: "center" });

  // ✅ LIGNE
  y += 5;
  doc.text("----------------------------------------------------------", 5, y);

  // ✅ PRODUITS
  y += 6;

  let totalBrut = 0;

  (t.items || []).forEach(item => {

    const qty = item.quantity ?? item.qty ?? 0;
    const price = item.price ?? 0;

    const subtotal = qty * price;
    totalBrut += subtotal;

    // ✅ NOM PRODUIT
    doc.text(cleanText(item.name), 5, y);
    y += 4;

    // ✅ DETAIL
    doc.text(
      cleanText(`${qty} x ${formatPrice(price)} GNF = ${formatPrice(subtotal)} GNF`),
      5,
      y
    );

    y += 5;
  });

  // ✅ LIGNE
  y += 2;
  doc.text("----------------------------------------------------------", 5, y);

  // ✅ TOTAUX
  y += 6;

  const remise = t.remise || 0;
  const credit = t.credit || 0;
  const totalNet = t.total || (totalBrut - remise);

  doc.text(cleanText(`Total brut : ${formatPrice(totalBrut)} GNF`), 5, y);
  y += 5;

  if (remise > 0) {
    doc.text(cleanText(`Remise : -${formatPrice(remise)} GNF`), 5, y);
    y += 5;
  }

  if (t.payment === "credit") {

    const remaining = t.credit || 0;
    const total = t.total || totalBrut;

    const encaisse = total - remaining;

    if (encaisse > 0) {
      doc.text(`Payé : ${formatPricePDF(encaisse)} GNF`, 5, y);
      y += 5;
    }

    if (remaining > 0) {
      doc.text(`Reste à payer : ${formatPricePDF(remaining)} GNF`, 5, y);
      y += 5;
    }

    // ✅ bonus (si tout payé)
    if (remaining <= 0) {
      doc.text("Credit solde", 5, y);
      y += 5;
    }
  }


  doc.setFontSize(11);
  doc.text(cleanText(`TOTAL : ${formatPrice(totalNet)} GNF`), 5, y);

  // ✅ FOOTER
  y += 8;
  doc.setFontSize(9);
  doc.text("Merci pour votre achat", 40, y, { align: "center" });

  doc.save(`ticket-${t.id}.pdf`);
}



/* LOAD MORE*/
document.getElementById("ticketLoadMore").onclick = () => {

  showAllTickets = !showAllTickets;

  renderTickets();

  // ✅ scroll vers le haut
  window.scrollTo({ top: 0, behavior: "smooth" });
};


/* FILTRES */
document.getElementById("ticketDate").onchange = () => {
  ticketPage = 1;
  renderTickets();
};

document.getElementById("ticketPayment").onchange = () => {
  ticketPage = 1;
  renderTickets();
};
