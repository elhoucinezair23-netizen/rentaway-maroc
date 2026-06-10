"use client";

import { Vehicle } from "@/types";
import { VehicleMap } from "./VehicleMap";
import { MapPin } from "lucide-react";

interface Props {
  vehicle: Vehicle;
  zoom?: number;
}

/**
 * Affiche la carte pour 1 véhicule.
 * - Si NEXT_PUBLIC_GOOGLE_MAPS_KEY est défini → Google Maps (VehicleMap).
 * - Sinon → fallback OpenStreetMap via iframe (gratuit, sans clé).
 */
export function SingleLocationMap({ vehicle, zoom = 13 }: Props) {
  const hasGoogleKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const lat = vehicle.lat;
  const lng = vehicle.lng;

  if (!lat || !lng) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Localisation indisponible</p>
        </div>
      </div>
    );
  }

  if (hasGoogleKey) {
    return <VehicleMap vehicles={[vehicle]} center={{ lat, lng }} zoom={zoom} />;
  }

  // Fallback OpenStreetMap
  const delta = 0.012;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const directionsUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

  return (
    <div className="relative w-full h-full">
      <iframe
        src={osmUrl}
        title={`Carte ${vehicle.city}`}
        className="w-full h-full border-0 rounded-xl"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-xs font-semibold text-primary-700 px-3 py-1.5 rounded-lg shadow-md hover:bg-white"
      >
        Voir en grand
      </a>
    </div>
  );
}
