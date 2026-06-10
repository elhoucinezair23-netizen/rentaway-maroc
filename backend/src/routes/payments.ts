import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const COMMISSION_RATE = parseFloat(process.env.PLATFORM_COMMISSION_RATE || "0.15");

// POST /api/payments/create-intent — create payment intent for main + caution
router.post("/create-intent", authenticate, requireRole("CLIENT"), async (req: AuthRequest, res: Response) => {
  const { reservationId } = req.body;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { vehicle: true },
  });

  if (!reservation) throw new AppError(404, "Réservation introuvable");
  if (reservation.clientId !== req.user!.id) throw new AppError(403, "Accès refusé");
  if (reservation.status !== "PENDING") throw new AppError(400, "Réservation déjà traitée");

  // Create payment intent for main amount
  const mainIntent = await stripe.paymentIntents.create({
    amount: Math.round(reservation.totalPrice * 100), // centimes
    currency: "mad",
    capture_method: "manual", // pre-authorize
    metadata: {
      reservationId,
      type: "MAIN",
      clientId: req.user!.id,
    },
  });

  // Create payment intent for caution (pre-authorization)
  const cautionIntent = await stripe.paymentIntents.create({
    amount: Math.round(reservation.cautionAmount * 100),
    currency: "mad",
    capture_method: "manual",
    metadata: {
      reservationId,
      type: "CAUTION",
      clientId: req.user!.id,
    },
  });

  // Save payment records
  await Promise.all([
    prisma.payment.create({
      data: {
        reservationId,
        amount: reservation.totalPrice,
        type: "MAIN",
        status: "PENDING",
        stripeIntentId: mainIntent.id,
      },
    }),
    prisma.payment.create({
      data: {
        reservationId,
        amount: reservation.cautionAmount,
        type: "CAUTION",
        status: "PENDING",
        stripeIntentId: cautionIntent.id,
      },
    }),
  ]);

  res.json({
    mainClientSecret: mainIntent.client_secret,
    cautionClientSecret: cautionIntent.client_secret,
    mainAmount: reservation.totalPrice,
    cautionAmount: reservation.cautionAmount,
  });
});

// POST /api/payments/capture/:reservationId — capture main payment on vehicle handover
router.post("/capture/:reservationId", authenticate, requireRole("LOUEUR", "ADMIN"), async (req: AuthRequest, res: Response) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.reservationId },
    include: { payments: true, agency: true },
  });

  if (!reservation) throw new AppError(404, "Réservation introuvable");

  if (req.user!.role === "LOUEUR" && reservation.agency.userId !== req.user!.id) {
    throw new AppError(403, "Accès refusé");
  }

  const mainPayment = reservation.payments.find((p) => p.type === "MAIN" && p.status === "PENDING");
  if (!mainPayment?.stripeIntentId) throw new AppError(400, "Paiement principal introuvable");

  await stripe.paymentIntents.capture(mainPayment.stripeIntentId);

  await prisma.payment.update({
    where: { id: mainPayment.id },
    data: { status: "CAPTURED" },
  });

  await prisma.reservation.update({
    where: { id: req.params.reservationId },
    data: { status: "ACTIVE" },
  });

  res.json({ message: "Paiement capturé, location démarrée" });
});

// POST /api/payments/release-caution/:reservationId
router.post("/release-caution/:reservationId", authenticate, requireRole("LOUEUR", "ADMIN"), async (req: AuthRequest, res: Response) => {
  const reservation = await prisma.reservation.findUnique({
    where: { id: req.params.reservationId },
    include: { payments: true, agency: true },
  });

  if (!reservation) throw new AppError(404, "Réservation introuvable");

  if (req.user!.role === "LOUEUR" && reservation.agency.userId !== req.user!.id) {
    throw new AppError(403, "Accès refusé");
  }

  const cautionPayment = reservation.payments.find((p) => p.type === "CAUTION" && p.status === "PENDING");
  if (!cautionPayment?.stripeIntentId) throw new AppError(400, "Dépôt de garantie introuvable");

  await stripe.paymentIntents.cancel(cautionPayment.stripeIntentId);

  await prisma.payment.update({
    where: { id: cautionPayment.id },
    data: { status: "RELEASED" },
  });

  res.json({ message: "Caution libérée" });
});

// Stripe webhook
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    res.status(400).json({ error: "Webhook signature invalid" });
    return;
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { reservationId } = intent.metadata;

    if (reservationId) {
      await prisma.reservation.update({
        where: { id: reservationId },
        data: { status: "CONFIRMED" },
      });
    }
  }

  res.json({ received: true });
});

export default router;
