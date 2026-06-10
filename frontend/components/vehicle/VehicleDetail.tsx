"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin, Star, Shield, Calendar, Car, Bike, Anchor, Waves,
  ChevronLeft, ChevronRight, Info, CheckCircle, Users,
  Cog, Fuel, Snowflake, Navigation, Wrench, Phone, Headphones, Truck,
  Award, MessageSquare,
} from "lucide-react";
import { Vehicle } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { BookingForm } from "@/components/booking/BookingForm";
import { SingleLocationMap } from "./SingleLocationMap";
import { VehicleReviews } from "./VehicleReviews";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";
import { CATEGORY_FALLBACK } from "@/lib/imageFallback";

const CATEGORY_ICONS = { VOITURE: Car, MOTO: Bike, BATEAU: Anchor, JETSKI: Waves };
const CATEGORY_LABELS = { VOITURE: "Voiture", MOTO: "Moto", BATEAU: "Bateau", JETSKI: "Jet-ski" };

interface VehicleDetailProps {
  vehicle: Vehicle;
}

export function VehicleDetail({ vehicle }: VehicleDetailProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const { t } = useTranslation();
  const CategoryIcon = CATEGORY_ICONS[vehicle.category];
  const fallback = CATEGORY_FALLBACK[vehicle.category];
  const safeSrc = (i: number) =>
    brokenImages[i] ? fallback : vehicle.images?.[i] || fallback;

  const specs = vehicle.specs as Record<string, unknown>;

  const SPEC_META: Record<string, { label: string; Icon: React.ElementType }> = {
    boite:           { label: "Boîte",        Icon: Cog },
    carburant:       { label: "Carburant",    Icon: Fuel },
    places:          { label: "Places",       Icon: Users },
    clim:            { label: "Climatisation", Icon: Snowflake },
    climatisation:   { label: "Climatisation", Icon: Snowflake },
    gps:             { label: "GPS embarqué", Icon: Navigation },
    kilometrage:     { label: "Kilométrage",  Icon: Truck },
    cylindree:       { label: "Cylindrée",    Icon: Wrench },
    type:            { label: "Type",         Icon: Bike },
    casque:          { label: "Casque inclus", Icon: Shield },
    permis:          { label: "Permis",       Icon: Award },
    longueur:        { label: "Longueur",     Icon: Anchor },
    capacite:        { label: "Capacité",     Icon: Users },
    moteur_cv:       { label: "Moteur (CV)",  Icon: Wrench },
    avec_skipper:    { label: "Avec skipper", Icon: Users },
    zone_navigation: { label: "Zone",         Icon: MapPin },
    puissance_cv:    { label: "Puissance",    Icon: Wrench },
    age_minimum:     { label: "Âge minimum",  Icon: Users },
    gilet_fourni:    { label: "Gilet fourni", Icon: Shield },
    combinaison:     { label: "Combinaison",  Icon: Shield },
    zone:            { label: "Zone",         Icon: MapPin },
  };

  const specsDisplay = Object.entries(specs)
    .filter(([, v]) => v !== null && v !== undefined && v !== false && v !== "")
    .map(([key, value]) => {
      const meta = SPEC_META[key] || { label: key, Icon: CheckCircle };
      return {
        key,
        label: meta.label,
        Icon: meta.Icon,
        value: typeof value === "boolean" ? (value ? "Oui" : "Non") : String(value),
      };
    });

  // "Inclus dans la location" — détecté automatiquement
  const includedItems = [
    { label: "Assurance tous risques incluse", on: true, Icon: Shield },
    { label: "Kilométrage illimité",            on: String(specs.kilometrage || "").toLowerCase().includes("illim") || vehicle.category === "VOITURE", Icon: Truck },
    { label: "Assistance 24h/24",               on: true, Icon: Headphones },
    { label: "Annulation gratuite (24h avant)", on: true, Icon: Calendar },
    { label: "Casque fourni",                   on: vehicle.category === "MOTO", Icon: Shield },
    { label: "Gilet de sauvetage fourni",       on: vehicle.category === "JETSKI" || vehicle.category === "BATEAU", Icon: Shield },
    { label: "Skipper professionnel",           on: !!specs.avec_skipper, Icon: Users },
  ].filter((x) => x.on);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">Accueil</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-primary-600">Recherche</Link>
        <span>/</span>
        <Link href={`/search?category=${vehicle.category}`} className="hover:text-primary-600">
          {CATEGORY_LABELS[vehicle.category]}s
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-xs">{vehicle.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo gallery */}
          <div className="relative">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100">
              {vehicle.images?.[photoIndex] ? (
                <Image
                  src={safeSrc(photoIndex)}
                  alt={`${vehicle.title} - photo ${photoIndex + 1}`}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                  onError={() =>
                    setBrokenImages((prev) => ({ ...prev, [photoIndex]: true }))
                  }
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CategoryIcon className="h-20 w-20 text-gray-300" />
                </div>
              )}

              {vehicle.images && vehicle.images.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIndex((i) => (i - 1 + vehicle.images.length) % vehicle.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setPhotoIndex((i) => (i + 1) % vehicle.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {vehicle.images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPhotoIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === photoIndex ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {vehicle.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`flex-shrink-0 relative h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${i === photoIndex ? "border-primary-600" : "border-transparent"}`}
                  >
                    <Image
                      src={brokenImages[i] ? fallback : img}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [i]: true }))
                      }
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Info */}
          <div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="category">
                    <CategoryIcon className="h-3 w-3" />
                    {CATEGORY_LABELS[vehicle.category]}
                  </Badge>
                  {vehicle.agency?.isApproved && (
                    <Badge variant="verified" icon>Agence vérifiée</Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{vehicle.title}</h1>
                <div className="flex items-center gap-2 mt-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{vehicle.city}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary-600">
                  {vehicle.pricePerDay.toLocaleString("fr-MA")} MAD
                </p>
                <p className="text-sm text-gray-400">/{t("vehicle.jour")}</p>
                {vehicle.pricePerHour && (
                  <p className="text-sm text-gray-500">ou {vehicle.pricePerHour} MAD/{t("vehicle.heure")}</p>
                )}
              </div>
            </div>

            {/* Rating */}
            {vehicle.reviewCount > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <StarRating rating={vehicle.rating} size="md" />
                <span className="font-medium text-gray-800">{vehicle.rating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({vehicle.reviewCount} {t("popular.avis")})</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{vehicle.description}</p>
          </div>

          {/* Specs — visuelles avec icônes */}
          {specsDisplay.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Caractéristiques</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {specsDisplay.map(({ key, label, Icon, value }) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inclus dans la location */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Inclus dans la location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {includedItems.map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Required license */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800">Permis requis</p>
              <p className="text-sm text-blue-600 mt-1">
                Ce véhicule nécessite un permis de catégorie{" "}
                <strong>{vehicle.requiredLicense}</strong>
              </p>
            </div>
          </div>

          {/* Agency info */}
          {vehicle.agency && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">L&apos;agence</h2>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-7 w-7 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{vehicle.agency.name}</h3>
                    {vehicle.agency.isApproved && (
                      <Badge variant="verified" icon>Vérifiée</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm text-gray-500">{vehicle.agency.city}</span>
                  </div>

                  {/* Stats agence */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm">
                    {vehicle.agency.reviewCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="font-semibold text-gray-800">{vehicle.agency.rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs">({vehicle.agency.reviewCount} avis)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-gray-500">
                      <Award className="h-4 w-4 text-primary-500" />
                      <span className="text-xs">{Math.max(vehicle.agency.reviewCount * 2, 10)}+ locations</span>
                    </div>
                  </div>

                  {vehicle.agency.description && (
                    <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                      {vehicle.agency.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link
                      href={`/dashboard/client/messages?agencyId=${vehicle.agency.id}&vehicleId=${vehicle.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Contacter l&apos;agence
                    </Link>
                    <Link
                      href={`/agency/${vehicle.agency.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700"
                    >
                      <Users className="h-4 w-4" />
                      Voir le profil
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Localisation */}
          {vehicle.lat && vehicle.lng && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                Localisation
              </h2>
              <div className="h-64 rounded-xl overflow-hidden">
                <SingleLocationMap vehicle={vehicle} zoom={13} />
              </div>
            </div>
          )}

          {/* Reviews */}
          {vehicle.agency && (
            <VehicleReviews agencyId={vehicle.agency.id} />
          )}

          {/* Caution info */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Calendar className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Dépôt de garantie</p>
              <p className="text-sm text-amber-700 mt-1">
                Une caution de{" "}
                <strong>{vehicle.caution.toLocaleString("fr-MA")} MAD</strong> sera préautorisée.
                Elle sera restituée sous 5 jours après la restitution du véhicule.
              </p>
            </div>
          </div>
        </div>

        {/* Right column — Booking Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <BookingForm vehicle={vehicle} />
          </div>
        </div>
      </div>
    </div>
  );
}
