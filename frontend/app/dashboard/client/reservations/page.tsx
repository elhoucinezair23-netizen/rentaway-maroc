"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Filter, Loader2, Calendar, Car, Star, CheckCircle } from "lucide-react";
import { Reservation, ReservationStatus } from "@/types";
import { reservationApi } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { ReviewModal } from "@/components/reviews/ReviewModal";

const STATUS_CONFIG: Record<ReservationStatus, { label: string; classes: string }> = {
  PENDING:   { label: "En attente",  classes: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "Confirmée",   classes: "bg-blue-100 text-blue-700" },
  ACTIVE:    { label: "En cours",    classes: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Terminée",    classes: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Annulée",     classes: "bg-red-100 text-red-600" },
  DISPUTED:  { label: "Litige",      classes: "bg-orange-100 text-orange-700" },
};

const FILTERS: { label: string; value: string }[] = [
  { label: "Toutes", value: "" },
  { label: "En attente", value: "PENDING" },
  { label: "Confirmées", value: "CONFIRMED" },
  { label: "En cours", value: "ACTIVE" },
  { label: "Terminées", value: "COMPLETED" },
  { label: "Annulées", value: "CANCELLED" },
];

export default function ClientReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Reservation | null>(null);

  useEffect(() => {
    setLoading(true);
    reservationApi
      .list(filter ? { status: filter } : {})
      .then((r) => setReservations(r.data.reservations || []))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleCancel = async (id: string) => {
    if (!confirm("Confirmer l'annulation de cette réservation ?")) return;
    setCancelLoading(id);
    try {
      const res = await reservationApi.cancel(id, "Annulation par le client");
      toast.success(`Réservation annulée — Remboursement : ${(res.data.refundRate * 100).toFixed(0)}%`);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r))
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCancelLoading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{reservations.length} réservation(s)</p>
        </div>
        <Link href="/search">
          <Button size="sm"><Car className="h-4 w-4" /> Louer un véhicule</Button>
        </Link>
      </div>

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
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
        </div>
      ) : reservations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-500">Aucune réservation</p>
          <Link href="/search" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
            Explorer les véhicules →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const cfg = STATUS_CONFIG[r.status];
            const canCancel = ["PENDING", "CONFIRMED"].includes(r.status);
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{r.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <p className="font-semibold text-gray-900 truncate">{r.vehicle?.title || "Véhicule"}</p>
                  <p className="text-sm text-gray-500">{r.agency?.name}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(r.startDate), "d MMM", { locale: fr })} →{" "}
                    {format(new Date(r.endDate), "d MMM yyyy", { locale: fr })}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-primary-600">
                    {r.totalPrice.toLocaleString("fr-MA")} MAD
                  </p>
                  <p className="text-xs text-gray-400">+ {r.cautionAmount.toLocaleString("fr-MA")} MAD caution</p>
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    {r.pdfPath && (
                      <a href={r.pdfPath} target="_blank" rel="noreferrer" title="Télécharger PDF">
                        <Button variant="secondary" size="sm" className="!py-1 !px-2.5">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                    {canCancel && (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={cancelLoading === r.id}
                        onClick={() => handleCancel(r.id)}
                        className="!py-1 !px-3 text-xs"
                      >
                        Annuler
                      </Button>
                    )}
                    {r.status === "COMPLETED" && (
                      (r.reviews && r.reviews.length > 0) ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Avis déposé
                        </span>
                      ) : (
                        <button
                          onClick={() => setReviewTarget(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-primary-600 text-primary-600 hover:bg-primary-50 text-xs font-semibold"
                        >
                          <Star className="h-3.5 w-3.5" />
                          Laisser un avis
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'avis */}
      {reviewTarget && reviewTarget.agency?.id && (
        <ReviewModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          reservationId={reviewTarget.id}
          agencyId={reviewTarget.agency.id}
          vehicleTitle={reviewTarget.vehicle?.title || "Véhicule"}
          onSubmitted={() => {
            // Refresh local state — marque la résa comme ayant un avis
            setReservations((prev) =>
              prev.map((r) =>
                r.id === reviewTarget.id
                  ? { ...r, reviews: [...(r.reviews || []), { id: "tmp", rating: 5 } as never] }
                  : r
              )
            );
          }}
        />
      )}
    </div>
  );
}
