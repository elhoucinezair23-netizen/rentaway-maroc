import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import { sendProspectInvitation } from "../services/email.service";

const router = Router();

router.use(authenticate, requireRole("ADMIN"));

// GET /api/admin/prospects?city=&category=&status=
router.get("/", async (req: AuthRequest, res: Response) => {
  const { city, category, status, q } = req.query as Record<string, string | undefined>;

  const where: any = {};
  if (city) where.city = city;
  if (status) where.status = status;
  if (category) where.categories = { has: category };
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
    { phone: { contains: q } },
  ];

  const [items, total, notContacted, emailSent, formSubmitted, registered] = await Promise.all([
    prisma.prospect.findMany({ where, orderBy: { scrapedAt: "desc" }, take: 500 }),
    prisma.prospect.count(),
    prisma.prospect.count({ where: { status: "NOT_CONTACTED" } }),
    prisma.prospect.count({ where: { status: "EMAIL_SENT" } }),
    prisma.prospect.count({ where: { status: "FORM_SUBMITTED" } }),
    prisma.prospect.count({ where: { status: "REGISTERED" } }),
  ]);

  res.json({
    items,
    counters: { total, notContacted, emailSent, formSubmitted, registered, invited: emailSent + formSubmitted + registered },
  });
});

// POST /api/admin/prospects/:id/invite
router.post("/:id/invite", async (req: AuthRequest, res: Response) => {
  const prospect = await prisma.prospect.findUnique({ where: { id: req.params.id } });
  if (!prospect) throw new AppError(404, "Prospect introuvable");
  if (!prospect.email) throw new AppError(400, "Pas d'email pour ce prospect");

  await sendProspectInvitation({
    email: prospect.email,
    name: prospect.name,
    city: prospect.city,
  });

  const updated = await prisma.prospect.update({
    where: { id: prospect.id },
    data: { status: "EMAIL_SENT", contactedAt: new Date() },
  });

  res.json({ message: "Email d'invitation envoyé", prospect: updated });
});

// PATCH /api/admin/prospects/:id/status
const statusSchema = z.object({
  status: z.enum(["NOT_CONTACTED", "EMAIL_SENT", "FORM_SUBMITTED", "REGISTERED"]),
  notes: z.string().optional(),
});

router.patch("/:id/status", async (req: AuthRequest, res: Response) => {
  const data = statusSchema.parse(req.body);
  const prospect = await prisma.prospect.update({
    where: { id: req.params.id },
    data: {
      status: data.status,
      notes: data.notes,
      contactedAt: data.status !== "NOT_CONTACTED" ? new Date() : undefined,
    },
  });
  res.json(prospect);
});

// DELETE /api/admin/prospects/:id
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  await prisma.prospect.delete({ where: { id: req.params.id } });
  res.json({ message: "Prospect supprimé" });
});

export default router;
