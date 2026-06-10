"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Grid3X3, Map, Filter, SlidersHorizontal, Loader2 } from "lucide-react";
import { Vehicle } from "@/types";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { SearchFilters } from "./SearchFilters";
import { VehicleMap } from "@/components/vehicle/VehicleMap";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

type ViewMode = "grid" | "map";

export function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { t } = useTranslation();

  const fetchVehicles = useCallback(async (params: URLSearchParams, p: number) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params);
      query.set("page", String(p));
      query.set("limit", "12");
      const res = await api.get(`/vehicles?${query.toString()}`);
      setVehicles(res.data.vehicles);
      setTotal(res.data.pagination.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles(searchParams, page);
  }, [searchParams, page, fetchVehicles]);

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.push(`/search?${params.toString()}`);
  };

  const activeFiltersCount = ["city", "category", "minPrice", "maxPrice", "minRating"]
    .filter((k) => searchParams.get(k))
    .length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {loading ? "..." : `${total} ${t("search.trouves")}`}
          </h1>
          {searchParams.get("city") && (
            <p className="text-sm text-gray-500">à {searchParams.get("city")}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none hidden md:block"
            value={searchParams.get("sort") || "createdAt"}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="createdAt">{t("search.plusRecents")}</option>
            <option value="price_asc">{t("search.prixCroissant")}</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="rating">{t("search.mieuxNotes")}</option>
            <option value="popular">Plus populaires</option>
          </select>

          {/* Filters toggle (mobile) */}
          <Button
            variant="secondary"
            size="sm"
            className="md:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4" />
            {t("search.filtres")}
            {activeFiltersCount > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView("grid")}
              className={`p-2 ${view === "grid" ? "bg-primary-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("map")}
              className={`p-2 ${view === "map" ? "bg-primary-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
            >
              <Map className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <SearchFilters />
        </aside>

        {/* Mobile filters drawer */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setFiltersOpen(false)}>
            <div
              className="absolute right-0 inset-y-0 w-80 bg-white overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" /> Filtres
                </h3>
                <button onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="p-4">
                <SearchFilters onApply={() => setFiltersOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <main className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun résultat
              </h3>
              <p className="text-gray-500 text-sm">
                Essayez d&apos;élargir vos critères de recherche
              </p>
            </div>
          ) : view === "grid" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>

              {/* Pagination */}
              {total > 12 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Précédent
                  </Button>
                  <span className="flex items-center text-sm text-gray-500 px-3">
                    Page {page} / {Math.ceil(total / 12)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= Math.ceil(total / 12)}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Suivant
                  </Button>
                </div>
              )}
            </>
          ) : (
            // Mode carte : liste scrollable à gauche + map à droite, avec sync hover/click
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[700px]">
              <div className="overflow-y-auto space-y-3 pr-2">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    ref={(el) => { cardRefs.current[v.id] = el; }}
                    onMouseEnter={() => setHighlightId(v.id)}
                    onMouseLeave={() => setHighlightId(null)}
                    className={`transition-all rounded-2xl ${highlightId === v.id ? "ring-2 ring-primary-500 ring-offset-2" : ""}`}
                  >
                    <VehicleCard vehicle={v} />
                  </div>
                ))}
              </div>
              <div className="h-full rounded-2xl overflow-hidden border border-gray-200 sticky top-4">
                <VehicleMap
                  vehicles={vehicles}
                  highlightId={highlightId}
                  onMarkerClick={(id) => {
                    setHighlightId(id);
                    const el = cardRefs.current[id];
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
