"use client";

import { useState, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { Vehicle } from "@/types";
import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";

interface VehicleMapProps {
  vehicles: Vehicle[];
  center?: { lat: number; lng: number };
  zoom?: number;
  /** ID actuellement survolé/sélectionné côté liste — pour mettre en valeur le marqueur correspondant. */
  highlightId?: string | null;
  /** Notifié quand l'utilisateur clique un marqueur (pour scroller la card côté liste). */
  onMarkerClick?: (vehicleId: string) => void;
}

const MAP_CENTER_MAROC = { lat: 31.7917, lng: -7.0926 };
const RW_RED = "#e63946";
const RW_RED_DARK = "#b01f2b";
const RW_NAVY = "#1d3557";

function markerSvg(price: number, highlighted: boolean): string {
  const fill = highlighted ? RW_NAVY : RW_RED;
  const stroke = highlighted ? RW_RED : "white";
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="46" height="50" viewBox="0 0 46 50">
      <rect x="2" y="2" width="42" height="32" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <text x="23" y="20" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle">${price}</text>
      <text x="23" y="29" font-family="Inter, Arial, sans-serif" font-size="7" font-weight="600" fill="white" text-anchor="middle">MAD/j</text>
      <polygon points="23,47 15,38 31,38" fill="${fill}"/>
    </svg>
  `)}`;
}

export function VehicleMap({
  vehicles,
  center = MAP_CENTER_MAROC,
  zoom = 6,
  highlightId = null,
  onMarkerClick,
}: VehicleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";
  const hasKey = apiKey.length > 0;

  // ──────── Fallback OpenStreetMap (sans clé Google) ────────
  if (!hasKey) {
    return <OSMFallback vehicles={vehicles} center={center} />;
  }

  return <GoogleMapView vehicles={vehicles} center={center} zoom={zoom} highlightId={highlightId} onMarkerClick={onMarkerClick} apiKey={apiKey} />;
}

function GoogleMapView({
  vehicles, center, zoom, highlightId, onMarkerClick, apiKey,
}: VehicleMapProps & { apiKey: string }) {
  const [selected, setSelected] = useState<Vehicle | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: ["places"],
  });

  const onUnmount = useCallback(() => {}, []);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <div className="text-center text-gray-500">
          <MapPin className="h-8 w-8 mx-auto mb-2" />
          <p>Carte indisponible</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const vehiclesWithCoords = vehicles.filter((v) => v.lat && v.lng);

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={center}
      zoom={zoom}
      onUnmount={onUnmount}
      options={{
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {vehiclesWithCoords.map((vehicle) => {
        const highlighted = highlightId === vehicle.id || selected?.id === vehicle.id;
        return (
          <Marker
            key={vehicle.id}
            position={{ lat: vehicle.lat!, lng: vehicle.lng! }}
            title={vehicle.title}
            onClick={() => {
              setSelected(vehicle);
              onMarkerClick?.(vehicle.id);
            }}
            zIndex={highlighted ? 999 : 1}
            icon={{
              url: markerSvg(vehicle.pricePerDay, highlighted),
              scaledSize: new window.google.maps.Size(46, 50),
              anchor: new window.google.maps.Point(23, 50),
            }}
          />
        );
      })}

      {selected && selected.lat && selected.lng && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="w-52">
            {selected.images?.[0] && (
              <div className="relative h-24 mb-2 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={selected.images[0]}
                  alt={selected.title}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <p className="font-semibold text-sm text-gray-900 mb-1 leading-tight">{selected.title}</p>
            <p className="text-xs text-gray-500 mb-2">{selected.city}</p>
            <p className="text-primary-600 font-bold text-sm mb-2">
              {selected.pricePerDay.toLocaleString("fr-MA")} MAD/jour
            </p>
            <Link
              href={`/vehicle/${selected.id}`}
              className="block text-center bg-primary-600 text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Voir le véhicule
            </Link>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

// ──────────────── OpenStreetMap fallback ────────────────
// Affiche un iframe OSM centré sur les véhicules (ou centre Maroc si vide).
function OSMFallback({ vehicles, center }: { vehicles: Vehicle[]; center: { lat: number; lng: number } }) {
  const withCoords = vehicles.filter((v) => v.lat && v.lng);
  let lat = center.lat;
  let lng = center.lng;
  let delta = 0.5;

  if (withCoords.length === 1) {
    lat = withCoords[0].lat!;
    lng = withCoords[0].lng!;
    delta = 0.02;
  } else if (withCoords.length > 1) {
    const lats = withCoords.map((v) => v.lat!);
    const lngs = withCoords.map((v) => v.lng!);
    lat = (Math.min(...lats) + Math.max(...lats)) / 2;
    lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    delta = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs), 0.05) * 0.7;
  }

  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const marker = withCoords.length === 1 ? `&marker=${lat},${lng}` : "";
  const url = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}`;

  return (
    <div className="relative w-full h-full">
      <iframe
        src={url}
        title="Carte OpenStreetMap"
        className="w-full h-full border-0 rounded-xl"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      {withCoords.length > 1 && (
        <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md text-xs">
          <span className="font-semibold text-primary-600">{withCoords.length}</span>{" "}
          <span className="text-gray-600">véhicules</span>
        </div>
      )}
      <a
        href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=10/${lat}/${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-xs font-semibold text-primary-700 px-3 py-1.5 rounded-lg shadow-md hover:bg-white"
      >
        Voir en grand ↗
      </a>
    </div>
  );
}
