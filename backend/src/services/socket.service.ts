import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export function initSocket(io: Server): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error("Authentication required"));
      return;
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
      socket.data.userId = payload.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("message:send", async (data: { receiverId: string; content: string }) => {
      io.to(`user:${data.receiverId}`).emit("message:new", {
        senderId: userId,
        content: data.content,
        createdAt: new Date().toISOString(),
      });
    });

    socket.on("disconnect", () => {
      socket.leave(`user:${userId}`);
    });
  });
}
