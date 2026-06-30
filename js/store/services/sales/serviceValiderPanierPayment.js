/**
 * SERVICE : PAYMENT BUILDER
 */
function buildPaymentDetails(paymentMethod, totalNet, creditData){

  if(paymentMethod === "credit"){

    if(!creditData){
      return { error: "❌ Veuillez saisir les infos crédit" };
    }

    if(!creditData.payments){
      creditData.payments = creditData.paidNow > 0 ? [{
        amount: creditData.paidNow,
        date: new Date().toISOString()
      }] : [];

      const totalPaid = creditData.payments
        .reduce((sum, p) => sum + p.amount, 0);

      creditData.total = totalNet;
      creditData.remaining = totalNet - totalPaid;
      creditData.status =
        creditData.remaining <= 0 ? "PAYÉ" : "EN ATTENTE";
    }

    return creditData;
  }

  return {
    type: paymentMethod,
    total: totalNet,
    status: "PAYÉ"
  };
}