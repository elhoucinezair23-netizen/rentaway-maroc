import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { upload, handleUploadError } from "../middleware/upload.middleware";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { AppError } from "../middleware/error.middleware";
import { VehicleCategory } from "@prisma/client";

const router = Router();

const vehicleSchema = z.object({
  category: z.nativeEnum(VehicleCategory),
  title: z.string().min(5),
  description: z.string().min(20),
  pricePerDay: z.coerce.number().positive(),
  pricePerHour: z.coerce.number().positive().optional(),
  caution: z.coerce.number().positive(),
  city: z.string().min(2),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  requiredLicense: z.string(),
  specs: z.string().transform((s) => JSON.parse(s)),
});

// GET /api/vehicles — public search
router.get("/", async (req: Request, res: Response) => {
  const {
    city, category, minPrice, maxPrice, minRating,
    startDate, endDate, sort = "createdAt",
    page = "1", limit = "12",
    availableOnly,
  } = req.query as Record<string, string>;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // availableOnly: par défaut true. Pour voir tous les véhicules, passer ?availableOnly=false
  const where: Record<string, unknown> = availableOnly === "false" ? {} : { isAvailable: true };

  if (city) where.city = { contains: city, mode: "insensitive" };
  if (category) where.category = category;
  if (minPrice || maxPrice) {
    where.pricePerDay = {
      ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
      ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
    };
  }
  if (minRating) where.rating = { gte: parseFloat(minRating) };

  // Exclude vehicles with overlapping reservations
  if (startDate && endDate) {
    where.reservations = {
      none: {
        status: { in: ["CONFIRMED", "ACTIVE"] },
        OR: [
          { startDate: { lte: new Date(endDate), gte: new Date(startDate) } },
          { endDate: { lte: new Date(endDate), gte: new Date(startDate) } },
          { startDate: { lte: new Date(startDate) }, endDate: { gte: new Date(endDate) } },
        ],
      },
    };
  }

  const orderBy: Record<string, string> = {};
  if (sort === "price_asc") orderBy.pricePerDay = "asc";
  else if (sort === "price_desc") orderBy.pricePerDay = "desc";
  else if (sort === "rating") orderBy.rating = "desc";
  else if (sort === "popular") orderBy.viewCount = "desc";
  else orderBy.createdAt = "desc";

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        agency: {
          select: { id: true, name: true, city: true, rating: true, isApproved: true },
        },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  res.json({
    vehicles,
    pagination: { total, page: parseInt(page), limit: take, pages: Math.ceil(total / take) },
  });
});

// GET /api/vehicles/:id
router.get("/:id", async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      agency: {
        select: {
          id: true, name: true, city: true, address: true,
          lat: true, lng: true, rating: true, reviewCount: true,
          isApproved: true, responseTime: true, description: true,
          user: { select: { avatar: true } },
        },
      },
      availability: { where: { date: { gte: new Date() } } },
    },
  });

  if (!vehicle) throw new AppError(404, "Véhicule introuvable");

  // Increment view count (fire and forget)
  prisma.vehicle.update({
    where: { id: vehicle.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  res.json(vehicle);
});

// POST /api/vehicles — agency only
router.post(
  "/",
  authenticate,
  requireRole("LOUEUR"),
  upload.array("images", 8),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    const data = vehicleSchema.parse(req.body);
    const files = req.files as Express.Multer.File[];

    const agency = await prisma.agency.findUnique({ where: { userId: req.user!.id } });
    if (!agency) throw new AppError(404, "Agence introuvable");
    if (!agency.isApproved) throw new AppError(403, "Votre agence doit être approuvée");

    const images = await Promise.all(
      (files || []).map((f) => uploadToCloudinary(f.buffer, "vehicles"))
    );

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        agencyId: agency.id,
        images,
      } as never,
    });

    res.status(201).json(vehicle);
  }
);

// PATCH /api/vehicles/:id
router.patch(
  "/:id",
  authenticate,
  requireRole("LOUEUR", "ADMIN"),
  async (req: AuthRequest, res: Response) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { agency: true },
    });
    if (!vehicle) throw new AppError(404, "Véhicule introuvable");

    if (req.user!.role === "LOUEUR" && vehicle.agency.userId !== req.user!.id) {
      throw new AppError(403, "Accès refusé");
    }

    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json(updated);
  }
);

// DELETE /api/vehicles/:id
router.delete(
  "/:id",
  authenticate,
  requireRole("LOUEUR", "ADMIN"),
  async (req: AuthRequest, res: Response) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { agency: true },
    });
    if (!vehicle) throw new AppError(404, "Véhicule introuvable");

    if (req.user!.role === "LOUEUR" && vehicle.agency.userId !== req.user!.id) {
      throw new AppError(403, "Accès refusé");
    }

    await prisma.vehicle.delete({ where: { id: req.params.id } });
    res.json({ message: "Véhicule supprimé" });
  }
);

// GET /api/vehicles/:id/availability
router.get("/:id/availability", async (req: Request, res: Response) => {
  const { month, year } = req.query as { month: string; year: string };
  const m = parseInt(month);
  const y = parseInt(year);

  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);

  const [blocked, reservations] = await Promise.all([
    prisma.availability.findMany({
      where: { vehicleId: req.params.id, date: { gte: start, lte: end }, isBlocked: true },
    }),
    prisma.reservation.findMany({
      where: {
        vehicleId: req.params.id,
        status: { in: ["CONFIRMED", "ACTIVE"] },
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { startDate: true, endDate: true },
    }),
  ]);

  res.json({ blocked: blocked.map((b) => b.date), reservations });
});

// POST /api/vehicles/:id/availability — toggle blocked dates
router.post(
  "/:id/availability",
  authenticate,
  requireRole("LOUEUR"),
  async (req: AuthRequest, res: Response) => {
    const { dates, isBlocked }: { dates: string[]; isBlocked: boolean } = req.body;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: { agency: true },
    });
    if (!vehicle || vehicle.agency.userId !== req.user!.id) {
      throw new AppError(403, "Accès refusé");
    }

    const ops = dates.map((d) =>
      prisma.availability.upsert({
        where: { vehicleId_date: { vehicleId: req.params.id, date: new Date(d) } },
        create: { vehicleId: req.params.id, date: new Date(d), isBlocked },
        update: { isBlocked },
      })
    );

    await Promise.all(ops);
    res.json({ message: "Disponibilités mises à jour" });
  }
);

export default router;
