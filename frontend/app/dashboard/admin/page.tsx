"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, Shield, Car, BookOpen, DollarSign, AlertTriangle,
  TrendingUp, CheckCircle, XCircle, Loader2, Download, ArrowRight,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DashboardData {
  totalUsers: number;
  totalAgencies: number;
  pendingAgencies: number;
  totalVehicles: number;
  totalReservations: number;
  activeReservations: number;
  completedReservations: number;
  disputedReservations: number;
  totalGMV: number;
  totalCommission: number;
  monthlyRevenue: { month: string; gmv: number; commission: number }[];
}

interface PendingAgency {
  id: string;
  name: string;
  city: string;
  registreCommerce: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; phone?: string };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [pendingAgencies, setPendingAgencies] = useState<PendingAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [csvLoading, setCsvLoading] = useState(false);

  const sessionUser = session?.user as { role?: string } | undefined;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated" && sessionUser?.role !== "ADMIN") {
      router.push("/dashboard/client");
    }
  }, [status, sessionUser, router]);

  const loadData = useCallback(async () => {
    try {
      const [dashRes, agenciesRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getPendingAgencies(),
      ]);
      setData(dashRes.data);
      setPendingAgencies(agenciesRes.data);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.approveAgency(id);
      toast.success("Agence approuvée ✅");
      setPendingAgencies((prev) => prev.filter((a) => a.id !== id));
      setData((prev) => prev ? { ...prev, pendingAgencies: prev.pendingAgencies - 1 } : prev);
    } catch {
      toast.error("Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Motif du refus (optionnel) :");
    setActionLoading(id);
    try {
      await adminApi.rejectAgency(id, reason || "");
      toast.success("Agence rejetée");
      setPendingAgencies((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error("Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = async () => {
    setCsvLoading(true);
    try {
      const res = await adminApi.exportCSV();
      const url = URL.createObjectURL(new Blob([res.data as BlobPart], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `reservations-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé");
    } catch {
      toast.error("Erreur d'export");
    } finally {
      setCsvLoading(false);
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
    labels: (data?.monthlyRevenue || []).map((d) => {
      const [y, m] = d.month.split("-");
      return format(new Date(parseInt(y), parseInt(m) - 1, 1), "MMM yy", { locale: fr });
    }),
    datasets: [
      {
        label: "GMV (MAD)",
        data: (data?.monthlyRevenue || []).map((d) => d.gmv),
        backgroundColor: "rgba(249,115,22,0.7)",
        borderRadius: 6,
      },
      {
        label: "Commission (MAD)",
        data: (data?.monthlyRevenue || []).map((d) => d.commission),
        backgroundColor: "rgba(59,130,246,0.7)",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f3f4f6" },
      },
      x: { grid: { display: false } },
    },
  };

  const kpis = [
    { label: "Utilisateurs", value: data?.totalUsers || 0, Icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Agences approuvées", value: (data?.totalAgencies || 0) - (data?.pendingAgencies || 0), Icon: Shield, color: "bg-green-50 text-green-600" },
    { label: "En attente validation", value: data?.pendingAgencies || 0, Icon: Shield, color: "bg-yellow-50 text-yellow-600", alert: (data?.pendingAgencies || 0) > 0 },
    { label: "Véhicules", value: data?.totalVehicles || 0, Icon: Car, color: "bg-primary-50 text-primary-600" },
    { label: "Réservations", value: data?.totalReservations || 0, Icon: BookOpen, color: "bg-purple-50 text-purple-600" },
    { label: "Litiges ouverts", value: data?.disputedReservations || 0, Icon: AlertTriangle, color: "bg-red-50 text-red-600", alert: (data?.disputedReservations || 0) > 0 },
    { label: "GMV total", value: `${(data?.totalGMV || 0).toLocaleString("fr-MA")} MAD`, Icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Commission totale", value: `${(data?.totalCommission || 0).toLocaleString("fr-MA")} MAD`, Icon: TrendingUp, color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-500 mt-1">Tableau de bord global RentaWay Maroc</p>
        </div>
        <Button onClick={handleExportCSV} loading={csvLoading} variant="secondary" size="sm">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, Icon, color, alert }) => (
          <div
            key={label}
            className={`bg-white rounded-2xl border p-5 ${alert ? "border-amber-200" : "border-gray-100"}`}
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            {alert && (
              <p className="text-xs text-amber-600 font-medium mt-1">⚠ Action requise</p>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary-600" />
          GMV & Commission sur 12 mois
        </h2>
        {data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
          <Bar data={chartData} options={chartOptions} height={80} />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            Aucune donnée disponible
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending agencies */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-yellow-500" />
              Agences à valider
              {pendingAgencies.length > 0 && (
                <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingAgencies.length}
                </span>
              )}
            </h2>
            <Link href="/dashboard/admin/agencies" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Toutes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pendingAgencies.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune agence en attente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingAgencies.slice(0, 5).map((agency) => (
                <div key={agency.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{agency.name}</p>
                      <p className="text-xs text-gray-500">
                        {agency.city} · RC : {agency.registreCommerce}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {agency.user.firstName} {agency.user.lastName} — {agency.user.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Soumis le {format(new Date(agency.createdAt), "d MMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        loading={actionLoading === agency.id}
                        onClick={() => handleApprove(agency.id)}
                        className="!py-1 !px-3 text-xs"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actionLoading === agency.id}
                        onClick={() => handleReject(agency.id)}
                        className="!py-1 !px-3 text-xs"
                      >
                        <XCircle className="h-3 w-3" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          {[
            {
              href: "/dashboard/admin/disputes",
              Icon: AlertTriangle,
              label: "Litiges en cours",
              desc: `${data?.disputedReservations || 0} litige(s) à traiter`,
              color: "text-red-600 bg-red-50",
              badge: data?.disputedReservations,
            },
            {
              href: "/dashboard/admin/agencies",
              Icon: Shield,
              label: "Gestion des agences",
              desc: `${data?.pendingAgencies || 0} en attente d'approbation`,
              color: "text-yellow-600 bg-yellow-50",
              badge: data?.pendingAgencies,
            },
            {
              href: "/dashboard/admin/users",
              Icon: Users,
              label: "Gestion des utilisateurs",
              desc: `${data?.totalUsers || 0} utilisateurs inscrits`,
              color: "text-blue-600 bg-blue-50",
            },
            {
              href: "/dashboard/admin/export",
              Icon: Download,
              label: "Export comptable",
              desc: "Télécharger les données CSV",
              color: "text-gray-600 bg-gray-50",
            },
          ].map(({ href, Icon, label, desc, color, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  {label}
                  {badge != null && badge > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {badge}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
