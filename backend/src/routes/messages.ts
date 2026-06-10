import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { upload, handleUploadError } from "../middleware/upload.middleware";
import { uploadToCloudinary } from "../services/cloudinary.service";
import { AppError } from "../middleware/error.middleware";
import { io } from "../index";
import { notifyNewMessage } from "../services/notification.service";

const router = Router();

// GET /api/messages/conversations
router.get("/conversations", authenticate, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const conversations = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    distinct: ["senderId", "receiverId"],
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      receiver: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  // Group by conversation partner
  const seen = new Set<string>();
  const grouped = conversations.filter((m) => {
    const partnerId = m.senderId === userId ? m.receiverId : m.senderId;
    if (seen.has(partnerId)) return false;
    seen.add(partnerId);
    return true;
  });

  res.json(grouped);
});

// GET /api/messages/:userId — conversation with a specific user
router.get("/:userId", authenticate, async (req: AuthRequest, res: Response) => {
  const { page = "1", limit = "50" } = req.query as Record<string, string>;
  const me = req.user!.id;
  const them = req.params.userId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: me, receiverId: them },
        { senderId: them, receiverId: me },
      ],
    },
    orderBy: { createdAt: "asc" },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
    },
  });

  // Mark as read
  await prisma.message.updateMany({
    where: { senderId: them, receiverId: me, isRead: false },
    data: { isRead: true },
  });

  res.json(messages);
});

// POST /api/messages — send message
router.post(
  "/",
  authenticate,
  upload.single("attachment"),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    const { receiverId, content, reservationId } = req.body;
    if (!receiverId) throw new AppError(400, "Destinataire requis");
    if (!content?.trim() && !req.file) throw new AppError(400, "Message vide");

    let attachmentUrl: string | undefined;
    if (req.file) {
      attachmentUrl = await uploadToCloudinary(req.file.buffer, "messages");
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        receiverId,
        content: content || "",
        attachmentUrl,
        reservationId: reservationId || null,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    // Emit via WebSocket (notification + payload temps réel)
    io.to(`user:${receiverId}`).emit("message:new", message);
    notifyNewMessage(receiverId, {
      senderName: `${message.sender.firstName} ${message.sender.lastName || ""}`.trim(),
      preview: message.content || "📎 Pièce jointe",
      conversationHref: req.user!.role === "LOUEUR"
        ? `/dashboard/agency/messages?user=${req.user!.id}`
        : `/dashboard/client/messages?user=${req.user!.id}`,
    });

    res.status(201).json(message);
  }
);

export default router;
