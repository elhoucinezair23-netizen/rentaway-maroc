"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, Loader2, MessageSquare } from "lucide-react";
import { Reservation } from "@/types";
import { adminApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getDisputedReservations()
      .then((r) => setDisputes(r.data))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id: string, resolution: "completed" | "cancelled") => {
    if (!confirm(`Résoudre en marquant comme ${resolution === "completed" ? "TERMINÉE" : "ANNULÉE"} ?`)) return;
    setActionId(id);
    try {
      await adminApi.resolveDispute(id, resolution);
      toast.success("Litige résolu");
      setDisputes((prev) => prev.filter((d) => d.id !== id));
    } catch { toast.error("Erreur"); }
    finally { setActionId(null); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Gestion des litiges</h1>
        {disputes.length > 0 && (
          <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-0.5 rounded-full">
            {disputes.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary-600" /></div>
      ) : disputes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <CheckCircle className="h-10 w-10 mx-auto text-green-400 mb-3" />
          <p className="font-medium text-gray-500">Aucun litige en cours 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl border border-red-100 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      LITIGE
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{d.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{d.vehicle?.title}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>Client : <strong className="text-gray-700">{d.client?.firstName} {d.client?.lastName}</strong></span>
                    <span>Agence : <strong className="text-gray-700">{d.agency?.name}</strong></span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {format(new Date(d.startDate), "d MMM", { locale: fr })} →{" "}
                    {format(new Date(d.endDate), "d MMM yyyy", { locale: fr })} ·{" "}
                    <strong>{d.totalPrice.toLocaleString("fr-MA")} MAD</strong>
                  </p>
                  <p className="text-sm text-gray-400">
                    Signalé le {format(new Date(d.createdAt), "d MMMM yyyy", { locale: fr })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    loading={actionId === d.id}
                    onClick={() => handleResolve(d.id, "completed")}
                    className="text-xs"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Résoudre (terminée)
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={actionId === d.id}
                    onClick={() => handleResolve(d.id, "cancelled")}
                    className="text-xs"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Résoudre (annulée)
                  </Button>
                  <button className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Voir les messages
                  </button>
                </div>
              </div>

              {/* Payments */}
              {d.payments && d.payments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Paiements</p>
                  <div className="flex gap-4">
                    {d.payments.map((p) => (
                      <div key={p.id} className="text-sm">
                        <span className="text-gray-500">{p.type === "MAIN" ? "Principal" : "Caution"} :</span>{" "}
                        <strong>{p.amount.toLocaleString("fr-MA")} MAD</strong>{" "}
                        <span className={`text-xs ${p.status === "CAPTURED" ? "text-green-600" : p.status === "REFUNDED" ? "text-blue-600" : "text-gray-400"}`}>
                          ({p.status})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
