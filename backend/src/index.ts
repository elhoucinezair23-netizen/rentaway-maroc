import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import vehicleRoutes from "./routes/vehicles";
import reservationRoutes from "./routes/reservations";
import paymentRoutes from "./routes/payments";
import reviewRoutes from "./routes/reviews";
import messageRoutes from "./routes/messages";
import agencyRoutes from "./routes/agencies";
import adminRoutes from "./routes/admin";
import uploadRoutes from "./routes/upload";
import prospectRoutes from "./routes/prospects";
import publicRoutes from "./routes/public";
import scrapedVehiclesRoutes from "./routes/scraped-vehicles";
import adminEmailsRoutes from "./routes/admin-emails";

import { errorHandler } from "./middleware/error.middleware";
import { initSocket } from "./services/socket.service";

dotenv.config();

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason instanceof Error ? reason.message : reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err.message);
});

const app = express();
const httpServer = createServer(app);

const socketOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",").map((s) => s.trim()).filter(Boolean);

export const io = new SocketServer(httpServer, {
  cors: {
    origin: socketOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

initSocket(io);

// Security — HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS — accepte plusieurs origines (frontend + dashboard + dev)
// Mettre ALLOWED_ORIGINS="*" pour tout accepter (utile en démo/staging).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowAll = allowedOrigins.includes("*");

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser requêtes server-to-server (Stripe webhooks, curl…) — pas d'origin
      if (!origin) return callback(null, true);
      if (allowAll) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`[CORS] blocked origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Rate limiting — global API (100 req/min/IP)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de requêtes, réessayez dans une minute." },
});
app.use("/api", apiLimiter);

// Rate limiting — anti brute-force sur les routes d'authentification (5 essais/min/IP)
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Trop de tentatives, réessayez dans une minute." },
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("combined"));
}

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/agencies", agencyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/prospects", prospectRoutes);
app.use("/api/admin/scraped-vehicles", scrapedVehiclesRoutes);
app.use("/api/admin/emails", adminEmailsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/public", publicRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

export default app;
