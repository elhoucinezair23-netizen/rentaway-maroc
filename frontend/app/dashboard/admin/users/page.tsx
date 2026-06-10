"use client";

import { useEffect, useState } from "react";
import { Search, UserX, UserCheck, Loader2, Users, Shield } from "lucide-react";
import { User } from "@/types";
import { adminApi } from "@/lib/api";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/admin/users")
      .then((r) => setUsers(r.data.users || r.data || []))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const toggleBlacklist = async (user: User) => {
    const action = user.isBlacklisted ? "réactiver" : "suspendre";
    if (!confirm(`Voulez-vous ${action} le compte de ${user.firstName} ${user.lastName} ?`)) return;
    setActionId(user.id);
    try {
      if (user.isBlacklisted) {
        await adminApi.unblacklistUser(user.id);
        toast.success("Compte réactivé");
      } else {
        await adminApi.blacklistUser(user.id);
        toast.success("Compte suspendu");
      }
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, isBlacklisted: !u.isBlacklisted } : u)
      );
    } catch { toast.error("Erreur"); }
    finally { setActionId(null); }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const ROLE_LABELS: Record<string, string> = {
    CLIENT: "Client", LOUEUR: "Loueur", ADMIN: "Admin",
  };
  const ROLE_COLORS: Record<string, string> = {
    CLIENT: "bg-blue-100 text-blue-700",
    LOUEUR: "bg-purple-100 text-purple-700",
    ADMIN: "bg-red-100 text-red-700",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <span className="text-sm text-gray-400">({users.length} total)</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Nom, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        {["", "CLIENT", "LOUEUR", "ADMIN"].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              roleFilter === r ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {r ? ROLE_LABELS[r] : "Tous"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                {["Utilisateur", "Email", "Rôle", "Inscription", "Statut", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50 ${u.isBlacklisted ? "opacity-60" : ""}`}>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-5 py-4 text-gray-500">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {format(new Date(u.createdAt), "d MMM yyyy", { locale: fr })}
                  </td>
                  <td className="px-5 py-4">
                    {u.isBlacklisted ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspendu</span>
                    ) : u.isVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <Shield className="h-3 w-3" /> Vérifié
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Non vérifié</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {u.role !== "ADMIN" && (
                      <Button
                        size="sm"
                        variant={u.isBlacklisted ? "secondary" : "danger"}
                        loading={actionId === u.id}
                        onClick={() => toggleBlacklist(u)}
                        className="!py-1 !px-2.5 text-xs"
                      >
                        {u.isBlacklisted ? (
                          <><UserCheck className="h-3 w-3" /> Réactiver</>
                        ) : (
                          <><UserX className="h-3 w-3" /> Suspendre</>
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-400">Aucun utilisateur trouvé</div>
          )}
        </div>
      )}
    </div>
  );
}
