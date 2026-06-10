import { Router, Response } from "express";
import { z } from "zod";
import { differenceInDays, differenceInHours } from "date-fns";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import { generateReservationPDF } from "../services/pdf.service";
import { sendReservationEmail, sendReservationToAgency } from "../services/email.service";
import {
  notifyReservationNew,
  notifyReservationConfirmed,
  notifyReservationCancelled,
} from "../services/notification.service";

const router = Router();

const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || "0.15");

const createReservationSchema = z.object({
  vehicleId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

// POST /api/reservations
router.post("/", authenticate, requireRole("CLIENT"), async (req: AuthRequest, res: Response) => {
  const { vehicleId, startDate, endDate } = createReservationSchema.parse(req.body);

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) throw new AppError(400, "La date de début doit être avant la date de fin");
  if (start < new Date()) throw new AppError(400, "La date de début doit être dans le futur");

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { agency: true },
  });
  if (!vehicle) throw new AppError(404, "Véhicule introuvable");
  if (!vehicle.isAvailable) throw new AppError(400, "Véhicule non disponible");
  if (!vehicle.agency.isApproved) throw new AppError(400, "Agence non approuvée");

  // Check for overlapping reservations
  const conflict = await prisma.reservation.findFirst({
    where: {
      vehicleId,
      status: { in: ["CONFIRMED", "ACTIVE"] },
      OR: [
        { startDate: { lte: end, gte: start } },
        { endDate: { lte: end, gte: start } },
        { startDate: { lte: start }, endDate: { gte: end } },
      ],
    },
  });
  if (conflict) throw new AppError(409, "Véhicule non disponible pour ces dates");

  // Check blocked availability
  const blocked = await prisma.availability.findFirst({
    where: {
      vehicleId,
      isBlocked: true,
      date: { gte: start, lte: end },
    },
  });
  if (blocked) throw new AppError(409, "Certaines dates sont bloquées par le loueur");

  const days = Math.max(1, differenceInDays(end, start));
  const totalPrice = days * vehicle.pricePerDay;
  const commission = totalPrice * COMMISSION_RATE;

  const reservation = await prisma.reservation.create({
    data: {
      vehicleId,
      clientId: req.user!.id,
      agencyId: vehicle.agencyId,
      startDate: start,
      endDate: end,
      totalPrice,
      commission,
      cautionAmount: vehicle.caution,
      status: "PENDING",
    },
    include: {
      vehicle: { select: { title: true, images: true, category: true } },
      agency: { select: { name: true, address: true, city: true } },
      client: { select: { firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  // Generate PDF bon de réservation
  try {
    const pdfUrl = await generateReservationPDF(reservation);
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { pdfPath: pdfUrl },
    });
    await sendReservationEmail(reservation.client.email, reservation);
  } catch {
    // PDF generation failure is non-blocking
  }

  // Notification temps réel + email au loueur
  try {
    const agencyOwner = await prisma.agency.findUnique({
      where: { id: vehicle.agencyId },
      select: { userId: true, user: { select: { email: true } } },
    });
    if (agencyOwner) {
      notifyReservationNew(agencyOwner.userId, {
        reservationId: reservation.id,
        vehicleTitle: reservation.vehicle.title,
        clientName: `${reservation.client.firstName} ${reservation.client.lastName}`,
      });
      if (agencyOwner.user.email) {
        sendReservationToAgency(agencyOwner.user.email, {
          ...reservation,
          client: {
            firstName: reservation.client.firstName,
            lastName: reservation.client.lastName,
            phone: reservation.client.phone || null,
          },
          commission,
        }).catch(() => { /* email non-blocking */ });
      }
    }
  } catch {
    // notification failure non-blocking
  }

  res.status(201).json(reservation);
});

// GET /api/reservations — list for current user
router.get("/", authenticate, async (req: AuthRequest, res: Response) => {
  const { status, page = "1", limit = "10" } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: Record<string, unknown> =
    req.user!.role === "CLIENT"
      ? { clientId: req.user!.id }
      : req.user!.role === "LOUEUR"
      ? { agency: { userId: req.user!.id } }
      : {};

  if (status) where.status = status;

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        vehicle: { select: { id: true, title: true, images: true, category: true } },
        client: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        agency: { select: { id: true, name: true } },
        payments: true,
        reviews: { select: { id: true, rating: true } },
      },
    }),
    prisma.reservation.count({ where }),
  ]);

  res.json({ reservations, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
});

// GET /api/reservations/:id
router.get("/:id", authenticate, async (req: AuthRequest, res: Response) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: true,
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
      agency: { select: { id: true, name: true, address: true, city: true } },
      payments: true,
      reviews: true,
    },
  });

  if (!reservation) throw new AppError(404, "Réservation introuvable");

  const isClient = reservation.clientId === req.user!.id;
  const isAgency = req.user!.role === "LOUEUR";
  const isAdmin = req.user!.role === "ADMIN";

  if (!isClient && !isAgency && !isAdmin) throw new AppError(403, "Accès refusé");

  res.json(reservation);
});

// PATCH /api/reservations/:id/status — agency or admin
router.patch("/:id/status", authenticate, async (req: AuthRequest, res: Response) => {
  const { status, cancelReason } = req.body;

  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id },
    include: { agency: true, client: true },
  });
  if (!reservation) throw new AppError(404, "Réservation introuvable");

  const isAgencyOwner = req.user!.role === "LOUEUR" && reservation.agency.userId === req.user!.id;
  const isAdmin = req.user!.role === "ADMIN";
  const isClient = reservation.clientId === req.user!.id;

  if (!isAgencyOwner && !isAdmin && !isClient) throw new AppError(403, "Accès refusé");

  // Validate allowed transitions
  const allowed: Record<string, string[]> = {
    PENDING: isAgencyOwner || isAdmin ? ["CONFIRMED", "CANCELLED"] : isClient ? ["CANCELLED"] : [],
    CONFIRMED: isAgencyOwner || isAdmin ? ["ACTIVE", "CANCELLED"] : isClient ? ["CANCELLED"] : [],
    ACTIVE: isAgencyOwner || isAdmin ? ["COMPLETED", "DISPUTED"] : [],
    COMPLETED: isAdmin ? ["DISPUTED"] : [],
  };

  if (!allowed[reservation.status]?.includes(status)) {
    throw new AppError(400, `Transition ${reservation.status} → ${status} non autorisée`);
  }

  const updated = await prisma.reservation.update({
    where: { id: req.params.id },
    data: { status, ...(cancelReason ? { cancelReason } : {}) },
    include: { vehicle: { select: { title: true } } },
  });

  // Notification temps réel
  try {
    if (status === "CONFIRMED") {
      notifyReservationConfirmed(reservation.clientId, {
        reservationId: reservation.id,
        vehicleTitle: updated.vehicle.title,
      });
    } else if (status === "CANCELLED") {
      // Prévenir les deux parties
      notifyReservationCancelled(reservation.clientId, {
        reservationId: reservation.id,
        vehicleTitle: updated.vehicle.title,
        reason: cancelReason,
      });
      notifyReservationCancelled(reservation.agency.userId, {
        reservationId: reservation.id,
        vehicleTitle: updated.vehicle.title,
        reason: cancelReason,
      });
    }
  } catch {
    // non-blocking
  }

  res.json(updated);
});

// Cancellation refund policy
router.post("/:id/cancel", authenticate, async (req: AuthRequest, res: Response) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.id },
    include: { payments: true, vehicle: { select: { title: true } }, agency: { select: { userId: true } } },
  });
  if (!reservation) throw new AppError(404, "Réservation introuvable");
  if (reservation.clientId !== req.user!.id) throw new AppError(403, "Accès refusé");
  if (!["PENDING", "CONFIRMED"].includes(reservation.status)) {
    throw new AppError(400, "Annulation impossible à ce stade");
  }

  const hoursUntilStart = differenceInHours(reservation.startDate, new Date());
  let refundRate = 0;
  if (hoursUntilStart > 48) refundRate = 1;
  else if (hoursUntilStart > 24) refundRate = 0.5;

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: { status: "CANCELLED", cancelReason: req.body.reason },
  });

  // Prévenir le loueur (client est déjà au courant, il vient de cliquer)
  try {
    notifyReservationCancelled(reservation.agency.userId, {
      reservationId: reservation.id,
      vehicleTitle: reservation.vehicle.title,
      reason: req.body.reason,
    });
  } catch {
    // non-blocking
  }

  res.json({
    message: "Réservation annulée",
    refundRate,
    refundAmount: reservation.totalPrice * refundRate,
  });
});

export default router;
