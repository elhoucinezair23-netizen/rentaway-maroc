"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  DollarSign, Car, BookOpen, Star, TrendingUp, Loader2,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler, ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { agencyApi } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler, ArcElement
);

interface Stats {
  totalRevenue: number;
  recentRevenue: number;
  totalReservations: number;
  activeReservations: number;
  vehicleCount: number;
  rating: number;
  reviewCount: number;
  monthlyData: { month: string; revenue: number; count: number }[];
}

export default function AgencyStatsPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const agencyId = (session?.user as { agencyId?: string })?.agencyId;

  useEffect(() => {
    if (!agencyId) return;
    agencyApi
      .getStats(agencyId)
      .then((r) => setStats(r.data))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [agencyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const monthLabels = (stats?.monthlyData || []).map((d) => {
    const [y, m] = d.month.split("-");
    return format(new Date(parseInt(y), parseInt(m) - 1, 1), "MMM yy", { locale: fr });
  });

  const revenueData = {
    labels: monthLabels,
    datasets: [{
      label: "Revenus (MAD)",
      data: (stats?.monthlyData || []).map((d) => d.revenue),
      borderColor: "#f97316",
      backgroundColor: "rgba(249,115,22,0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#f97316",
      pointRadius: 5,
    }],
  };

  const reservationsData = {
    labels: monthLabels,
    datasets: [{
      label: "Réservations",
      data: (stats?.monthlyData || []).map((d) => d.count),
      backgroundColor: "rgba(59,130,246,0.7)",
      borderRadius: 6,
    }],
  };

  const occupancyRate = stats?.totalReservations && stats?.vehicleCount
    ? Math.min(100, Math.round((stats.activeReservations / stats.vehicleCount) * 100))
    : 0;

  const doughnutData = {
    labels: ["Occupés", "Disponibles"],
    datasets: [{
      data: [occupancyRate, 100 - occupancyRate],
      backgroundColor: ["#f97316", "#f3f4f6"],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "#f3f4f6" } },
      x: { grid: { display: false } },
    },
  };

  const kpis = [
    { label: "Revenus totaux", value: `${(stats?.totalRevenue || 0).toLocaleString("fr-MA")} MAD`, Icon: DollarSign, color: "text-green-600 bg-green-50", sub: `+${(stats?.recentRevenue || 0).toLocaleString("fr-MA")} MAD ce mois` },
    { label: "Réservations", value: stats?.totalReservations || 0, Icon: BookOpen, color: "text-blue-600 bg-blue-50", sub: `${stats?.activeReservations || 0} en cours` },
    { label: "Véhicules", value: stats?.vehicleCount || 0, Icon: Car, color: "text-primary-600 bg-primary-50", sub: `${occupancyRate}% taux d'occupation` },
    { label: "Note moyenne", value: stats?.rating ? `${stats.rating.toFixed(1)} / 5` : "—", Icon: Star, color: "text-amber-600 bg-amber-50", sub: `${stats?.reviewCount || 0} avis` },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-500 mt-0.5">Analyse de performance de votre agence</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, Icon, color, sub }) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-600" />
            Évolution des revenus
          </h2>
          {stats?.monthlyData && stats.monthlyData.length > 0 ? (
            <Line data={revenueData} options={chartOptions as never} height={100} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Données insuffisantes</div>
          )}
        </div>

        {/* Occupancy donut */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Taux d&apos;occupation</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <Doughnut data={doughnutData} options={{ cutout: "72%", plugins: { legend: { display: false } } }} />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-gray-900">{occupancyRate}%</span>
                <span className="text-xs text-gray-400">occupés</span>
              </div>
            </div>
          </div>
          <div className="flex justify-around mt-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary-500" />
              <span className="text-gray-600">Occupés ({stats?.activeReservations || 0})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-gray-600">Libres ({(stats?.vehicleCount || 0) - (stats?.activeReservations || 0)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations bar chart */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Réservations par mois</h2>
        {stats?.monthlyData && stats.monthlyData.length > 0 ? (
          <Bar data={reservationsData} options={chartOptions as never} height={60} />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Données insuffisantes</div>
        )}
      </div>
    </div>
  );
}
