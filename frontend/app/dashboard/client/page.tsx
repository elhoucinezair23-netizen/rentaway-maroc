"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Loader2,
  CalendarDays,
  FileText,
  MessageSquare,
  UserCircle,
  Download,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { reservationApi } from "@/lib/api";
import type { Reservation, ReservationStatus } from "@/types/index";

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; classes: string }
> = {
  PENDING:   { label: "En attente",  classes: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmée",   classes: "bg-blue-100 text-blue-800"   },
  ACTIVE:    { label: "En cours",    classes: "bg-green-100 text-green-800"  },
  COMPLETED: { label: "Terminée",    classes: "bg-gray-100 text-gray-700"   },
  CANCELLED: { label: "Annulée",     classes: "bg-red-100 text-red-800"     },
  DISPUTED:  { label: "Litige",      classes: "bg-orange-100 text-orange-800" },
};

function StatusBadge({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Quick link card ───────────────────────────────────────────────────────────
function QuickLink({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
          {label}
        </p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClientDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated") {
      const role = (session?.user as { role?: string })?.role;
      if (role === "LOUEUR") { router.replace("/dashboard/agency"); return; }
      if (role === "ADMIN")  { router.replace("/dashboard/admin");  return; }
    }
  }, [status, session, router]);

  // Fetch reservations
  useEffect(() => {
    if (status !== "authenticated") return;
    const role = (session?.user as { role?: string })?.role;
    if (role !== "CLIENT") return;

    reservationApi
      .list()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setReservations(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("Impossible de charger vos réservations"))
      .finally(() => setLoading(false));
  }, [status, session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const user = session?.user as {
    name?: string | null;
    firstName?: string;
    lastName?: string;
    role?: string;
  };

  const displayName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
      : user?.name ?? "Client";

  // Stats
  const total     = reservations.length;
  const active    = reservations.filter((r) => r.status === "ACTIVE" || r.status === "CONFIRMED").length;
  const completed = reservations.filter((r) => r.status === "COMPLETED").length;
  const cancelled = reservations.filter((r) => r.status === "CANCELLED").length;

  // Recent 5
  const recent = [...reservations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {displayName} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Voici un aperçu de vos activités sur RentaWay Maroc.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total réservations"
          value={total}
          icon={<BookOpen className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Actives / Confirmées"
          value={active}
          icon={<TrendingUp className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Terminées"
          value={completed}
          icon={<CalendarDays className="w-6 h-6 text-gray-500" />}
          color="bg-gray-50"
        />
        <StatCard
          label="Annulées"
          value={cancelled}
          icon={<FileText className="w-6 h-6 text-red-500" />}
          color="bg-red-50"
        />
      </div>

      {/* Recent reservations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Réservations récentes</h2>
          <Link
            href="/dashboard/client/reservations"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir tout
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Aucune réservation pour le moment.</p>
            <Link
              href="/vehicles"
              className="mt-4 inline-block text-blue-600 hover:underline text-sm font-medium"
            >
              Parcourir les véhicules
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Ref.</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Véhicule</th>
                  <th className="px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Dates</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Statut</th>
                  <th className="px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Prix total</th>
                  <th className="px-6 py-3 font-medium text-gray-500">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                      #{r.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {r.vehicle?.title ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden md:table-cell">
                      {format(new Date(r.startDate), "dd MMM yyyy", { locale: fr })}
                      {" → "}
                      {format(new Date(r.endDate), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium hidden sm:table-cell">
                      {r.totalPrice.toLocaleString("fr-MA")} MAD
                    </td>
                    <td className="px-6 py-4">
                      {r.pdfPath ? (
                        <a
                          href={r.pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          title="Télécharger le contrat PDF"
                        >
                          <Download size={16} />
                          <span className="hidden sm:inline text-xs">PDF</span>
                        </a>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Accès rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink
            href="/dashboard/client/reservations"
            icon={<CalendarDays size={20} />}
            label="Mes réservations"
            description="Voir et gérer vos locations"
          />
          <QuickLink
            href="/dashboard/client/messages"
            icon={<MessageSquare size={20} />}
            label="Messages"
            description="Discuter avec les agences"
          />
          <QuickLink
            href="/dashboard/client/profile"
            icon={<UserCircle size={20} />}
            label="Mon profil"
            description="Mettre à jour vos informations"
          />
        </div>
      </div>
    </div>
  );
}
