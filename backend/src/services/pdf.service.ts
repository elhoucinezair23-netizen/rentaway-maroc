import PDFDocument from "pdfkit";
import { uploadToCloudinary } from "./cloudinary.service";

interface ReservationData {
  id: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  cautionAmount: number;
  commission: number;
  vehicle: { title: string; category: string; images?: string[] };
  agency: { name: string; address: string; city: string };
  client: { firstName: string; lastName: string; email: string };
}

export async function generateReservationPDF(
  reservation: ReservationData
): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("error", reject);
    doc.on("end", async () => {
      const buffer = Buffer.concat(buffers);
      try {
        const url = await uploadToCloudinary(buffer, "pdfs");
        resolve(url);
      } catch (e) {
        reject(e);
      }
    });

    const dateFormat = (d: Date) =>
      d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

    // Header
    doc
      .rect(0, 0, 612, 80)
      .fill("#E63946")
      .fillColor("white")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("RentaWay Maroc", 50, 25)
      .fontSize(10)
      .font("Helvetica")
      .text("Plateforme de location de véhicules au Maroc", 50, 55)
      .fillColor("black");

    doc.moveDown(4);

    // Title
    doc
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("BON DE RÉSERVATION", { align: "center" })
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#666")
      .text(`Référence : ${reservation.id}`, { align: "center" })
      .fillColor("black")
      .moveDown(1.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#f97316").moveDown(1);

    // Client info
    doc.fontSize(13).font("Helvetica-Bold").text("CLIENT").moveDown(0.3);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Nom : ${reservation.client.firstName} ${reservation.client.lastName}`);
    doc.text(`Email : ${reservation.client.email}`).moveDown(1);

    // Vehicle info
    doc.fontSize(13).font("Helvetica-Bold").text("VÉHICULE").moveDown(0.3);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Véhicule : ${reservation.vehicle.title}`);
    doc.text(`Catégorie : ${reservation.vehicle.category}`).moveDown(1);

    // Agency info
    doc.fontSize(13).font("Helvetica-Bold").text("AGENCE DE LOCATION").moveDown(0.3);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Agence : ${reservation.agency.name}`);
    doc.text(`Adresse : ${reservation.agency.address}, ${reservation.agency.city}`).moveDown(1);

    // Dates
    doc.fontSize(13).font("Helvetica-Bold").text("PÉRIODE DE LOCATION").moveDown(0.3);
    doc.fontSize(11).font("Helvetica");
    doc.text(`Début : ${dateFormat(reservation.startDate)}`);
    doc.text(`Fin : ${dateFormat(reservation.endDate)}`).moveDown(1);

    // Pricing
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#eee").moveDown(0.5);
    doc.fontSize(13).font("Helvetica-Bold").text("DÉTAIL DES PRIX").moveDown(0.5);

    const net = reservation.totalPrice - reservation.commission;
    const rows = [
      ["Montant total de la location", `${reservation.totalPrice.toFixed(2)} MAD`],
      ["Commission plateforme (15%)", `${reservation.commission.toFixed(2)} MAD`],
      ["Montant net à l'agence", `${net.toFixed(2)} MAD`],
      ["Dépôt de garantie (remboursable)", `${reservation.cautionAmount.toFixed(2)} MAD`],
    ];

    rows.forEach(([label, value]) => {
      doc.fontSize(11).font("Helvetica").text(label, 50, doc.y, { continued: true });
      doc.text(value, { align: "right" });
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke("#f97316").moveDown(0.5);

    const total = reservation.totalPrice + reservation.cautionAmount;
    doc
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("TOTAL À PAYER", 50, doc.y, { continued: true })
      .text(`${total.toFixed(2)} MAD`, { align: "right" })
      .moveDown(2);

    // Footer
    doc
      .fontSize(9)
      .fillColor("#888")
      .font("Helvetica")
      .text(
        "La caution sera libérée dans les 5 jours ouvrés après la restitution du véhicule, sous réserve d'absence de dommages.",
        { align: "center" }
      )
      .text(
        "Politique d'annulation : 100% remboursé si > 48h, 50% si 24-48h, aucun remboursement si < 24h.",
        { align: "center" }
      );

    doc.end();
  });
}
