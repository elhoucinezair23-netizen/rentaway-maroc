"use client";

import { useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  /** Si fourni, le marqueur est déplaçable et appelle ce callback à chaque drop. */
  onChange?: (coords: { lat: number; lng: number }) => void;
  height?: string; // tailwind class
}

/**
 * Carte avec marqueur déplaçable pour ajuster la position d'un véhicule.
 * - Si clé Google → carte interactive, marqueur draggable.
 * - Sinon → iframe OpenStreetMap (read-only) + message informatif.
 */
export function LocationPickerMap({ lat, lng, onChange, height = "h-64" }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

  if (!apiKey) {
    return (
      <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-gray-200`}>
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`}
          title="Carte OpenStreetMap"
          className="w-full h-full border-0"
          loading="lazy"
        />
        {onChange && (
          <div className="absolute top-2 left-2 right-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
            ℹ︎ Marqueur déplaçable uniquement avec Google Maps.{" "}
            Définissez <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> pour l&apos;activer.
          </div>
        )}
      </div>
    );
  }

  return <GoogleLocationPicker lat={lat} lng={lng} onChange={onChange} height={height} apiKey={apiKey} />;
}

function GoogleLocationPicker({
  lat, lng, onChange, height, apiKey,
}: Props & { apiKey: string }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });
  const [pos, setPos] = useState({ lat, lng });

  if (loadError) {
    return (
      <div className={`w-full ${height} flex items-center justify-center bg-gray-100 rounded-xl`}>
        <div className="text-center text-gray-500 text-sm">
          <MapPin className="h-6 w-6 mx-auto mb-1" />
          Carte indisponible
        </div>
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className={`w-full ${height} flex items-center justify-center bg-gray-100 rounded-xl`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const draggable = !!onChange;

  return (
    <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-gray-200`}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={pos}
        zoom={14}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker
          position={pos}
          draggable={draggable}
          onDragEnd={(e) => {
            if (!e.latLng) return;
            const next = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setPos(next);
            onChange?.(next);
          }}
        />
      </GoogleMap>
      {draggable && (
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md text-xs font-medium text-gray-700">
          🖱️ Glissez le marqueur pour ajuster
        </div>
      )}
    </div>
  );
}
