"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus, Car, Bike, Anchor, Waves, Edit2, Trash2,
  Eye, EyeOff, Loader2, MapPin, ChevronDown,
} from "lucide-react";
import { Vehicle, VehicleCategory } from "@/types";
import { vehicleApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LocationPickerMap } from "@/components/maps/LocationPickerMap";
import toast from "react-hot-toast";

const CATEGORY_ICONS: Record<VehicleCategory, React.ElementType> = {
  VOITURE: Car, MOTO: Bike, BATEAU: Anchor, JETSKI: Waves,
};
const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  VOITURE: "Voiture", MOTO: "Moto", BATEAU: "Bateau", JETSKI: "Jet-ski",
};

export default function AgencyVehiclesPage() {
  const { data: session } = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [openMapId, setOpenMapId] = useState<string | null>(null);

  // Sauvegarde différée (300ms) après le dernier drop, pour éviter une PATCH par pixel.
  async function persistLocation(vehicleId: string, coords: { lat: number; lng: number }) {
    try {
      await vehicleApi.update(vehicleId, coords);
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId ? { ...v, ...coords } : v))
      );
      toast.success("Position enregistrée");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }

  const sessionUser = session?.user as { agencyId?: string } | undefined;

  useEffect(() => {
    if (!sessionUser?.agencyId) return;
    vehicleApi
      .search({ agencyId: sessionUser.agencyId, limit: 50 })
      .then((r) => setVehicles(r.data.vehicles || []))
      .catch(() => toast.error("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [sessionUser?.agencyId]);

  const toggleAvailability = async (id: string, current: boolean) => {
    try {
      await vehicleApi.update(id, { isAvailable: !current });
      setVehicles((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isAvailable: !current } : v))
      );
      toast.success(!current ? "Véhicule activé" : "Véhicule désactivé");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer définitivement ce véhicule ?")) return;
    setDeleteId(id);
    try {
      await vehicleApi.delete(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
      toast.success("Véhicule supprimé");
    } catch {
      toast.error("Erreur de suppression");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon parc véhicules</h1>
          <p className="text-sm text-gray-500 mt-0.5">{vehicles.length} véhicule(s)</p>
        </div>
        <Link href="/dashboard/agency/vehicles/new">
          <Button><Plus className="h-4 w-4" /> Ajouter un véhicule</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary-600" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Car className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-500 mb-3">Votre parc est vide</p>
          <Link href="/dashboard/agency/vehicles/new">
            <Button><Plus className="h-4 w-4" /> Ajouter mon premier véhicule</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vehicles.map((v) => {
            const Icon = CATEGORY_ICONS[v.category];
            const mapOpen = openMapId === v.id;
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex">
                {/* Thumbnail */}
                <div className="relative w-28 flex-shrink-0 bg-gray-100">
                  {v.images?.[0] ? (
                    <Image
                      src={v.images[0]}
                      alt={v.title}
                      fill
                      className="object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                  {!v.isAvailable && (
                    <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">Inactif</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="category">
                          <Icon className="h-3 w-3" />
                          {CATEGORY_LABELS[v.category]}
                        </Badge>
                        {v.isAvailable ? (
                          <span className="text-xs text-green-600 font-medium">● Actif</span>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">● Inactif</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 truncate text-sm">{v.title}</p>
                      <p className="text-primary-600 font-bold text-sm mt-0.5">
                        {v.pricePerDay.toLocaleString("fr-MA")} MAD/j
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        ⭐ {v.rating.toFixed(1)} · {v.reviewCount} avis · {v.viewCount} vues
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3">
                    <Link href={`/vehicle/${v.id}`} title="Voir l'annonce">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </Link>
                    <Link href={`/dashboard/agency/vehicles/${v.id}/edit`} title="Modifier">
                      <button className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </Link>
                    <button
                      title={v.isAvailable ? "Désactiver" : "Activer"}
                      onClick={() => toggleAvailability(v.id, v.isAvailable)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      {v.isAvailable ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      title="Supprimer"
                      onClick={() => handleDelete(v.id)}
                      disabled={deleteId === v.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleteId === v.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      title="Position GPS"
                      onClick={() => setOpenMapId(mapOpen ? null : v.id)}
                      className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        mapOpen
                          ? "bg-primary-100 text-primary-700"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Position
                      <ChevronDown className={`h-3 w-3 transition-transform ${mapOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mini-carte déployable */}
              {mapOpen && (
                <div className="border-t border-gray-100 p-3">
                  {v.lat != null && v.lng != null ? (
                    <>
                      <LocationPickerMap
                        lat={v.lat}
                        lng={v.lng}
                        height="h-56"
                        onChange={(coords) => persistLocation(v.id, coords)}
                      />
                      <p className="text-[11px] text-gray-400 mt-1.5 font-mono">
                        📍 {v.lat.toFixed(5)}, {v.lng.toFixed(5)}
                      </p>
                    </>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                      Coordonnées GPS manquantes — éditez le véhicule pour ajouter une localisation.
                    </div>
                  )}
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
