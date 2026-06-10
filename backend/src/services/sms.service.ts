// Structure SMS prête pour Twilio
// Décommenter et configurer les variables d'env pour activer

export async function sendSMS(_to: string, _body: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[SMS STUB] To: ${_to} | Body: ${_body}`);
    return;
  }

  // const twilio = require('twilio');
  // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({
  //   body: _body,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  //   to: _to,
  // });
}

export async function sendReservationSMS(phone: string, vehicleTitle: string, startDate: Date): Promise<void> {
  const msg =
    `RentaWay Maroc - Réservation confirmée ! Véhicule: ${vehicleTitle}. ` +
    `Départ: ${startDate.toLocaleDateString("fr-MA")}. Bonne route !`;
  await sendSMS(phone, msg);
}

export async function sendReminderSMS(phone: string, vehicleTitle: string): Promise<void> {
  const msg = `RentaWay Maroc - Rappel: votre location de "${vehicleTitle}" démarre demain. N'oubliez pas votre permis !`;
  await sendSMS(phone, msg);
}
