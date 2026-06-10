/**
 * Notifications temps réel via Socket.IO.
 * Chaque utilisateur connecté écoute la room `user:<id>`.
 */
import { io } from "../index";

export type NotificationType =
  | "reservation_new"
  | "reservation_confirmed"
  | "reservation_cancelled"
  | "message_new"
  | "review_new";

export interface Notification {
  type: NotificationType;
  title: string;
  message: string;
  /** URL de redirection au clic (ex. /dashboard/client/reservations/xxx) */
  href?: string;
  /** Données additionnelles (ID, etc.) */
  data?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Envoie une notification à un utilisateur spécifique.
 * Silencieux si le user n'est pas connecté (Socket.IO no-op).
 */
export function notifyUser(userId: string, n: Omit<Notification, "createdAt">): void {
  const payload: Notification = { ...n, createdAt: new Date().toISOString() };
  io.to(`user:${userId}`).emit("notification", payload);
}

/** Notifications fréquemment réutilisées */

export function notifyReservationNew(loueurUserId: string, data: {
  reservationId: string;
  vehicleTitle: string;
  clientName: string;
}): void {
  notifyUser(loueurUserId, {
    type: "reservation_new",
    title: "Nouvelle réservation",
    message: `${data.clientName} a réservé ${data.vehicleTitle}`,
    href: `/dashboard/agency/reservations/${data.reservationId}`,
    data: { reservationId: data.reservationId },
  });
}

export function notifyReservationConfirmed(clientUserId: string, data: {
  reservationId: string;
  vehicleTitle: string;
}): void {
  notifyUser(clientUserId, {
    type: "reservation_confirmed",
    title: "Réservation confirmée",
    message: `Votre location de ${data.vehicleTitle} est confirmée`,
    href: `/dashboard/client/reservations/${data.reservationId}`,
    data: { reservationId: data.reservationId },
  });
}

export function notifyReservationCancelled(userId: string, data: {
  reservationId: string;
  vehicleTitle: string;
  reason?: string;
}): void {
  notifyUser(userId, {
    type: "reservation_cancelled",
    title: "Réservation annulée",
    message: `La location de ${data.vehicleTitle} a été annulée${data.reason ? ` — ${data.reason}` : ""}`,
    href: `/dashboard/client/reservations/${data.reservationId}`,
    data: { reservationId: data.reservationId },
  });
}

export function notifyNewMessage(receiverId: string, data: {
  senderName: string;
  preview: string;
  conversationHref: string;
}): void {
  notifyUser(receiverId, {
    type: "message_new",
    title: `Message de ${data.senderName}`,
    message: data.preview.slice(0, 120),
    href: data.conversationHref,
  });
}
