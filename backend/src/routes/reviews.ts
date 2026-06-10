import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

const router = Router();

const reviewSchema = z.object({
  reservationId: z.string(),
  targetId: z.string(),
  targetType: z.enum(["CLIENT", "AGENCY"]),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});

// POST /api/reviews
router.post("/", authenticate, async (req: AuthRequest, res: Response) => {
  const data = reviewSchema.parse(req.body);

  const reservation = await prisma.reservation.findUnique({
    where: { id: data.reservationId },
  });
  if (!reservation) throw new AppError(404, "Réservation introuvable");
  if (reservation.status !== "COMPLETED") {
    throw new AppError(400, "La location doit être terminée pour laisser un avis");
  }
  if (reservation.clientId !== req.user!.id && req.user!.role !== "LOUEUR") {
    throw new AppError(403, "Accès refusé");
  }

  const existing = await prisma.review.findFirst({
    where: { reservationId: data.reservationId, authorId: req.user!.id },
  });
  if (existing) throw new AppError(409, "Vous avez déjà laissé un avis pour cette réservation");

  const review = await prisma.review.create({
    data: { ...data, authorId: req.user!.id },
    include: { author: { select: { firstName: true, lastName: true, avatar: true } } },
  });

  // Update agency/vehicle rating
  if (data.targetType === "AGENCY") {
    const stats = await prisma.review.aggregate({
      where: { targetId: data.targetId, targetType: "AGENCY" },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.agency.update({
      where: { id: data.targetId },
      data: { rating: stats._avg.rating ?? 0, reviewCount: stats._count },
    });
  }

  res.status(201).json(review);
});

// GET /api/reviews/agency/:agencyId
router.get("/agency/:agencyId", async (req, res: Response) => {
  const { page = "1", limit = "10" } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { targetId: req.params.agencyId, targetType: "AGENCY", isModerated: false },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: { author: { select: { firstName: true, lastName: true, avatar: true } } },
    }),
    prisma.review.count({ where: { targetId: req.params.agencyId, targetType: "AGENCY" } }),
  ]);

  res.json({ reviews, total });
});

// POST /api/reviews/:id/reply — agency responds
router.post("/:id/reply", authenticate, requireRole("LOUEUR"), async (req: AuthRequest, res: Response) => {
  const { reply } = req.body;
  if (!reply?.trim()) throw new AppError(400, "Réponse requise");

  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw new AppError(404, "Avis introuvable");

  const agency = await prisma.agency.findUnique({ where: { userId: req.user!.id } });
  if (!agency || review.targetId !== agency.id) throw new AppError(403, "Accès refusé");

  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data: { reply },
  });
  res.json(updated);
});

// DELETE /api/reviews/:id — admin moderate
router.delete("/:id", authenticate, requireRole("ADMIN"), async (req, res: Response) => {
  await prisma.review.update({ where: { id: req.params.id }, data: { isModerated: true } });
  res.json({ message: "Avis modéré" });
});

export default router;
