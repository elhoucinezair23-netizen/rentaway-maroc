import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

const router = Router();

// GET /api/agencies/:id — public profile
router.get("/:id", async (req: Request, res: Response) => {
  const agency = await prisma.agency.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { firstName: true, lastName: true, avatar: true, createdAt: true } },
      vehicles: {
        where: { isAvailable: true },
        take: 12,
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!agency) throw new AppError(404, "Agence introuvable");

  const reviewStats = await prisma.review.aggregate({
    where: { targetId: agency.id, targetType: "AGENCY", isModerated: false },
    _avg: { rating: true },
    _count: true,
  });

  res.json({ ...agency, reviewStats });
});

// GET /api/agencies/:id/stats — agency dashboard stats
router.get("/:id/stats", authenticate, requireRole("LOUEUR", "ADMIN"), async (req: AuthRequest, res: Response) => {
  const agency = await prisma.agency.findUnique({ where: { id: req.params.id } });
  if (!agency) throw new AppError(404, "Agence introuvable");
  if (req.user!.role === "LOUEUR" && agency.userId !== req.user!.id) {
    throw new AppError(403, "Accès refusé");
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalRevenue, totalReservations, activeReservations, vehicleCount, reviews] =
    await Promise.all([
      prisma.reservation.aggregate({
        where: { agencyId: agency.id, status: { in: ["COMPLETED", "ACTIVE"] } },
        _sum: { totalPrice: true },
      }),
      prisma.reservation.count({ where: { agencyId: agency.id } }),
      prisma.reservation.count({ where: { agencyId: agency.id, status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { agencyId: agency.id } }),
      prisma.review.aggregate({
        where: { targetId: agency.id, targetType: "AGENCY" },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

  const recentRevenue = await prisma.reservation.aggregate({
    where: {
      agencyId: agency.id,
      status: { in: ["COMPLETED", "ACTIVE"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { totalPrice: true },
  });

  const monthlyData = await prisma.$queryRaw<Array<{ month: string; revenue: number; count: number }>>`
    SELECT
      TO_CHAR("createdAt", 'YYYY-MM') as month,
      SUM("totalPrice")::float as revenue,
      COUNT(*)::int as count
    FROM "reservations"
    WHERE "agencyId" = ${agency.id}
      AND "status"::text IN ('COMPLETED', 'ACTIVE')
      AND "createdAt" >= NOW() - INTERVAL '6 months'
    GROUP BY month
    ORDER BY month
  `;

  res.json({
    totalRevenue: totalRevenue._sum.totalPrice ?? 0,
    recentRevenue: recentRevenue._sum.totalPrice ?? 0,
    totalReservations,
    activeReservations,
    vehicleCount,
    rating: reviews._avg.rating ?? 0,
    reviewCount: reviews._count,
    monthlyData,
  });
});

// PATCH /api/agencies/:id
router.patch("/:id", authenticate, requireRole("LOUEUR"), async (req: AuthRequest, res: Response) => {
  const agency = await prisma.agency.findUnique({ where: { id: req.params.id } });
  if (!agency) throw new AppError(404, "Agence introuvable");
  if (agency.userId !== req.user!.id) throw new AppError(403, "Accès refusé");

  const { name, description, address, city, lat, lng } = req.body;
  const updated = await prisma.agency.update({
    where: { id: req.params.id },
    data: { name, description, address, city, lat, lng },
  });
  res.json(updated);
});

export default router;
