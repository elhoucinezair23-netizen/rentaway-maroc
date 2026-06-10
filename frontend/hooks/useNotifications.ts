"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import { Bell, Calendar, MessageSquare, XCircle, CheckCircle2 } from "lucide-react";
import { createElement } from "react";

type NotificationType =
  | "reservation_new"
  | "reservation_confirmed"
  | "reservation_cancelled"
  | "message_new"
  | "review_new";

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

const ICONS: Record<NotificationType, { Icon: React.ElementType; color: string }> = {
  reservation_new:       { Icon: Calendar,    color: "text-primary-600" },
  reservation_confirmed: { Icon: CheckCircle2, color: "text-green-600" },
  reservation_cancelled: { Icon: XCircle,     color: "text-primary-600" },
  message_new:           { Icon: MessageSquare, color: "text-secondary-600" },
  review_new:            { Icon: Bell,        color: "text-amber-500" },
};

let socket: Socket | null = null;

/**
 * Connecte au WebSocket dès qu'on est authentifié, écoute "notification"
 * et affiche un toast en haut à droite.
 */
export function useNotifications() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;

  useEffect(() => {
    if (!token) return;

    const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");

    socket = io(base, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });

    socket.on("notification", (n: NotificationPayload) => {
      const cfg = ICONS[n.type] || ICONS.reservation_new;
      toast.custom((t) => {
        const onClick = () => {
          toast.dismiss(t.id);
          if (n.href) window.location.href = n.href;
        };
        return createElement(
          "div",
          {
            onClick,
            className: `${t.visible ? "animate-slide-up" : "opacity-0"} cursor-pointer bg-white rounded-xl shadow-lift border-l-4 border-primary-600 p-4 max-w-sm flex items-start gap-3 hover:shadow-xl transition-shadow`,
          },
          createElement(
            "div",
            { className: `h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 ${cfg.color}` },
            createElement(cfg.Icon, { className: "h-5 w-5" })
          ),
          createElement(
            "div",
            { className: "flex-1 min-w-0" },
            createElement("p", { className: "font-semibold text-sm text-gray-900" }, n.title),
            createElement("p", { className: "text-xs text-gray-500 mt-0.5 line-clamp-2" }, n.message)
          )
        );
      }, { duration: 5000, position: "top-right" });
    });

    socket.on("connect_error", (err) => {
      console.warn("[socket] connect_error:", err.message);
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [token]);
}
