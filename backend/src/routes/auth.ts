import { Router, Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { upload, handleUploadError } from "../middleware/upload.middleware";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { sendWelcomeEmail, sendPasswordResetEmail } from "../services/email.service";
import { AppError } from "../middleware/error.middleware";

const router = Router();

const clientRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

const agencyRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  agencyName: z.string().min(2),
  registreCommerce: z.string().min(5),
  address: z.string().min(5),
  city: z.string().min(2),
  description: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(id: string, email: string, role: string) {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
}

// POST /api/auth/register/client
router.post("/register/client", async (req: Request, res: Response) => {
  try {
    const data = clientRegisterSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, "Email déjà utilisé");

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: "CLIENT",
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
    });

    await sendWelcomeEmail(user.email, user.firstName);

    const token = signToken(user.id, user.email, user.role);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Données invalides", details: err.errors });
      return;
    }
    throw err;
  }
});

// POST /api/auth/register/agency
router.post(
  "/register/agency",
  upload.fields([
    { name: "assurance", maxCount: 1 },
    { name: "cin", maxCount: 1 },
  ]),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const data = agencyRegisterSchema.parse(req.body);
      const files = req.files as Record<string, Express.Multer.File[]>;

      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new AppError(409, "Email déjà utilisé");

      let assurancePath: string | undefined;
      let cinPath: string | undefined;

      if (files?.assurance?.[0]) {
        assurancePath = await uploadToCloudinary(files.assurance[0].buffer, "documents");
      }
      if (files?.cin?.[0]) {
        cinPath = await uploadToCloudinary(files.cin[0].buffer, "documents");
      }

      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "LOUEUR",
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          cinPath,
          agency: {
            create: {
              name: data.agencyName,
              registreCommerce: data.registreCommerce,
              assurancePath,
              address: data.address,
              city: data.city,
              description: data.description,
            },
          },
        },
      });

      const token = signToken(user.id, user.email, user.role);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          isVerified: user.isVerified,
        },
        message: "Inscription en attente de validation par l'administrateur",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: "Données invalides", details: err.errors });
        return;
      }
      throw err;
    }
  }
);

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) throw new AppError(401, "Email ou mot de passe incorrect");
    if (user.isBlacklisted) throw new AppError(403, "Compte suspendu");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError(401, "Email ou mot de passe incorrect");

    const token = signToken(user.id, user.email, user.role);

    let agencyId: string | undefined;
    if (user.role === "LOUEUR") {
      const agency = await prisma.agency.findUnique({ where: { userId: user.id } });
      agencyId = agency?.id;
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isVerified: user.isVerified,
        agencyId,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Données invalides" });
      return;
    }
    throw err;
  }
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, role: true, firstName: true, lastName: true,
      phone: true, avatar: true, isVerified: true, createdAt: true,
      agency: {
        select: { id: true, name: true, isApproved: true, rating: true, city: true },
      },
    },
  });
  res.json(user);
});

// POST /api/auth/upload-documents
router.post(
  "/upload-documents",
  authenticate,
  upload.fields([
    { name: "cin", maxCount: 1 },
    { name: "permis", maxCount: 1 },
  ]),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    const files = req.files as Record<string, Express.Multer.File[]>;
    const updates: Record<string, string> = {};

    if (files?.cin?.[0]) {
      updates.cinPath = await uploadToCloudinary(files.cin[0].buffer, "documents");
    }
    if (files?.permis?.[0]) {
      updates.permisPath = await uploadToCloudinary(files.permis[0].buffer, "documents");
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updates,
      select: { id: true, cinPath: true, permisPath: true },
    });

    res.json(user);
  }
);

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  const schema = z.object({ email: z.string().email() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    // Réponse uniforme pour ne rien révéler
    return res.json({ success: true });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const url = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail(user.email, user.firstName, url);
    } catch (e) {
      console.error("[forgot-password] email send failed", e);
    }
  }

  // Toujours 200 — ne pas révéler si l'email existe
  res.json({ success: true });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string().min(10),
    newPassword: z.string().min(8),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Données invalides" });
  }

  const { token, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return res.status(400).json({ error: "Lien expiré ou invalide" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  res.json({ success: true });
});

export default router;
