"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Search, MapPin, Calendar, Car, Bike, Anchor, Waves } from "lucide-react";
import { Button } from "./Button";
import { CITY_NAMES } from "@/lib/constants/cities";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

type Category = "" | "VOITURE" | "MOTO" | "BATEAU" | "JETSKI";

// labelKey = traduction key dans le fichier i18n
const CATEGORY_KEYS: { value: Category; labelKey: string; Icon: React.ElementType }[] = [
  { value: "",        labelKey: "hero.toutes",   Icon: Search },
  { value: "VOITURE", labelKey: "nav.voitures",  Icon: Car },
  { value: "MOTO",    labelKey: "nav.motos",     Icon: Bike },
  { value: "BATEAU",  labelKey: "nav.bateaux",   Icon: Anchor },
  { value: "JETSKI",  labelKey: "nav.jetskis",   Icon: Waves },
];

interface SearchBarProps {
  variant?: "hero" | "compact";
}

export function SearchBar({ variant = "hero" }: SearchBarProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [category, setCategory] = useState<Category>("");
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCityList, setShowCityList] = useState(false);
  const [showCatList, setShowCatList] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCityList(false);
      if (catRef.current && !catRef.current.contains(e.target as Node)) setShowCatList(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredCities = city
    ? CITY_NAMES.filter((c) => c.toLowerCase().includes(city.toLowerCase()))
    : CITY_NAMES;

  function handleSearch() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    if (startDate) params.set("startDate", startDate.toISOString().split("T")[0]);
    if (endDate) params.set("endDate", endDate.toISOString().split("T")[0]);
    router.push(`/search?${params.toString()}`);
  }

  const currentCat = CATEGORY_KEYS.find((c) => c.value === category) || CATEGORY_KEYS[0];

  return (
    <div
      className={
        variant === "hero"
          ? "w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lift p-3 md:p-4"
          : "w-full bg-white rounded-xl shadow-card p-3"
      }
    >
      <div className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-0 md:divide-x md:divide-gray-200">
        {/* Catégorie */}
        <div ref={catRef} className="relative md:flex-1 md:px-3">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {t("hero.categorie")}
          </label>
          <button
            type="button"
            onClick={() => setShowCatList((v) => !v)}
            className="mt-1 w-full flex items-center gap-2 text-left text-sm font-medium text-gray-900 hover:text-primary-600"
          >
            <currentCat.Icon className="h-4 w-4 text-primary-600" />
            {t(currentCat.labelKey)}
          </button>
          {showCatList && (
            <div className="absolute z-30 mt-2 left-0 w-56 bg-white rounded-xl shadow-lift border border-gray-100 py-2">
              {CATEGORY_KEYS.map(({ value, labelKey, Icon }) => (
                <button
                  key={value || "all"}
                  type="button"
                  onClick={() => {
                    setCategory(value);
                    setShowCatList(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50"
                >
                  <Icon className="h-4 w-4 text-primary-600" /> {t(labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ville */}
        <div ref={cityRef} className="relative md:flex-1 md:px-3">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {t("hero.ville")}
          </label>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary-600 flex-shrink-0" />
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setShowCityList(true);
              }}
              onFocus={() => setShowCityList(true)}
              placeholder={t("hero.toutesVilles")}
              className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none"
            />
          </div>
          {showCityList && (
            <div className="absolute z-30 mt-2 left-0 right-0 max-h-64 overflow-y-auto bg-white rounded-xl shadow-lift border border-gray-100 py-2">
              {filteredCities.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-400">Aucune ville</div>
              ) : (
                filteredCities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCity(c);
                      setShowCityList(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary-50"
                  >
                    {c}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Date début */}
        <div className="md:flex-1 md:px-3">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {t("hero.du")}
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600 flex-shrink-0" />
            <DatePicker
              selected={startDate}
              onChange={setStartDate}
              minDate={new Date()}
              dateFormat="dd MMM yyyy"
              placeholderText={t("hero.selectionner")}
              className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Date fin */}
        <div className="md:flex-1 md:px-3">
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            {t("hero.au")}
          </label>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600 flex-shrink-0" />
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              minDate={startDate || new Date()}
              dateFormat="dd MMM yyyy"
              placeholderText={t("hero.selectionner")}
              className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="md:pl-3 md:flex md:items-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleSearch}
            className="w-full md:w-auto md:px-8 rounded-xl"
          >
            <Search className="h-5 w-5" />
            {t("hero.rechercher")}
          </Button>
        </div>
      </div>
    </div>
  );
}
