"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Search, Loader2, Building2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

interface Agency {
  id: string;
  name: string;
  city: string;
  registreCommerce: string;
  assurancePath?: string;
  isApproved: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string; phone?: string };
}

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getPendingAgencies()
      .then((r) => setAgencies(r.data))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setActionId(id);
    try {
      await adminApi.approveAgency(id);
      toast.success("Agence approuvée ✅");
      setAgencies((prev) => prev.map((a) => a.id === id ? { ...a, isApproved: true } : a));
    } catch { toast.error("Erreur"); }
    finally { setActionId(null); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Motif du refus :") || "";
    setActionId(id);
    try {
      await adminApi.rejectAgency(id, reason);
      toast.success("Agence rejetée");
      setAgencies((prev) => prev.filter((a) => a.id !== id));
    } catch { toast.error("Erreur"); }
    finally { setActionId(null); }
  };

  const filtered = agencies.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "pending" && !a.isApproved) ||
      (filter === "approved" && a.isApproved);
    return matchSearch && matchFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Gestion des agences</h1>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        {(["pending", "approved", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === f ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "pending" ? "En attente" : f === "approved" ? "Approuvées" : "Toutes"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-14 text-center">
          <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Aucune agence trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Agence", "Contact", "Ville / RC", "Date", "Statut", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{a.name}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700">{a.user.firstName} {a.user.lastName}</p>
                    <p className="text-xs text-gray-400">{a.user.email}</p>
                    {a.user.phone && <p className="text-xs text-gray-400">{a.user.phone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700">{a.city}</p>
                    <p className="text-xs text-gray-400">{a.registreCommerce}</p>
                    {a.assurancePath && (
                      <a href={a.assurancePath} target="_blank" rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-0.5 mt-0.5">
                        <ExternalLink className="h-3 w-3" /> Assurance
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {format(new Date(a.createdAt), "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      a.isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {a.isApproved ? "Approuvée" : "En attente"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {!a.isApproved && (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="!py-1 !px-2.5 text-xs" loading={actionId === a.id}
                          onClick={() => handleApprove(a.id)}>
                          <CheckCircle className="h-3 w-3" /> Approuver
                        </Button>
                        <Button size="sm" variant="danger" className="!py-1 !px-2.5 text-xs" loading={actionId === a.id}
                          onClick={() => handleReject(a.id)}>
                          <XCircle className="h-3 w-3" /> Rejeter
                        </Button>
                      </div>
                    )}
                    {a.isApproved && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Validée
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
