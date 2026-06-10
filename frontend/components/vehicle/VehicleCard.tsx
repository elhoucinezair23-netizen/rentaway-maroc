"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Car, Bike, Anchor, Waves, ShieldCheck } from "lucide-react";
import { Vehicle, VehicleCategory } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const CATEGORY_ICONS: Record<VehicleCategory, React.ElementType> = {
  VOITURE: Car,
  MOTO: Bike,
  BATEAU: Anchor,
  JETSKI: Waves,
};

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  VOITURE: "Voiture",
  MOTO: "Moto",
  BATEAU: "Bateau",
  JETSKI: "Jet-ski",
};

const CATEGORY_FALLBACK: Record<VehicleCategory, string> = {
  VOITURE: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400",
  MOTO:    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  BATEAU:  "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=400",
  JETSKI:  "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=400",
};

interface VehicleCardProps {
  vehicle: Vehicle;
}

const NEW_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const { t } = useTranslation();
  const CategoryIcon = CATEGORY_ICONS[vehicle.category];
  const imgSrc = vehicle.images?.[0] || CATEGORY_FALLBACK[vehicle.category];

  const isNew = vehicle.createdAt
    ? Date.now() - new Date(vehicle.createdAt).getTime() < NEW_THRESHOLD_MS
    : false;
  const isPopular = vehicle.rating > 4.7;

  return (
    <Link href={`/vehicle/${vehicle.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <Image
            src={imgSrc}
            alt={vehicle.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="category">
              <CategoryIcon className="h-3 w-3" />
              {CATEGORY_LABELS[vehicle.category]}
            </Badge>
          </div>

          {/* Agency verified badge */}
          {vehicle.agency?.isApproved && (
            <div className="absolute top-3 right-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </div>
            </div>
          )}

          {/* Badges Nouveau / Populaire */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {isNew && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-500 text-white text-[10px] font-bold shadow-md uppercase tracking-wide">
                Nouveau
              </span>
            )}
            {isPopular && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-600 text-white text-[10px] font-bold shadow-md uppercase tracking-wide">
                ★ Populaire
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors">
              {vehicle.title}
            </h3>
          </div>

          {/* Agency name */}
          {vehicle.agency && (
            <p className="text-xs text-gray-400 mb-2">{vehicle.agency.name}</p>
          )}

          <div className="flex items-center gap-1 mb-3">
            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-xs text-gray-500 truncate">{vehicle.city}</span>
          </div>

          {/* Rating */}
          {vehicle.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-gray-700">
                {vehicle.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">({vehicle.reviewCount} {t("popular.avis")})</span>
            </div>
          )}

          {/* Price + CTA */}
          <div className="flex items-end justify-between pt-2 border-t border-gray-100 mt-2">
            <div>
              <span className="text-lg font-bold text-primary-600">
                {vehicle.pricePerDay.toLocaleString("fr-MA")} MAD
              </span>
              <span className="text-xs text-gray-400 ml-1">/{t("vehicle.jour")}</span>
              {vehicle.pricePerHour && (
                <span className="block text-[11px] text-gray-400">
                  ou {vehicle.pricePerHour} MAD/h
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold group-hover:bg-primary-700 transition-colors">
              {t("popular.reserver")} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
