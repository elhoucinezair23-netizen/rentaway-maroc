/**
 * Endpoints d'administration pour tester l'envoi d'emails.
 * Prefix : /api/admin/emails
 * Réservé aux ADMIN.
 */
import { Router, Response } from "express";
import { z } from "zod";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import {
  sendWelcomeEmail,
  sendReservationConfirmation,
  sendReservationToAgency,
  sendPasswordResetEmail,
  sendContactEmail,
  sendContactConfirmation,
} from "../services/email.service";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));

// Log en mémoire des 10 derniers envois (FIFO)
type LogEntry = {
  id: string;
  type: string;
  to: string;
  status: "sent" | "failed";
  error?: string;
  sentAt: string;
  sentBy: string;
};
const LOG_MAX = 10;
const sentLog: LogEntry[] = [];

function record(entry: Omit<LogEntry, "id" | "sentAt">): void {
  sentLog.unshift({
    ...entry,
    id: Math.random().toString(36).slice(2, 10),
    sentAt: new Date().toISOString(),
  });
  if (sentLog.length > LOG_MAX) sentLog.length = LOG_MAX;
}

const TYPES = ["welcome", "reservation", "agency", "reset", "contact", "contactConfirm"] as const;
type EmailType = typeof TYPES[number];

const querySchema = z.object({
  type: z.enum(TYPES),
  to: z.string().email(),
});

// GET /api/admin/emails/log — last 10 sends
router.get("/log", (_req, res: Response) => {
  res.json({ items: sentLog });
});

// Handler partagé GET (query) + POST (body)
async function handleTestEmail(req: AuthRequest, res: Response) {
  const payload = Object.keys(req.body || {}).length ? req.body : req.query;
  const parsed = querySchema.safeParse(payload);
  if (!parsed.success) {
    return res.status(400).json({ error: "type ou email invalide", issues: parsed.error.issues });
  }
  const { type, to } = parsed.data;
  const sampleData = buildSample(type as EmailType, to);

  try {
    await sampleData.send();
    record({ type, to, status: "sent", sentBy: req.user!.id });
    return res.json({ success: true, type, to });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    record({ type, to, status: "failed", error: msg, sentBy: req.user!.id });
    return res.status(500).json({ success: false, error: msg });
  }
}

router.post("/test", handleTestEmail);
router.get("/test", handleTestEmail);

// Fabrique les données factices + action d'envoi pour chaque type.
function buildSample(type: EmailType, to: string): { send: () => Promise<void> } {
  const FRONT = process.env.FRONTEND_URL || "http://localhost:3000";
  const sampleReservation = {
    id: "DEMO-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    totalPrice: 1050,
    cautionAmount: 700,
    vehicle: { title: "Dacia Logan 2023" },
    agency: {
      name: "Atlas Auto Casablanca",
      address: "Boulevard Mohammed V",
      city: "Casablanca",
      phone: "+212 5 22 00 00 00",
    },
  };

  switch (type) {
    case "welcome":
      return { send: () => sendWelcomeEmail(to, "Sara") };
    case "reservation":
      return { send: () => sendReservationConfirmation(to, sampleReservation) };
    case "agency":
      return {
        send: () =>
          sendReservationToAgency(to, {
            ...sampleReservation,
            client: { firstName: "Karim", lastName: "El Fassi", phone: "+212 6 12 34 56 78" },
            commission: sampleReservation.totalPrice * 0.15,
          }),
      };
    case "reset":
      return {
        send: () =>
          sendPasswordResetEmail(
            to,
            "Sara",
            `${FRONT}/reset-password?token=demo-${Math.random().toString(36).slice(2)}`
          ),
      };
    case "contact":
      return {
        send: () =>
          sendContactEmail({
            name: "Karim El Fassi",
            email: to,
            subject: "Question sur la disponibilité",
            message: "Bonjour, est-ce que la Dacia Duster 4x4 est disponible du 15 au 20 juin à Marrakech ? Merci.",
          }),
      };
    case "contactConfirm":
      return {
        send: () =>
          sendContactConfirmation(to, "Karim", {
            subject: "Question sur la disponibilité",
            message: "Bonjour, est-ce que la Dacia Duster 4x4 est disponible du 15 au 20 juin à Marrakech ? Merci.",
          }),
      };
  }
}

export default router;
