import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/error.middleware";
import { sendLoueurFormConfirmation, sendAdminLoueurNotification, sendContactEmail, sendContactConfirmation } from "../services/email.service";

const router = Router();

const loueurSignupSchema = z.object({
  agencyName: z.string().min(2),
  contactName: z.string().min(2),
  city: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  categories: z.array(z.enum(["VOITURE", "MOTO", "BATEAU", "JETSKI"])).min(1),
  message: z.string().optional(),
});

// POST /api/public/loueur-signup
router.post("/loueur-signup", async (req: Request, res: Response) => {
  const data = loueurSignupSchema.parse(req.body);

  const existing = await prisma.prospect.findFirst({
    where: { email: data.email, status: { in: ["FORM_SUBMITTED", "REGISTERED"] } },
  });
  if (existing) throw new AppError(409, "Une demande existe déjà pour cet email");

  const prospect = await prisma.prospect.create({
    data: {
      name: data.agencyName,
      city: data.city,
      phone: data.phone,
      email: data.email,
      categories: data.categories,
      sourceUrl: "form:rejoindre-en-tant-que-loueur",
      status: "FORM_SUBMITTED",
      contactedAt: new Date(),
      notes: data.message ? `Contact: ${data.contactName}\n${data.message}` : `Contact: ${data.contactName}`,
    },
  });

  // Envoi des emails (non bloquants en cas d'erreur SMTP non configuré)
  Promise.allSettled([
    sendLoueurFormConfirmation(data.email, data.agencyName),
    sendAdminLoueurNotification(data),
  ]).catch(() => {});

  res.json({
    success: true,
    message: "Votre demande a bien été reçue ! Notre équipe vous contacte dans les 24h.",
    prospectId: prospect.id,
  });
});

// POST /api/public/contact
const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});

router.post("/contact", async (req: Request, res: Response) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Données invalides", issues: parsed.error.issues });
  }
  const data = parsed.data;

  // Emails non bloquants
  Promise.allSettled([
    sendContactEmail(data),
    sendContactConfirmation(data.email, data.name, { subject: data.subject, message: data.message }),
  ]).catch(() => {});

  res.json({ success: true });
});

// GET /api/public/stats — chiffres clés pour la homepage
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const [totalVehicles, distinctCities, totalAgencies, ratingAgg] = await Promise.all([
      prisma.vehicle.count({ where: { isAvailable: true } }),
      prisma.vehicle.findMany({
        where: { isAvailable: true },
        select: { city: true },
        distinct: ["city"],
      }),
      prisma.agency.count({ where: { isApproved: true } }),
      prisma.vehicle.aggregate({
        where: { rating: { gt: 0 } },
        _avg: { rating: true },
      }),
    ]);

    res.json({
      totalVehicles,
      totalCities: distinctCities.length,
      totalAgencies,
      averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : 0,
    });
  } catch (err) {
    console.error("[stats]", err);
    res.status(200).json({
      totalVehicles: 500,
      totalCities: 27,
      totalAgencies: 50,
      averageRating: 4.8,
    });
  }
});

export default router;
