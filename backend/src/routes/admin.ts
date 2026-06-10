import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole("ADMIN"));

// GET /api/admin/dashboard — KPIs
router.get("/dashboard", async (_req, res: Response) => {
  const [
    totalUsers, totalAgencies, pendingAgencies,
    totalVehicles, totalReservations, activeReservations,
    completedReservations, revenueStats, disputedReservations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agency.count(),
    prisma.agency.count({ where: { isApproved: false } }),
    prisma.vehicle.count(),
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: "ACTIVE" } }),
    prisma.reservation.count({ where: { status: "COMPLETED" } }),
    prisma.reservation.aggregate({
      where: { status: { in: ["COMPLETED", "ACTIVE"] } },
      _sum: { totalPrice: true, commission: true },
    }),
    prisma.reservation.count({ where: { status: "DISPUTED" } }),
  ]);

  const monthlyRevenue = await prisma.$queryRaw<Array<{ month: string; gmv: number; commission: number }>>`
    SELECT
      TO_CHAR("createdAt", 'YYYY-MM') as month,
      SUM("totalPrice")::float as gmv,
      SUM("commission")::float as commission
    FROM "reservations"
    WHERE "status"::text IN ('COMPLETED', 'ACTIVE')
      AND "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY month
    ORDER BY month
  `;

  res.json({
    totalUsers,
    totalAgencies,
    pendingAgencies,
    totalVehicles,
    totalReservations,
    activeReservations,
    completedReservations,
    disputedReservations,
    totalGMV: revenueStats._sum.totalPrice ?? 0,
    totalCommission: revenueStats._sum.commission ?? 0,
    monthlyRevenue,
  });
});

// GET /api/admin/agencies/pending
router.get("/agencies/pending", async (_req, res: Response) => {
  const agencies = await prisma.agency.findMany({
    where: { isApproved: false },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(agencies);
});

// POST /api/admin/agencies/:id/approve
router.post("/agencies/:id/approve", async (_req, res: Response) => {
  const agency = await prisma.agency.update({
    where: { id: _req.params.id },
    data: { isApproved: true },
    include: { user: { select: { email: true, firstName: true } } },
  });
  res.json({ message: "Agence approuvée", agency });
});

// POST /api/admin/agencies/:id/reject
router.post("/agencies/:id/reject", async (req, res: Response) => {
  const { reason } = req.body;
  const agency = await prisma.agency.findUnique({ where: { id: req.params.id } });
  if (!agency) throw new AppError(404, "Agence introuvable");

  await prisma.user.update({
    where: { id: agency.userId },
    data: { isBlacklisted: false },
  });
  res.json({ message: "Agence rejetée", reason });
});

// POST /api/admin/users/:id/blacklist
router.post("/users/:id/blacklist", async (req, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBlacklisted: true },
  });
  res.json({ message: `Utilisateur ${user.email} suspendu` });
});

// DELETE /api/admin/users/:id/blacklist
router.delete("/users/:id/blacklist", async (req, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isBlacklisted: false },
  });
  res.json({ message: `Utilisateur ${user.email} réactivé` });
});

// GET /api/admin/reservations/disputed
router.get("/reservations/disputed", async (_req, res: Response) => {
  const reservations = await prisma.reservation.findMany({
    where: { status: "DISPUTED" },
    include: {
      client: { select: { id: true, firstName: true, lastName: true, email: true } },
      agency: { select: { id: true, name: true } },
      vehicle: { select: { id: true, title: true, category: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(reservations);
});

// POST /api/admin/reservations/:id/resolve
router.post("/reservations/:id/resolve", async (req, res: Response) => {
  const { resolution } = req.body;
  const reservation = await prisma.reservation.update({
    where: { id: req.params.id },
    data: { status: resolution === "completed" ? "COMPLETED" : "CANCELLED" },
  });
  res.json(reservation);
});

// GET /api/admin/users
router.get("/users", async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true, email: true, role: true, firstName: true, lastName: true,
      phone: true, isVerified: true, isBlacklisted: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ users });
});

// GET /api/admin/export/csv
router.get("/export/csv", async (_req, res: Response) => {
  const reservations = await prisma.reservation.findMany({
    where: { status: { in: ["COMPLETED", "ACTIVE"] } },
    include: {
      client: { select: { firstName: true, lastName: true, email: true } },
      agency: { select: { name: true } },
      vehicle: { select: { title: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const csv = [
    "ID,Client,Email,Agence,Véhicule,Catégorie,Début,Fin,Montant,Commission,Statut",
    ...reservations.map((r) =>
      [
        r.id,
        `${r.client.firstName} ${r.client.lastName}`,
        r.client.email,
        r.agency.name,
        r.vehicle.title,
        r.vehicle.category,
        r.startDate.toISOString().split("T")[0],
        r.endDate.toISOString().split("T")[0],
        r.totalPrice,
        r.commission,
        r.status,
      ].join(",")
    ),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=reservations.csv");
  res.send(csv);
});

// CSV helpers ────────────────────────────────────────────────
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n;]/.test(s) ? `"${s}"` : s;
}
function toCsv(headers: string[], rows: unknown[][]): string {
  return [
    headers.join(","),
    ...rows.map((r) => r.map(csvCell).join(",")),
  ].join("\n");
}
function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send("﻿" + csv); // BOM pour Excel
}

// GET /api/admin/export/users
router.get("/export/users", async (_req, res: Response) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  const csv = toCsv(
    ["ID", "Email", "Prénom", "Nom", "Rôle", "Téléphone", "Vérifié", "Suspendu", "Créé le"],
    users.map((u) => [u.id, u.email, u.firstName, u.lastName, u.role, u.phone || "", u.isVerified, u.isBlacklisted, u.createdAt.toISOString()])
  );
  sendCsv(res, "users.csv", csv);
});

// GET /api/admin/export/reservations
router.get("/export/reservations", async (_req, res: Response) => {
  const reservations = await prisma.reservation.findMany({
    include: {
      client: { select: { firstName: true, lastName: true, email: true } },
      agency: { select: { name: true, city: true } },
      vehicle: { select: { title: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const csv = toCsv(
    ["ID", "Client", "Email", "Agence", "Ville", "Véhicule", "Catégorie", "Début", "Fin", "Montant MAD", "Commission MAD", "Caution MAD", "Statut", "Créé le"],
    reservations.map((r) => [
      r.id,
      `${r.client.firstName} ${r.client.lastName}`,
      r.client.email,
      r.agency.name,
      r.agency.city,
      r.vehicle.title,
      r.vehicle.category,
      r.startDate.toISOString().split("T")[0],
      r.endDate.toISOString().split("T")[0],
      r.totalPrice,
      r.commission,
      r.cautionAmount,
      r.status,
      r.createdAt.toISOString(),
    ])
  );
  sendCsv(res, "reservations.csv", csv);
});

// GET /api/admin/export/agencies
router.get("/export/agencies", async (_req, res: Response) => {
  const agencies = await prisma.agency.findMany({
    include: { user: { select: { email: true, phone: true } }, _count: { select: { vehicles: true, reservations: true } } },
    orderBy: { createdAt: "desc" },
  });
  const csv = toCsv(
    ["ID", "Nom", "Ville", "Adresse", "Email", "Téléphone", "RC", "Approuvée", "Démo", "Note", "Avis", "Véhicules", "Réservations", "Créée le"],
    agencies.map((a) => [
      a.id, a.name, a.city, a.address, a.user.email, a.user.phone || "",
      a.registreCommerce, a.isApproved, a.isDemo, a.rating, a.reviewCount,
      a._count.vehicles, a._count.reservations, a.createdAt.toISOString(),
    ])
  );
  sendCsv(res, "agencies.csv", csv);
});

// GET /api/admin/export/prospects
router.get("/export/prospects", async (_req, res: Response) => {
  const prospects = await prisma.prospect.findMany({ orderBy: { scrapedAt: "desc" } });
  const csv = toCsv(
    ["ID", "Nom agence", "Ville", "Adresse", "Téléphone", "Email", "Site web", "Catégories", "Source", "Statut", "Scrapé le", "Contacté le"],
    prospects.map((p) => [
      p.id, p.name, p.city, p.address || "", p.phone || "", p.email || "",
      p.website || "", p.categories.join(";"), p.sourceUrl, p.status,
      p.scrapedAt.toISOString(),
      p.contactedAt ? p.contactedAt.toISOString() : "",
    ])
  );
  sendCsv(res, "prospects.csv", csv);
});

export default router;
