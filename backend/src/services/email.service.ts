/**
 * Service email RentaWay Maroc.
 * Tous les templates partagent un wrapper commun (header rouge + footer navy).
 * SMTP configuré via les variables d'environnement SMTP_HOST/PORT/USER/PASS/EMAIL_FROM.
 */
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"RentaWay Maroc" <${process.env.EMAIL_FROM || "noreply@rentaway.ma"}>`;
const FRONT_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Palette RentaWay
const RW_RED = "#E63946";
const RW_NAVY = "#1D3557";
const RW_TEXT = "#212529";
const RW_MUTED = "#6C757D";
const RW_BG = "#F8F9FA";

/**
 * Wrapper HTML commun à tous les templates.
 * @param title       Titre H1 dans le header rouge
 * @param bodyHtml    Contenu HTML déjà mis en page
 * @param emoji       Optionnel — décoration du titre
 */
function wrap(title: string, bodyHtml: string, emoji = ""): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background:${RW_BG}; font-family: 'Inter', Arial, sans-serif; color:${RW_TEXT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${RW_BG}; padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(15,23,42,0.06);">

          <!-- Header rouge RentaWay -->
          <tr>
            <td style="background:${RW_RED}; padding:28px 30px; text-align:center;">
              <div style="display:inline-block; background:#ffffff; padding:8px 14px; border-radius:10px; margin-bottom:14px;">
                <span style="font-size:20px; font-weight:700; color:${RW_NAVY}; letter-spacing:-0.5px;">
                  Renta<span style="color:${RW_RED};">Way</span>
                </span>
                <span style="display:block; font-size:9px; font-weight:600; color:#F4A261; letter-spacing:4px; margin-top:1px;">
                  MAROC
                </span>
              </div>
              <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:700;">
                ${emoji ? emoji + " " : ""}${title}
              </h1>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:32px 36px; font-size:15px; line-height:1.6; color:${RW_TEXT};">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer navy -->
          <tr>
            <td style="background:${RW_NAVY}; padding:22px 30px; text-align:center;">
              <p style="margin:0 0 6px 0; color:#ffffff; font-size:13px; font-weight:600;">
                RentaWay Maroc
              </p>
              <p style="margin:0; color:rgba(255,255,255,0.7); font-size:11px;">
                Louez partout au Maroc en toute confiance
              </p>
              <p style="margin:12px 0 0 0; color:rgba(255,255,255,0.5); font-size:10px;">
                © ${new Date().getFullYear()} RentaWay Maroc. Tous droits réservés.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Bouton CTA HTML (table-based pour compatibilité Outlook).
 */
function button(label: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:8px; background:${RW_RED};">
          <a href="${url}" style="display:inline-block; padding:14px 28px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; border-radius:8px;">
            ${label}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function muted(text: string): string {
  return `<p style="font-size:12px; color:${RW_MUTED}; margin:24px 0 0 0;">${text}</p>`;
}

const fmtDate = (d: Date): string =>
  new Date(d).toLocaleDateString("fr-MA", { day: "2-digit", month: "long", year: "numeric" });

const fmtMAD = (n: number): string => `${n.toLocaleString("fr-MA")} MAD`;

// ════════════════════════════════════════════════════════════
// 1. WELCOME
// ════════════════════════════════════════════════════════════
export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  const body = `
    <h2 style="margin:0 0 12px 0; font-size:20px; color:${RW_NAVY};">Bonjour ${firstName} 👋</h2>
    <p>Votre compte RentaWay a été créé avec succès. Vous pouvez désormais louer des voitures, motos, bateaux et jet-skis partout au Maroc.</p>

    ${button("Découvrir les véhicules", `${FRONT_URL}/search`)}

    <div style="background:${RW_BG}; border-radius:8px; padding:16px 20px; margin-top:24px;">
      <p style="margin:0 0 10px 0; font-weight:600; color:${RW_NAVY};">Pourquoi RentaWay ?</p>
      <ul style="margin:0; padding-left:20px; color:${RW_TEXT};">
        <li style="margin-bottom:6px;">Plus de 500 véhicules dans 27 villes</li>
        <li style="margin-bottom:6px;">Agences vérifiées avec assurance incluse</li>
        <li style="margin-bottom:6px;">Paiement sécurisé et annulation gratuite 24h avant</li>
      </ul>
    </div>

    ${muted("Vous recevez cet email parce que vous avez créé un compte sur rentaway.ma.")}
  `;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Bienvenue sur RentaWay Maroc 🎉",
    html: wrap("Bienvenue !", body, "🎉"),
  });
}

// ════════════════════════════════════════════════════════════
// 2. RESERVATION CONFIRMATION (au client)
// ════════════════════════════════════════════════════════════
export interface ReservationEmailData {
  id: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  cautionAmount: number;
  vehicle: { title: string };
  agency: { name: string; address?: string; city?: string; phone?: string | null };
}

export async function sendReservationConfirmation(
  email: string,
  reservation: ReservationEmailData
): Promise<void> {
  const body = `
    <p>Votre réservation est confirmée. Voici le récapitulatif :</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Véhicule</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${reservation.vehicle.title}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Agence</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${reservation.agency.name}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Du</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${fmtDate(reservation.startDate)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Au</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${fmtDate(reservation.endDate)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px; color:${RW_MUTED}; font-size:13px;">Total à payer</td>
        <td style="padding:10px 12px; font-weight:700; color:${RW_RED}; font-size:18px; text-align:right;">${fmtMAD(reservation.totalPrice)}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px 10px 12px; color:${RW_MUTED}; font-size:11px;">Caution (préautorisée)</td>
        <td style="padding:4px 12px 10px 12px; font-size:12px; color:${RW_MUTED}; text-align:right;">${fmtMAD(reservation.cautionAmount)}</td>
      </tr>
    </table>

    ${reservation.agency.address || reservation.agency.phone ? `
    <div style="background:${RW_BG}; border-radius:8px; padding:14px 18px; margin:16px 0;">
      <p style="margin:0 0 6px 0; font-weight:600; color:${RW_NAVY}; font-size:13px;">Coordonnées de l'agence</p>
      ${reservation.agency.address ? `<p style="margin:0; font-size:13px; color:${RW_TEXT};">${reservation.agency.address}${reservation.agency.city ? ", " + reservation.agency.city : ""}</p>` : ""}
      ${reservation.agency.phone ? `<p style="margin:4px 0 0 0; font-size:13px; color:${RW_TEXT};">📞 ${reservation.agency.phone}</p>` : ""}
    </div>
    ` : ""}

    ${button("Voir ma réservation", `${FRONT_URL}/dashboard/client/reservations/${reservation.id}`)}

    <div style="background:#FEF3C7; border-left:3px solid #F4A261; padding:12px 16px; border-radius:6px; margin-top:20px; font-size:13px;">
      <strong>Politique d'annulation :</strong> annulation gratuite jusqu'à 48h avant la prise en charge. Entre 24-48h : 50% remboursés. Moins de 24h : non remboursable.
    </div>

    ${muted(`Référence : ${reservation.id}`)}
  `;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Réservation confirmée — ${reservation.vehicle.title}`,
    html: wrap("Réservation confirmée", body, "✅"),
  });
}

// Alias rétrocompatible — l'ancien code l'appelle encore
export const sendReservationEmail = sendReservationConfirmation;

// ════════════════════════════════════════════════════════════
// 3. RESERVATION TO AGENCY (au loueur)
// ════════════════════════════════════════════════════════════
export async function sendReservationToAgency(
  agencyEmail: string,
  data: ReservationEmailData & {
    client: { firstName: string; lastName: string; phone?: string | null };
    commission: number;
  }
): Promise<void> {
  const netAmount = data.totalPrice - data.commission;
  const body = `
    <p>Vous avez reçu une nouvelle réservation pour <strong>${data.vehicle.title}</strong>.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Client</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${data.client.firstName} ${data.client.lastName}</td>
      </tr>
      ${data.client.phone ? `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Téléphone</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">📞 ${data.client.phone}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Dates</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${fmtDate(data.startDate)} → ${fmtDate(data.endDate)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Montant brut</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; text-align:right;">${fmtMAD(data.totalPrice)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Commission RentaWay (15%)</td>
        <td style="padding:10px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; text-align:right;">-${fmtMAD(data.commission)}</td>
      </tr>
      <tr>
        <td style="padding:10px 12px; color:${RW_MUTED}; font-size:13px;">Vous recevez</td>
        <td style="padding:10px 12px; font-weight:700; color:#2DC653; font-size:18px; text-align:right;">${fmtMAD(netAmount)}</td>
      </tr>
    </table>

    ${button("Gérer la réservation", `${FRONT_URL}/dashboard/agency/reservations/${data.id}`)}

    ${muted(`Référence : ${data.id} — Contactez le client avant la date de prise en charge pour confirmer les modalités.`)}
  `;
  await transporter.sendMail({
    from: FROM,
    to: agencyEmail,
    subject: `Nouvelle réservation — ${data.vehicle.title}`,
    html: wrap("Nouvelle réservation", body, "📅"),
  });
}

// ════════════════════════════════════════════════════════════
// 4. PASSWORD RESET
// ════════════════════════════════════════════════════════════
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string
): Promise<void> {
  const body = `
    <h2 style="margin:0 0 12px 0; font-size:18px; color:${RW_NAVY};">Bonjour ${firstName},</h2>
    <p>Vous avez demandé la réinitialisation de votre mot de passe RentaWay.</p>
    <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expirera dans <strong>1 heure</strong>.</p>

    ${button("Réinitialiser mon mot de passe", resetUrl)}

    <p style="font-size:12px; color:${RW_MUTED}; margin-top:20px;">
      Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :
    </p>
    <p style="font-size:11px; color:${RW_MUTED}; word-break:break-all; background:${RW_BG}; padding:10px 12px; border-radius:6px;">
      ${resetUrl}
    </p>

    <div style="background:#FEF3C7; border-left:3px solid #F4A261; padding:12px 16px; border-radius:6px; margin-top:20px; font-size:13px;">
      Si vous n'avez pas fait cette demande, ignorez simplement cet email. Votre mot de passe ne sera pas modifié.
    </div>
  `;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Réinitialisation de votre mot de passe",
    html: wrap("Réinitialisation de mot de passe", body, "🔐"),
  });
}

// ════════════════════════════════════════════════════════════
// 5. CONTACT (vers admin)
// ════════════════════════════════════════════════════════════
export async function sendContactEmail(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "admin@rentaway.ma";
  const body = `
    <p>Vous avez reçu un nouveau message via le formulaire de contact.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0; border-collapse:collapse;">
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Nom</td>
        <td style="padding:8px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">Email</td>
        <td style="padding:8px 12px; border-bottom:1px solid #eee; text-align:right;"><a href="mailto:${data.email}" style="color:${RW_RED};">${data.email}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 12px; color:${RW_MUTED}; font-size:13px;">Sujet</td>
        <td style="padding:8px 12px; font-weight:600; text-align:right;">${data.subject}</td>
      </tr>
    </table>

    <div style="background:${RW_BG}; padding:16px 20px; border-radius:8px; margin-top:16px;">
      <p style="margin:0 0 6px 0; font-weight:600; color:${RW_NAVY}; font-size:13px;">Message :</p>
      <p style="margin:0; white-space:pre-wrap; color:${RW_TEXT};">${data.message}</p>
    </div>

    ${button("Répondre par email", `mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}`)}
  `;
  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    replyTo: data.email,
    subject: `[Contact RentaWay] ${data.subject}`,
    html: wrap(`Message de ${data.name}`, body, "✉️"),
  });
}

// ════════════════════════════════════════════════════════════
// 6. CONTACT CONFIRMATION (au visiteur)
// ════════════════════════════════════════════════════════════
export async function sendContactConfirmation(
  email: string,
  name: string,
  payload?: { subject?: string; message?: string }
): Promise<void> {
  const body = `
    <h2 style="margin:0 0 12px 0; font-size:18px; color:${RW_NAVY};">Merci ${name} 🙏</h2>
    <p>Nous avons bien reçu votre message. Notre équipe vous répondra dans les <strong>24 heures</strong>.</p>

    ${payload?.subject || payload?.message ? `
    <div style="background:${RW_BG}; border-radius:8px; padding:16px 20px; margin:20px 0;">
      <p style="margin:0 0 8px 0; font-weight:600; color:${RW_NAVY}; font-size:13px;">Récapitulatif de votre message :</p>
      ${payload?.subject ? `<p style="margin:0 0 8px 0; font-size:13px;"><strong>Sujet :</strong> ${payload.subject}</p>` : ""}
      ${payload?.message ? `<p style="margin:0; font-size:13px; white-space:pre-wrap; color:${RW_MUTED};">${payload.message}</p>` : ""}
    </div>
    ` : ""}

    <p>En attendant, vous pouvez explorer notre catalogue :</p>
    ${button("Voir les véhicules", `${FRONT_URL}/search`)}

    ${muted("L'équipe RentaWay Maroc")}
  `;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Votre message a bien été reçu",
    html: wrap("Message reçu", body, "✅"),
  });
}

// ════════════════════════════════════════════════════════════
// Autres emails existants — rebrand léger
// ════════════════════════════════════════════════════════════
export async function sendProspectInvitation(prospect: {
  email: string;
  name: string;
  city: string;
}): Promise<void> {
  const signupUrl = `${FRONT_URL}/register?role=loueur&ref=invite&email=${encodeURIComponent(prospect.email)}`;
  const body = `
    <h2 style="margin:0 0 12px 0; font-size:18px; color:${RW_NAVY};">Bonjour ${prospect.name},</h2>
    <p>Nous avons trouvé votre agence de location à <strong>${prospect.city}</strong> et nous vous invitons à rejoindre <strong>RentaWay Maroc</strong>, la plateforme qui connecte les clients aux meilleures agences du royaume.</p>

    <div style="background:#FEF3C7; border-left:3px solid #F4A261; padding:14px 18px; border-radius:6px; margin:20px 0;">
      <strong>Offre de lancement :</strong> 6 mois sans commission pour les premières agences inscrites.
    </div>

    <ul style="margin:0 0 20px 0; padding-left:20px;">
      <li style="margin-bottom:6px;">Inscription gratuite en 5 minutes</li>
      <li style="margin-bottom:6px;">Paiements sécurisés et garantis</li>
      <li style="margin-bottom:6px;">Dashboard avec statistiques et calendrier</li>
      <li style="margin-bottom:6px;">Clients vérifiés (CIN + permis)</li>
    </ul>

    ${button("Créer mon espace loueur", signupUrl)}

    ${muted("Vous recevez ce message car votre agence est référencée dans des annuaires publics au Maroc. Pour ne plus recevoir de communications, répondez simplement \"STOP\".")}
  `;
  await transporter.sendMail({
    from: FROM,
    to: prospect.email,
    subject: "Rejoignez RentaWay Maroc — La plateforme de location au Maroc",
    html: wrap("Rejoignez RentaWay", body, "🚀"),
  });
}

export async function sendLoueurFormConfirmation(email: string, agencyName: string): Promise<void> {
  const completeUrl = `${FRONT_URL}/register?role=loueur&email=${encodeURIComponent(email)}&ref=form`;
  const body = `
    <p>Nous avons bien reçu la demande d'inscription pour <strong>${agencyName}</strong>. Notre équipe vous contacte dans les <strong>24 heures</strong>.</p>
    <p>Pour gagner du temps, vous pouvez compléter votre inscription dès maintenant :</p>
    ${button("Finaliser mon inscription", completeUrl)}
    ${muted("Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.")}
  `;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Votre demande d'inscription a bien été reçue",
    html: wrap("Demande reçue", body, "✅"),
  });
}

export async function sendAdminLoueurNotification(data: {
  agencyName: string;
  contactName: string;
  city: string;
  phone: string;
  email: string;
  categories: string[];
  message?: string;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || "admin@rentaway.ma";
  const rows = [
    ["Agence", data.agencyName],
    ["Contact", data.contactName],
    ["Ville", data.city],
    ["Téléphone", data.phone],
    ["Email", data.email],
    ["Catégories", data.categories.join(", ")],
  ];
  const body = `
    <p>Une nouvelle agence souhaite rejoindre RentaWay.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0; border-collapse:collapse;">
      ${rows.map(([k, v]) => `
        <tr>
          <td style="padding:8px 12px; border-bottom:1px solid #eee; color:${RW_MUTED}; font-size:13px;">${k}</td>
          <td style="padding:8px 12px; border-bottom:1px solid #eee; font-weight:600; text-align:right;">${v}</td>
        </tr>
      `).join("")}
    </table>

    ${data.message ? `
    <div style="background:${RW_BG}; padding:14px 18px; border-radius:6px;">
      <p style="margin:0 0 6px 0; font-weight:600; color:${RW_NAVY}; font-size:13px;">Message :</p>
      <p style="margin:0; white-space:pre-wrap;">${data.message}</p>
    </div>
    ` : ""}

    ${button("Voir dans le dashboard", `${FRONT_URL}/dashboard/admin/prospection`)}
  `;
  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `Nouvelle demande loueur — ${data.agencyName} — ${data.city}`,
    html: wrap("Nouvelle demande loueur", body, "🏢"),
  });
}

export async function sendReminderEmail(
  email: string,
  firstName: string,
  vehicleTitle: string,
  startDate: Date
): Promise<void> {
  const body = `
    <p>Bonjour ${firstName},</p>
    <p>Votre location de <strong>${vehicleTitle}</strong> démarre demain le <strong>${fmtDate(startDate)}</strong>.</p>
    <p>📋 <strong>Pensez à avoir avec vous :</strong></p>
    <ul>
      <li>Votre permis de conduire en cours de validité</li>
      <li>Votre pièce d'identité (CIN ou passeport)</li>
      <li>La carte bancaire ayant servi à la réservation</li>
    </ul>
    <p>Bonne route ! 🚗</p>
  `;
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Rappel : votre location démarre demain — ${vehicleTitle}`,
    html: wrap("Rappel de location", body, "⏰"),
  });
}
