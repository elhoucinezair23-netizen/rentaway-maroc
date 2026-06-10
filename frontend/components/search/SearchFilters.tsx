"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Star } from "lucide-react";
import { CITY_NAMES } from "@/lib/constants/cities";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const CATEGORY_KEYS = [
  { value: "", labelKey: "search.tous" },
  { value: "VOITURE", labelKey: "nav.voitures" },
  { value: "MOTO",    labelKey: "nav.motos" },
  { value: "BATEAU",  labelKey: "nav.bateaux" },
  { value: "JETSKI",  labelKey: "nav.jetskis" },
];

const MOROCCAN_CITIES = CITY_NAMES;

interface SearchFiltersProps {
  onApply?: () => void;
}

export function SearchFilters({ onApply }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState<number>(Number(searchParams.get("minPrice")) || 0);
  const [maxPrice, setMaxPrice] = useState<number>(Number(searchParams.get("maxPrice")) || 2000);
  const [minRating, setMinRating] = useState(Number(searchParams.get("minRating")) || 0);
  const [availableOnly, setAvailableOnly] = useState(searchParams.get("availableOnly") !== "false");

  useEffect(() => {
    setCity(searchParams.get("city") || "");
    setCategory(searchParams.get("category") || "");
    setMinPrice(Number(searchParams.get("minPrice")) || 0);
    setMaxPrice(Number(searchParams.get("maxPrice")) || 2000);
    setMinRating(Number(searchParams.get("minRating")) || 0);
    setAvailableOnly(searchParams.get("availableOnly") !== "false");
  }, [searchParams]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (category) params.set("category", category);
    if (minPrice > 0) params.set("minPrice", String(minPrice));
    if (maxPrice < 2000) params.set("maxPrice", String(maxPrice));
    if (minRating > 0) params.set("minRating", String(minRating));
    if (!availableOnly) params.set("availableOnly", "false");
    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);
    router.push(`/search?${params.toString()}`);
    onApply?.();
  };

  const reset = () => {
    setCity("");
    setCategory("");
    setMinPrice(0);
    setMaxPrice(2000);
    setMinRating(0);
    setAvailableOnly(true);
    router.push("/search");
    onApply?.();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("search.filtres")}</h3>
        <button onClick={reset} className="text-xs text-primary-600 hover:underline font-medium">
          {t("search.reinitialiser")}
        </button>
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("search.ville")}</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">{t("hero.toutesVilles")}</option>
          {MOROCCAN_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("search.categorie")}</label>
        <div className="space-y-2">
          {CATEGORY_KEYS.map(({ value, labelKey }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="category"
                value={value}
                checked={category === value}
                onChange={() => setCategory(value)}
                className="text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">{t(labelKey)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price range — slider double */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">{t("search.prix")}</label>
          <span className="text-xs font-semibold text-primary-600">
            {minPrice} – {maxPrice >= 2000 ? "2000+" : maxPrice}
          </span>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-[11px] text-gray-400">Min : {minPrice} MAD</label>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={minPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMinPrice(v);
                if (v > maxPrice) setMaxPrice(v);
              }}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-400">Max : {maxPrice >= 2000 ? "2000+" : maxPrice} MAD</label>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={maxPrice}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMaxPrice(v);
                if (v < minPrice) setMinPrice(v);
              }}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("search.noteMin")}</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(minRating === r ? 0 : r)}
              className={`p-1 rounded transition-colors ${r <= minRating ? "text-amber-400" : "text-gray-300 hover:text-amber-300"}`}
            >
              <Star className="h-5 w-5 fill-current" />
            </button>
          ))}
          {minRating > 0 && (
            <span className="text-xs text-gray-400 ml-1 self-center">{minRating}+</span>
          )}
        </div>
      </div>

      {/* Disponibilité */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="text-primary-600 focus:ring-primary-500 rounded"
          />
          <span className="text-sm text-gray-700">Seulement disponibles</span>
        </label>
      </div>

      <Button onClick={applyFilters} fullWidth>
        Appliquer
      </Button>
    </div>
  );
}
