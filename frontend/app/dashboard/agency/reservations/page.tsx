"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Eye, Filter, Loader2, Calendar } from "lucide-react";
import { Reservation, ReservationStatus } from "@/types";
import { reservationApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<ReservationStatus, { label: string; classes: string }> = {
  PENDING:   { label: "En attente",  classes: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmée",   classes: "bg-blue-100 text-blue-700" },
  ACTIVE:    { label: "En cours",    classes: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Terminée",    classes: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Annulée",     classes: "bg-red-100 text-red-600" },
  DISPUTED:  { label: "Litige",      classes: "bg-orange-100 text-orange-700" },
};

const FILTERS = [
  { label: "Toutes", value: "" },
  { label: "En attente", value: "PENDING" },
  { label: "Confirmées", value: "CONFIRMED" },
  { label: "En cours", value: "ACTIVE" },
  { label: "Terminées", value: "COMPLETED" },
  { label: "Annulées", value: "CANCELLED" },
];

export default function AgencyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    reservationApi
      .list(filter ? { status: filter } : {})
      .then((r) => setReservations(r.data.reservations || []))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleAction = async (id: string, status: "CONFIRMED" | "CANCELLED" | "ACTIVE" | "COMPLETED") => {
    setActionId(id);
    try {
      await reservationApi.updateStatus(id, status);
      const labels: Record<string, string> = {
        CONFIRMED: "Réservation acceptée ✅",
        CANCELLED: "Réservation refusée",
        ACTIVE: "Location démarrée ✅",
        COMPLETED: "Location terminée ✅",
      };
      toast.success(labels[status] || "Statut mis à jour");
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch {
      toast.error("Erreur");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Gestion des réservations</h1>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-400" />
        {FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              filter === value
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary-600" /></div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune réservation dans cette catégorie</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {["Client", "Véhicule", "Dates", "Montant", "Statut", "Actions"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservations.map((r) => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">
                          {r.client?.firstName} {r.client?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{r.client?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900 truncate max-w-[140px]">
                          {r.vehicle?.title}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600">
                        {format(new Date(r.startDate), "d MMM", { locale: fr })} →{" "}
                        {format(new Date(r.endDate), "d MMM yy", { locale: fr })}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900 whitespace-nowrap">
                        {r.totalPrice.toLocaleString("fr-MA")} MAD
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/dashboard/agency/reservations/${r.id}`} title="Détails">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          {r.status === "PENDING" && (
                            <>
                              <Button size="sm" className="!py-1 !px-2.5 text-xs" loading={actionId === r.id}
                                onClick={() => handleAction(r.id, "CONFIRMED")}>
                                <CheckCircle className="h-3 w-3" /> Accepter
                              </Button>
                              <Button size="sm" variant="danger" className="!py-1 !px-2.5 text-xs" loading={actionId === r.id}
                                onClick={() => handleAction(r.id, "CANCELLED")}>
                                <XCircle className="h-3 w-3" /> Refuser
                              </Button>
                            </>
                          )}
                          {r.status === "CONFIRMED" && (
                            <Button size="sm" variant="secondary" className="!py-1 !px-2.5 text-xs" loading={actionId === r.id}
                              onClick={() => handleAction(r.id, "ACTIVE")}>
                              Démarrer
                            </Button>
                          )}
                          {r.status === "ACTIVE" && (
                            <Button size="sm" variant="secondary" className="!py-1 !px-2.5 text-xs" loading={actionId === r.id}
                              onClick={() => handleAction(r.id, "COMPLETED")}>
                              Terminer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
