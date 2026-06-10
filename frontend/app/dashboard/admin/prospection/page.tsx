"use client";

import { useEffect, useMemo, useState } from "react";
import { prospectApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Mail, Search, Trash2, Download, Phone, Globe, Loader2 } from "lucide-react";
import { CITY_NAMES } from "@/lib/constants/cities";

type Prospect = {
  id: string;
  name: string;
  city: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  categories: string[];
  sourceUrl: string;
  scrapedAt: string;
  status: "NOT_CONTACTED" | "EMAIL_SENT" | "FORM_SUBMITTED" | "REGISTERED";
};

type Counters = {
  total: number;
  notContacted: number;
  emailSent: number;
  formSubmitted: number;
  registered: number;
  invited: number;
};

const CITIES = CITY_NAMES;

const CATEGORIES = ["VOITURE", "MOTO", "BATEAU", "JETSKI"];

const STATUS_LABELS: Record<Prospect["status"], string> = {
  NOT_CONTACTED: "Non contacté",
  EMAIL_SENT: "Email envoyé",
  FORM_SUBMITTED: "Demande reçue",
  REGISTERED: "Inscrit",
};

const STATUS_COLORS: Record<Prospect["status"], string> = {
  NOT_CONTACTED: "bg-gray-100 text-gray-700",
  EMAIL_SENT: "bg-accent-100 text-accent-700",
  FORM_SUBMITTED: "bg-yellow-100 text-yellow-700",
  REGISTERED: "bg-green-100 text-green-700",
};

export default function ProspectionPage() {
  const [items, setItems] = useState<Prospect[]>([]);
  const [counters, setCounters] = useState<Counters>({
    total: 0, notContacted: 0, emailSent: 0, formSubmitted: 0, registered: 0, invited: 0,
  });
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const [filterCity, setFilterCity] = useState("");
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterCity) params.city = filterCity;
      if (filterStatus) params.status = filterStatus;
      if (search) params.q = search;
      // category filter applied client-side for multi-select
      const { data } = await prospectApi.list(params);
      setItems(data.items);
      setCounters(data.counters);
    } catch (e: any) {
      toast.error(e.message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filterCity, filterStatus]);

  const filtered = useMemo(() => {
    let list = items;
    if (filterCategories.length > 0) {
      list = list.filter((p) => p.categories.some((c) => filterCategories.includes(c)));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(search)
      );
    }
    return list;
  }, [items, filterCategories, search]);

  function toggleCategory(cat: string) {
    setFilterCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function invite(id: string) {
    setInvitingId(id);
    try {
      await prospectApi.invite(id);
      toast.success("Email d'invitation envoyé");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Erreur envoi");
    } finally {
      setInvitingId(null);
    }
  }

  async function changeStatus(id: string, status: Prospect["status"]) {
    try {
      await prospectApi.updateStatus(id, status);
      toast.success("Statut mis à jour");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce prospect ?")) return;
    try {
      await prospectApi.remove(id);
      toast.success("Supprimé");
      await load();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function exportCsv() {
    const header = ["Nom", "Ville", "Catégories", "Téléphone", "Email", "Site web", "Statut", "Source", "Date scrape"];
    const rows = filtered.map((p) => [
      p.name, p.city, p.categories.join(";"), p.phone || "", p.email || "",
      p.website || "", STATUS_LABELS[p.status], p.sourceUrl,
      new Date(p.scrapedAt).toLocaleDateString("fr-MA"),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `prospects_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospection</h1>
          <p className="text-sm text-gray-500">Agences identifiées par scraping</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-2xl font-bold text-gray-900">{counters.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-2xl font-bold text-gray-700">{counters.notContacted}</div>
          <div className="text-sm text-gray-500">Non contactés</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-2xl font-bold text-blue-600">{counters.invited}</div>
          <div className="text-sm text-gray-500">Invités</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-2xl font-bold text-green-600">{counters.registered}</div>
          <div className="text-sm text-gray-500">Inscrits</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher nom, email, téléphone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">Toutes les villes</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            <option value="NOT_CONTACTED">Non contacté</option>
            <option value="EMAIL_SENT">Email envoyé</option>
            <option value="FORM_SUBMITTED">Demande reçue</option>
            <option value="REGISTERED">Inscrit</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500 mr-2 self-center">Catégories :</span>
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={filterCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded"
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucun prospect. Lance le scraper avec <code className="bg-gray-100 px-2 py-1 rounded">npm run scrape:prospects</code>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-gray-700">
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Ville</th>
                  <th className="px-4 py-3 font-medium">Catégories</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-gray-700">{p.city}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.categories.map((c) => (
                          <span key={c} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex flex-col gap-1">
                        {p.phone && (
                          <span className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3" /> {p.phone}
                          </span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-1 text-xs">
                            <Mail className="w-3 h-3" /> {p.email}
                          </span>
                        )}
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                            <Globe className="w-3 h-3" /> Site
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => changeStatus(p.id, e.target.value as Prospect["status"])}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium cursor-pointer ${STATUS_COLORS[p.status]}`}
                      >
                        <option value="NOT_CONTACTED">Non contacté</option>
                        <option value="EMAIL_SENT">Email envoyé</option>
                        <option value="FORM_SUBMITTED">Demande reçue</option>
                        <option value="REGISTERED">Inscrit</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        {new URL(p.sourceUrl.startsWith("http") ? p.sourceUrl : `https://${p.sourceUrl}`).hostname.replace("www.", "")}
                      </a>
                      <div>{new Date(p.scrapedAt).toLocaleDateString("fr-MA")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => invite(p.id)}
                          disabled={!p.email || invitingId === p.id || p.status !== "NOT_CONTACTED"}
                          className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={!p.email ? "Pas d'email" : "Envoyer invitation"}
                        >
                          {invitingId === p.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Mail className="w-3 h-3" />
                          )}
                          Inviter
                        </button>
                        <button
                          onClick={() => remove(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
