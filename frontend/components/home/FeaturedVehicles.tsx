"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

// Fallback démo si API indisponible — pour ne jamais afficher une page vide
const DEMO_VEHICLES = [
  {
    id: "demo-1", title: "Dacia Logan 2023", city: "Casablanca", category: "VOITURE",
    pricePerDay: 350, pricePerHour: null, rating: 4.7, reviewCount: 24,
    images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "RentaWay Casablanca", isApproved: true },
  },
  {
    id: "demo-2", title: "Hyundai Tucson", city: "Marrakech", category: "VOITURE",
    pricePerDay: 650, pricePerHour: null, rating: 4.9, reviewCount: 41,
    images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "Atlas Auto", isApproved: true },
  },
  {
    id: "demo-3", title: "Yamaha MT-07", city: "Agadir", category: "MOTO",
    pricePerDay: 600, pricePerHour: null, rating: 4.8, reviewCount: 19,
    images: ["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "Surf Moto", isApproved: true },
  },
  {
    id: "demo-4", title: "Semi-rigide 6 places", city: "Essaouira", category: "BATEAU",
    pricePerDay: 9000, pricePerHour: 1500, rating: 4.6, reviewCount: 12,
    images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "Atlantic Boats", isApproved: true },
  },
  {
    id: "demo-5", title: "Toyota Corolla", city: "Tanger", category: "VOITURE",
    pricePerDay: 500, pricePerHour: null, rating: 4.6, reviewCount: 33,
    images: ["https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "Tanger Rent", isApproved: true },
  },
  {
    id: "demo-6", title: "Honda CB 125cc", city: "Marrakech", category: "MOTO",
    pricePerDay: 200, pricePerHour: null, rating: 4.5, reviewCount: 28,
    images: ["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "Medina Bikes", isApproved: true },
  },
  {
    id: "demo-7", title: "Sea-Doo GTI", city: "Dakhla", category: "JETSKI",
    pricePerDay: 3000, pricePerHour: 500, rating: 4.9, reviewCount: 15,
    images: ["https://images.unsplash.com/photo-1530538987395-032d1800fdd4?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "Dakhla Watersports", isApproved: true },
  },
  {
    id: "demo-8", title: "BMW Série 3", city: "Casablanca", category: "VOITURE",
    pricePerDay: 1500, pricePerHour: null, rating: 4.8, reviewCount: 22,
    images: ["https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80"],
    agency: { name: "Premium Auto", isApproved: true },
  },
];

export function FeaturedVehicles() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<typeof DEMO_VEHICLES>(DEMO_VEHICLES);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/vehicles?sort=rating&limit=8`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        clearTimeout(timeout);
        if (data?.vehicles?.length > 0) setVehicles(data.vehicles);
      })
      .catch(() => {/* keep demo */});

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-3">
              <TrendingUp className="h-3.5 w-3.5" />
              Tendance
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-secondary-700">
              {t("popular.title")}
            </h2>
            <p className="text-gray-500 mt-1">{t("popular.subtitle")}</p>
          </div>
          <Link href="/search" className="hidden md:block">
            <Button variant="outline" size="sm">
              {t("popular.voirTout")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {vehicles.slice(0, 8).map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle as never} />
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/search">
            <Button variant="outline">{t("popular.voirTout")}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
