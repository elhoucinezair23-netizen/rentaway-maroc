/**
 * Endpoints d'administration pour les véhicules scrapés.
 * Pré-fixe monté : /api/admin/scraped-vehicles
 * Tous les endpoints exigent ADMIN.
 */
import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole } from "../middleware/auth.middleware";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));

// GET /api/admin/scraped-vehicles?status=pending|approved&city=&category=
router.get("/", async (req, res: Response) => {
  const status = (req.query.status as string) || "pending";
  const city = (req.query.city as string) || undefined;
  const category = (req.query.category as string) || undefined;

  const where: any = { isScraped: true };
  if (status === "pending")  where.isApproved = false;
  if (status === "approved") where.isApproved = true;
  if (city)     where.city = city;
  if (category) where.category = category;

  const [items, total, counters] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { agency: { select: { name: true } } },
      take: 200,
    }),
    prisma.vehicle.count({ where }),
    Promise.all([
      prisma.vehicle.count({ where: { isScraped: true } }),
      prisma.vehicle.count({ where: { isScraped: true, isApproved: false } }),
      prisma.vehicle.count({ where: { isScraped: true, isApproved: true } }),
    ]).then(([total, pending, approved]) => ({ total, pending, approved })),
  ]);

  res.json({ items, total, counters });
});

// POST /api/admin/scraped-vehicles/:id/approve
router.post("/:id/approve", async (req, res: Response) => {
  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { isApproved: true },
  });
  res.json(updated);
});

// POST /api/admin/scraped-vehicles/:id/reject  → delete
router.post("/:id/reject", async (req, res: Response) => {
  await prisma.vehicle.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// POST /api/admin/scraped-vehicles/approve-all  → approve all pending
router.post("/approve-all", async (_req, res: Response) => {
  const result = await prisma.vehicle.updateMany({
    where: { isScraped: true, isApproved: false },
    data: { isApproved: true },
  });
  res.json({ count: result.count });
});

// PATCH /api/admin/scraped-vehicles/:id  → edit fields before publishing
const updateSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  pricePerDay: z.number().positive().optional(),
  caution: z.number().positive().optional(),
  city: z.string().optional(),
  category: z.enum(["VOITURE", "MOTO", "BATEAU", "JETSKI"]).optional(),
  requiredLicense: z.string().optional(),
});

router.patch("/:id", async (req, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues });
  }
  const updated = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(updated);
});

export default router;
