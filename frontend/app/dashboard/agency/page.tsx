"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign, Car, BookOpen, Star, TrendingUp,
  CheckCircle, XCircle, Clock, AlertTriangle,
  ArrowRight, Loader2, Plus,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Reservation } from "@/types";
import { agencyApi, reservationApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface AgencyStats {
  totalRevenue: number;
  recentRevenue: number;
  totalReservations: number;
  activeReservations: number;
  vehicleCount: number;
  rating: number;
  reviewCount: number;
  monthlyData: { month: string; revenue: number; count: number }[];
}

const STATUS_CONFIG = {
  PENDING:   { label: "En attente", classes: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmée",  classes: "bg-blue-100 text-blue-700" },
  ACTIVE:    { label: "En cours",   classes: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Terminée",   classes: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Annulée",    classes: "bg-red-100 text-red-600" },
  DISPUTED:  { label: "Litige",     classes: "bg-orange-100 text-orange-700" },
};

export default function AgencyDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const sessionUser = session?.user as {
    role?: string; name?: string; agencyId?: string; isApproved?: boolean;
  } | undefined;

  const agencyId = sessionUser?.agencyId;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && sessionUser?.role !== "LOUEUR") {
      router.push(sessionUser?.role === "CLIENT" ? "/dashboard/client" : "/dashboard/admin");
    }
  }, [status, sessionUser, router]);

  const loadData = useCallback(async () => {
    if (!agencyId) return;
    try {
      const [statsRes, resRes] = await Promise.all([
        agencyApi.getStats(agencyId),
        reservationApi.list({ status: "PENDING", limit: 20 }),
      ]);
      setStats(statsRes.data);
      setPendingReservations(resRes.data.reservations || []);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  const handleAction = async (id: string, action: "CONFIRMED" | "CANCELLED") => {
    setActionLoading(id);
    try {
      await reservationApi.updateStatus(id, action);
      toast.success(action === "CONFIRMED" ? "Réservation acceptée ✅" : "Réservation refusée");
      setPendingReservations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const chartData = {
    labels: (stats?.monthlyData || []).map((d) => {
      const [y, m] = d.month.split("-");
      return format(new Date(parseInt(y), parseInt(m) - 1, 1), "MMM yy", { locale: fr });
    }),
    datasets: [
      {
        label: "Revenus (MAD)",
        data: (stats?.monthlyData || []).map((d) => d.revenue),
        borderColor: "#f97316",
        backgroundColor: "rgba(249,115,22,0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#f97316",
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
        ticks: { callback: (v: number | string) => `${Number(v).toLocaleString("fr-MA")} MAD` },
      },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord agence
          </h1>
          <p className="text-gray-500 mt-1">Bienvenue, {sessionUser?.name?.split(" ")[0]}</p>
        </div>
        <Link href="/dashboard/agency/vehicles/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Ajouter un véhicule
          </Button>
        </Link>
      </div>

      {/* Approval warning */}
      {sessionUser?.isApproved === false && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Votre agence est en attente de validation</p>
            <p className="text-sm text-amber-700 mt-1">
              Notre équipe vérifie vos documents. Vous recevrez un email dès que votre agence sera approuvée.
            </p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Revenus totaux",
            value: `${(stats?.totalRevenue || 0).toLocaleString("fr-MA")} MAD`,
            sub: `+${(stats?.recentRevenue || 0).toLocaleString("fr-MA")} ce mois`,
            Icon: DollarSign,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "Réservations",
            value: stats?.totalReservations || 0,
            sub: `${stats?.activeReservations || 0} en cours`,
            Icon: BookOpen,
            color: "bg-blue-50 text-blue-600",
          },
          {
            label: "Véhicules",
            value: stats?.vehicleCount || 0,
            sub: "dans votre parc",
            Icon: Car,
            color: "bg-primary-50 text-primary-600",
          },
          {
            label: "Note moyenne",
            value: stats?.rating ? stats.rating.toFixed(1) : "—",
            sub: `${stats?.reviewCount || 0} avis`,
            Icon: Star,
            color: "bg-amber-50 text-amber-600",
          },
        ].map(({ label, value, sub, Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
              Revenus des 6 derniers mois
            </h2>
          </div>
          {stats?.monthlyData && stats.monthlyData.length > 0 ? (
            <Line data={chartData} options={chartOptions as never} height={120} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="xl:col-span-2 space-y-3">
          {[
            { href: "/dashboard/agency/vehicles", Icon: Car, label: "Mon parc", desc: `${stats?.vehicleCount || 0} véhicules`, color: "text-primary-600 bg-primary-50" },
            { href: "/dashboard/agency/reservations", Icon: BookOpen, label: "Réservations", desc: `${stats?.totalReservations || 0} au total`, color: "text-blue-600 bg-blue-50" },
            { href: "/dashboard/agency/stats", Icon: TrendingUp, label: "Statistiques détaillées", desc: "Taux d'occupation, revenus", color: "text-green-600 bg-green-50" },
          ].map(({ href, Icon, label, desc, color }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </div>

      {/* Pending reservations */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            Demandes en attente
            {pendingReservations.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingReservations.length}
              </span>
            )}
          </h2>
          <Link href="/dashboard/agency/reservations" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            Toutes <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingReservations.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucune demande en attente</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingReservations.slice(0, 5).map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {r.vehicle?.title || "Véhicule"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {r.client?.firstName} {r.client?.lastName} ·{" "}
                    {format(new Date(r.startDate), "d MMM", { locale: fr })} →{" "}
                    {format(new Date(r.endDate), "d MMM yyyy", { locale: fr })}
                  </p>
                  <p className="text-sm font-semibold text-primary-600 mt-0.5">
                    {r.totalPrice.toLocaleString("fr-MA")} MAD
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={actionLoading === r.id}
                    onClick={() => handleAction(r.id, "CANCELLED")}
                    className="!py-1.5"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Refuser
                  </Button>
                  <Button
                    size="sm"
                    loading={actionLoading === r.id}
                    onClick={() => handleAction(r.id, "CONFIRMED")}
                    className="!py-1.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Accepter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
