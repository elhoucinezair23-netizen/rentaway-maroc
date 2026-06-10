"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Check, X, Edit2, ExternalLink, Loader2, RefreshCw, Filter,
  CheckCheck, Search, ImageOff,
} from "lucide-react";
import { scrapedVehicleApi } from "@/lib/api";
import { CITY_NAMES } from "@/lib/constants/cities";

type ScrapedVehicle = {
  id: string;
  title: string;
  description: string;
  category: "VOITURE" | "MOTO" | "BATEAU" | "JETSKI";
  city: string;
  pricePerDay: number;
  caution: number;
  images: string[];
  sourceUrl?: string | null;
  sourcePhone?: string | null;
  isApproved: boolean;
  createdAt: string;
  agency?: { name: string };
};

type Counters = { total: number; pending: number; approved: number };

const CATEGORIES = ["VOITURE", "MOTO", "BATEAU", "JETSKI"] as const;

const CAT_LABEL: Record<ScrapedVehicle["category"], string> = {
  VOITURE: "Voiture", MOTO: "Moto", BATEAU: "Bateau", JETSKI: "Jet-ski",
};

export default function ScrapedVehiclesPage() {
  const [items, setItems] = useState<ScrapedVehicle[]>([]);
  const [counters, setCounters] = useState<Counters>({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState<"pending" | "approved" | "all">("pending");
  const [filterCity, setFilterCity] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  // édition inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<ScrapedVehicle>>({});

  async function load() {
    setLoading(true);
    try {
      const params: Record<string, string> = { status: filterStatus };
      if (filterCity) params.city = filterCity;
      if (filterCategory) params.category = filterCategory;
      const { data } = await scrapedVehicleApi.list(params);
      setItems(data.items);
      setCounters(data.counters);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Erreur chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterCity, filterCategory]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.agency?.name.toLowerCase().includes(q)
    );
  }, [items, search]);

  async function approve(id: string) {
    setActingId(id);
    try {
      await scrapedVehicleApi.approve(id);
      toast.success("Véhicule approuvé ✓");
      await load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function reject(id: string) {
    if (!confirm("Supprimer définitivement ce véhicule scrapé ?")) return;
    setActingId(id);
    try {
      await scrapedVehicleApi.reject(id);
      toast.success("Refusé et supprimé");
      await load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  async function approveAll() {
    if (!confirm(`Approuver tous les ${counters.pending} véhicules en attente ?`)) return;
    setBulkLoading(true);
    try {
      const { data } = await scrapedVehicleApi.approveAll();
      toast.success(`${data.count} véhicules approuvés`);
      await load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBulkLoading(false);
    }
  }

  function startEdit(v: ScrapedVehicle) {
    setEditId(v.id);
    setEditDraft({
      title: v.title,
      city: v.city,
      pricePerDay: v.pricePerDay,
      caution: v.caution,
      category: v.category,
      description: v.description,
    });
  }

  async function saveEdit() {
    if (!editId) return;
    setActingId(editId);
    try {
      const payload: Record<string, unknown> = { ...editDraft };
      if (payload.pricePerDay !== undefined) payload.pricePerDay = Number(payload.pricePerDay);
      if (payload.caution !== undefined) payload.caution = Number(payload.caution);
      await scrapedVehicleApi.update(editId, payload);
      toast.success("Modifié");
      setEditId(null);
      await load();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary-700">Véhicules scrapés</h1>
          <p className="text-sm text-gray-500 mt-1">
            Modération des annonces importées (Avito, Moteur.ma, Wandaloo).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Rafraîchir
          </button>
          {filterStatus === "pending" && counters.pending > 0 && (
            <button
              onClick={approveAll}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 text-sm font-semibold"
            >
              {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Approuver tout ({counters.pending})
            </button>
          )}
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-soft">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Total scrapés</p>
          <p className="text-2xl font-bold text-secondary-700 mt-1">{counters.total}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-soft">
          <p className="text-xs text-gray-400 uppercase tracking-wide">En attente</p>
          <p className="text-2xl font-bold text-accent-600 mt-1">{counters.pending}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-soft">
          <p className="text-xs text-gray-400 uppercase tracking-wide">Approuvés</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{counters.approved}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-soft">
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-gray-400" />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as never)}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="all">Tous</option>
          </select>

          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Toutes les villes</option>
            {CITY_NAMES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CAT_LABEL[c]}</option>
            ))}
          </select>

          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher titre, ville…"
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-primary-200"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            Aucun véhicule scrapé pour ces filtres.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Titre</th>
                  <th className="px-4 py-3">Ville</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((v) => {
                  const editing = editId === v.id;
                  return (
                    <tr key={v.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        {v.images[0] ? (
                          <Image
                            src={v.images[0]}
                            alt={v.title}
                            width={60}
                            height={44}
                            className="rounded-md object-cover h-11 w-16"
                            unoptimized
                          />
                        ) : (
                          <div className="h-11 w-16 bg-gray-100 rounded-md flex items-center justify-center">
                            <ImageOff className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        {editing ? (
                          <input
                            value={editDraft.title || ""}
                            onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                          />
                        ) : (
                          <>
                            <p className="font-medium text-gray-900 truncate">{v.title}</p>
                            <p className="text-xs text-gray-400 truncate">{v.agency?.name}</p>
                          </>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {editing ? (
                          <select
                            value={editDraft.city || ""}
                            onChange={(e) => setEditDraft({ ...editDraft, city: e.target.value })}
                            className="px-2 py-1 border border-gray-200 rounded text-sm"
                          >
                            {CITY_NAMES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          v.city || <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {editing ? (
                          <select
                            value={editDraft.category || v.category}
                            onChange={(e) => setEditDraft({ ...editDraft, category: e.target.value as never })}
                            className="px-2 py-1 border border-gray-200 rounded text-sm"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c}>{CAT_LABEL[c]}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-xs font-medium">
                            {CAT_LABEL[v.category]}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {editing ? (
                          <input
                            type="number"
                            value={editDraft.pricePerDay ?? v.pricePerDay}
                            onChange={(e) => setEditDraft({ ...editDraft, pricePerDay: Number(e.target.value) })}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm"
                          />
                        ) : (
                          <span className="font-semibold text-primary-600">
                            {v.pricePerDay.toLocaleString("fr-MA")} MAD
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {v.sourceUrl ? (
                          <a
                            href={v.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-secondary-600 hover:text-primary-600 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {new URL(v.sourceUrl).hostname.replace("www.", "")}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {v.isApproved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                            Approuvé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 text-xs font-medium">
                            En attente
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {editing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={actingId === v.id}
                                className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
                                title="Enregistrer"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditId(null)}
                                className="p-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                                title="Annuler"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              {!v.isApproved && (
                                <button
                                  onClick={() => approve(v.id)}
                                  disabled={actingId === v.id}
                                  className="p-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
                                  title="Approuver"
                                >
                                  {actingId === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                </button>
                              )}
                              <button
                                onClick={() => startEdit(v)}
                                disabled={actingId === v.id}
                                className="p-1.5 rounded-md bg-secondary-50 text-secondary-700 hover:bg-secondary-100 disabled:opacity-60"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => reject(v.id)}
                                disabled={actingId === v.id}
                                className="p-1.5 rounded-md bg-primary-50 text-primary-700 hover:bg-primary-100 disabled:opacity-60"
                                title="Refuser & supprimer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
